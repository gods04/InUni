import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CreatePostPage } from './CreatePostPage';

const mocks = vi.hoisted(() => ({
  createPost: vi.fn(),
  navigate: vi.fn(),
  uploadLinkedFiles: vi.fn(),
}));

const testUser = {
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
    createdAt: '2026-06-16T00:00:00.000Z',
  },
};

vi.mock('../lib/forumApi', () => ({
  createPost: (...args: unknown[]) => mocks.createPost(...args),
}));

vi.mock('../lib/fileApi', () => ({
  uploadLinkedFiles: (...args: unknown[]) => mocks.uploadLinkedFiles(...args),
}));

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({ user: testUser }),
}));

vi.mock('react-router-dom', async () => {
  const actual =
    await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mocks.navigate };
});

describe('CreatePostPage attachments', () => {
  beforeEach(() => {
    mocks.createPost.mockReset();
    mocks.navigate.mockReset();
    mocks.uploadLinkedFiles.mockReset();
    mocks.createPost.mockResolvedValue({ id: 'post-1' });
    mocks.uploadLinkedFiles.mockResolvedValue([]);
  });

  it('uploads selected files after creating the post', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <CreatePostPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText('Title'), 'Question');
    await user.type(screen.getByLabelText('Content'), 'Useful content');
    await user.upload(
      screen.getByLabelText('Attach files'),
      new File(['notes'], 'notes.pdf', { type: 'application/pdf' }),
    );
    await user.click(screen.getByRole('button', { name: 'Publish post' }));

    await waitFor(() =>
      expect(mocks.uploadLinkedFiles).toHaveBeenCalledWith(
        { type: 'post', postId: 'post-1' },
        expect.arrayContaining([
          expect.objectContaining({
            description: '',
            submitToSharedFiles: false,
          }),
        ]),
        expect.objectContaining({ id: 'user-1' }),
      ),
    );
    expect(mocks.navigate).toHaveBeenCalledWith('/post/post-1');
  });
});
