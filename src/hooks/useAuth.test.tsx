import { useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
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
  const {
    hasAuthSession,
    hasPasswordRecoverySession,
    requestPasswordReset,
    updatePassword,
  } = useAuth();
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');
  const [updateMessage, setUpdateMessage] = useState('');
  const [updateError, setUpdateError] = useState('');

  return (
    <>
      <p>
        {hasAuthSession === false
          ? 'no session'
          : hasAuthSession
            ? 'session'
            : 'missing session state'}
      </p>
      <p>
        {hasPasswordRecoverySession === false
          ? 'no recovery session'
          : hasPasswordRecoverySession
            ? 'recovery session'
            : 'missing recovery session state'}
      </p>
      <button
        onClick={() => {
          void requestPasswordReset('student@demo.local').then((result) => {
            setResetMessage(result.message ?? '');
            setResetError(result.error ?? '');
          });
        }}
        type="button"
      >
        Request password reset
      </button>
      <output aria-label="password reset message">{resetMessage}</output>
      <output aria-label="password reset error">{resetError}</output>
      <button
        onClick={() => {
          void updatePassword('new-password123').then((result) => {
            setUpdateMessage(result.message ?? '');
            setUpdateError(result.error ?? '');
          });
        }}
        type="button"
      >
        Update password
      </button>
      <output aria-label="password update message">{updateMessage}</output>
      <output aria-label="password update error">{updateError}</output>
    </>
  );
}

function ProfileIdentityHarness() {
  const {
    user,
    signIn,
    updateDisplayName,
    uploadProfilePhoto,
    removeProfilePhoto,
  } = useAuth();
  const [result, setResult] = useState('');

  return (
    <>
      <p>{user?.profile.displayName ?? 'no display name'}</p>
      <output aria-label="avatar url">
        {user?.profile.avatarUrl ?? 'no avatar'}
      </output>
      <output aria-label="profile result">{result}</output>
      <button
        onClick={() => void signIn('student@demo.local', 'password123')}
        type="button"
      >
        Sign in for profile
      </button>
      <button
        onClick={() => {
          void updateDisplayName(' New Demo Name ').then((nextResult) => {
            setResult(JSON.stringify(nextResult));
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
          void uploadProfilePhoto(file).then((nextResult) => {
            setResult(JSON.stringify(nextResult));
          });
        }}
        type="button"
      >
        Upload avatar
      </button>
      <button
        onClick={() => {
          void removeProfilePhoto().then((nextResult) => {
            setResult(JSON.stringify(nextResult));
          });
        }}
        type="button"
      >
        Remove avatar
      </button>
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
    expect(screen.getByText('no recovery session')).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'Request password reset' }),
    );
    expect(
      await screen.findByRole('status', { name: 'password reset message' }),
    ).toHaveTextContent('Password recovery requires Supabase configuration.');
    expect(
      screen.getByRole('status', { name: 'password reset error' }),
    ).toBeEmptyDOMElement();

    await user.click(screen.getByRole('button', { name: 'Update password' }));
    expect(
      await screen.findByRole('status', { name: 'password update message' }),
    ).toHaveTextContent('Password recovery requires Supabase configuration.');
    expect(
      screen.getByRole('status', { name: 'password update error' }),
    ).toBeEmptyDOMElement();
  });

  it('updates and persists the demo profile display name', async () => {
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <ProfileIdentityHarness />
      </AuthProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Sign in for profile' }));
    await user.click(screen.getByRole('button', { name: 'Update display name' }));

    expect(await screen.findByText('New Demo Name')).toBeInTheDocument();
    expect(
      screen.getByRole('status', { name: 'profile result' }),
    ).toHaveTextContent('{}');
    expect(
      JSON.parse(window.localStorage.getItem('inuni.demoUser') ?? '{}').profile
        .displayName,
    ).toBe('New Demo Name');
  });

  it('stores and removes a demo profile photo', async () => {
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <ProfileIdentityHarness />
      </AuthProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Sign in for profile' }));
    await user.click(screen.getByRole('button', { name: 'Upload avatar' }));

    await waitFor(() => {
      expect(
        screen.getByRole('status', { name: 'avatar url' }),
      ).toHaveTextContent(/^data:image\/png;base64,/);
    });

    await user.click(screen.getByRole('button', { name: 'Remove avatar' }));

    expect(
      await screen.findByRole('status', { name: 'avatar url' }),
    ).toHaveTextContent('no avatar');
  });
});
