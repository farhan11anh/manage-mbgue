import { create } from 'zustand';
import { api } from './api';

interface User {
  id: number;
  username: string;
  displayName: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  loading: true,

  login: async (username, password) => {
    const res = await api.login({ username, password }) as { user: User };
    set({ user: res.user });
  },

  register: async (username, password, displayName) => {
    const res = await api.register({ username, password, displayName }) as { user: User };
    set({ user: res.user });
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
}));
