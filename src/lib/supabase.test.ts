import { describe, expect, it } from 'vitest';
import { shouldUseSupabase } from './supabase';

describe('shouldUseSupabase', () => {
  it('uses demo mode when explicitly requested even if Supabase config exists', () => {
    expect(
      shouldUseSupabase({
        VITE_INUNI_DEMO_MODE: 'true',
        VITE_SUPABASE_ANON_KEY: 'anon-key',
        VITE_SUPABASE_URL: 'https://example.supabase.co',
      }),
    ).toBe(false);
  });
});
