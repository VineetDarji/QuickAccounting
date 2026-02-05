import {
  CaseAppointment,
  CaseDocument,
  CaseInvoice,
  CaseInternalNote,
  CaseStatus,
  CaseTask,
  TaxCase,
  User,
} from '../types';
import { generateId, loadJson, saveJson } from './storageService';

const CASES_KEY = 'tax_cases';

const normalizeStatus = (status?: string): CaseStatus => {
  const s = String(status || '').toUpperCase();
  const allowed: CaseStatus[] = [
    'NEW',
    'IN_REVIEW',
    'WAITING_ON_CLIENT',
    'SCHEDULED',
    'ON_HOLD',
    'COMPLETED',
  ];
  return (allowed.includes(s as CaseStatus) ? (s as CaseStatus) : 'NEW') as CaseStatus;
};

export const listCases = () => {
  const all = loadJson<TaxCase[]>(CASES_KEY, []);
  return all
    .map((c) => ({ ...c, status: normalizeStatus(c.status) }))
    .sort((a, b) => b.updatedAt - a.updatedAt);
};

export const getCaseById = (id: string) => listCases().find((c) => c.id === id);

export const listCasesForClient = (clientEmail: string) => listCases().filter((c) => c.clientEmail === clientEmail);

export const listCasesForAssignee = (assigneeEmail: string) =>
  listCases().filter((c) => c.assignedToEmail === assigneeEmail);

const getDefaultTasks = (service: string): CaseTask[] => {
  const now = Date.now();
  const mk = (title: string): CaseTask => ({ id: generateId(), title, status: 'TODO', createdAt: now });

  const s = service.toLowerCase();
  if (s.includes('gst')) return [mk('Collect sales invoices'), mk('Collect purchase invoices'), mk('Reconcile input credits')];
  if (s.includes('audit')) return [mk('Collect financial statements'), mk('Collect ledger exports'), mk('Prepare audit checklist')];
  if (s.includes('tds')) return [mk('Collect payment list'), mk('Confirm section & rates'), mk('Prepare return data')];
  return [mk('Collect Form 16 / salary details'), mk('Collect bank interest statements'), mk('Collect deduction proofs (80C/80D)')];
};

export const createCase = (user: User, input: { title: string; service: string }): TaxCase => {
  const all = loadJson<TaxCase[]>(CASES_KEY, []);
  const now = Date.now();
  const next: TaxCase = {
    id: generateId(),
    clientEmail: user.email,
    clientName: user.name,
    title: input.title.trim() || 'New Case',
    service: input.service || 'Income Tax Filing',
    status: 'NEW',
    createdAt: now,
    updatedAt: now,
    providedData: {},
    documents: [],
    appointments: [],
    invoices: [],
    assignedToEmail: '',
    internalNotes: [],
    tasks: getDefaultTasks(input.service || ''),
  };
  saveJson(CASES_KEY, [...all, next]);
  return next;
};

export const createCaseForClient = (client: { email: string; name: string }, input: { title: string; service: string }): TaxCase => {
  const all = loadJson<TaxCase[]>(CASES_KEY, []);
  const now = Date.now();
  const next: TaxCase = {
    id: generateId(),
    clientEmail: client.email,
    clientName: client.name,
    title: input.title.trim() || 'New Case',
    service: input.service || 'Income Tax Filing',
    status: 'NEW',
    createdAt: now,
    updatedAt: now,
    providedData: {},
    documents: [],
    appointments: [],
    invoices: [],
    assignedToEmail: '',
    internalNotes: [],
    tasks: getDefaultTasks(input.service || ''),
  };
  saveJson(CASES_KEY, [...all, next]);
  return next;
};

export const updateCase = (id: string, updater: (current: TaxCase) => TaxCase) => {
  const all = loadJson<TaxCase[]>(CASES_KEY, []);
  const idx = all.findIndex((c) => c.id === id);
  if (idx < 0) return null;

  const current = all[idx];
  const updated = {
    ...updater(current),
    updatedAt: Date.now(),
  };
  const next = [...all];
  next[idx] = updated;
  saveJson(CASES_KEY, next);
  return updated;
};

export const addCaseDocumentMeta = (caseId: string, doc: CaseDocument) =>
  updateCase(caseId, (c) => ({ ...c, documents: [...(c.documents || []), doc] }));

export const removeCaseDocumentMeta = (caseId: string, docId: string) =>
  updateCase(caseId, (c) => ({ ...c, documents: (c.documents || []).filter((d) => d.id !== docId) }));

export const addAppointment = (caseId: string, appt: CaseAppointment) =>
  updateCase(caseId, (c) => ({ ...c, appointments: [...(c.appointments || []), appt] }));

export const updateAppointment = (caseId: string, apptId: string, patch: Partial<CaseAppointment>) =>
  updateCase(caseId, (c) => ({
    ...c,
    appointments: (c.appointments || []).map((a) => (a.id === apptId ? { ...a, ...patch } : a)),
  }));

export const addInvoice = (caseId: string, invoice: CaseInvoice) =>
  updateCase(caseId, (c) => ({ ...c, invoices: [...(c.invoices || []), invoice] }));

export const updateInvoice = (caseId: string, invoiceId: string, patch: Partial<CaseInvoice>) =>
  updateCase(caseId, (c) => ({
    ...c,
    invoices: (c.invoices || []).map((inv) => (inv.id === invoiceId ? { ...inv, ...patch } : inv)),
  }));

export const addInternalNote = (caseId: string, note: CaseInternalNote) =>
  updateCase(caseId, (c) => ({ ...c, internalNotes: [...(c.internalNotes || []), note] }));

export const addTask = (caseId: string, task: CaseTask) =>
  updateCase(caseId, (c) => ({ ...c, tasks: [...(c.tasks || []), task] }));

export const updateTask = (caseId: string, taskId: string, patch: Partial<CaseTask>) =>
  updateCase(caseId, (c) => ({
    ...c,
    tasks: (c.tasks || []).map((t) => (t.id === taskId ? { ...t, ...patch } : t)),
  }));
