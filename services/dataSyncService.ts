const IMPORT_ENDPOINT = '/api/v1/import/local-export';

let syncTimer: ReturnType<typeof setTimeout> | null = null;

const parseKey = <T,>(key: string, fallback: T): T => {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const buildPayload = () => ({
  users: parseKey<any[]>('quickaccounting_users', []),
  profiles: parseKey<any[]>('tax_profiles', []),
  cases: parseKey<any[]>('tax_cases', []),
  calculations: parseKey<any[]>('tax_saved_calcs', []),
  inquiries: parseKey<any[]>('tax_inquiries', []),
  activities: parseKey<any[]>('tax_activities', []),
});

export const syncLocalDataToBackend = async () => {
  try {
    await fetch(IMPORT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildPayload()),
    });
  } catch {
    // Silent fallback: app keeps local mode if backend is unavailable.
  }
};

export const scheduleLocalDataSync = (delayMs = 700) => {
  if (typeof window === 'undefined') return;
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    syncTimer = null;
    syncLocalDataToBackend();
  }, delayMs);
};

