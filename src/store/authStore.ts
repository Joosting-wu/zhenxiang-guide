import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  userId: number;
  name: string;
  email: string;
  avatar_url?: string;
  role?: string;
  token?: string;
  created_at?: string;
}

interface AuthState {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      logout: () => set({ user: null }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
