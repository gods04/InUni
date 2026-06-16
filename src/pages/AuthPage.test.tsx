import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthPage } from './AuthPage';

const { requestPasswordReset, signIn, signUp } = vi.hoisted(() => ({
  requestPasswordReset: vi.fn().mockResolvedValue({
    message:
      'If an account exists for that email, a password reset link has been sent.',
  }),
  signIn: vi.fn().mockResolvedValue({}),
  signUp: vi.fn().mockResolvedValue({}),
}));

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    requestPasswordReset,
    signIn,
    signUp,
    isDemoMode: true,
  }),
}));

describe('AuthPage', () => {
  beforeEach(() => {
    requestPasswordReset.mockClear();
    signIn.mockClear();
    signUp.mockClear();
  });

  it('submits the login form', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AuthPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText('Email'), 'student@uct.ac.za');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(signIn).toHaveBeenCalledWith('student@uct.ac.za', 'password123');
  });

  it('switches to signup and submits registration', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AuthPage />
      </MemoryRouter>,
    );

    await user.click(
      screen.getByRole('button', { name: 'Need an account? Sign up' }),
    );
    await user.type(screen.getByLabelText('Email'), 'new@uct.ac.za');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(signUp).toHaveBeenCalledWith('new@uct.ac.za', 'password123');
  });

  it('switches to recovery mode and requests a reset link', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AuthPage />
      </MemoryRouter>,
    );

    await user.click(
      screen.getByRole('button', { name: 'Forgot password?' }),
    );
    expect(
      screen.getByRole('heading', { name: 'Reset your password' }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText('Password')).not.toBeInTheDocument();

    await user.type(screen.getByLabelText('Email'), '  student@uct.ac.za  ');
    await user.click(screen.getByRole('button', { name: 'Send reset link' }));

    expect(requestPasswordReset).toHaveBeenCalledWith('student@uct.ac.za');
    expect(
      await screen.findByText(
        'If an account exists for that email, a password reset link has been sent.',
      ),
    ).toBeInTheDocument();
  });

  it('requires an email before requesting a reset link', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AuthPage />
      </MemoryRouter>,
    );

    await user.click(
      screen.getByRole('button', { name: 'Forgot password?' }),
    );
    await user.click(screen.getByRole('button', { name: 'Send reset link' }));

    expect(screen.getByText('Email is required.')).toBeInTheDocument();
    expect(requestPasswordReset).not.toHaveBeenCalled();
  });

  it('opens recovery mode from navigation state', () => {
    render(
      <MemoryRouter
        initialEntries={[
          { pathname: '/login', state: { authMode: 'recovery' } },
        ]}
      >
        <AuthPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', { name: 'Reset your password' }),
    ).toBeInTheDocument();
  });

  it('shows confirmation after a successful password update', () => {
    render(
      <MemoryRouter
        initialEntries={[
          { pathname: '/login', state: { passwordReset: true } },
        ]}
      >
        <AuthPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText('Password updated. You can now log in.'),
    ).toBeInTheDocument();
  });
});
