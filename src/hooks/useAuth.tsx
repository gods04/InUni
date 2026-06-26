import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { getAuthRedirectUrl } from '../lib/authRedirect';
import { getDisplayName } from '../lib/format';
import {
  readFileAsDataUrl,
  validateDisplayName,
  validateProfilePhoto,
} from '../lib/profileIdentity';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import {
  isMissingAvatarPathError,
  isMissingRpcFunctionError,
} from '../lib/supabaseCompat';
import { isUctVerifiedEmail } from '../lib/permissions';
import type { ForumUser, Profile, UserRole } from '../types/forum';

interface AuthResult {
  error?: string;
  message?: string;
}

export interface AuthContextValue {
  user: ForumUser | null;
  loading: boolean;
  isDemoMode: boolean;
  hasAuthSession: boolean;
  hasPasswordRecoverySession: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signInWithGoogle: () => Promise<AuthResult>;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  requestPasswordReset: (email: string) => Promise<AuthResult>;
  updatePassword: (password: string) => Promise<AuthResult>;
  updateDisplayName: (displayName: string) => Promise<AuthResult>;
  uploadProfilePhoto: (file: File) => Promise<AuthResult>;
  removeProfilePhoto: () => Promise<AuthResult>;
  signOut: () => Promise<void>;
}

interface ProfileRow {
  id: string;
  username: string;
  display_name: string;
  avatar_path?: string | null;
  role: UserRole;
  is_banned: boolean;
  ban_reason: string | null;
  is_uct_verified: boolean;
  created_at: string;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const demoUserKey = 'inuni.demoUser';
const demoProfilesKey = 'inuni.profiles';
const passwordRecoverySessionKey = 'inuni.passwordRecoverySession';
const passwordRecoveryConfigurationMessage =
  'Password recovery requires Supabase configuration.';
const googleOAuthConfigurationMessage =
  'Google login requires Supabase Google OAuth configuration.';
const profilePhotoBucket = 'inuni-avatars';
const profileSelectWithAvatar =
  'id, username, display_name, avatar_path, role, is_banned, ban_reason, is_uct_verified, created_at';
const profileSelectWithoutAvatar =
  'id, username, display_name, role, is_banned, ban_reason, is_uct_verified, created_at';

function readPasswordRecoverySessionUserId(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.sessionStorage.getItem(passwordRecoverySessionKey);
}

function writePasswordRecoverySession(userId: string | null): void {
  if (typeof window === 'undefined') {
    return;
  }

  if (userId) {
    window.sessionStorage.setItem(passwordRecoverySessionKey, userId);
    return;
  }

  window.sessionStorage.removeItem(passwordRecoverySessionKey);
}

function getProfilePhotoUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('data:') || path.startsWith('http')) return path;
  if (!isSupabaseConfigured || !supabase) return null;

  return supabase.storage.from(profilePhotoBucket).getPublicUrl(path).data
    .publicUrl;
}

function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    avatarPath: row.avatar_path ?? null,
    avatarUrl: getProfilePhotoUrl(row.avatar_path),
    role: row.role,
    isBanned: row.is_banned,
    banReason: row.ban_reason,
    isUctVerified: row.is_uct_verified,
    createdAt: row.created_at,
  };
}

function normalizeStoredProfile(
  profile: Profile & { isUctVerified?: boolean },
  email: string,
  emailConfirmed: boolean,
): Profile {
  return {
    ...profile,
    isUctVerified:
      profile.isUctVerified ?? isUctVerifiedEmail(email, emailConfirmed),
  };
}

async function loadProfileRow(userId: string): Promise<ProfileRow> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase
    .from('profiles')
    .select(profileSelectWithAvatar)
    .eq('id', userId)
    .single();

  if (!error) {
    return data as ProfileRow;
  }

  if (!isMissingAvatarPathError(error)) {
    throw new Error(`Could not load your profile: ${error.message}`);
  }

  const fallback = await supabase
    .from('profiles')
    .select(profileSelectWithoutAvatar)
    .eq('id', userId)
    .single();

  if (fallback.error) {
    throw new Error(`Could not load your profile: ${fallback.error.message}`);
  }

  return {
    ...(fallback.data as Omit<ProfileRow, 'avatar_path'>),
    avatar_path: null,
  };
}

