import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { bootCoreDatabase, startCoreSync } from '../lib/DatabaseCore';
import { User } from '../types';

interface AuthState {
  currentUser: User | null;
  session: any | null;
  isLoading: boolean;
  error: string | null;
  isUiLocked: boolean;
  setUiLocked: (locked: boolean) => void;
  initialize: () => Promise<void>;
  // 🚨 CRITICAL FIX: Explicitly require password, not PIN, for primary login
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const withTimeout = <T>(promise: Promise<T>, ms: number, fallbackError: string): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(fallbackError)), ms))
  ]);
};

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  session: null,
  isLoading: true,
  error: null,
  isUiLocked: false,
  setUiLocked: (locked) => set({ isUiLocked: locked }),

  initialize: async () => {
    try {
      await bootCoreDatabase().catch(e => console.warn("Background DB boot issue:", e));
      
      if (navigator.onLine) {
        const { data: { session } } = await withTimeout(
           supabase.auth.getSession(), 
           3000, 
           "Session check timed out"
        );
        if (session) {
          set({ session, isLoading: false });
          startCoreSync().catch(e => console.warn("Background sync issue:", e));
          return;
        }
      }
      set({ isLoading: false });
    } catch (error) {
      console.warn('Auth init skipped/timed out:', error);
      set({ isLoading: false });
    }
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });

    try {
      let isOnlineAuthSuccess = false;
      let activeSession = null;

      // TIER 1: Strict Online Password Verification
      if (navigator.onLine) {
        try {
          console.log("📡 [Auth] Attempting Live Supabase Login...");
          const authResponse = await withTimeout(
            supabase.auth.signInWithPassword({ email, password }),
            5000,
            "Supabase connection timed out."
          );

          if (authResponse.error) {
            if (authResponse.error.message.toLowerCase().includes('credentials') || authResponse.error.message.toLowerCase().includes('invalid')) {
              // 🚨 CRITICAL FIX: Explicitly flag this as a hard credential failure
              throw new Error("Invalid email or password.");
            }
            throw new Error("Supabase rejected connection.");
          } 
          
          isOnlineAuthSuccess = true;
          activeSession = authResponse.data.session;
          console.log("✅ [Auth] Live Login Successful. Fetching profile...");
          startCoreSync().catch(e => console.warn(e));

        } catch (tier1Error: any) {
          // 🚨 CRITICAL FIX: The Online-First Gatekeeper
          // If Supabase verified the connection but rejected the password, ABORT completely.
          if (tier1Error.message === "Invalid email or password.") {
            throw tier1Error; 
          }
          console.warn("⚠️ [Auth] Live Login Network Failure. Falling back to offline cache...", tier1Error.message);
        }
      }

      // TIER 2 & PROFILE HYDRATION: Always query RxDB for the REAL user profile
      const db = await withTimeout(bootCoreDatabase(), 3000, "Local database failed to wake up.");
      const usersDoc = await withTimeout(
        db.admin_records.find({ selector: { record_type: 'user' } }).exec(),
        4000,
        "Offline database query timed out. IndexedDB connection may be corrupted."
      );

      if (!usersDoc || usersDoc.length === 0) {
        throw new Error("No offline profile found. Connect to Wi-Fi to sync this device.");
      }

      const rawUsers = usersDoc.map(u => u.toJSON());
      const localUser = rawUsers.find(u => u.email?.toLowerCase() === email.toLowerCase() && !u.is_deleted);

      if (!localUser) {
        throw new Error("User profile not found on this device.");
      }

      // TIER 3: Offline Verification (Strictly reserved for network failures)
      if (!isOnlineAuthSuccess) {
        console.log("🔒 [Auth] Engaging Offline Verification...");
        const storedPin = String(localUser.pin || '');
        const storedPass = String(localUser.password || '');
        const inputCredentials = String(password);
        
        // Accept either their full password or their PIN when forced offline
        if (storedPin !== inputCredentials && storedPass !== inputCredentials) {
          throw new Error("Invalid offline email or PIN/Password.");
        }
        console.log("✅ [Auth] Offline Login Successful.");
      }

      set({
        session: activeSession,
        currentUser: {
          id: String(localUser.id),
          email: localUser.email,
          name: localUser.name || 'Unknown User',
          role: localUser.role || 'GUEST',
          initials: localUser.initials || '??',
        },
        isLoading: false
      });

    } catch (error: any) {
      console.error("❌ [Auth] Final Rejection:", error.message);
      set({ error: error.message, isLoading: false });
      throw error; 
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      if (navigator.onLine) {
        await withTimeout(supabase.auth.signOut(), 2000, "Logout timeout").catch(e => console.warn(e));
      }
    } finally {
      set({ currentUser: null, session: null, isLoading: false, error: null });
    }
  }
}));
