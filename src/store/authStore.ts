import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';
import { User } from '../types';
import { bootCoreDatabase } from '../lib/DatabaseCore';

interface AuthState {
  session: Session | null;
  currentUser: User | null; 
  isLoading: boolean;
  isUiLocked: boolean;
  initialized: boolean;
  setUiLocked: (locked: boolean) => void;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>; 
  logout: () => Promise<void>;
}

// 🛡️ Anti-Hang Wrapper: Physically kills stalled promises
const withTimeout = <T>(promise: Promise<T>, ms: number, errorMessage: string): Promise<T> => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(errorMessage)), ms);
    promise.then(
      (res) => { clearTimeout(timer); resolve(res); },
      (err) => { clearTimeout(timer); reject(err); }
    );
  });
};

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  currentUser: null,
  isLoading: true,
  isUiLocked: false,
  initialized: false,
  setUiLocked: (locked: boolean) => set({ isUiLocked: locked }),

  initialize: async () => {
    if (get().initialized) return;
    set({ initialized: true });

    // Always register the auth state change listener
    supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (newSession) {
        try {
          const { data: profile } = await withTimeout(
            supabase.from('users').select('*').eq('id', newSession.user.id).single(),
            5000,
            "Profile fetch timeout"
          );
            
          const userData = profile || {
            ...newSession.user,
            role: newSession.user.user_metadata?.role || 'GUEST'
          };

          console.log(`👤 [Auth] Login Resolved Role: ${userData.role}`);
          set({ session: newSession, currentUser: userData, isLoading: false });
        } catch (err) {
          console.warn('⚠️ [Auth] Profile fetch failed during auth state change:', err);
          const userData = {
            ...newSession.user,
            role: newSession.user.user_metadata?.role || 'GUEST'
          };
          set({ session: newSession, currentUser: userData, isLoading: false });
        }
      } else {
        set({ session: null, currentUser: null, isLoading: false });
      }
    });

    try {
      console.log('🛡️ [Auth] Initializing Real Supabase Auth...');
      
      const { data: { session }, error } = await withTimeout(
        supabase.auth.getSession(),
        5000,
        "Supabase getSession timeout"
      );
      
      if (error) throw error;

      if (session) {
        let profile = null;
        try {
          const { data, error: profileError } = await withTimeout(
            supabase.from('users').select('*').eq('id', session.user.id).single(),
            5000,
            "Profile fetch timeout"
          );
          if (profileError && profileError.code !== 'PGRST116') {
             console.warn('⚠️ [Auth] Profile fetch issue (RLS might be blocking):', profileError.message);
          }
          profile = data;
        } catch (err) {
          console.warn('⚠️ [Auth] Profile fetch timeout or error:', err);
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

    } catch (error) {
      console.error('❌ [Auth Error] Failed to initialize session:', error);
      set({ session: null, currentUser: null, isLoading: false });
    }
  },

  login: async (email, password) => {
    console.log('🔑 [Auth] Attempting Login...');
    set({ isLoading: true });
    
    try {
      if (navigator.onLine) {
        try {
          // Tier 1 (Online): Attempt Supabase Login with strict timeout
          const { error } = await withTimeout(
            supabase.auth.signInWithPassword({ email, password }),
            8000,
            "Supabase login timeout"
          );
          
          if (error) {
            const errorMsg = error.message.toLowerCase();
            if (errorMsg.includes('credentials') || errorMsg.includes('invalid login') || errorMsg.includes('password')) {
               throw new Error("Invalid email or password.");
            }
            throw error; // Network or other error, fallback to offline
          }
          
          // Wake engine to rebuild empty cache
          await withTimeout(bootCoreDatabase(), 10000, "Database boot timeout");
          return; // Success, onAuthStateChange will handle setting the user
        } catch (onlineError: any) {
          if (onlineError.message === "Invalid email or password.") {
            throw onlineError;
          }
          console.warn("Network unreachable or timeout. Engaging offline failover...");
        }
      }

      // Tier 2 & 3 (Offline Failover): Query the local rulebook
      const db = await withTimeout(bootCoreDatabase(), 10000, "Database boot timeout");
      const users = await db.admin_records.find({
        selector: { record_type: 'user' }
      }).exec();

      // Tier 3 (Empty Cache Hard-Stop)
      if (!users || users.length === 0) {
        throw new Error("No internet connection and no local profile found. You must connect to Wi-Fi at least once to set up this device for offline use.");
      }

      const rawUsers = users.map((u: any) => u.toJSON());
      const localUser = rawUsers.find((u: any) => u.email === email);

      if (!localUser) {
         throw new Error("User profile not found on this offline device.");
      }

      // SECURITY GUARD: Verify the password/PIN offline
      const storedPin = String(localUser.pin || '');
      const storedPass = String(localUser.password || '');
      
      if (storedPin !== password && storedPass !== password) {
         throw new Error("Invalid email or password.");
      }

      // Offline Login Success
      set({
         currentUser: {
           id: String(localUser.id),
           email: localUser.email,
           name: localUser.name || 'Offline User',
           initials: localUser.initials || 'OU',
           role: localUser.role || 'GUEST',
         },
         session: null, 
         isLoading: false
      });

    } catch (err: any) {
      // 🚨 CRITICAL FIX: Ensure UI unlocks if an error is thrown
      set({ isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    console.log('🚪 [Auth] Logging out...');
    set({ isLoading: true });
    try {
      await withTimeout(supabase.auth.signOut(), 5000, "Sign out timeout");
    } catch (err) {
      console.warn("Sign out timeout or error, forcing local logout", err);
    } finally {
      set({ session: null, currentUser: null, isLoading: false });
    }
  }
}));