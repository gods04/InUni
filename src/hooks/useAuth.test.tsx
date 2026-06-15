import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { AuthProvider, useAuth } from './useAuth';
import type { Profile } from '../types/forum';

function SignInHarness() {
  const { user, signIn } = useAuth();

  return (
    <button
      onClick={() => void signIn('student@demo.local', 'password123')}
      type="button"
    >
      {user ? String(user.profile.isBanned) : 'Sign in'}
    </button>
  );
}

function PasswordRecoveryHarness() {
  const { hasAuthSession, requestPasswordReset, updatePassword } = useAuth();
  const [resetResult, setResetResult] = useState('');
  const [updateResult, setUpdateResult] = useState('');

  return (
    <>
      <p>
        {hasAuthSession === false
          ? 'no session'
          : hasAuthSession
            ? 'session'
            : 'missing session state'}
      </p>
      <button
        onClick={() => {
          void requestPasswordReset('student@demo.local').then((result) => {
            setResetResult(result.error ?? result.message ?? '');
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
            setUpdateResult(result.error ?? result.message ?? '');
          });
        }}
        type="button"
      >
        Update password
      </button>
      <output aria-label="password update result">{updateResult}</output>
    </>
  );
}

describe('demo authentication', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('restores a moderation ban when the demo user signs in again', async () => {
    const profile: Profile = {
      id: 'demo-student@demo.local',
      username: 'student',
      displayName: 'Student',
      role: 'student',
      isBanned: true,
      banReason: 'Repeated harassment',
      createdAt: '2026-06-14T00:00:00.000Z',
    };
    window.localStorage.setItem('inuni.profiles', JSON.stringify([profile]));

    const user = userEvent.setup();
    render(
      <AuthProvider>
        <SignInHarness />
      </AuthProvider>,
    );

    await user.click(await screen.findByRole('button', { name: 'Sign in' }));
    expect(
      await screen.findByRole('button', { name: 'true' }),
    ).toBeInTheDocument();
  });

  it('reports that password recovery requires Supabase configuration', async () => {
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <PasswordRecoveryHarness />
      </AuthProvider>,
    );

    expect(await screen.findByText('no session')).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'Request password reset' }),
    );
    expect(
      await screen.findByRole('status', { name: 'password reset result' }),
    ).toHaveTextContent('Password recovery requires Supabase configuration.');

    await user.click(screen.getByRole('button', { name: 'Update password' }));
    expect(
      await screen.findByRole('status', { name: 'password update result' }),
    ).toHaveTextContent('Password recovery requires Supabase configuration.');
  });
});
