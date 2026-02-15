import React, { useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { CaseTask, User } from '../types';
import { listCasesForAssignee } from '../services/caseService';
import { EmployeeDashboardPayload, fetchEmployeeDashboard } from '../services/dashboardService';

interface EmployeeDashboardProps {
  user: User | null;
}

const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ user }) => {
  if (!user) return <Navigate to="/login" />;
  if (String(user.role || '').toLowerCase() !== 'employee') return <Navigate to="/dashboard" />;

  const [remoteData, setRemoteData] = useState<EmployeeDashboardPayload | null>(null);
  const [remoteError, setRemoteError] = useState('');

  useEffect(() => {
    let active = true;
    fetchEmployeeDashboard(user.email)
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
  }, [user.email]);

  const assignedCases = useMemo(() => listCasesForAssignee(user.email), [user.email]);
  const caseStats = useMemo(() => {
    if (remoteData?.stats) return remoteData.stats;
    const active = assignedCases.filter((c) => c.status !== 'COMPLETED').length;
    const waiting = assignedCases.filter((c) => c.status === 'WAITING_ON_CLIENT').length;
    const scheduled = assignedCases.filter((c) => c.status === 'SCHEDULED').length;
    return { total: assignedCases.length, active, waiting, scheduled };
  }, [assignedCases, remoteData]);

  const taskQueue = useMemo(() => {
    if (remoteData?.tasks) {
      return remoteData.tasks
        .map((t) => ({
          ...t,
          caseTitle: t.caseTitle,
          clientName: t.clientName,
        }))
        .slice(0, 10);
    }
    const tasks: Array<CaseTask & { caseId: string; caseTitle: string; clientName: string }> = [];
    assignedCases.forEach((c) => {
      (c.tasks || []).forEach((t) => {
        if (t.status !== 'DONE') {
          tasks.push({ ...t, caseId: c.id, caseTitle: c.title, clientName: c.clientName });
        }
      });
    });
    return tasks
      .sort((a, b) => (a.status === b.status ? b.createdAt - a.createdAt : a.status.localeCompare(b.status)))
      .slice(0, 10);
  }, [assignedCases, remoteData]);

  const upcomingAppointments = useMemo(() => {
    if (remoteData?.appointments) {
      return remoteData.appointments.slice(0, 6).map((a) => ({
        caseId: a.caseId,
        title: a.caseTitle,
        client: a.clientName,
        date: a.date,
        status: a.status,
      }));
    }
    const items: Array<{ caseId: string; title: string; client: string; date: string; status: string }> = [];
    assignedCases.forEach((c) => {
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
  }, [assignedCases, remoteData]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-16 space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Employee Dashboard</p>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white mt-3">Work Queue</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-3">
            Manage assigned cases, tasks, and appointment requests.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to="/cases"
              className="px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-800 dark:text-slate-200 hover:border-indigo-400 transition-all"
            >
              View Assigned Cases
            </Link>
          </div>
        </div>
        <div className="bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-lg">
          <div className="text-[10px] font-black uppercase tracking-widest text-white/60">Active Cases</div>
          <div className="text-2xl font-black mt-1">{caseStats.active}</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">
        {[
          { label: 'Assigned Cases', value: caseStats.total },
          { label: 'Active', value: caseStats.active },
          { label: 'Waiting on Client', value: caseStats.waiting },
          { label: 'Scheduled', value: caseStats.scheduled },
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

      {remoteError && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          {remoteError}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-700">
            <h2 className="text-lg font-black text-slate-900 dark:text-white">Task Queue</h2>
          </div>
          <div className="p-6 space-y-4">
            {taskQueue.map((t) => (
              <div key={t.id} className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{t.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{t.clientName}</p>
                  <p className="text-[11px] text-slate-400">{t.caseTitle}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-300">
                    {t.status}
                  </p>
                </div>
              </div>
            ))}
            {taskQueue.length === 0 && (
              <p className="text-sm text-slate-500 dark:text-slate-400">No open tasks assigned.</p>
            )}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-700">
            <h2 className="text-lg font-black text-slate-900 dark:text-white">Upcoming Appointments</h2>
          </div>
          <div className="p-6 space-y-3">
            {upcomingAppointments.map((a) => (
              <div key={`${a.caseId}-${a.date}`}>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{a.title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{a.client}</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">{a.date}</p>
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
      </div>
    </div>
  );
};

export default EmployeeDashboard;
