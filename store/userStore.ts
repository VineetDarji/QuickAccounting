import { create } from 'zustand';
import { User } from '../types';

interface UserState {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}

const normalizeRole = (role: string): User['role'] => {
  const value = String(role || '').toLowerCase();
  if (value === 'admin') return 'admin';
  if (value === 'employee') return 'employee';
  return 'user';
};

export const useUserStore = create<UserState>((set) => ({
  user: null,
  login: (user) => {
    const normalized: User = {
      ...user,
      role: normalizeRole((user as any)?.role),
    };
    set({ user: normalized });
    localStorage.setItem('tax_user', JSON.stringify(normalized));
  },
  logout: () => {
    set({ user: null });
    localStorage.removeItem('tax_user');
  },
}));
