import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dgnncauvnzivsxxiifvs.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_r0yjFsdxKolSme2t2iUs4Q_F0zIenxX';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Helper for your components to check if it's alive
export const isSupabaseConfigured = () => {
  return true;
};