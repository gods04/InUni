import { useState } from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const supabaseMocks = vi.hoisted(() => ({
  authCallback: undefined as
    | ((event: string, session: { user: unknown } | null) => void)
    | undefined,
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  rpc: vi.fn(),
  select: vi.fn(),
  signInWithOAuth: vi.fn(),
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  signUp: vi.fn(),
  single: vi.fn(),
  storageFrom: vi.fn(),
  storageGetPublicUrl: vi.fn(),
  storageRemove: vi.fn(),
  storageUpload: vi.fn(),
  unsubscribe: vi.fn(),
  updateUser: vi.fn(),
}));

vi.mock('../lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabase: {
    auth: {
      getSession: supabaseMocks.getSession,
      onAuthStateChange: supabaseMocks.onAuthStateChange,
      resetPasswordForEmail: supabaseMocks.resetPasswordForEmail,
      signInWithOAuth: supabaseMocks.signInWithOAuth,
      signInWithPassword: supabaseMocks.signInWithPassword,
      signOut: supabaseMocks.signOut,
      signUp: supabaseMocks.signUp,
      updateUser: supabaseMocks.updateUser,
    },
    rpc: (...args: unknown[]) => supabaseMocks.rpc(...args),
    storage: {
      from: (...args: unknown[]) => supabaseMocks.storageFrom(...args),
    },
    from: vi.fn(() => ({
      select: (...args: unknown[]) => supabaseMocks.select(...args),
    })),
  },
}));

supabaseMocks.select.mockImplementation(() => ({
  eq: vi.fn(() => ({
    single: supabaseMocks.single,
  })),
}));

import { AuthProvider, useAuth } from './useAuth';

const supabaseUser = {
  id: 'student-1',
  email: 'student@uct.ac.za',
  email_confirmed_at: '2026-06-15T00:00:00.000Z',
};

const profileRow = {
  id: 'student-1',
  username: 'student',
  display_name: 'Student',
  role: 'student',
  is_banned: false,
  ban_reason: null,
  is_uct_verified: true,
  avatar_path: null,
  created_at: '2026-06-15T00:00:00.000Z',
};

const passwordRecoverySessionKey = 'inuni.passwordRecoverySession';

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((nextResolve) => {
    resolve = nextResolve;
  });
  return { promise, resolve };
}

function SupabaseAuthHarness() {
  const {
    user,
    hasAuthSession,
    hasPasswordRecoverySession,
    requestPasswordReset,
    removeProfilePhoto,
    signUp,
    signInWithGoogle,
    signOut,
    updateDisplayName,
    updatePassword,
    uploadProfilePhoto,
  } = useAuth();
  const [resetResult, setResetResult] = useState('{}');
  const [signUpResult, setSignUpResult] = useState('{}');
  const [profileResult, setProfileResult] = useState('{}');
  const [googleResult, setGoogleResult] = useState('{}');
  const [updateResult, setUpdateResult] = useState('{}');

  return (
    <>
      <p>{user?.id ?? 'no user'}</p>
      <p>{user?.profile.displayName ?? 'no display name'}</p>
      <output aria-label="avatar url">
        {user?.profile.avatarUrl ?? 'no avatar'}
      </output>
      <output aria-label="uct verification">
        {user?.profile.isUctVerified ? 'uct verified' : 'not uct verified'}
      </output>
      <p>{hasAuthSession ? 'session' : 'no session'}</p>
      <p>
        {hasPasswordRecoverySession
          ? 'recovery session'
          : 'no recovery session'}
      </p>
      <button
        onClick={() => {
          void signUp('student@uct.ac.za', 'password123').then((result) => {
            setSignUpResult(JSON.stringify(result));
          });
        }}
        type="button"
      >
        Create account
      </button>
      <output aria-label="signup result">{signUpResult}</output>
      <button
        onClick={() => {
          void requestPasswordReset('student@uct.ac.za').then((result) => {
            setResetResult(JSON.stringify(result));
          });
        }}
        type="button"
      >
        Request password reset
      </button>
      <output aria-label="password reset result">{resetResult}</output>
      <button
        onClick={() => {
          void signInWithGoogle().then((result) => {
            setGoogleResult(JSON.stringify(result));
          });
        }}
        type="button"
      >
        Continue with Google
      </button>
      <output aria-label="google result">{googleResult}</output>
      <button
        onClick={() => {
          void updatePassword('new-password123').then((result) => {
            setUpdateResult(JSON.stringify(result));
          });
        }}
        type="button"
      >
        Update password
      </button>
      <output aria-label="password update result">{updateResult}</output>
      <button
        onClick={() => {
          void updateDisplayName('New Supabase Name').then((result) => {
            setProfileResult(JSON.stringify(result));
          });
        }}
        type="button"
      >
        Update display name
      </button>
      <button
        onClick={() => {
          const file = new File(['avatar'], 'avatar.png', {
            type: 'image/png',
          });
          void uploadProfilePhoto(file).then((result) => {
            setProfileResult(JSON.stringify(result));
          });
        }}
        type="button"
      >
        Upload profile photo
      </button>
      <button
        onClick={() => {
          void removeProfilePhoto().then((result) => {
            setProfileResult(JSON.stringify(result));
          });
        }}
        type="button"
      >
        Remove profile photo
      </button>
      <output aria-label="profile result">{profileResult}</output>
      <button onClick={() => void signOut()} type="button">
        Sign out
      </button>
    </>
  );
}

