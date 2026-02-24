import { create } from 'zustand';
import { User } from '../types';
import { normalizeUserIdentity } from '../services/userNameService';

interface UserState {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}

const normalizeRole = (role: string): User['role'] => {
  const value = String(role || '').toLowerCase();
  if (value === 'admin') return 'admin';
  if (value === 'employee') return 'employee';
  if (value === 'client') return 'client';
  if (value === 'client_pending') return 'client_pending';
  return 'user';
};

export const useUserStore = create<UserState>((set) => ({
  user: null,
  login: (user) => {
    const normalized = normalizeUserIdentity({
      ...user,
      role: normalizeRole((user as any)?.role),
    }) as User;
    set({ user: normalized });
    localStorage.setItem('tax_user', JSON.stringify(normalized));
  },
  logout: () => {
    set({ user: null });
    localStorage.removeItem('tax_user');
  },
}));
