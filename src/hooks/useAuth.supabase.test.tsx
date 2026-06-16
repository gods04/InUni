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
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  signUp: vi.fn(),
  single: vi.fn(),
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
      signInWithPassword: supabaseMocks.signInWithPassword,
      signOut: supabaseMocks.signOut,
      signUp: supabaseMocks.signUp,
      updateUser: supabaseMocks.updateUser,
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: supabaseMocks.single,
        })),
      })),
    })),
  },
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
    signOut,
    updatePassword,
  } = useAuth();
  const [resetResult, setResetResult] = useState('{}');
  const [updateResult, setUpdateResult] = useState('{}');

  return (
    <>
      <p>{user?.id ?? 'no user'}</p>
      <p>{hasAuthSession ? 'session' : 'no session'}</p>
      <p>
        {hasPasswordRecoverySession
          ? 'recovery session'
          : 'no recovery session'}
      </p>
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
          void updatePassword('new-password123').then((result) => {
            setUpdateResult(JSON.stringify(result));
          });
        }}
        type="button"
      >
        Update password
      </button>
      <output aria-label="password update result">{updateResult}</output>
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
    supabaseMocks.updateUser.mockResolvedValue({ error: null });
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
});
