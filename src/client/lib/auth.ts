import { create } from 'zustand';
import { api } from './api';

export interface User {
  id: number;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  isAdmin: number;
  mustChangePassword: number;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, displayName: string) => Promise<string>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  loading: true,

  login: async (username, password) => {
    const res = await api.login({ username, password });
    set({ user: res.user });
  },

  register: async (username, password, displayName) => {
    const res = await api.register({ username, password, displayName });
    set({ user: null });
    return res.message;
  },

  logout: async () => {
    await api.logout();
    set({ user: null });
  },

  checkAuth: async () => {
    try {
      const res = await api.me();
      set({ user: res.user, loading: false });
    } catch {
      set({ user: null, loading: false });
    }
  },

  setUser: (user) => set({ user }),
}));