function renderAuthProvider() {
  return render(
    <AuthProvider>
      <SupabaseAuthHarness />
    </AuthProvider>,
  );
}

function emitAuthEvent(event: string, user: typeof supabaseUser | null) {
  act(() => {
    supabaseMocks.authCallback?.(event, user ? { user } : null);
  });
}

describe('configured Supabase authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.sessionStorage.clear();
    supabaseMocks.authCallback = undefined;
    supabaseMocks.rpc.mockReset();
    supabaseMocks.storageFrom.mockReset();
    supabaseMocks.storageGetPublicUrl.mockReset();
    supabaseMocks.storageRemove.mockReset();
    supabaseMocks.storageUpload.mockReset();
    supabaseMocks.getSession.mockResolvedValue({
      data: { session: null },
    });
    supabaseMocks.onAuthStateChange.mockImplementation((callback) => {
      supabaseMocks.authCallback = callback;
      return {
        data: {
          subscription: {
            unsubscribe: supabaseMocks.unsubscribe,
          },
        },
      };
    });
    supabaseMocks.single.mockResolvedValue({
      data: profileRow,
      error: null,
    });
    supabaseMocks.resetPasswordForEmail.mockResolvedValue({ error: null });
    supabaseMocks.signInWithOAuth.mockResolvedValue({
      data: { url: 'https://accounts.google.com/o/oauth2/v2/auth' },
      error: null,
    });
    supabaseMocks.updateUser.mockResolvedValue({ error: null });
    supabaseMocks.rpc.mockResolvedValue({ data: profileRow, error: null });
    supabaseMocks.storageGetPublicUrl.mockReturnValue({
      data: { publicUrl: 'https://cdn.example.com/avatar.png' },
    });
    supabaseMocks.storageUpload.mockResolvedValue({ error: null });
    supabaseMocks.storageRemove.mockResolvedValue({ error: null });
    supabaseMocks.storageFrom.mockReturnValue({
      getPublicUrl: supabaseMocks.storageGetPublicUrl,
      remove: supabaseMocks.storageRemove,
      upload: supabaseMocks.storageUpload,
    });
  });

  it('requests a password reset with the reset page redirect and neutral success', async () => {
    const user = userEvent.setup();
    renderAuthProvider();

    await user.click(
      screen.getByRole('button', { name: 'Request password reset' }),
    );

    expect(supabaseMocks.resetPasswordForEmail).toHaveBeenCalledWith(
      'student@uct.ac.za',
      {
        redirectTo: `${window.location.origin}/reset-password`,
      },
    );
    expect(
      screen.getByRole('status', { name: 'password reset result' }),
    ).toHaveTextContent(
      JSON.stringify({
        message:
          'If an account exists for that email, a password reset link has been sent.',
      }),
    );
  });

  it('returns the password reset provider error', async () => {
    supabaseMocks.resetPasswordForEmail.mockResolvedValue({
      error: { message: 'Reset unavailable' },
    });
    const user = userEvent.setup();
    renderAuthProvider();

    await user.click(
      screen.getByRole('button', { name: 'Request password reset' }),
    );

    expect(
      screen.getByRole('status', { name: 'password reset result' }),
    ).toHaveTextContent(JSON.stringify({ error: 'Reset unavailable' }));
  });

  it('starts Google OAuth with the profile redirect', async () => {
    const user = userEvent.setup();
    renderAuthProvider();

    await user.click(screen.getByRole('button', { name: 'Continue with Google' }));

    expect(supabaseMocks.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/profile`,
      },
    });
    expect(
      screen.getByRole('status', { name: 'google result' }),
    ).toHaveTextContent('{}');
  });

  it('returns the Google OAuth provider error', async () => {
    supabaseMocks.signInWithOAuth.mockResolvedValue({
      data: { url: null },
      error: { message: 'Provider is not configured' },
    });
    const user = userEvent.setup();
    renderAuthProvider();

    await user.click(screen.getByRole('button', { name: 'Continue with Google' }));

    expect(
      screen.getByRole('status', { name: 'google result' }),
    ).toHaveTextContent(JSON.stringify({ error: 'Provider is not configured' }));
  });

  it('detects an existing confirmed email when Supabase returns an obfuscated signup user', async () => {
    supabaseMocks.signUp.mockResolvedValue({
      data: {
        user: {
          ...supabaseUser,
          identities: [],
        },
        session: null,
      },
      error: null,
    });
    const user = userEvent.setup();
    renderAuthProvider();

    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(supabaseMocks.signUp).toHaveBeenCalledWith({
      email: 'student@uct.ac.za',
      password: 'password123',
      options: {
        emailRedirectTo: `${window.location.origin}/profile`,
        data: {
          display_name: 'student',
          username: 'student',
        },
      },
    });
    expect(
      screen.getByRole('status', { name: 'signup result' }),
    ).toHaveTextContent(
      JSON.stringify({
        error: 'An account already exists for this email. Log in instead.',
      }),
    );
  });

  it('updates the password and clears recovery readiness after success', async () => {
    const user = userEvent.setup();
    renderAuthProvider();
    emitAuthEvent('PASSWORD_RECOVERY', supabaseUser);

    expect(await screen.findByText('recovery session')).toBeInTheDocument();
    expect(
      window.sessionStorage.getItem(passwordRecoverySessionKey),
    ).toBe(supabaseUser.id);

    await user.click(screen.getByRole('button', { name: 'Update password' }));

    expect(supabaseMocks.updateUser).toHaveBeenCalledWith({
      password: 'new-password123',
    });
    expect(
      screen.getByRole('status', { name: 'password update result' }),
    ).toHaveTextContent('{}');
    expect(await screen.findByText('no recovery session')).toBeInTheDocument();
    expect(window.sessionStorage.length).toBe(0);
  });

  it('returns the password update provider error without clearing readiness', async () => {
    supabaseMocks.updateUser.mockResolvedValue({
      error: { message: 'Password rejected' },
    });
    const user = userEvent.setup();
    renderAuthProvider();
    emitAuthEvent('PASSWORD_RECOVERY', supabaseUser);

    await user.click(screen.getByRole('button', { name: 'Update password' }));

    expect(
      screen.getByRole('status', { name: 'password update result' }),
    ).toHaveTextContent(JSON.stringify({ error: 'Password rejected' }));
    expect(screen.getByText('recovery session')).toBeInTheDocument();
  });

  it('clears recovery readiness on sign-out', async () => {
    const user = userEvent.setup();
    renderAuthProvider();
    emitAuthEvent('PASSWORD_RECOVERY', supabaseUser);
    expect(await screen.findByText('recovery session')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Sign out' }));

    expect(supabaseMocks.signOut).toHaveBeenCalledOnce();
    expect(await screen.findByText('no recovery session')).toBeInTheDocument();
    expect(window.sessionStorage.length).toBe(0);
  });

  it('restores recovery readiness on reload when the marker matches the session user', async () => {
    supabaseMocks.getSession.mockResolvedValue({
      data: { session: { user: supabaseUser } },
    });
    const firstRender = renderAuthProvider();

    expect(await screen.findByText('student-1')).toBeInTheDocument();
    expect(screen.getByText('session')).toBeInTheDocument();
    expect(screen.getByText('no recovery session')).toBeInTheDocument();

    emitAuthEvent('SIGNED_IN', supabaseUser);
    expect(screen.getByText('no recovery session')).toBeInTheDocument();

    emitAuthEvent('PASSWORD_RECOVERY', supabaseUser);
    expect(await screen.findByText('recovery session')).toBeInTheDocument();
    expect(
      window.sessionStorage.getItem(passwordRecoverySessionKey),
    ).toBe(supabaseUser.id);

    firstRender.unmount();
    renderAuthProvider();

    expect(await screen.findByText('recovery session')).toBeInTheDocument();
  });

  it('clears a stale recovery marker when the initial session is missing', async () => {
    window.sessionStorage.setItem(passwordRecoverySessionKey, 'student-1');

    renderAuthProvider();

    await waitFor(() => {
      expect(screen.getByText('no recovery session')).toBeInTheDocument();
      expect(
        window.sessionStorage.getItem(passwordRecoverySessionKey),
      ).toBeNull();
    });
  });

  it('clears recovery readiness when an ordinary signed-in event arrives', async () => {
    renderAuthProvider();
    emitAuthEvent('PASSWORD_RECOVERY', supabaseUser);
    expect(await screen.findByText('recovery session')).toBeInTheDocument();

    emitAuthEvent('SIGNED_IN', supabaseUser);

    expect(await screen.findByText('no recovery session')).toBeInTheDocument();
    expect(
      window.sessionStorage.getItem(passwordRecoverySessionKey),
    ).toBeNull();
  });

  it('restores readiness on INITIAL_SESSION only for the marked user', async () => {
    window.sessionStorage.setItem(passwordRecoverySessionKey, supabaseUser.id);
    renderAuthProvider();

    emitAuthEvent('INITIAL_SESSION', supabaseUser);

    expect(await screen.findByText('recovery session')).toBeInTheDocument();
  });

  it('does not let an older profile load restore user state after sign-out', async () => {
    const profileLoad = createDeferred<{
      data: typeof profileRow;
      error: null;
    }>();
    supabaseMocks.getSession.mockResolvedValue({
      data: { session: { user: supabaseUser } },
    });
    supabaseMocks.single.mockReturnValue(profileLoad.promise);
    renderAuthProvider();

    await waitFor(() => {
      expect(supabaseMocks.single).toHaveBeenCalledTimes(1);
    });
    emitAuthEvent('SIGNED_OUT', null);
    await waitFor(() => {
      expect(screen.getByText('no user')).toBeInTheDocument();
      expect(screen.getByText('no session')).toBeInTheDocument();
    });

    await act(async () => {
      profileLoad.resolve({ data: profileRow, error: null });
      await profileLoad.promise;
    });

    expect(screen.getByText('no user')).toBeInTheDocument();
    expect(screen.getByText('no session')).toBeInTheDocument();
  });

  it('loads a signed-in user when the production profile schema has no avatar path yet', async () => {
    supabaseMocks.getSession.mockResolvedValue({
      data: { session: { user: supabaseUser } },
    });
    supabaseMocks.single
      .mockResolvedValueOnce({
        data: null,
        error: { message: 'column profiles.avatar_path does not exist' },
      })
      .mockResolvedValueOnce({
        data: {
          id: profileRow.id,
          username: profileRow.username,
          display_name: profileRow.display_name,
          role: profileRow.role,
          is_banned: profileRow.is_banned,
          ban_reason: profileRow.ban_reason,
          is_uct_verified: profileRow.is_uct_verified,
          created_at: profileRow.created_at,
        },
        error: null,
      });

    renderAuthProvider();

    expect(await screen.findByText('student-1')).toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'avatar url' })).toHaveTextContent(
      'no avatar',
    );
    expect(supabaseMocks.select).toHaveBeenCalledWith(
      'id, username, display_name, avatar_path, role, is_banned, ban_reason, is_uct_verified, created_at',
    );
    expect(supabaseMocks.select).toHaveBeenCalledWith(
      'id, username, display_name, role, is_banned, ban_reason, is_uct_verified, created_at',
    );
  });

  it('loads the stored UCT verification state with the profile', async () => {
    supabaseMocks.getSession.mockResolvedValue({
      data: { session: { user: supabaseUser } },
    });
    supabaseMocks.single.mockResolvedValue({
      data: {
        ...profileRow,
        is_uct_verified: true,
      },
      error: null,
    });

    renderAuthProvider();

    expect(
      await screen.findByRole('status', { name: 'uct verification' }),
    ).toHaveTextContent('uct verified');
    expect(supabaseMocks.select).toHaveBeenCalledWith(
      'id, username, display_name, avatar_path, role, is_banned, ban_reason, is_uct_verified, created_at',
    );
  });

  it('updates the display name through the profile RPC', async () => {
    supabaseMocks.getSession.mockResolvedValue({
      data: { session: { user: supabaseUser } },
    });
    supabaseMocks.rpc.mockResolvedValue({
      data: {
        ...profileRow,
        display_name: 'New Supabase Name',
      },
      error: null,
    });
    const user = userEvent.setup();
    renderAuthProvider();

    expect(await screen.findByText('Student')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Update display name' }));

    expect(supabaseMocks.rpc).toHaveBeenCalledWith('update_own_display_name', {
      new_display_name: 'New Supabase Name',
    });
    expect(await screen.findByText('New Supabase Name')).toBeInTheDocument();
    expect(
      screen.getByRole('status', { name: 'profile result' }),
    ).toHaveTextContent('{}');
  });

  it('updates the display name through the legacy profile RPC when the display-name RPC is missing', async () => {
    supabaseMocks.getSession.mockResolvedValue({
      data: { session: { user: supabaseUser } },
    });
    supabaseMocks.rpc
      .mockResolvedValueOnce({
        data: null,
        error: {
          message:
            'Could not find the function public.update_own_display_name(new_display_name) in the schema cache',
        },
      })
      .mockResolvedValueOnce({
        data: {
          ...profileRow,
          display_name: 'New Supabase Name',
        },
        error: null,
      });
    const user = userEvent.setup();
    renderAuthProvider();

    expect(await screen.findByText('Student')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Update display name' }));

    expect(supabaseMocks.rpc).toHaveBeenNthCalledWith(
      1,
      'update_own_display_name',
      {
        new_display_name: 'New Supabase Name',
      },
    );
    expect(supabaseMocks.rpc).toHaveBeenNthCalledWith(2, 'update_own_profile', {
      new_username: 'student',
      new_display_name: 'New Supabase Name',
    });
    expect(await screen.findByText('New Supabase Name')).toBeInTheDocument();
    expect(
      screen.getByRole('status', { name: 'profile result' }),
    ).toHaveTextContent('{}');
  });

  it('uploads a profile photo and stores the returned avatar path', async () => {
    supabaseMocks.getSession.mockResolvedValue({
      data: { session: { user: supabaseUser } },
    });
    supabaseMocks.rpc.mockResolvedValue({
      data: {
        ...profileRow,
        avatar_path: 'student-1/avatar.png',
      },
      error: null,
    });
    const user = userEvent.setup();
    renderAuthProvider();

    expect(await screen.findByText('Student')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Upload profile photo' }));

    expect(supabaseMocks.storageFrom).toHaveBeenCalledWith('inuni-avatars');
    expect(supabaseMocks.storageUpload).toHaveBeenCalledWith(
      expect.stringMatching(/^student-1\/.+\.png$/),
      expect.any(File),
      {
        contentType: 'image/png',
        upsert: false,
      },
    );
    expect(supabaseMocks.rpc).toHaveBeenCalledWith('update_own_avatar', {
      new_avatar_path: expect.stringMatching(/^student-1\/.+\.png$/),
    });
    expect(
      await screen.findByRole('status', { name: 'avatar url' }),
    ).toHaveTextContent('https://cdn.example.com/avatar.png');
  });

  it('removes the previous profile photo after clearing the avatar path', async () => {
    supabaseMocks.getSession.mockResolvedValue({
      data: {
        session: {
          user: supabaseUser,
        },
      },
    });
    supabaseMocks.single.mockResolvedValue({
      data: {
        ...profileRow,
        avatar_path: 'student-1/old-avatar.png',
      },
      error: null,
    });
    supabaseMocks.rpc.mockResolvedValue({
      data: profileRow,
      error: null,
    });
    const user = userEvent.setup();
    renderAuthProvider();

    expect(
      await screen.findByRole('status', { name: 'avatar url' }),
    ).toHaveTextContent('https://cdn.example.com/avatar.png');
    await user.click(screen.getByRole('button', { name: 'Remove profile photo' }));

    expect(supabaseMocks.rpc).toHaveBeenCalledWith('update_own_avatar', {
      new_avatar_path: null,
    });
    expect(supabaseMocks.storageRemove).toHaveBeenCalledWith([
      'student-1/old-avatar.png',
    ]);
    expect(
      await screen.findByRole('status', { name: 'avatar url' }),
    ).toHaveTextContent('no avatar');
  });
});
