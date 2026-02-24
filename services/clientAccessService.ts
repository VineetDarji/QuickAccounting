import { ClientAccessRequest, User } from '../types';
import { generateId, loadJson, saveJson } from './storageService';

const REQUESTS_KEY = 'tax_client_access_requests';
const USERS_KEY = 'quickaccounting_users';

const parseJson = async (response: Response) => {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `HTTP ${response.status}`);
  }
  return response.json();
};

const normalizeRequest = (request: any): ClientAccessRequest => ({
  id: String(request?.id || generateId()),
  email: String(request?.email || ''),
  name: String(request?.name || request?.email || ''),
  reason: String(request?.reason || ''),
  status: request?.status === 'approved' || request?.status === 'rejected' ? request.status : 'pending',
  createdAt: Number(request?.createdAt || Date.now()),
  decidedAt: request?.decidedAt ? Number(request.decidedAt) : undefined,
  decidedByEmail: request?.decidedByEmail ? String(request.decidedByEmail) : undefined,
});

const upsertLocalRequest = (request: ClientAccessRequest) => {
  const all = listClientAccessRequests();
  const idx = all.findIndex((item) => item.id === request.id);
  if (idx >= 0) {
    all[idx] = request;
    saveJson(REQUESTS_KEY, all);
    return;
  }
  saveJson(REQUESTS_KEY, [request, ...all]);
};

const replaceLocalRequests = (requests: ClientAccessRequest[]) => {
  const normalized = requests.map(normalizeRequest).sort((a, b) => b.createdAt - a.createdAt);
  saveJson(REQUESTS_KEY, normalized);
};

const updateStoredUserRole = (email: string, role: User['role']) => {
  const users = loadJson<any[]>(USERS_KEY, []);
  const idx = users.findIndex((u) => String(u?.email || '').toLowerCase() === String(email || '').toLowerCase());
  if (idx < 0) return false;
  users[idx] = { ...users[idx], role, updatedAt: Date.now() };
  saveJson(USERS_KEY, users);
  return true;
};

export const listClientAccessRequests = (): ClientAccessRequest[] =>
  loadJson<ClientAccessRequest[]>(REQUESTS_KEY, []).sort((a, b) => b.createdAt - a.createdAt);

export const getPendingClientAccessRequestByEmail = (email: string): ClientAccessRequest | null => {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail) return null;
  const all = listClientAccessRequests();
  return all.find((request) => String(request.email || '').toLowerCase() === normalizedEmail && request.status === 'pending') || null;
};

export const fetchClientAccessRequests = async (filters?: { status?: 'pending' | 'approved' | 'rejected'; email?: string }) => {
  const query = new URLSearchParams();
  if (filters?.status) query.set('status', filters.status);
  if (filters?.email) query.set('email', filters.email);
  const suffix = query.toString() ? `?${query.toString()}` : '';

  try {
    const response = await fetch(`/api/v1/client-access-requests${suffix}`);
    const data = (await parseJson(response)) as ClientAccessRequest[];
    replaceLocalRequests(data);
    return data.map(normalizeRequest);
  } catch {
    const all = listClientAccessRequests();
    return all.filter((request) => {
      if (filters?.status && request.status !== filters.status) return false;
      if (filters?.email && String(request.email || '').toLowerCase() !== String(filters.email).toLowerCase()) return false;
      return true;
    });
  }
};

export const fetchPendingClientAccessRequestByEmail = async (email: string) => {
  if (!email) return null;
  const requests = await fetchClientAccessRequests({ email, status: 'pending' });
  return requests[0] || null;
};

export const createClientAccessRequest = async (payload: { email: string; name: string; reason?: string }) => {
  const email = String(payload.email || '').trim();
  if (!email) return null;

  try {
    const response = await fetch('/api/v1/client-access-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        name: String(payload.name || email),
        reason: String(payload.reason || ''),
      }),
    });
    const created = normalizeRequest(await parseJson(response));
    upsertLocalRequest(created);
    updateStoredUserRole(email, 'client_pending');
    return created;
  } catch {
    const existing = getPendingClientAccessRequestByEmail(email);
    if (existing) return existing;

    const local: ClientAccessRequest = {
      id: generateId(),
      email,
      name: String(payload.name || email).trim() || email,
      reason: String(payload.reason || '').trim(),
      status: 'pending',
      createdAt: Date.now(),
    };
    upsertLocalRequest(local);
    updateStoredUserRole(email, 'client_pending');
    return local;
  }
};

export const decideClientAccessRequest = async (
  requestId: string,
  decision: 'approved' | 'rejected',
  admin: { email: string }
): Promise<ClientAccessRequest | null> => {
  if (!requestId) return null;

  try {
    const response = await fetch(`/api/v1/client-access-requests/${encodeURIComponent(requestId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        decision,
        decidedByEmail: String(admin.email || ''),
      }),
    });
    const updated = normalizeRequest(await parseJson(response));
    upsertLocalRequest(updated);
    updateStoredUserRole(updated.email, decision === 'approved' ? 'client' : 'user');
    return updated;
  } catch {
    const all = listClientAccessRequests();
    const idx = all.findIndex((request) => request.id === requestId);
    if (idx < 0) return null;

    const current = all[idx];
    const updated: ClientAccessRequest = {
      ...current,
      status: decision,
      decidedAt: Date.now(),
      decidedByEmail: String(admin.email || ''),
    };
    const next = [...all];
    next[idx] = updated;
    saveJson(REQUESTS_KEY, next);
    updateStoredUserRole(current.email, decision === 'approved' ? 'client' : 'user');
    return updated;
  }
};
