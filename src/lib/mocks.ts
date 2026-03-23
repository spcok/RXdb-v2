// Mock file to satisfy imports for deleted SyncEngine and Supabase
export const databaseInstance = null;
export const bootDatabase = async () => null;
export const launchSync = async () => {};
export const stopSync = () => {};
export const activeSyncStates = [];

export const supabase = {
  from: () => ({
    select: () => ({
      eq: () => ({
        single: () => Promise.resolve({ data: null, error: null }),
        order: () => Promise.resolve({ data: [], error: null }),
      }),
      order: () => Promise.resolve({ data: [], error: null }),
    }),
  }),
  auth: {
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    getSession: () => Promise.resolve({ data: { session: null } }),
  }
} as unknown;

export const isSupabaseConfigured = () => false;
