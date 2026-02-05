import React, { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { SERVICES } from '../constants';
import { CaseStatus, TaxCase, User } from '../types';
import { logActivity } from '../services/activityService';
import { createCase, createCaseForClient, listCases, listCasesForAssignee, listCasesForClient } from '../services/caseService';

interface CasesProps {
  user: User | null;
}

const statusBadge = (status: CaseStatus) => {
  const styles: Record<CaseStatus, string> = {
    NEW: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-200',
    IN_REVIEW: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200',
    WAITING_ON_CLIENT: 'bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200',
    SCHEDULED: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-200',
    ON_HOLD: 'bg-slate-100 text-slate-700 dark:bg-slate-700/50 dark:text-slate-200',
    COMPLETED: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-200',
  };
  const label = status.replace(/_/g, ' ');
  return (
    <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${styles[status]}`}>{label}</span>
  );
};

const Cases: React.FC<CasesProps> = ({ user }) => {
  const navigate = useNavigate();
  const [items, setItems] = useState<TaxCase[]>([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | CaseStatus>('ALL');

  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [service, setService] = useState(SERVICES[0]?.title || 'Income Tax Filing');
  const [clientEmail, setClientEmail] = useState('');
  const [clientName, setClientName] = useState('');

  const refresh = () => {
    if (!user) return;
    if (user.role === 'admin') setItems(listCases());
    else if (user.role === 'employee') setItems(listCasesForAssignee(user.email));
    else setItems(listCasesForClient(user.email));
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email, user?.role]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((c) => {
      if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
      if (!q) return true;
      return (
        c.title.toLowerCase().includes(q) ||
        c.service.toLowerCase().includes(q) ||
        c.clientName.toLowerCase().includes(q) ||
        c.clientEmail.toLowerCase().includes(q)
      );
    });
  }, [items, query, statusFilter]);

  if (!user) return <Navigate to="/login" />;

  const handleCreate = () => {
    if (!user) return;

    const trimmedTitle = title.trim() || 'New Case';
    const trimmedService = service || 'Income Tax Filing';

    let next: TaxCase;
    if (user.role === 'admin' && clientEmail.trim()) {
      next = createCaseForClient(
        { email: clientEmail.trim(), name: clientName.trim() || clientEmail.trim() },
        { title: trimmedTitle, service: trimmedService }
      );
      logActivity(user, 'CREATE_CASE', `Created case for ${next.clientEmail}: ${next.title}`);
    } else {
      next = createCase(user, { title: trimmedTitle, service: trimmedService });
      logActivity(user, 'CREATE_CASE', `Created case: ${next.title}`);
    }

    toast.success('Case created');
    setTitle('');
    setClientEmail('');
    setClientName('');
    setIsCreating(false);
    refresh();
    navigate(`/cases/${next.id}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-16 space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cases</p>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white mt-2">
            {user.role === 'admin' ? 'All Client Cases' : user.role === 'employee' ? 'Assigned Cases' : 'My Cases'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Provided data, documents, appointments, invoices, and status — organized per case.
          </p>
        </div>
        <div className="flex gap-3 flex-wrap items-center">
          <Link
            to="/profile"
            className="px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-800 dark:text-slate-200 hover:border-indigo-400 transition-all"
          >
            Profile
          </Link>
          {(user.role === 'user' || user.role === 'admin') && (
            <Button onClick={() => setIsCreating((v) => !v)}>{isCreating ? 'Close' : 'New Case'}</Button>
          )}
        </div>
      </div>

      {isCreating && (
        <Card>
          <div className="p-8 space-y-6">
            <h2 className="text-xl font-black text-slate-900 dark:text-white">Create a Case</h2>
            {user.role === 'admin' && (
              <div className="grid md:grid-cols-2 gap-6">
                <Input
                  label="Client Email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="client@example.com"
                />
                <Input
                  label="Client Name"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Client name (optional)"
                />
              </div>
            )}
            <div className="grid md:grid-cols-2 gap-6">
              <Input label="Case Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. ITR Filing FY 24-25" />
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Service</label>
                <select
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                  className="w-full p-4 border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl text-base font-semibold focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900 outline-none transition-all duration-200"
                >
                  {SERVICES.map((s) => (
                    <option key={s.title} value={s.title}>
                      {s.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleCreate}>Create</Button>
            </div>
          </div>
        </Card>
      )}

      <Card>
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex gap-3 items-center flex-wrap">
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search cases..." />
          </div>
          <div className="flex gap-3 items-center">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm font-bold outline-none focus:border-indigo-500 dark:text-white"
            >
              <option value="ALL">ALL</option>
              <option value="NEW">NEW</option>
              <option value="IN_REVIEW">IN REVIEW</option>
              <option value="WAITING_ON_CLIENT">WAITING ON CLIENT</option>
              <option value="SCHEDULED">SCHEDULED</option>
              <option value="ON_HOLD">ON HOLD</option>
              <option value="COMPLETED">COMPLETED</option>
            </select>
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {filtered.map((c) => (
            <button
              key={c.id}
              onClick={() => navigate(`/cases/${c.id}`)}
              className="w-full text-left p-6 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-lg font-black text-slate-900 dark:text-white">{c.title}</span>
                  {statusBadge(c.status)}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-300 mt-2">
                  {c.service} • Updated {new Date(c.updatedAt).toLocaleString()}
                </div>
                {(user.role === 'admin' || user.role === 'employee') && (
                  <div className="text-xs text-slate-500 dark:text-slate-300 mt-1 font-mono">
                    Client: {c.clientName} ({c.clientEmail})
                  </div>
                )}
              </div>

              <div className="flex gap-2 flex-wrap justify-start md:justify-end">
                <span className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-xs font-black text-slate-700 dark:text-slate-200">
                  Docs: {c.documents?.length || 0}
                </span>
                <span className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-xs font-black text-slate-700 dark:text-slate-200">
                  Invoices: {c.invoices?.length || 0}
                </span>
                <span className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-xs font-black text-slate-700 dark:text-slate-200">
                  Appts: {c.appointments?.length || 0}
                </span>
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="p-12 text-center text-slate-400 font-bold">
              No cases found. {user.role === 'user' ? 'Create one to start.' : ''}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Cases;

