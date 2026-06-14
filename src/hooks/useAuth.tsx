import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { getDisplayName } from '../lib/format';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import type { ForumUser } from '../types/forum';

interface AuthResult {
  error?: string;
  message?: string;
}

interface AuthContextValue {
  user: ForumUser | null;
  loading: boolean;
  isDemoMode: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const demoUserKey = 'inuni.demoUser';

function mapUser(user: SupabaseUser): ForumUser {
  const email = user.email ?? 'student@inuni.local';
  const displayName =
    (user.user_metadata.display_name as string | undefined) ||
    (user.user_metadata.username as string | undefined) ||
    getDisplayName(email);

  return {
    id: user.id,
    email,
    emailConfirmed: Boolean(user.email_confirmed_at),
    profile: {
      id: user.id,
      username: getDisplayName(email),
      displayName,
      role: 'student',
      isBanned: false,
      banReason: null,
      createdAt: user.created_at,
    },
  };
}

function readDemoUser(): ForumUser | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem(demoUserKey);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as ForumUser;
  } catch {
    return null;
  }
}

function writeDemoUser(user: ForumUser | null): void {
  if (typeof window === 'undefined') {
    return;
  }

  if (!user) {
    window.localStorage.removeItem(demoUserKey);
    return;
  }

  window.localStorage.setItem(demoUserKey, JSON.stringify(user));
}

function createDemoUser(email: string): ForumUser {
  const normalizedEmail = email.trim().toLowerCase();

  return {
    id: `demo-${normalizedEmail}`,
    email: normalizedEmail,
    emailConfirmed: true,
    profile: {
      id: `demo-${normalizedEmail}`,
      username: getDisplayName(normalizedEmail),
      displayName: getDisplayName(normalizedEmail),
      role: 'student',
      isBanned: false,
      banReason: null,
      createdAt: new Date().toISOString(),
    },
  };
}

async function ensureProfile(user: ForumUser): Promise<void> {
  if (!supabase) {
    return;
  }

  await supabase.from('profiles').upsert(
    {
      id: user.id,
      username: getDisplayName(user.email),
      display_name: user.profile.displayName,
    },
    { onConflict: 'id' },
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ForumUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    if (!isSupabaseConfigured || !supabase) {
      setUser(readDemoUser());
      setLoading(false);
      return () => {
        isMounted = false;
      };
    }

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!isMounted) {
          return;
        }

        const sessionUser = data.session?.user ? mapUser(data.session.user) : null;
        setUser(sessionUser);
        if (sessionUser) {
          void ensureProfile(sessionUser);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user ? mapUser(session.user) : null;
      setUser(sessionUser);
      if (sessionUser) {
        void ensureProfile(sessionUser);
      }
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isDemoMode: !isSupabaseConfigured,
      async signIn(email: string, password: string) {
        if (!isSupabaseConfigured || !supabase) {
          const demoUser = createDemoUser(email);
          writeDemoUser(demoUser);
          setUser(demoUser);
          return {};
        }

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          return { error: error.message };
        }

        if (data.user) {
          const nextUser = mapUser(data.user);
          await ensureProfile(nextUser);
          setUser(nextUser);
        }

        return {};
      },
      async signUp(email: string, password: string) {
        if (!isSupabaseConfigured || !supabase) {
          const demoUser = createDemoUser(email);
          writeDemoUser(demoUser);
          setUser(demoUser);
          return {};
        }

        const displayName = getDisplayName(email);
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: displayName,
              username: displayName,
            },
          },
        });

        if (error) {
          return { error: error.message };
        }

        if (data.user && data.session) {
          const nextUser = mapUser(data.user);
          await ensureProfile(nextUser);
          setUser(nextUser);
          return {};
        }

        return {
          message: 'Account created. If email confirmation is enabled, check your inbox before logging in.',
        };
      },
      async signOut() {
        if (isSupabaseConfigured && supabase) {
          await supabase.auth.signOut();
        }

        writeDemoUser(null);
        setUser(null);
      },
    }),
    [loading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }

  return context;
}
