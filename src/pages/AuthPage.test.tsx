import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthPage } from './AuthPage';

const { requestPasswordReset, signIn, signInWithGoogle, signUp } = vi.hoisted(
  () => ({
    requestPasswordReset: vi.fn().mockResolvedValue({
      message:
        'If an account exists for that email, a password reset link has been sent.',
    }),
    signIn: vi.fn().mockResolvedValue({}),
    signInWithGoogle: vi.fn().mockResolvedValue({}),
    signUp: vi.fn().mockResolvedValue({}),
  }),
);

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    requestPasswordReset,
    signIn,
    signInWithGoogle,
    signUp,
    isDemoMode: true,
  }),
}));

describe('AuthPage', () => {
  beforeEach(() => {
    window.localStorage.clear();
    requestPasswordReset.mockClear();
    signIn.mockClear();
    signInWithGoogle.mockClear();
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

  it('shows a clearer login error for wrong credentials', async () => {
    signIn.mockResolvedValueOnce({ error: 'Invalid login credentials' });
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AuthPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText('Email'), 'student@uct.ac.za');
    await user.type(screen.getByLabelText('Password'), 'wrong-password');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(
      await screen.findByText(
        'Email or password is incorrect. Check both and try again.',
      ),
    ).toBeInTheDocument();
  });

  it('shows a clearer login error when the email is not confirmed', async () => {
    signIn.mockResolvedValueOnce({ error: 'Email not confirmed' });
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AuthPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText('Email'), 'student@uct.ac.za');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(
      await screen.findByText(
        'Please confirm your email before logging in.',
      ),
    ).toBeInTheDocument();
  });

  it('shows a clear email format error before submitting login', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AuthPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText('Email'), 'not-an-email');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(
      screen.getByText('Enter a valid email address.'),
    ).toBeInTheDocument();
    expect(signIn).not.toHaveBeenCalled();
  });

  it('shows and hides the login password without changing submission', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AuthPage />
      </MemoryRouter>,
    );
    const passwordInput = screen.getByLabelText('Password');

    expect(passwordInput).toHaveAttribute('type', 'password');

    await user.type(screen.getByLabelText('Email'), 'student@uct.ac.za');
    await user.type(passwordInput, 'password123');
    await user.click(
      screen.getByRole('button', { name: 'Show password' }),
    );

    expect(passwordInput).toHaveAttribute('type', 'text');

    await user.click(
      screen.getByRole('button', { name: 'Hide password' }),
    );
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(signIn).toHaveBeenCalledWith('student@uct.ac.za', 'password123');
  });

  it('starts Google login from the login form without requiring email or password', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AuthPage />
      </MemoryRouter>,
    );

    await user.click(
      screen.getByRole('button', { name: 'Continue with Google' }),
    );

    expect(signInWithGoogle).toHaveBeenCalledOnce();
    expect(signIn).not.toHaveBeenCalled();
  });

  it('shows a clear message when Google login is not configured yet', async () => {
    signInWithGoogle.mockResolvedValueOnce({
      error: 'Google login requires Supabase Google OAuth configuration.',
    });
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AuthPage />
      </MemoryRouter>,
    );

    await user.click(
      screen.getByRole('button', { name: 'Continue with Google' }),
    );

    expect(
      await screen.findByText(
        'Google login requires Supabase Google OAuth configuration.',
      ),
    ).toBeInTheDocument();
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
    await user.click(
      screen.getByRole('checkbox', {
        name: /I agree to the Terms, Privacy Policy, Disclaimer, and Community Rules/i,
      }),
    );
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(signUp).toHaveBeenCalledWith('new@uct.ac.za', 'password123');
  });

  it('requires terms agreement before submitting signup', async () => {
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

    expect(
      screen.getByText(
        'You need to agree to the Terms, Privacy Policy, Disclaimer, and Community Rules before creating an account.',
      ),
    ).toBeInTheDocument();
    expect(signUp).not.toHaveBeenCalled();
  });

  it('links signup users to the legal terms page', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AuthPage />
      </MemoryRouter>,
    );

    await user.click(
      screen.getByRole('button', { name: 'Need an account? Sign up' }),
    );

    expect(
      screen.getByRole('link', { name: 'Terms, Privacy Policy, Disclaimer, and Community Rules' }),
    ).toHaveAttribute('href', '/terms');
  });

  it('requires a longer password before submitting signup', async () => {
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
    await user.type(screen.getByLabelText('Password'), 'short');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(
      screen.getByText('Password must be at least 6 characters.'),
    ).toBeInTheDocument();
    expect(signUp).not.toHaveBeenCalled();
  });

  it('shows a clearer signup error when authentication is not configured', async () => {
    signUp.mockResolvedValueOnce({ error: 'Supabase is not configured.' });
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
    await user.click(
      screen.getByRole('checkbox', {
        name: /I agree to the Terms, Privacy Policy, Disclaimer, and Community Rules/i,
      }),
    );
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(
      await screen.findByText(
        'Authentication is not fully configured yet. Please contact the site administrator.',
      ),
    ).toBeInTheDocument();
  });

  it('shows a clear signup error when the email already has an account', async () => {
    signUp.mockResolvedValueOnce({ error: 'User already registered' });
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AuthPage />
      </MemoryRouter>,
    );

    await user.click(
      screen.getByRole('button', { name: 'Need an account? Sign up' }),
    );
    await user.type(screen.getByLabelText('Email'), 'existing@uct.ac.za');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(
      screen.getByRole('checkbox', {
        name: /I agree to the Terms, Privacy Policy, Disclaimer, and Community Rules/i,
      }),
    );
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(
      await screen.findByText(
        'An account already exists for this email. Log in instead.',
      ),
    ).toBeInTheDocument();
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
