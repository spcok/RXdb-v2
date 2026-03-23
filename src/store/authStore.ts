import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';

interface AuthState {
  session: Session | null;
  currentUser: any | null; // Holds the extended user profile (role, pin, etc.)
  isLoading: boolean;
  initialize: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  currentUser: null,
  isLoading: true,

  initialize: async () => {
    try {
      console.log('🛡️ [Auth] Initializing Real Supabase Auth...');
      
      // 1. Get the current active session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) throw error;

      if (session) {
        // 2. Fetch the user's extended profile (roles, permissions, pin)
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

      // 3. Listen for future login/logout events
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

  logout: async () => {
    console.log('🚪 [Auth] Logging out...');
    set({ isLoading: true });
    await supabase.auth.signOut();
    set({ session: null, currentUser: null, isLoading: false });
  }
}));