async function loadSupabaseUser(user: SupabaseUser): Promise<ForumUser> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const profile = await loadProfileRow(user.id);

  return {
    id: user.id,
    email: user.email ?? 'student@inuni.local',
    emailConfirmed: Boolean(user.email_confirmed_at),
    profile: mapProfile(profile),
  };
}

function createDemoUser(email: string): ForumUser {
  const normalizedEmail = email.trim().toLowerCase();
  const displayName = getDisplayName(normalizedEmail);
  const id = `demo-${normalizedEmail}`;
  let storedProfile:
    | (Profile & { isUctVerified?: boolean })
    | undefined;

  if (typeof window !== 'undefined') {
    const rawProfiles = window.localStorage.getItem(demoProfilesKey);
    if (rawProfiles) {
      try {
        storedProfile = (
          JSON.parse(rawProfiles) as Array<Profile & { isUctVerified?: boolean }>
        ).find(
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
    profile: storedProfile
      ? normalizeStoredProfile(storedProfile, normalizedEmail, true)
      : {
          id,
          username: displayName.toLowerCase().replace(/\s+/g, '_'),
          displayName,
          avatarPath: null,
          avatarUrl: null,
          role: normalizedEmail === 'admin@inuni.local' ? 'admin' : 'student',
          isBanned: false,
          banReason: null,
          isUctVerified: isUctVerifiedEmail(normalizedEmail, true),
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
      const normalizedEmail = stored.email.trim().toLowerCase();
      const emailConfirmed = stored.emailConfirmed ?? true;

      return {
        id: stored.id ?? `demo-${normalizedEmail}`,
        email: normalizedEmail,
        emailConfirmed,
        profile: normalizeStoredProfile(
          stored.profile as Profile & { isUctVerified?: boolean },
          normalizedEmail,
          emailConfirmed,
        ),
      };
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

function writeDemoProfile(profile: Profile): void {
  if (typeof window === 'undefined') {
    return;
  }

  const rawProfiles = window.localStorage.getItem(demoProfilesKey);
  let profiles: Profile[] = [];

  if (rawProfiles) {
    try {
      profiles = JSON.parse(rawProfiles) as Profile[];
    } catch {
      profiles = [];
    }
  }

  const nextProfiles = [
    profile,
    ...profiles.filter((item) => item.id !== profile.id),
  ];
  window.localStorage.setItem(demoProfilesKey, JSON.stringify(nextProfiles));
}

function getProfilePhotoExtension(file: File): string {
  if (file.type === 'image/jpeg') return 'jpg';
  if (file.type === 'image/webp') return 'webp';
  return 'png';
}

function createProfilePhotoPath(userId: string, file: File): string {
  const randomId =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${userId}/${randomId}.${getProfilePhotoExtension(file)}`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ForumUser | null>(() =>
    isSupabaseConfigured ? null : readDemoUser(),
  );
  const [hasAuthSession, setHasAuthSession] = useState(Boolean(user));
  const [hasPasswordRecoverySession, setHasPasswordRecoverySession] =
    useState(false);
  const [loading, setLoading] = useState(true);
  const hydrationGeneration = useRef(0);

  useEffect(() => {
    let isMounted = true;

    if (!isSupabaseConfigured || !supabase) {
      const demoUser = readDemoUser();
      setUser(demoUser);
      setHasAuthSession(Boolean(demoUser));
      setLoading(false);
      return () => {
        isMounted = false;
      };
    }

    const hydrate = async (
      sessionUser: SupabaseUser | null,
      generation: number,
    ) => {
      if (!isMounted || generation !== hydrationGeneration.current) {
        return;
      }

      setHasAuthSession(Boolean(sessionUser));

      if (!sessionUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const nextUser = await loadSupabaseUser(sessionUser);
        if (isMounted && generation === hydrationGeneration.current) {
          setUser(nextUser);
        }
      } catch {
        if (isMounted && generation === hydrationGeneration.current) {
          setUser(null);
        }
      } finally {
        if (isMounted && generation === hydrationGeneration.current) {
          setLoading(false);
        }
      }
    };

    const initialGeneration = ++hydrationGeneration.current;
    void supabase.auth.getSession().then(({ data }) => {
      const sessionUser = data.session?.user ?? null;
      if (
        isMounted &&
        initialGeneration === hydrationGeneration.current
      ) {
        const recoveryUserId = readPasswordRecoverySessionUserId();
        const isRecoverySession =
          Boolean(sessionUser) && recoveryUserId === sessionUser?.id;

        if (!isRecoverySession) {
          writePasswordRecoverySession(null);
        }
        setHasPasswordRecoverySession(isRecoverySession);
      }

      void hydrate(sessionUser, initialGeneration);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const generation = ++hydrationGeneration.current;

        if (event === 'PASSWORD_RECOVERY') {
          const recoveryUserId = session?.user.id ?? null;
          writePasswordRecoverySession(recoveryUserId);
          setHasPasswordRecoverySession(Boolean(recoveryUserId));
        } else if (event === 'INITIAL_SESSION') {
          const recoveryUserId = readPasswordRecoverySessionUserId();
          const isRecoverySession =
            Boolean(session?.user) && recoveryUserId === session?.user.id;

          if (!isRecoverySession) {
            writePasswordRecoverySession(null);
          }
          setHasPasswordRecoverySession(isRecoverySession);
        } else if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          writePasswordRecoverySession(null);
          setHasPasswordRecoverySession(false);
        }

        setLoading(true);
        window.setTimeout(() => {
          void hydrate(session?.user ?? null, generation);
        }, 0);
      },
    );

    return () => {
      isMounted = false;
      hydrationGeneration.current += 1;
      listener.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isDemoMode: !isSupabaseConfigured,
      hasAuthSession,
      hasPasswordRecoverySession,
      async signIn(email: string, password: string) {
        if (!isSupabaseConfigured || !supabase) {
          const demoUser = createDemoUser(email);
          writeDemoUser(demoUser);
          setUser(demoUser);
          setHasAuthSession(true);
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
            setHasAuthSession(true);
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
      async signInWithGoogle() {
        if (!isSupabaseConfigured || !supabase) {
          return { error: googleOAuthConfigurationMessage };
        }

        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: getAuthRedirectUrl(window.location.origin, '/profile'),
          },
        });

        if (error) {
          return { error: error.message };
        }

        return {};
      },
      async signUp(email: string, password: string) {
        if (!isSupabaseConfigured || !supabase) {
          const demoUser = createDemoUser(email);
          writeDemoUser(demoUser);
          setUser(demoUser);
          setHasAuthSession(true);
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
            setHasAuthSession(true);
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
      async requestPasswordReset(email: string) {
        if (!isSupabaseConfigured || !supabase) {
          return { message: passwordRecoveryConfigurationMessage };
        }

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: getAuthRedirectUrl(
            window.location.origin,
            '/reset-password',
          ),
        });

        if (error) {
          return { error: error.message };
        }

        return {
          message:
            'If an account exists for that email, a password reset link has been sent.',
        };
      },
      async updatePassword(password: string) {
        if (!isSupabaseConfigured || !supabase) {
          return { message: passwordRecoveryConfigurationMessage };
        }

        const { error } = await supabase.auth.updateUser({ password });
        if (error) {
          return { error: error.message };
        }

        writePasswordRecoverySession(null);
        setHasPasswordRecoverySession(false);
        return {};
      },
      async updateDisplayName(displayName: string) {
        const validationError = validateDisplayName(displayName);
        if (validationError) return { error: validationError };
        if (!user) return { error: 'Log in to edit your profile.' };
        if (user.profile.isBanned) {
          return { error: 'Restricted accounts cannot edit profile details.' };
        }

        const trimmedDisplayName = displayName.trim();

        if (!isSupabaseConfigured || !supabase) {
          const nextProfile = {
            ...user.profile,
            displayName: trimmedDisplayName,
          };
          const nextUser = { ...user, profile: nextProfile };
          setUser(nextUser);
          writeDemoUser(nextUser);
          writeDemoProfile(nextProfile);
          return {};
        }

        const { data, error } = await supabase.rpc(
          'update_own_display_name',
          {
            new_display_name: trimmedDisplayName,
          },
        );

        let nextProfileRow = data as ProfileRow | null;

        if (error) {
          if (!isMissingRpcFunctionError(error, 'update_own_display_name')) {
            return { error: error.message };
          }

          const legacyResult = await supabase.rpc('update_own_profile', {
            new_username: user.profile.username,
            new_display_name: trimmedDisplayName,
          });

          if (legacyResult.error) {
            return { error: legacyResult.error.message };
          }

          nextProfileRow = legacyResult.data as ProfileRow;
        }

        const nextUser = {
          ...user,
          profile: mapProfile(nextProfileRow as ProfileRow),
        };
        setUser(nextUser);
        return {};
      },
      async uploadProfilePhoto(file: File) {
        const validationError = validateProfilePhoto(file);
        if (validationError) return { error: validationError };
        if (!user) return { error: 'Log in to edit your profile.' };
        if (user.profile.isBanned) {
          return { error: 'Restricted accounts cannot edit profile details.' };
        }

        if (!isSupabaseConfigured || !supabase) {
          const avatarUrl = await readFileAsDataUrl(file);
          const nextProfile = {
            ...user.profile,
            avatarPath: null,
            avatarUrl,
          };
          const nextUser = { ...user, profile: nextProfile };
          setUser(nextUser);
          writeDemoUser(nextUser);
          writeDemoProfile(nextProfile);
          return {};
        }

        const nextPath = createProfilePhotoPath(user.id, file);
        const oldPath = user.profile.avatarPath ?? null;
        const storage = supabase.storage.from(profilePhotoBucket);
        const { error: uploadError } = await storage.upload(nextPath, file, {
          contentType: file.type,
          upsert: false,
        });

        if (uploadError) {
          return { error: `Could not upload profile photo: ${uploadError.message}` };
        }

        const { data, error } = await supabase.rpc('update_own_avatar', {
          new_avatar_path: nextPath,
        });

        if (error) {
          await storage.remove([nextPath]);
          return { error: error.message };
        }

        if (oldPath) {
          await storage.remove([oldPath]);
        }

        const nextUser = {
          ...user,
          profile: mapProfile(data as ProfileRow),
        };
        setUser(nextUser);
        return {};
      },
      async removeProfilePhoto() {
        if (!user) return { error: 'Log in to edit your profile.' };
        if (user.profile.isBanned) {
          return { error: 'Restricted accounts cannot edit profile details.' };
        }

        if (!isSupabaseConfigured || !supabase) {
          const nextProfile = {
            ...user.profile,
            avatarPath: null,
            avatarUrl: null,
          };
          const nextUser = { ...user, profile: nextProfile };
          setUser(nextUser);
          writeDemoUser(nextUser);
          writeDemoProfile(nextProfile);
          return {};
        }

        const oldPath = user.profile.avatarPath ?? null;
        const { data, error } = await supabase.rpc('update_own_avatar', {
          new_avatar_path: null,
        });

        if (error) return { error: error.message };

        if (oldPath) {
          await supabase.storage.from(profilePhotoBucket).remove([oldPath]);
        }

        const nextUser = {
          ...user,
          profile: mapProfile(data as ProfileRow),
        };
        setUser(nextUser);
        return {};
      },
      async signOut() {
        if (isSupabaseConfigured && supabase) {
          await supabase.auth.signOut();
        }

        writeDemoUser(null);
        writePasswordRecoverySession(null);
        setUser(null);
        setHasAuthSession(false);
        setHasPasswordRecoverySession(false);
      },
    }),
    [hasAuthSession, hasPasswordRecoverySession, loading, user],
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
