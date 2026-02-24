import React, { useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import AdminDashboard from './AdminDashboard';
import { Activity, SavedCalculation, User } from '../types';
import { listCases } from '../services/caseService';
import { loadJson } from '../services/storageService';
import { AdminDashboardPayload, fetchAdminDashboard } from '../services/dashboardService';

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

type DashboardClient = {
  name: string;
  email: string;
  role: string;
  calcCount?: number;
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
  if (String(user.role || '').toLowerCase() !== 'admin') return <Navigate to="/dashboard" />;

  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [remoteData, setRemoteData] = useState<AdminDashboardPayload | null>(null);
  const [remoteError, setRemoteError] = useState('');

  const storedUsers = useMemo(() => {
    return safeJsonParse<StoredUser[]>(localStorage.getItem('quickaccounting_users'), []);
  }, []);

  const allCases = useMemo(() => listCases(), []);

  const allCalcs = useMemo(() => {
    return safeJsonParse<SavedCalculation[]>(localStorage.getItem('tax_saved_calcs'), [])
      .filter((c) => c && typeof c === 'object')
      .sort((a, b) => b.timestamp - a.timestamp);
  }, []);

  const normalizedRemoteClients = useMemo(() => {
    if (!Array.isArray(remoteData?.clients)) return [];
    return remoteData.clients
      .filter((client) => client && typeof client === 'object')
      .map((client) => ({
        name: String((client as any).name || ''),
        email: String((client as any).email || ''),
        role: String((client as any).role || 'user').toLowerCase(),
        calcCount: Number((client as any).calcCount || 0),
      }))
      .filter((client) => client.name || client.email);
  }, [remoteData]);

  const allCalcsForView = useMemo(() => {
    if (!Array.isArray(remoteData?.calculations)) return allCalcs;
    return remoteData.calculations
      .filter((calc) => calc && typeof calc === 'object')
      .map((calc, index) => ({
        ...calc,
        id: String((calc as any).id || `remote-${index}`),
        userName: String((calc as any).userName || ''),
        label: String((calc as any).label || ''),
        type: String((calc as any).type || 'UNKNOWN'),
        timestamp: Number((calc as any).timestamp || Date.now()),
      }))
      .sort((a, b) => b.timestamp - a.timestamp) as SavedCalculation[];
  }, [remoteData, allCalcs]);

  const localActivities = useMemo(() => {
    return loadJson<Activity[]>('tax_activities', []).sort((a, b) => b.timestamp - a.timestamp).slice(0, 8);
  }, []);

  useEffect(() => {
    let active = true;
    fetchAdminDashboard()
      .then((payload) => {
        if (!active) return;
        setRemoteData(payload);
        setRemoteError('');
      })
      .catch(() => {
        if (!active) return;
        setRemoteError('Backend unavailable. Showing local browser data.');
      });
    return () => {
      active = false;
    };
  }, []);

  const calcTypes = useMemo(() => {
    const types = Array.from(new Set(allCalcsForView.map((c) => String(c.type || 'UNKNOWN')))).sort();
    return ['ALL', ...types];
  }, [allCalcsForView]);

  const clients = useMemo(() => {
    if (normalizedRemoteClients.length > 0) return normalizedRemoteClients;

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
      .filter(
        (u) =>
          u &&
          (u.role === 'user' ||
            u.role === 'client_pending' ||
            u.role === 'client' ||
            u.role === 'employee' ||
            u.role === 'admin' ||
            !u.role)
      )
      .map((u) => ({
        name: String(u.name || ''),
        email: String(u.email || ''),
        role: String(u.role || 'user'),
      }))
      .filter((u) => u.name || u.email);

    const fromCalcs = Array.from(new Set(allCalcs.map((c) => c.userName))).map((name) => {
      const match = byName.get(String(name || '').toLowerCase());
      return {
        name: String(name || ''),
        email: match?.email || '',
        role: match?.role || 'user',
      };
    });

    const combined = [...fromUsers, ...fromCalcs] as DashboardClient[];
    const byKey = new Map<string, DashboardClient>();
    for (const c of combined) {
      const key = String(c.email || c.name || '').toLowerCase();
      if (!key) continue;
      if (!byKey.has(key)) byKey.set(key, c);
    }

    return Array.from(byKey.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [allCalcs, storedUsers, normalizedRemoteClients]);

  const clientStats = useMemo(() => {
    const stats = new Map<string, { calcCount: number }>();
    for (const client of clients) {
      const key = String(client.email || client.name || '').toLowerCase();
      if ((client as any).calcCount !== undefined) {
        stats.set(key, { calcCount: Number((client as any).calcCount || 0) });
      }
    }

    if (stats.size > 0) return stats;

    const countsByName = new Map<string, number>();
    for (const c of allCalcsForView) {
      const key = String(c.userName || '').toLowerCase();
      countsByName.set(key, (countsByName.get(key) || 0) + 1);
    }
    for (const client of clients) {
      const key = String(client.email || client.name || '').toLowerCase();
      const byNameKey = String(client.name || '').toLowerCase();
      stats.set(key, { calcCount: countsByName.get(byNameKey) || 0 });
    }
    return stats;
  }, [allCalcsForView, clients]);

  const filteredCalcs = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allCalcsForView.filter((c) => {
      const typeValue = String(c.type || 'UNKNOWN');
      if (typeFilter !== 'ALL' && typeValue !== typeFilter) return false;
      if (!q) return true;
      return (
        String(c.userName || '').toLowerCase().includes(q) ||
        String(c.label || '').toLowerCase().includes(q) ||
        typeValue.toLowerCase().includes(q)
      );
    });
  }, [allCalcsForView, query, typeFilter]);

  const caseStats = useMemo(() => {
    if (remoteData?.stats) {
      return {
        total: Number(remoteData.stats.total || 0),
        active: Number(remoteData.stats.active || 0),
        unassigned: Number(remoteData.stats.unassigned || 0),
        waiting: Number(remoteData.stats.waiting || 0),
        scheduled: Number(remoteData.stats.scheduled || 0),
      };
    }
    const counts = { total: allCases.length, active: 0, unassigned: 0, waiting: 0, scheduled: 0 };
    allCases.forEach((c) => {
      if (c.status !== 'COMPLETED') counts.active += 1;
      if (!c.assignedToEmail) counts.unassigned += 1;
      if (c.status === 'WAITING_ON_CLIENT') counts.waiting += 1;
      if (c.status === 'SCHEDULED') counts.scheduled += 1;
    });
    return counts;
  }, [allCases, remoteData]);

  const userStats = useMemo(() => {
    if (remoteData?.stats) {
      return {
        clients: Number(remoteData.stats.clients || 0),
        employees: Number(remoteData.stats.employees || 0),
      };
    }
    const clients = storedUsers.filter((u) => String(u.role || '').toLowerCase() === 'client').length;
    const employees = storedUsers.filter((u) => u.role === 'employee').length;
    return { clients, employees };
  }, [storedUsers, remoteData]);

  const upcomingAppointments = useMemo(() => {
    if (Array.isArray(remoteData?.appointments)) {
      return remoteData.appointments.slice(0, 6).map((a) => ({
        caseId: String(a.caseId || ''),
        title: String(a.caseTitle || ''),
        client: String(a.clientName || ''),
        date: String(a.date || ''),
        status: String(a.status || ''),
      }));
    }
    const items: Array<{ caseId: string; title: string; client: string; date: string; status: string }> = [];
    allCases.forEach((c) => {
      (c.appointments || []).forEach((a) => {
        if (a.status === 'REQUESTED' || a.status === 'CONFIRMED') {
          items.push({
            caseId: c.id,
            title: c.title,
            client: c.clientName,
            date: a.scheduledFor || `${a.preferredDate} ${a.preferredTime}`,
            status: a.status,
          });
        }
      });
    });
    return items.slice(0, 6);
  }, [allCases, remoteData]);

  const activities = useMemo(() => {
    if (!Array.isArray(remoteData?.activities)) return localActivities;
    return remoteData.activities
      .filter((activity) => activity && typeof activity === 'object')
      .map((activity, index) => ({
        id: String((activity as any).id || `remote-activity-${index}`),
        action: String((activity as any).action || ''),
        details: String((activity as any).details || ''),
        userName: String((activity as any).userName || ''),
        timestamp: Number((activity as any).timestamp || Date.now()),
      }))
      .slice(0, 8);
  }, [remoteData, localActivities]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-14 space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Admin Dashboard</p>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white mt-2">Master Control</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            View all client calculations stored in this browser.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to="/cases"
              className="px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-800 dark:text-slate-200 hover:border-indigo-400 transition-all"
            >
              View Cases
            </Link>
            <Link
              to="/admin/users"
              className="px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-800 dark:text-slate-200 hover:border-indigo-400 transition-all"
            >
              Users & Permissions
            </Link>
            <Link
              to="/admin/legacy"
              className="px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-800 dark:text-slate-200 hover:border-indigo-400 transition-all"
            >
              Legacy Admin
            </Link>
          </div>
        </div>
        <div className="bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-lg">
          <div className="text-[10px] font-black uppercase tracking-widest text-white/60">Total Calculations</div>
          <div className="text-2xl font-black mt-1">{remoteData?.stats?.calculations ?? allCalcsForView.length}</div>
        </div>
      </div>

      {remoteError && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          {remoteError}
        </div>
      )}

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">
        {[
          { label: 'Total Cases', value: caseStats.total },
          { label: 'Active Cases', value: caseStats.active },
          { label: 'Unassigned', value: caseStats.unassigned },
          { label: 'Waiting on Client', value: caseStats.waiting },
          { label: 'Scheduled', value: caseStats.scheduled },
          { label: 'Clients', value: userStats.clients },
          { label: 'Employees', value: userStats.employees },
        ].map((item) => (
          <div
            key={item.label}
            className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-5 shadow-sm"
          >
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.label}</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900 dark:text-white">Upcoming Appointments</h2>
            <Link
              to="/cases"
              className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-300 hover:text-indigo-700"
            >
              View Cases
            </Link>
          </div>
          <div className="p-6 space-y-3">
            {upcomingAppointments.map((a) => (
              <div key={`${a.caseId}-${a.date}`} className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{a.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{a.client}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{a.date}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-300">
                    {a.status}
                  </p>
                </div>
              </div>
            ))}
            {upcomingAppointments.length === 0 && (
              <p className="text-sm text-slate-500 dark:text-slate-400">No pending appointments.</p>
            )}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-700">
            <h2 className="text-lg font-black text-slate-900 dark:text-white">Recent Activity</h2>
          </div>
          <div className="p-6 space-y-4">
            {activities.map((a) => (
              <div key={a.id}>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">{a.action}</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{a.details}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{a.userName}</p>
              </div>
            ))}
            {activities.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">No activity yet.</p>}
          </div>
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
                  const key = String(c.email || c.name || '').toLowerCase();
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
                      {Number.isFinite(Number(c.timestamp)) ? new Date(Number(c.timestamp)).toLocaleString() : '-'}
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
