import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import App from './App';

vi.mock('./hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    isDemoMode: true,
    hasAuthSession: false,
    hasPasswordRecoverySession: false,
    requestPasswordReset: vi.fn(),
    signIn: vi.fn(),
    signUp: vi.fn(),
    updatePassword: vi.fn(),
    signOut: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: ReactNode }) => children,
}));

describe('MVP navigation', () => {
  it('shows approved public destinations for a signed-out visitor', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: 'Forum' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Files' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Login' })).toBeInTheDocument();
    expect(screen.queryByText('Tools')).not.toBeInTheDocument();
    expect(screen.queryByText('Shared Files')).not.toBeInTheDocument();
  });

  it('renders the public password reset route', () => {
    render(
      <MemoryRouter initialEntries={['/reset-password']}>
        <App />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', { name: 'Reset link expired' }),
    ).toBeInTheDocument();
  });
});
