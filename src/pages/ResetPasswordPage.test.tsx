import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ResetPasswordPage } from './ResetPasswordPage';

const { navigate, signOut, updatePassword } = vi.hoisted(() => ({
  navigate: vi.fn(),
  signOut: vi.fn().mockResolvedValue(undefined),
  updatePassword: vi.fn().mockResolvedValue({}),
}));

let hasPasswordRecoverySession = true;
let loading = false;

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    hasPasswordRecoverySession,
    loading,
    signOut,
    updatePassword,
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>(
    'react-router-dom',
  );

  return {
    ...actual,
    useNavigate: () => navigate,
  };
});

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    hasPasswordRecoverySession = true;
    loading = false;
    navigate.mockReset();
    signOut.mockReset().mockResolvedValue(undefined);
    updatePassword.mockReset().mockResolvedValue({});
  });

  it('shows an invalid-link state without a password recovery session', () => {
    hasPasswordRecoverySession = false;
    render(
      <MemoryRouter>
        <ResetPasswordPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', { name: 'Reset link expired' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Request a new reset link' }),
    ).toHaveAttribute('href', '/login');
  });

  it('rejects a short password', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ResetPasswordPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText('New password'), 'short');
    await user.type(screen.getByLabelText('Confirm password'), 'short');
    await user.click(screen.getByRole('button', { name: 'Update password' }));

    expect(
      screen.getByText('Password must be at least 6 characters.'),
    ).toBeInTheDocument();
    expect(updatePassword).not.toHaveBeenCalled();
  });

  it('rejects passwords that do not match', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ResetPasswordPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText('New password'), 'password123');
    await user.type(screen.getByLabelText('Confirm password'), 'password456');
    await user.click(screen.getByRole('button', { name: 'Update password' }));

    expect(screen.getByText('Passwords do not match.')).toBeInTheDocument();
    expect(updatePassword).not.toHaveBeenCalled();
  });

  it('shows and hides new and confirmation passwords independently', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ResetPasswordPage />
      </MemoryRouter>,
    );
    const newPasswordInput = screen.getByLabelText('New password');
    const confirmPasswordInput = screen.getByLabelText('Confirm password');

    expect(newPasswordInput).toHaveAttribute('type', 'password');
    expect(confirmPasswordInput).toHaveAttribute('type', 'password');

    await user.click(
      screen.getByRole('button', { name: 'Show new password' }),
    );

    expect(newPasswordInput).toHaveAttribute('type', 'text');
    expect(confirmPasswordInput).toHaveAttribute('type', 'password');

    await user.click(
      screen.getByRole('button', { name: 'Show confirm password' }),
    );

    expect(newPasswordInput).toHaveAttribute('type', 'text');
    expect(confirmPasswordInput).toHaveAttribute('type', 'text');

    await user.click(
      screen.getByRole('button', { name: 'Hide new password' }),
    );

    expect(newPasswordInput).toHaveAttribute('type', 'password');
    expect(confirmPasswordInput).toHaveAttribute('type', 'text');
  });

  it('updates the password, signs out, and returns to login', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ResetPasswordPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText('New password'), 'password123');
    await user.type(screen.getByLabelText('Confirm password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Update password' }));

    expect(updatePassword).toHaveBeenCalledWith('password123');
    expect(signOut).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith('/login', {
      replace: true,
      state: { passwordReset: true },
    });
  });

  it('keeps the form visible when Supabase rejects the update', async () => {
    updatePassword.mockResolvedValueOnce({ error: 'Recovery session expired' });
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ResetPasswordPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText('New password'), 'password123');
    await user.type(screen.getByLabelText('Confirm password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Update password' }));

    expect(screen.getByText('Recovery session expired')).toBeInTheDocument();
    expect(signOut).not.toHaveBeenCalled();
  });
});
