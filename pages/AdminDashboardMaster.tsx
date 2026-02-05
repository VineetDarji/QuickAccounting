import React, { useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import AdminDashboard from './AdminDashboard';
import { SavedCalculation, User } from '../types';

interface AdminDashboardMasterProps {
  user: User | null;
}

type StoredUser = {
  name?: string;
  email?: string;
  role?: string;
  password?: string;
  [key: string]: any;
};

const safeJsonParse = <T,>(value: string | null, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const AdminDashboardMaster: React.FC<AdminDashboardMasterProps> = ({ user }) => {
  if (!user) return <Navigate to="/login" />;
  if (user.role !== 'admin') return <Navigate to="/dashboard" />;

  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  const storedUsers = useMemo(() => {
    return safeJsonParse<StoredUser[]>(localStorage.getItem('quickaccounting_users'), []);
  }, []);

  const allCalcs = useMemo(() => {
    return safeJsonParse<SavedCalculation[]>(localStorage.getItem('tax_saved_calcs'), [])
      .filter((c) => c && typeof c === 'object')
      .sort((a, b) => b.timestamp - a.timestamp);
  }, []);

  const calcTypes = useMemo(() => {
    const types = Array.from(new Set(allCalcs.map((c) => c.type))).sort();
    return ['ALL', ...types];
  }, [allCalcs]);

  const clients = useMemo(() => {
    const byName = new Map<string, { name: string; email: string; role: string }>();
    for (const u of storedUsers) {
      if (!u) continue;
      const name = String(u.name || '');
      if (!name) continue;
      const key = name.toLowerCase();
      if (!byName.has(key)) {
        byName.set(key, {
          name,
          email: String(u.email || ''),
          role: String(u.role || 'user'),
        });
      }
    }

    const fromUsers = storedUsers
      .filter((u) => u && (u.role === 'user' || u.role === 'employee' || u.role === 'admin' || !u.role))
      .map((u) => ({
        name: String(u.name || ''),
        email: String(u.email || ''),
        role: String(u.role || 'user'),
      }))
      .filter((u) => u.name || u.email);

    const fromCalcs = Array.from(new Set(allCalcs.map((c) => c.userName))).map((name) => {
      const match = byName.get(String(name || '').toLowerCase());
      return {
        name,
        email: match?.email || '',
        role: match?.role || 'user',
      };
    });

    const combined = [...fromUsers, ...fromCalcs];
    const byKey = new Map<string, { name: string; email: string; role: string }>();
    for (const c of combined) {
      const key = (c.email || c.name).toLowerCase();
      if (!key) continue;
      if (!byKey.has(key)) byKey.set(key, c);
    }

    return Array.from(byKey.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [allCalcs, storedUsers]);

  const clientStats = useMemo(() => {
    const countsByName = new Map<string, number>();
    for (const c of allCalcs) {
      const key = (c.userName || '').toLowerCase();
      countsByName.set(key, (countsByName.get(key) || 0) + 1);
    }

    const stats = new Map<string, { calcCount: number }>();
    for (const client of clients) {
      const key = (client.email || client.name).toLowerCase();
      const byNameKey = (client.name || '').toLowerCase();
      stats.set(key, { calcCount: countsByName.get(byNameKey) || 0 });
    }
    return stats;
  }, [allCalcs, clients]);

  const filteredCalcs = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allCalcs.filter((c) => {
      if (typeFilter !== 'ALL' && c.type !== typeFilter) return false;
      if (!q) return true;
      return (
        c.userName.toLowerCase().includes(q) ||
        c.label.toLowerCase().includes(q) ||
        c.type.toLowerCase().includes(q)
      );
    });
  }, [allCalcs, query, typeFilter]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-14 space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Admin Dashboard</p>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white mt-2">Master Control</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            View all client calculations stored in this browser.
          </p>
        </div>
        <div className="bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-lg">
          <div className="text-[10px] font-black uppercase tracking-widest text-white/60">Total Calculations</div>
          <div className="text-2xl font-black mt-1">{allCalcs.length}</div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between gap-4 flex-wrap">
          <h2 className="text-lg font-black text-slate-900 dark:text-white">Clients & Calculations</h2>
          <div className="flex gap-3 flex-wrap items-center">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by client, label, type..."
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm font-semibold outline-none focus:border-indigo-500 dark:text-white"
            />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm font-semibold outline-none focus:border-indigo-500 dark:text-white"
            >
              {calcTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-200 text-[10px] uppercase font-black">
                <tr>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Saved Calcs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {clients.map((c) => {
                  const key = (c.email || c.name).toLowerCase();
                  const stats = clientStats.get(key);
                  return (
                    <tr key={key} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="px-4 py-4 font-bold text-slate-900 dark:text-white">{c.name || '—'}</td>
                      <td className="px-4 py-4 text-xs font-black uppercase text-indigo-600 dark:text-indigo-300">
                        {c.role}
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-500 dark:text-slate-300 font-mono">
                        {c.email || '—'}
                      </td>
                      <td className="px-4 py-4 text-sm font-black text-slate-900 dark:text-white">
                        {stats?.calcCount ?? 0}
                      </td>
                    </tr>
                  );
                })}
                {clients.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-slate-400 font-bold">
                      No clients found yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="border-t border-slate-100 dark:border-slate-700 p-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4">All Saved Calculations</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-200 text-[10px] uppercase font-black">
                <tr>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Label</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Inputs</th>
                  <th className="px-4 py-3">Results</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {filteredCalcs.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors align-top">
                    <td className="px-4 py-4 text-sm font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      {c.userName}
                    </td>
                    <td className="px-4 py-4 text-xs font-black uppercase text-indigo-600 dark:text-indigo-300">
                      {c.type}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-700 dark:text-slate-200">{c.label}</td>
                    <td className="px-4 py-4 text-xs text-slate-500 dark:text-slate-300 whitespace-nowrap">
                      {new Date(c.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-4">
                      <details className="text-xs">
                        <summary className="cursor-pointer font-bold text-slate-600 dark:text-slate-200">View</summary>
                        <pre className="mt-2 p-3 rounded-xl bg-slate-900 text-slate-100 overflow-auto max-w-[420px]">
{JSON.stringify(c.inputs, null, 2)}
                        </pre>
                      </details>
                    </td>
                    <td className="px-4 py-4">
                      <details className="text-xs">
                        <summary className="cursor-pointer font-bold text-slate-600 dark:text-slate-200">View</summary>
                        <pre className="mt-2 p-3 rounded-xl bg-slate-900 text-slate-100 overflow-auto max-w-[420px]">
{JSON.stringify(c.results, null, 2)}
                        </pre>
                      </details>
                    </td>
                  </tr>
                ))}
                {filteredCalcs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-slate-400 font-bold">
                      No calculations match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <details className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <summary className="cursor-pointer p-6 font-black text-slate-900 dark:text-white">
          Inquiries & Logs (Legacy Admin View)
        </summary>
        <div className="pb-6">
          <AdminDashboard />
        </div>
      </details>
    </div>
  );
};

export default AdminDashboardMaster;
