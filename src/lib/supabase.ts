import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isConfigured = supabaseUrl && supabaseAnonKey;

if (!isConfigured) {
  console.warn('Supabase environment variables missing. App running in local-only mode.');
}

// Mock client for local-only mode to prevent crashes
const mockClient = {
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signInWithPassword: async () => ({ error: { message: 'Supabase is not configured. Please connect to Supabase to sign in.' } }),
    signUp: async () => ({ error: { message: 'Supabase is not configured. Please connect to Supabase to sign up.' } }),
    signOut: async () => ({ error: null }),
  },
  from: () => ({
    select: () => ({
      eq: () => ({
        maybeSingle: async () => ({ data: null, error: null }),
        single: async () => ({ data: null, error: null }),
      }),
    }),
    insert: () => ({
      select: () => ({
        single: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
      }),
    }),
    update: () => ({
      eq: async () => ({ error: { message: 'Supabase not configured' } }),
    }),
  }),
};

export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (mockClient as any);
