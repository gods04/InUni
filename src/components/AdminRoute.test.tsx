import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AdminRoute } from './AdminRoute';

vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '../hooks/useAuth';

describe('AdminRoute', () => {
  it('shows an access denied state for a student', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: 'student-1',
        email: 'student@uct.ac.za',
        emailConfirmed: true,
        profile: {
          id: 'student-1',
          username: 'student',
          displayName: 'Student',
          role: 'student',
          isBanned: false,
          banReason: null,
          isUctVerified: true,
          createdAt: '2026-06-14T00:00:00.000Z',
        },
      },
      loading: false,
      isDemoMode: true,
      hasAuthSession: true,
      hasPasswordRecoverySession: false,
      signIn: vi.fn(),
      signInWithGoogle: vi.fn(),
      signUp: vi.fn(),
      requestPasswordReset: vi.fn(),
      updatePassword: vi.fn(),
      updateDisplayName: vi.fn(),
      uploadProfilePhoto: vi.fn(),
      removeProfilePhoto: vi.fn(),
      signOut: vi.fn(),
    });

    render(
      <MemoryRouter>
        <AdminRoute>
          <div>Admin content</div>
        </AdminRoute>
      </MemoryRouter>,
    );

    expect(
      screen.getByText('Administrator access required'),
    ).toBeInTheDocument();
  });
});
