import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { getAuthRedirectUrl } from '../lib/authRedirect';
import { getDisplayName } from '../lib/format';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import type { ForumUser, Profile, UserRole } from '../types/forum';

interface AuthResult {
  error?: string;
  message?: string;
}

export interface AuthContextValue {
  user: ForumUser | null;
  loading: boolean;
  isDemoMode: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
}

interface ProfileRow {
  id: string;
  username: string;
  display_name: string;
  role: UserRole;
  is_banned: boolean;
  ban_reason: string | null;
  created_at: string;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const demoUserKey = 'inuni.demoUser';

function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    role: row.role,
    isBanned: row.is_banned,
    banReason: row.ban_reason,
    createdAt: row.created_at,
  };
}

async function loadSupabaseUser(user: SupabaseUser): Promise<ForumUser> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase
    .from('profiles')
    .select(
      'id, username, display_name, role, is_banned, ban_reason, created_at',
    )
    .eq('id', user.id)
    .single();

  if (error) {
    throw new Error(`Could not load your profile: ${error.message}`);
  }

  return {
    id: user.id,
    email: user.email ?? 'student@inuni.local',
    emailConfirmed: Boolean(user.email_confirmed_at),
    profile: mapProfile(data as ProfileRow),
  };
}

function createDemoUser(email: string): ForumUser {
  const normalizedEmail = email.trim().toLowerCase();
  const displayName = getDisplayName(normalizedEmail);
  const id = `demo-${normalizedEmail}`;
  let storedProfile: Profile | undefined;

  if (typeof window !== 'undefined') {
    const rawProfiles = window.localStorage.getItem('inuni.profiles');
    if (rawProfiles) {
      try {
        storedProfile = (JSON.parse(rawProfiles) as Profile[]).find(
          (profile) => profile.id === id,
        );
      } catch {
        storedProfile = undefined;
      }
    }
  }

  return {
    id,
    email: normalizedEmail,
    emailConfirmed: true,
    profile: storedProfile ?? {
      id,
      username: displayName.toLowerCase().replace(/\s+/g, '_'),
      displayName,
      role: normalizedEmail === 'admin@inuni.local' ? 'admin' : 'student',
      isBanned: false,
      banReason: null,
      createdAt: new Date().toISOString(),
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
    const stored = JSON.parse(raw) as Partial<ForumUser>;
    if (stored.email && stored.profile) {
      return stored as ForumUser;
    }

    return stored.email ? createDemoUser(stored.email) : null;
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

    const hydrate = async (sessionUser: SupabaseUser | null) => {
      if (!sessionUser) {
        if (isMounted) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      try {
        const nextUser = await loadSupabaseUser(sessionUser);
        if (isMounted) {
          setUser(nextUser);
        }
      } catch {
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void supabase.auth.getSession().then(({ data }) => {
      void hydrate(data.session?.user ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setLoading(true);
        window.setTimeout(() => {
          void hydrate(session?.user ?? null);
        }, 0);
      },
    );

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

        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          return { error: error.message };
        }

        if (data.user) {
          try {
            setUser(await loadSupabaseUser(data.user));
          } catch (profileError) {
            return {
              error:
                profileError instanceof Error
                  ? profileError.message
                  : 'Could not load your profile.',
            };
          }
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
            emailRedirectTo: getAuthRedirectUrl(),
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
          try {
            setUser(await loadSupabaseUser(data.user));
            return {};
          } catch (profileError) {
            return {
              error:
                profileError instanceof Error
                  ? profileError.message
                  : 'Could not load your profile.',
            };
          }
        }

        return {
          message:
            'Account created. Check your inbox to confirm your email before logging in.',
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
