import React, { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import { AppointmentMode, CaseAppointment, CaseDocument, CaseInvoice, CaseStatus, CaseTask, TaxCase, User } from '../types';
import {
  addAppointment,
  addCaseDocumentMeta,
  addInternalNote,
  addInvoice,
  addTask,
  getCaseById,
  removeCaseDocumentMeta,
  updateAppointment,
  updateCase,
  updateInvoice,
  updateTask,
} from '../services/caseService';
import { logActivity } from '../services/activityService';
import { deleteDocument, getDocument, putDocument } from '../services/documentsDb';
import { generateId, loadJson } from '../services/storageService';

interface CaseDetailsProps {
  user: User | null;
}

type TabId = 'data' | 'docs' | 'appts' | 'invoices' | 'tasks' | 'notes';

const tabLabel: Record<TabId, string> = {
  data: 'Provided Data',
  docs: 'Documents',
  appts: 'Appointments',
  invoices: 'Invoices',
  tasks: 'Tasks',
  notes: 'Internal Notes',
};

const statusStyles: Record<CaseStatus, string> = {
  NEW: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-200',
  IN_REVIEW: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200',
  WAITING_ON_CLIENT: 'bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200',
  SCHEDULED: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-200',
  ON_HOLD: 'bg-slate-100 text-slate-700 dark:bg-slate-700/50 dark:text-slate-200',
  COMPLETED: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-200',
};

const CaseDetails: React.FC<CaseDetailsProps> = ({ user }) => {
  const { caseId } = useParams();
  const navigate = useNavigate();

  const [tab, setTab] = useState<TabId>('data');
  const [caseData, setCaseData] = useState<TaxCase | null>(null);
  const [dataDraft, setDataDraft] = useState<Record<string, any>>({});

  const [apptDraft, setApptDraft] = useState({
    preferredDate: '',
    preferredTime: '',
    mode: 'CALL' as AppointmentMode,
    notes: '',
  });
  const [scheduleDraft, setScheduleDraft] = useState<Record<string, string>>({});
  const [invoiceDraft, setInvoiceDraft] = useState({
    amount: '',
    description: '',
    dueDate: '',
    paymentLink: '',
  });
  const [taskTitle, setTaskTitle] = useState('');
  const [noteText, setNoteText] = useState('');

  const [docPreview, setDocPreview] = useState<{ meta: CaseDocument; url: string } | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  useEffect(() => {
    if (!caseId) return;
    const found = getCaseById(caseId);
    setCaseData(found || null);
    setDataDraft(found?.providedData || {});
  }, [caseId]);

  useEffect(() => {
    if (!caseData) return;
    setDataDraft(caseData.providedData || {});
  }, [caseData?.id, caseData?.updatedAt]);

  if (!user) return <Navigate to="/login" />;
  if (!caseId) return <Navigate to="/cases" />;
  if (!caseData) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 space-y-6">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">Case not found</h1>
        <p className="text-slate-500 dark:text-slate-400">This case may not exist in local storage.</p>
        <Button onClick={() => navigate('/cases')}>Back to cases</Button>
      </div>
    );
  }

  const isAdmin = user.role === 'admin';
  const isOwner = caseData.clientEmail === user.email;
  const isAssignee = Boolean(caseData.assignedToEmail) && caseData.assignedToEmail === user.email;
  const canView = isAdmin || isOwner || isAssignee;
  if (!canView) return <Navigate to="/dashboard" />;

  const canManage = isAdmin || isAssignee;
  const canUploadDocs = isAdmin || isOwner;

  const clientCalcsCount = useMemo(() => {
    const all = loadJson<any[]>('tax_saved_calcs', []);
    return all.filter((c) => c && (c.userEmail === caseData.clientEmail || c.userName === caseData.clientName)).length;
  }, [caseData.clientEmail, caseData.clientName]);

  const employees = useMemo(() => {
    if (!isAdmin) return [] as { email: string; name: string }[];
    const users = loadJson<any[]>('quickaccounting_users', []);
    return users
      .filter((u) => u && u.role === 'employee')
      .map((u) => ({ email: String(u.email || ''), name: String(u.name || u.email || '') }))
      .filter((u) => u.email);
  }, [isAdmin]);

  const save = (fn: (current: TaxCase) => TaxCase) => {
    const updated = updateCase(caseId, fn);
    if (updated) setCaseData(updated);
    return updated;
  };

  const saveProvidedData = () => {
    if (!isOwner && !isAdmin) return;
    save((c) => ({ ...c, providedData: dataDraft }));
    toast.success('Saved');
    logActivity(user, 'UPDATE_CASE_DATA', `${caseData.clientEmail}: ${caseData.title}`);
  };

  const setStatus = (status: CaseStatus) => {
    if (!canManage) return;
    save((c) => ({ ...c, status }));
    toast.success('Status updated');
    logActivity(user, 'UPDATE_CASE_STATUS', `${caseData.title} → ${status}`);
  };

  const setAssignee = (email: string) => {
    if (!isAdmin) return;
    save((c) => ({ ...c, assignedToEmail: email }));
    toast.success('Assigned');
    logActivity(user, 'ASSIGN_CASE', `${caseData.title} → ${email || 'unassigned'}`);
  };

  const uploadDocs = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (!canUploadDocs) return;
    try {
      for (const f of Array.from(files)) {
        const id = generateId();
        const meta: CaseDocument = {
          id,
          name: f.name,
          type: f.type || 'application/octet-stream',
          size: f.size,
          uploadedAt: Date.now(),
        };
        await putDocument({ ...meta, caseId, ownerEmail: caseData.clientEmail, blob: f });
        const updated = addCaseDocumentMeta(caseId, meta);
        if (updated) setCaseData(updated);
        logActivity(user, 'UPLOAD_DOCUMENT', `${caseData.title}: ${f.name}`);
      }
      toast.success('Uploaded');
    } catch (e) {
      console.error(e);
      toast.error('Upload failed');
    }
  };

  const openDoc = async (doc: CaseDocument, download: boolean) => {
    try {
      const stored = await getDocument(doc.id);
      if (!stored?.blob) throw new Error('Missing blob');
      const url = URL.createObjectURL(stored.blob);
      if (download) {
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        return;
      }
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(url), 30_000);
    } catch (e) {
      console.error(e);
      toast.error('Could not open document');
    }
  };

  const openPreview = async (doc: CaseDocument) => {
    try {
      setIsPreviewLoading(true);
      const stored = await getDocument(doc.id);
      if (!stored?.blob) throw new Error('Missing blob');
      const url = URL.createObjectURL(stored.blob);
      setDocPreview((prev) => {
        if (prev?.url) URL.revokeObjectURL(prev.url);
        return { meta: doc, url };
      });
    } catch (e) {
      console.error(e);
      toast.error('Could not preview document');
    } finally {
      setIsPreviewLoading(false);
    }
  };

  useEffect(() => {
    if (!docPreview) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDocPreview((prev) => {
          if (prev?.url) URL.revokeObjectURL(prev.url);
          return null;
        });
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
      URL.revokeObjectURL(docPreview.url);
    };
  }, [docPreview]);

  const deleteDoc = async (doc: CaseDocument) => {
    if (!canUploadDocs) return;
    try {
      await deleteDocument(doc.id);
      const updated = removeCaseDocumentMeta(caseId, doc.id);
      if (updated) setCaseData(updated);
      toast.success('Deleted');
      logActivity(user, 'DELETE_DOCUMENT', `${caseData.title}: ${doc.name}`);
    } catch (e) {
      console.error(e);
      toast.error('Delete failed');
    }
  };

  const requestAppt = () => {
    if (!(isOwner || isAdmin)) return;
    if (!apptDraft.preferredDate || !apptDraft.preferredTime) return toast.error('Pick date + time');
    const appt: CaseAppointment = {
      id: generateId(),
      requestedAt: Date.now(),
      preferredDate: apptDraft.preferredDate,
      preferredTime: apptDraft.preferredTime,
      mode: apptDraft.mode,
      notes: apptDraft.notes,
      status: 'REQUESTED',
    };
    const updated = addAppointment(caseId, appt);
    if (updated) setCaseData(updated);
    setApptDraft({ preferredDate: '', preferredTime: '', mode: 'CALL', notes: '' });
    toast.success('Requested');
    logActivity(user, 'REQUEST_APPOINTMENT', `${caseData.title}: ${appt.preferredDate} ${appt.preferredTime} (${appt.mode})`);
  };

  const confirmAppt = (id: string) => {
    if (!canManage) return;
    const scheduledFor = (scheduleDraft[id] || '').trim();
    if (!scheduledFor) return toast.error('Enter scheduled date/time');
    const updated = updateAppointment(caseId, id, { status: 'CONFIRMED', scheduledFor });
    if (updated) setCaseData(updated);
    toast.success('Confirmed');
    logActivity(user, 'CONFIRM_APPOINTMENT', `${caseData.title}: ${scheduledFor}`);
  };

  const setApptStatus = (id: string, status: CaseAppointment['status']) => {
    if (!canManage) return;
    const updated = updateAppointment(caseId, id, { status });
    if (updated) setCaseData(updated);
    toast.success('Updated');
    logActivity(user, 'UPDATE_APPOINTMENT', `${caseData.title}: ${status}`);
  };

  const createInvoice = () => {
    if (!isAdmin) return;
    const amount = Number(invoiceDraft.amount);
    if (!amount || amount <= 0) return toast.error('Enter amount');
    const inv: CaseInvoice = {
      id: generateId(),
      number: `QA-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
      createdAt: Date.now(),
      dueDate: invoiceDraft.dueDate || '',
      currency: 'INR',
      amount,
      description: invoiceDraft.description || 'Professional services',
      status: 'SENT',
      paymentLink: invoiceDraft.paymentLink || '',
    };
    const updated = addInvoice(caseId, inv);
    if (updated) setCaseData(updated);
    setInvoiceDraft({ amount: '', description: '', dueDate: '', paymentLink: '' });
    toast.success('Invoice created');
    logActivity(user, 'CREATE_INVOICE', `${caseData.title}: ${inv.number} (₹${amount})`);
  };

  const setInvoiceStatus = (id: string, status: CaseInvoice['status']) => {
    if (!isAdmin) return;
    const updated = updateInvoice(caseId, id, { status });
    if (updated) setCaseData(updated);
    toast.success('Invoice updated');
    logActivity(user, 'UPDATE_INVOICE', `${caseData.title}: ${status}`);
  };

  const toggleTask = (t: CaseTask) => {
    if (!canManage) return;
    const nextStatus = t.status === 'DONE' ? 'TODO' : 'DONE';
    const updated = updateTask(caseId, t.id, { status: nextStatus });
    if (updated) setCaseData(updated);
    logActivity(user, 'UPDATE_TASK', `${caseData.title}: ${t.title} → ${nextStatus}`);
  };

  const addNewTask = () => {
    if (!canManage) return;
    const title = taskTitle.trim();
    if (!title) return;
    const task: CaseTask = { id: generateId(), title, status: 'TODO', createdAt: Date.now() };
    const updated = addTask(caseId, task);
    if (updated) setCaseData(updated);
    setTaskTitle('');
    toast.success('Task added');
    logActivity(user, 'ADD_TASK', `${caseData.title}: ${title}`);
  };

  const addNote = () => {
    if (!canManage) return;
    const text = noteText.trim();
    if (!text) return;
    const updated = addInternalNote(caseId, {
      id: generateId(),
      authorEmail: user.email,
      authorName: user.name,
      text,
      createdAt: Date.now(),
    });
    if (updated) setCaseData(updated);
    setNoteText('');
    toast.success('Note added');
    logActivity(user, 'ADD_NOTE', caseData.title);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-14 space-y-8">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Case</span>
            <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${statusStyles[caseData.status]}`}>
              {caseData.status.replace(/_/g, ' ')}
            </span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white mt-2">{caseData.title}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            {caseData.service} • Client: {caseData.clientName} ({caseData.clientEmail})
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to="/cases" className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold">
              ← Back
            </Link>
            <Link to="/records" className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold">
              My Records
            </Link>
          </div>
        </div>

        <div className="w-full lg:w-[420px]">
          <Card>
            <div className="p-6 space-y-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Overview</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-700/40">
                  <p className="text-[10px] font-black uppercase text-slate-400">Docs</p>
                  <p className="text-xl font-black text-slate-900 dark:text-white mt-1">{caseData.documents?.length || 0}</p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-700/40">
                  <p className="text-[10px] font-black uppercase text-slate-400">Invoices</p>
                  <p className="text-xl font-black text-slate-900 dark:text-white mt-1">{caseData.invoices?.length || 0}</p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-700/40">
                  <p className="text-[10px] font-black uppercase text-slate-400">Calcs</p>
                  <p className="text-xl font-black text-slate-900 dark:text-white mt-1">{clientCalcsCount}</p>
                </div>
              </div>

              {canManage && (
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Status</label>
                    <select
                      value={caseData.status}
                      onChange={(e) => setStatus(e.target.value as CaseStatus)}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm font-bold outline-none focus:border-indigo-500 dark:text-white"
                    >
                      <option value="NEW">NEW</option>
                      <option value="IN_REVIEW">IN REVIEW</option>
                      <option value="WAITING_ON_CLIENT">WAITING ON CLIENT</option>
                      <option value="SCHEDULED">SCHEDULED</option>
                      <option value="ON_HOLD">ON HOLD</option>
                      <option value="COMPLETED">COMPLETED</option>
                    </select>
                  </div>

                  {isAdmin && (
                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Assign</label>
                      <select
                        value={caseData.assignedToEmail || ''}
                        onChange={(e) => setAssignee(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm font-bold outline-none focus:border-indigo-500 dark:text-white"
                      >
                        <option value="">Unassigned</option>
                        {employees.map((emp) => (
                          <option key={emp.email} value={emp.email}>
                            {emp.name} ({emp.email})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(Object.keys(tabLabel) as TabId[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-3 rounded-2xl text-sm font-black transition-all border ${
              tab === t
                ? 'bg-slate-900 text-white border-slate-900 dark:bg-indigo-600 dark:border-indigo-500'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
            }`}
          >
            {tabLabel[t]}
          </button>
        ))}
      </div>

      {tab === 'data' && (
        <Card>
          <div className="p-8 space-y-6">
            <div className="flex items-end justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">Provided Data</h2>
                <p className="text-slate-500 dark:text-slate-300 mt-1">Client-submitted info for this case.</p>
              </div>
              {(isOwner || isAdmin) && <Button onClick={saveProvidedData}>Save</Button>}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Input
                label="PAN"
                value={dataDraft.pan || ''}
                onChange={(e) => setDataDraft({ ...dataDraft, pan: e.target.value.toUpperCase() })}
                placeholder="ABCDE1234F"
                disabled={!isOwner && !isAdmin}
              />
              <Input
                label="Aadhaar"
                value={dataDraft.aadhaar || ''}
                onChange={(e) => setDataDraft({ ...dataDraft, aadhaar: e.target.value })}
                placeholder="xxxx xxxx xxxx"
                disabled={!isOwner && !isAdmin}
              />
              <Input
                label="Date of Birth"
                value={dataDraft.dob || ''}
                onChange={(e) => setDataDraft({ ...dataDraft, dob: e.target.value })}
                placeholder="YYYY-MM-DD"
                disabled={!isOwner && !isAdmin}
              />
              <Input
                label="Gross Income (₹)"
                type="number"
                value={dataDraft.grossIncome || ''}
                onChange={(e) => setDataDraft({ ...dataDraft, grossIncome: Number(e.target.value) })}
                placeholder="1500000"
                disabled={!isOwner && !isAdmin}
              />
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Notes</label>
                <textarea
                  value={dataDraft.notes || ''}
                  onChange={(e) => setDataDraft({ ...dataDraft, notes: e.target.value })}
                  rows={4}
                  disabled={!isOwner && !isAdmin}
                  className="w-full p-4 border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl text-base font-semibold outline-none transition-all duration-200 disabled:opacity-60"
                />
              </div>
            </div>
          </div>
        </Card>
      )}

      {tab === 'docs' && (
        <Card>
          <div className="p-8 space-y-6">
            <div className="flex items-end justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">Documents</h2>
                <p className="text-slate-500 dark:text-slate-300 mt-1">
                  Upload PDFs/images. Stored locally in this browser (IndexedDB).
                </p>
              </div>
              {canUploadDocs && (
                <label className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-slate-900 text-white font-black text-sm cursor-pointer">
                  Upload
                  <input
                    type="file"
                    multiple
                    accept="application/pdf,image/*"
                    className="hidden"
                    onChange={(e) => uploadDocs(e.target.files)}
                  />
                </label>
              )}
            </div>

            <div className="space-y-3">
              {(caseData.documents || []).map((d) => (
                <div
                  key={d.id}
                  className="p-5 rounded-3xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                >
                  <div>
                    <div className="font-black text-slate-900 dark:text-white">{d.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-300 mt-1">
                      {(d.size / 1024).toFixed(1)} KB • {new Date(d.uploadedAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => openPreview(d)}
                      disabled={isPreviewLoading}
                      className="px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-200 text-xs font-black"
                    >
                      Preview
                    </button>
                    <button
                      onClick={() => openDoc(d, false)}
                      className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700/50 text-slate-800 dark:text-slate-200 text-xs font-black"
                    >
                      Open
                    </button>
                    <button
                      onClick={() => openDoc(d, true)}
                      className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700/50 text-slate-800 dark:text-slate-200 text-xs font-black"
                    >
                      Download
                    </button>
                    {canUploadDocs && (
                      <button
                        onClick={() => deleteDoc(d)}
                        className="px-4 py-2 rounded-xl bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-200 text-xs font-black"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {(caseData.documents || []).length === 0 && (
                <div className="p-10 text-center text-slate-400 font-bold">No documents yet.</div>
              )}
            </div>
          </div>
        </Card>
      )}

      {docPreview && (
        <div className="fixed inset-0 z-[65] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onMouseDown={() =>
              setDocPreview((prev) => {
                if (prev?.url) URL.revokeObjectURL(prev.url);
                return null;
              })
            }
          />
          <div
            className="relative w-full max-w-5xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-2xl overflow-hidden"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <div className="text-sm font-black text-slate-900 dark:text-white truncate">{docPreview.meta.name}</div>
                <div className="text-xs text-slate-500 dark:text-slate-300 mt-0.5">
                  {(docPreview.meta.size / 1024).toFixed(1)} KB â€¢ {docPreview.meta.type || 'file'}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => window.open(docPreview.url, '_blank', 'noopener,noreferrer')}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-black"
                >
                  New tab
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = docPreview.url;
                    a.download = docPreview.meta.name;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-black"
                >
                  Download
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setDocPreview((prev) => {
                      if (prev?.url) URL.revokeObjectURL(prev.url);
                      return null;
                    })
                  }
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-black"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950">
              {(() => {
                const isPdf = docPreview.meta.type === 'application/pdf' || docPreview.meta.name.toLowerCase().endsWith('.pdf');
                const isImage = (docPreview.meta.type || '').startsWith('image/');

                if (isPdf) {
                  return (
                    <iframe
                      title={docPreview.meta.name}
                      src={docPreview.url}
                      className="w-full h-[72vh] bg-white"
                    />
                  );
                }

                if (isImage) {
                  return (
                    <div className="p-4 flex justify-center">
                      <img
                        src={docPreview.url}
                        alt={docPreview.meta.name}
                        className="max-h-[72vh] rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700"
                      />
                    </div>
                  );
                }

                return (
                  <div className="p-12 text-center text-slate-500 dark:text-slate-300 font-bold">
                    Preview not available for this file type. Use “New tab” or “Download”.
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {tab === 'appts' && (
        <Card>
          <div className="p-8 space-y-8">
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">Appointments</h2>
              <p className="text-slate-500 dark:text-slate-300 mt-1">Client can request; admin/employee can confirm.</p>
            </div>

            {(isOwner || isAdmin) && (
              <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/40 space-y-4">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Request</p>
                <div className="grid md:grid-cols-2 gap-6">
                  <Input
                    label="Preferred Date"
                    type="date"
                    value={apptDraft.preferredDate}
                    onChange={(e) => setApptDraft({ ...apptDraft, preferredDate: e.target.value })}
                  />
                  <Input
                    label="Preferred Time"
                    type="time"
                    value={apptDraft.preferredTime}
                    onChange={(e) => setApptDraft({ ...apptDraft, preferredTime: e.target.value })}
                  />
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Mode</label>
                    <select
                      value={apptDraft.mode}
                      onChange={(e) => setApptDraft({ ...apptDraft, mode: e.target.value as AppointmentMode })}
                      className="w-full p-4 border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl text-base font-semibold outline-none"
                    >
                      <option value="CALL">Call</option>
                      <option value="VIDEO">Video</option>
                      <option value="IN_PERSON">In-person</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Notes</label>
                    <textarea
                      value={apptDraft.notes}
                      onChange={(e) => setApptDraft({ ...apptDraft, notes: e.target.value })}
                      rows={3}
                      className="w-full p-4 border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl text-base font-semibold outline-none"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={requestAppt}>Submit</Button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {(caseData.appointments || [])
                .slice()
                .sort((a, b) => b.requestedAt - a.requestedAt)
                .map((a) => (
                  <div
                    key={a.id}
                    className="p-6 rounded-3xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="font-black text-slate-900 dark:text-white">
                        {a.mode} • {a.preferredDate} {a.preferredTime}
                      </div>
                      <div className="text-xs font-black uppercase text-slate-500 dark:text-slate-300">{a.status}</div>
                    </div>
                    {a.scheduledFor && (
                      <div className="text-xs font-mono text-indigo-600 dark:text-indigo-300">Scheduled: {a.scheduledFor}</div>
                    )}
                    {a.notes && <div className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap">{a.notes}</div>}

                    {canManage && (
                      <div className="flex flex-col md:flex-row gap-3 md:items-center">
                        {a.status === 'REQUESTED' && (
                          <>
                            <Input
                              value={scheduleDraft[a.id] || ''}
                              onChange={(e) => setScheduleDraft({ ...scheduleDraft, [a.id]: e.target.value })}
                              placeholder="Scheduled: 2026-02-10 11:00"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => confirmAppt(a.id)}
                                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-black"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setApptStatus(a.id, 'CANCELLED')}
                                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700/50 text-slate-800 dark:text-slate-200 text-xs font-black"
                              >
                                Cancel
                              </button>
                            </div>
                          </>
                        )}
                        {a.status === 'CONFIRMED' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => setApptStatus(a.id, 'COMPLETED')}
                              className="px-4 py-2 rounded-xl bg-green-600 text-white text-xs font-black"
                            >
                              Complete
                            </button>
                            <button
                              onClick={() => setApptStatus(a.id, 'CANCELLED')}
                              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700/50 text-slate-800 dark:text-slate-200 text-xs font-black"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              {(caseData.appointments || []).length === 0 && (
                <div className="p-10 text-center text-slate-400 font-bold">No appointment requests yet.</div>
              )}
            </div>
          </div>
        </Card>
      )}

      {tab === 'invoices' && (
        <Card>
          <div className="p-8 space-y-8">
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">Invoices</h2>
              <p className="text-slate-500 dark:text-slate-300 mt-1">Stubbed payments: invoices + optional pay link.</p>
            </div>

            {isAdmin && (
              <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/40 space-y-4">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Create</p>
                <div className="grid md:grid-cols-2 gap-6">
                  <Input
                    label="Amount (₹)"
                    type="number"
                    value={invoiceDraft.amount}
                    onChange={(e) => setInvoiceDraft({ ...invoiceDraft, amount: e.target.value })}
                  />
                  <Input
                    label="Due Date"
                    type="date"
                    value={invoiceDraft.dueDate}
                    onChange={(e) => setInvoiceDraft({ ...invoiceDraft, dueDate: e.target.value })}
                  />
                  <div className="md:col-span-2">
                    <Input
                      label="Description"
                      value={invoiceDraft.description}
                      onChange={(e) => setInvoiceDraft({ ...invoiceDraft, description: e.target.value })}
                      placeholder="ITR filing + consultation"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Input
                      label="Payment Link (optional)"
                      value={invoiceDraft.paymentLink}
                      onChange={(e) => setInvoiceDraft({ ...invoiceDraft, paymentLink: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={createInvoice}>Create</Button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {(caseData.invoices || [])
                .slice()
                .sort((a, b) => b.createdAt - a.createdAt)
                .map((inv) => (
                  <div
                    key={inv.id}
                    className="p-6 rounded-3xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="font-black text-slate-900 dark:text-white">
                        {inv.number} • ₹{inv.amount.toLocaleString('en-IN')}
                      </div>
                      <div className="text-xs font-black uppercase text-slate-500 dark:text-slate-300">{inv.status}</div>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-300">
                      Created {new Date(inv.createdAt).toLocaleString()} {inv.dueDate ? `• Due ${inv.dueDate}` : ''}
                    </div>
                    <div className="text-sm text-slate-700 dark:text-slate-200">{inv.description}</div>
                    {inv.paymentLink && (
                      <a
                        href={inv.paymentLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block text-sm font-black text-indigo-600 dark:text-indigo-300"
                      >
                        Pay link →
                      </a>
                    )}
                    {isAdmin && (
                      <div className="flex gap-2 flex-wrap pt-2">
                        <button
                          onClick={() => setInvoiceStatus(inv.id, 'SENT')}
                          className="px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-200 text-xs font-black"
                        >
                          Sent
                        </button>
                        <button
                          onClick={() => setInvoiceStatus(inv.id, 'PAID')}
                          className="px-4 py-2 rounded-xl bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-200 text-xs font-black"
                        >
                          Paid
                        </button>
                        <button
                          onClick={() => setInvoiceStatus(inv.id, 'VOID')}
                          className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700/50 text-slate-800 dark:text-slate-200 text-xs font-black"
                        >
                          Void
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              {(caseData.invoices || []).length === 0 && (
                <div className="p-10 text-center text-slate-400 font-bold">No invoices yet.</div>
              )}
            </div>
          </div>
        </Card>
      )}

      {tab === 'tasks' && (
        <Card>
          <div className="p-8 space-y-6">
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">Tasks</h2>
              <p className="text-slate-500 dark:text-slate-300 mt-1">Employee/admin checklist for this case.</p>
            </div>

            {!canManage ? (
              <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/40 text-sm font-bold text-slate-600 dark:text-slate-200">
                Tasks are only visible to assigned employee/admin.
              </div>
            ) : (
              <>
                <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/40 flex flex-col md:flex-row gap-3">
                  <Input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="Add a task..." />
                  <Button onClick={addNewTask}>Add</Button>
                </div>
                <div className="space-y-3">
                  {(caseData.tasks || []).map((t) => (
                    <button
                      key={t.id}
                      onClick={() => toggleTask(t)}
                      className={`w-full text-left p-5 rounded-3xl border transition-all ${
                        t.status === 'DONE'
                          ? 'border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-900/30'
                          : 'border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="font-black text-slate-900 dark:text-white">{t.title}</div>
                        <div className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-300">
                          {t.status.replace(/_/g, ' ')}
                        </div>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-300 mt-2">
                        {new Date(t.createdAt).toLocaleString()}
                      </div>
                    </button>
                  ))}
                  {(caseData.tasks || []).length === 0 && (
                    <div className="p-10 text-center text-slate-400 font-bold">No tasks yet.</div>
                  )}
                </div>
              </>
            )}
          </div>
        </Card>
      )}

      {tab === 'notes' && (
        <Card>
          <div className="p-8 space-y-6">
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">Internal Notes</h2>
              <p className="text-slate-500 dark:text-slate-300 mt-1">Private notes for admin/employee.</p>
            </div>

            {!canManage ? (
              <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/40 text-sm font-bold text-slate-600 dark:text-slate-200">
                Notes are only visible to assigned employee/admin.
              </div>
            ) : (
              <>
                <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/40 space-y-3">
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    rows={4}
                    className="w-full p-4 border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl text-base font-semibold outline-none"
                    placeholder="Write a note..."
                  />
                  <div className="flex justify-end">
                    <Button onClick={addNote}>Add</Button>
                  </div>
                </div>

                <div className="space-y-3">
                  {(caseData.internalNotes || [])
                    .slice()
                    .sort((a, b) => b.createdAt - a.createdAt)
                    .map((n) => (
                      <div
                        key={n.id}
                        className="p-6 rounded-3xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800"
                      >
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                          <div className="font-black text-slate-900 dark:text-white">{n.authorName}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-300">
                            {new Date(n.createdAt).toLocaleString()}
                          </div>
                        </div>
                        <div className="mt-3 text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap">{n.text}</div>
                      </div>
                    ))}
                  {(caseData.internalNotes || []).length === 0 && (
                    <div className="p-10 text-center text-slate-400 font-bold">No notes yet.</div>
                  )}
                </div>
              </>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default CaseDetails;
