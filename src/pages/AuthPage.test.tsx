import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AuthPage } from './AuthPage';

const { signIn, signUp } = vi.hoisted(() => ({
  signIn: vi.fn().mockResolvedValue({}),
  signUp: vi.fn().mockResolvedValue({}),
}));

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    signIn,
    signUp,
    isDemoMode: true,
  }),
}));

describe('AuthPage', () => {
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
});
