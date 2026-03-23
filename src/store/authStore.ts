import { create } from 'zustand';

interface AuthState {
  session: { user: { id: string; email: string } } | null;
  isLoading: boolean;
  initialize: () => Promise<void>;
  currentUser: { id: string; email: string; name: string; role: string; initials?: string; job_position?: string; pin?: string } | null;
  logout: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ error: { message: string } | null }>;
  isUiLocked: boolean;
  setUiLocked: (locked: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: { user: { id: 'mock-user-123', email: 'admin@demo.com' } }, // Fake session
  isLoading: false,
  currentUser: { id: 'mock-user-123', email: 'admin@demo.com', name: 'Demo Admin', role: 'admin' },
  initialize: async () => { console.log('🛡️ [Auth] Mock Auth Initialized'); },
  logout: async () => { set({ session: null, currentUser: null }); },
  login: async () => ({ error: null }),
  isUiLocked: false,
  setUiLocked: (locked: boolean) => set({ isUiLocked: locked }),
}));
