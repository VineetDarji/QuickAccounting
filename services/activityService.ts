import { Activity, User } from '../types';
import { generateId, loadJson, saveJson } from './storageService';

const ACTIVITY_KEY = 'tax_activities';

export const logActivity = (user: User, action: string, details: string) => {
  const existing = loadJson<Activity[]>(ACTIVITY_KEY, []);
  const entry: Activity = {
    id: generateId(),
    userName: user.name,
    userEmail: user.email,
    action,
    details,
    timestamp: Date.now(),
  };
  saveJson(ACTIVITY_KEY, [...existing, entry]);
};

