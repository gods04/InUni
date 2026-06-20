import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PasswordField } from './PasswordField';

describe('PasswordField', () => {
  it('uses icon-only controls while preserving accessible show and hide labels', async () => {
    const user = userEvent.setup();
    render(
      <PasswordField
        autoComplete="current-password"
        label="Password"
        onChange={vi.fn()}
        value=""
      />,
    );
    const input = screen.getByLabelText('Password');
    const showButton = screen.getByRole('button', { name: 'Show password' });

    expect(input).toHaveAttribute('type', 'password');
    expect(showButton.textContent).toBe('');
    expect(showButton.querySelector('svg')).toBeInTheDocument();

    await user.click(showButton);

    const hideButton = screen.getByRole('button', { name: 'Hide password' });
    expect(input).toHaveAttribute('type', 'text');
    expect(hideButton.textContent).toBe('');
    expect(hideButton.querySelector('svg')).toBeInTheDocument();
  });
});
