import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

type SupabaseEnv = Pick<
  ImportMetaEnv,
  'VITE_SUPABASE_ANON_KEY' | 'VITE_SUPABASE_URL'
> & {
  VITE_INUNI_DEMO_MODE?: string;
};

export function shouldUseSupabase(env: SupabaseEnv): boolean {
  return (
    env.VITE_INUNI_DEMO_MODE !== 'true' &&
    Boolean(env.VITE_SUPABASE_URL && env.VITE_SUPABASE_ANON_KEY)
  );
}

export const isSupabaseConfigured = shouldUseSupabase(import.meta.env);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
      },
    })
  : null;
