import { User } from '../types';
import { loadJson, saveJson } from './storageService';

const USERS_KEY = 'quickaccounting_users';
const SESSION_KEY = 'tax_user';

export const splitFullName = (name: string) => {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return { firstName: '', middleName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], middleName: '', lastName: '' };
  if (parts.length === 2) return { firstName: parts[0], middleName: '', lastName: parts[1] };
  return {
    firstName: parts[0],
    middleName: parts.slice(1, -1).join(' '),
    lastName: parts[parts.length - 1],
  };
};

export const buildFullName = (parts: { firstName?: string; middleName?: string; lastName?: string }) =>
  [parts.firstName, parts.middleName, parts.lastName]
    .map((part) => String(part || '').trim())
    .filter(Boolean)
    .join(' ')
    .trim();

export const normalizeUserIdentity = <T extends { name?: string; firstName?: string; middleName?: string; lastName?: string }>(
  user: T
) => {
  const fromName = splitFullName(String(user?.name || ''));
  const firstName = String(user?.firstName || fromName.firstName || '').trim();
  const middleName = String(user?.middleName || fromName.middleName || '').trim();
  const lastName = String(user?.lastName || fromName.lastName || '').trim();
  const name = buildFullName({ firstName, middleName, lastName }) || String(user?.name || '').trim();
  return {
    ...user,
    firstName,
    middleName,
    lastName,
    name,
  };
};

export const backfillStoredUsersIdentity = () => {
  const users = loadJson<any[]>(USERS_KEY, []);
  let changed = false;
  const nextUsers = users.map((user) => {
    if (!user || typeof user !== 'object') return user;
    const normalized = normalizeUserIdentity(user);
    if (
      normalized.name !== user.name ||
      normalized.firstName !== user.firstName ||
      normalized.middleName !== user.middleName ||
      normalized.lastName !== user.lastName
    ) {
      changed = true;
      return { ...normalized, updatedAt: Date.now() };
    }
    return user;
  });

  if (changed) saveJson(USERS_KEY, nextUsers);

  const sessionRaw = localStorage.getItem(SESSION_KEY);
  if (!sessionRaw) return;
  try {
    const sessionUser = JSON.parse(sessionRaw) as User;
    const normalizedSession = normalizeUserIdentity(sessionUser);
    if (
      normalizedSession.name !== sessionUser.name ||
      normalizedSession.firstName !== (sessionUser as any).firstName ||
      normalizedSession.middleName !== (sessionUser as any).middleName ||
      normalizedSession.lastName !== (sessionUser as any).lastName
    ) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(normalizedSession));
    }
  } catch {
    // ignore
  }
};

export const updateStoredUserIdentity = (payload: {
  email: string;
  firstName: string;
  middleName?: string;
  lastName: string;
}) => {
  const email = String(payload.email || '').trim().toLowerCase();
  if (!email) return null;
  const normalized = normalizeUserIdentity({
    email,
    firstName: payload.firstName,
    middleName: payload.middleName || '',
    lastName: payload.lastName,
  });

  const users = loadJson<any[]>(USERS_KEY, []);
  const idx = users.findIndex((user) => String(user?.email || '').trim().toLowerCase() === email);
  if (idx < 0) return null;

  const updated = {
    ...users[idx],
    ...normalized,
    updatedAt: Date.now(),
  };
  users[idx] = updated;
  saveJson(USERS_KEY, users);
  return updated;
};
