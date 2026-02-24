import { scheduleLocalDataSync } from './dataSyncService';

export const loadJson = <T,>(key: string, fallback: T): T => {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

export const saveJson = (key: string, value: unknown) => {
  localStorage.setItem(key, JSON.stringify(value));
  if (
    key === 'quickaccounting_users' ||
    key === 'tax_profiles' ||
    key === 'tax_cases' ||
    key === 'tax_saved_calcs' ||
    key === 'tax_inquiries' ||
    key === 'tax_activities' ||
    key === 'tax_client_access_requests'
  ) {
    scheduleLocalDataSync();
  }
};

export const generateId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
};
