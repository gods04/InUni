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
    signInWithGoogle: vi.fn(),
    signUp: vi.fn(),
    updatePassword: vi.fn(),
    signOut: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: ReactNode }) => children,
}));

vi.mock('./pages/HomePage', () => ({
  HomePage: () => <h1>Forum route</h1>,
}));

vi.mock('./pages/FilesPage', () => ({
  FilesPage: () => <h1>Files route</h1>,
}));

vi.mock('./pages/PostDetailPage', () => ({
  PostDetailPage: () => <h1>Post detail route</h1>,
}));

vi.mock('./pages/ResetPasswordPage', () => ({
  ResetPasswordPage: () => <h1>Reset link expired</h1>,
}));

vi.mock('./pages/ToolsPage', () => ({
  ToolsPage: () => <h1>Student tools</h1>,
}));

describe('MVP navigation', () => {
  it('shows approved public destinations for a signed-out visitor', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );
    expect(
      await screen.findByRole('link', { name: 'Forum' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Files' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Tools' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Login' })).toBeInTheDocument();
    expect(screen.queryByText('Shared Files')).not.toBeInTheDocument();
  });

  it('renders the compact tools hub as a public route', async () => {
    render(
      <MemoryRouter initialEntries={['/tools']}>
        <App />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole('heading', { name: 'Student tools' }),
    ).toBeInTheDocument();
  });

  it('renders shared files as a public route', async () => {
    render(
      <MemoryRouter initialEntries={['/files']}>
        <App />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole('heading', { name: 'Files route' }),
    ).toBeInTheDocument();
  });

  it('renders post details as a public route', async () => {
    render(
      <MemoryRouter initialEntries={['/post/post-1']}>
        <App />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole('heading', { name: 'Post detail route' }),
    ).toBeInTheDocument();
  });

  it('renders the public password reset route', async () => {
    render(
      <MemoryRouter initialEntries={['/reset-password']}>
        <App />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole('heading', { name: 'Reset link expired' }),
    ).toBeInTheDocument();
  });
});
