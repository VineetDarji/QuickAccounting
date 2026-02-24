import React, { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { User } from '../types';
import { downloadJsonFile } from '../services/downloadService';
import { listProfiles } from '../services/profileService';
import { listCases } from '../services/caseService';
import { loadJson, saveJson } from '../services/storageService';
import { logActivity } from '../services/activityService';
import { decideClientAccessRequest, fetchClientAccessRequests, listClientAccessRequests } from '../services/clientAccessService';

interface AdminUsersProps {
  user: User | null;
}

type StoredUser = {
  name?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  email?: string;
  role?: 'user' | 'client_pending' | 'client' | 'employee' | 'admin';
  password?: string;
  [key: string]: any;
};

const USERS_KEY = 'quickaccounting_users';

const AdminUsers: React.FC<AdminUsersProps> = ({ user }) => {
  const [query, setQuery] = useState('');
  const [refreshTick, setRefreshTick] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(() =>
    listClientAccessRequests().filter((request) => request.status === 'pending')
  );
  const [isDecidingId, setIsDecidingId] = useState('');

  if (!user) return <Navigate to="/login" />;
  if (String(user.role || '').toLowerCase() !== 'admin') return <Navigate to="/dashboard" />;

  const users = useMemo(() => {
    const all = loadJson<StoredUser[]>(USERS_KEY, []);
    const q = query.trim().toLowerCase();
    return all
      .filter((u) => u && (u.email || u.name))
      .filter((u) => {
        if (!q) return true;
        const full = String(u.name || '').toLowerCase();
        const first = String(u.firstName || '').toLowerCase();
        const middle = String(u.middleName || '').toLowerCase();
        const last = String(u.lastName || '').toLowerCase();
        return (
          String(u.email || '').toLowerCase().includes(q) ||
          full.includes(q) ||
          first.includes(q) ||
          middle.includes(q) ||
          last.includes(q)
        );
      })
      .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
  }, [query, refreshTick]);

  useEffect(() => {
    let active = true;
    fetchClientAccessRequests({ status: 'pending' })
      .then((requests) => {
        if (!active) return;
        setPendingRequests(requests);
      })
      .catch(() => {
        if (!active) return;
        setPendingRequests(listClientAccessRequests().filter((request) => request.status === 'pending'));
      });
    return () => {
      active = false;
    };
  }, [refreshTick]);

  const updateRole = (email: string, role: StoredUser['role']) => {
    const all = loadJson<StoredUser[]>(USERS_KEY, []);
    const idx = all.findIndex((u) => u && u.email === email);
    if (idx < 0) return;
    const updated = { ...all[idx], role };
    const next = [...all];
    next[idx] = updated;
    saveJson(USERS_KEY, next);
    toast.success('Role updated');
    logActivity(user, 'UPDATE_USER_ROLE', `${email} -> ${role}`);
    setRefreshTick((value) => value + 1);
  };

  const decideRequest = async (requestId: string, decision: 'approved' | 'rejected') => {
    setIsDecidingId(requestId);
    const decided = await decideClientAccessRequest(requestId, decision, { email: user.email });
    setIsDecidingId('');
    if (!decided) {
      toast.error('Could not update request');
      return;
    }
    if (decision === 'approved') {
      logActivity(user, 'APPROVE_CLIENT_ACCESS', `${decided.email} approved as client`);
      toast.success('Client access approved');
    } else {
      logActivity(user, 'REJECT_CLIENT_ACCESS', `${decided.email} request rejected`);
      toast.success('Request rejected');
    }
    setRefreshTick((value) => value + 1);
  };

  const exportAll = () => {
    const payload = {
      users: loadJson(USERS_KEY, []),
      profiles: listProfiles(),
      cases: listCases(),
      calculations: loadJson('tax_saved_calcs', []),
      inquiries: loadJson('tax_inquiries', []),
      activities: loadJson('tax_activities', []),
      clientAccessRequests: listClientAccessRequests(),
    };
    downloadJsonFile('quick-accounting-export.json', payload);
    toast.success('Export downloaded');
    logActivity(user, 'EXPORT_DATA', 'Downloaded full JSON export');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-16 space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Admin</p>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white mt-2">Users & Permissions</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Manage roles and client access requests.</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Button onClick={exportAll}>Download Export</Button>
        </div>
      </div>

      <Card>
        <div className="p-6 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-lg font-black text-slate-900 dark:text-white">Client Access Requests</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Approve users before they can access the client dashboard.
          </p>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {pendingRequests.map((request) => (
            <div key={request.id} className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="font-bold text-slate-900 dark:text-white">{request.name || request.email}</p>
                <p className="text-xs font-mono text-slate-600 dark:text-slate-200">{request.email}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Requested: {new Date(request.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => decideRequest(request.id, 'approved')} disabled={isDecidingId === request.id}>
                  {isDecidingId === request.id ? 'Saving...' : 'Approve'}
                </Button>
                <button
                  onClick={() => decideRequest(request.id, 'rejected')}
                  disabled={isDecidingId === request.id}
                  className="px-4 py-2 rounded-xl border border-rose-300 text-rose-700 text-sm font-bold hover:bg-rose-50"
                >
                  {isDecidingId === request.id ? 'Saving...' : 'Reject'}
                </button>
              </div>
            </div>
          ))}
          {pendingRequests.length === 0 && (
            <div className="px-6 py-12 text-center text-slate-400 font-bold">No pending access requests.</div>
          )}
        </div>
      </Card>

      <Card>
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full md:max-w-md px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm font-semibold outline-none focus:border-indigo-500 dark:text-white"
          />
          <div className="text-xs font-black uppercase tracking-widest text-slate-400">Total: {users.length}</div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-200 text-[10px] uppercase font-black">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {users.map((u) => (
                <tr key={String(u.email)} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-900 dark:text-white">{u.name || '-'}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-300">
                      {`${u.firstName || '-'} ${u.middleName || ''} ${u.lastName || '-'}`.replace(/\s+/g, ' ').trim()}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-xs font-mono text-slate-600 dark:text-slate-200">{u.email || '-'}</td>
                  <td className="px-6 py-4">
                    <select
                      value={u.role || 'user'}
                      onChange={(e) => updateRole(String(u.email), e.target.value as StoredUser['role'])}
                      className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-bold outline-none focus:border-indigo-500 dark:text-white"
                    >
                      <option value="user">User</option>
                      <option value="client_pending">Client Pending</option>
                      <option value="client">Client</option>
                      <option value="employee">Employee</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-slate-400 font-bold">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default AdminUsers;
