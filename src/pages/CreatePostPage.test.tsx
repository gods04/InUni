import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { CreatePostPage } from './CreatePostPage';

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: 'user-1',
      email: 'user@uct.ac.za',
      emailConfirmed: true,
      profile: {
        id: 'user-1',
        username: 'user',
        displayName: 'User',
        role: 'student',
        isBanned: false,
        banReason: null,
        createdAt: '2026-06-14T00:00:00.000Z',
      },
    },
  }),
}));

describe('CreatePostPage', () => {
  it('keeps the form and shows validation for a blank title', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <CreatePostPage />
      </MemoryRouter>,
    );

    await user.type(
      screen.getByLabelText('Content'),
      'A useful campus post',
    );
    await user.click(screen.getByRole('button', { name: 'Publish post' }));

    expect(screen.getByText('Title is required.')).toBeInTheDocument();
    expect(
      screen.getByDisplayValue('A useful campus post'),
    ).toBeInTheDocument();
  });
});
