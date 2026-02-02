import { create } from 'zustand';
import { User } from '../types';

interface UserState {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  login: (user) => {
    set({ user });
    localStorage.setItem('tax_user', JSON.stringify(user));
  },
  logout: () => {
    set({ user: null });
    localStorage.removeItem('tax_user');
  },
}));
