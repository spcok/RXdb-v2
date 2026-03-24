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
  login: (email: string, password: string) => Promise<void>; 
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
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
           console.warn('⚠️ [Auth] Profile fetch issue (RLS might be blocking):', profileError.message);
        }

        const userData = profile || {
          ...session.user,
          role: session.user.user_metadata?.role || 'GUEST'
        };

        console.log(`👤 [Auth] Boot Resolved Role: ${userData.role}`);

        set({ session, currentUser: userData, isLoading: false });
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
            
          const userData = profile || {
            ...newSession.user,
            role: newSession.user.user_metadata?.role || 'GUEST'
          };

          console.log(`👤 [Auth] Login Resolved Role: ${userData.role}`);

          set({ session: newSession, currentUser: userData, isLoading: false });
        } else {
          set({ session: null, currentUser: null, isLoading: false });
        }
      });

    } catch (error) {
      console.error('❌ [Auth Error] Failed to initialize session:', error);
      set({ session: null, currentUser: null, isLoading: false });
    }
  },

  login: async (email, password) => {
    console.log('🔑 [Auth] Attempting Login...');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  },

  logout: async () => {
    console.log('🚪 [Auth] Logging out...');
    set({ isLoading: true });
    await supabase.auth.signOut();
    set({ session: null, currentUser: null, isLoading: false });
  }
}));