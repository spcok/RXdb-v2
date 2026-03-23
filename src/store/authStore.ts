import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';

interface AuthState {
  session: Session | null;
  currentUser: any | null; 
  isLoading: boolean;
  isUiLocked: boolean;
  setUiLocked: (locked: boolean) => void;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>; // 🚨 Restored Login Function
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  currentUser: null,
  isLoading: true,
  isUiLocked: false,
  setUiLocked: (locked: boolean) => set({ isUiLocked: locked }),

  initialize: async () => {
    try {
      console.log('🛡️ [Auth] Initializing Real Supabase Auth...');
      
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) throw error;

      if (session) {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        set({ 
          session, 
          currentUser: profile || session.user, 
          isLoading: false 
        });
      } else {
        set({ session: null, currentUser: null, isLoading: false });
      }

      supabase.auth.onAuthStateChange(async (_event, newSession) => {
        if (newSession) {
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', newSession.user.id)
            .single();
            
          set({ 
            session: newSession, 
            currentUser: profile || newSession.user, 
            isLoading: false 
          });
        } else {
          set({ session: null, currentUser: null, isLoading: false });
        }
      });

    } catch (error) {
      console.error('❌ [Auth Error] Failed to initialize session:', error);
      set({ session: null, currentUser: null, isLoading: false });
    }
  },

  // 🚨 Restored the missing login function so the LoginScreen doesn't crash
  login: async (email, password) => {
    console.log('🔑 [Auth] Attempting Login...');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    // The onAuthStateChange listener will automatically catch this and update the state
  },

  logout: async () => {
    console.log('🚪 [Auth] Logging out...');
    set({ isLoading: true });
    await supabase.auth.signOut();
    set({ session: null, currentUser: null, isLoading: false });
  }
}));