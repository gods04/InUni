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
});
