import { ClientProfile, User } from '../types';
import { loadJson, saveJson } from './storageService';

const PROFILE_KEY = 'tax_profiles';

export const getProfile = (user: User): ClientProfile => {
  const all = loadJson<ClientProfile[]>(PROFILE_KEY, []);
  const existing = all.find((p) => p.email === user.email);
  if (existing) return existing;

  const now = Date.now();
  const fresh: ClientProfile = {
    email: user.email,
    name: user.name,
    phone: '',
    whatsapp: '',
    address: '',
    pan: '',
    aadhaar: '',
    aadhaarDocument: null,
    notificationPrefs: { email: true, whatsapp: false },
    createdAt: now,
    updatedAt: now,
  };
  saveJson(PROFILE_KEY, [...all, fresh]);
  return fresh;
};

export const upsertProfile = (profile: ClientProfile) => {
  const all = loadJson<ClientProfile[]>(PROFILE_KEY, []);
  const idx = all.findIndex((p) => p.email === profile.email);
  const updated = { ...profile, updatedAt: Date.now() };

  if (idx >= 0) {
    const next = [...all];
    next[idx] = updated;
    saveJson(PROFILE_KEY, next);
    return updated;
  }

  saveJson(PROFILE_KEY, [...all, updated]);
  return updated;
};

export const listProfiles = () => loadJson<ClientProfile[]>(PROFILE_KEY, []);
