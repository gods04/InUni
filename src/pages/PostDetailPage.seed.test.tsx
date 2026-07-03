import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PostDetailPage } from './PostDetailPage';

const seedPostId = '99999999-9999-4999-8999-999999999991';

const mocks = vi.hoisted(() => ({
  createComment: vi.fn(),
  getComments: vi.fn(),
  getFilesForComment: vi.fn(),
  getFilesForPost: vi.fn(),
  getPost: vi.fn(),
}));

const user = {
  id: 'user-1',
  email: 'orange@uct.ac.za',
  emailConfirmed: true,
  profile: {
    id: 'user-1',
    username: 'orange',
    displayName: 'orange',
    role: 'student',
    isBanned: false,
    banReason: null,
    isUctVerified: false,
    createdAt: '2026-06-16T00:00:00.000Z',
  },
};

const seedPost = {
  id: seedPostId,
  title: 'Engineering handbook: where do I check course rules?',
  content: 'Seeded post content.',
  category: 'General',
  authorId: '70000000-0000-4000-8000-000000000001',
  authorName: 'Maya',
  authorIsUctVerified: false,
  isAnonymous: false,
  createdAt: '2026-06-27T10:00:00.000Z',
  commentCount: 2,
};

const seedComment = {
  id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
  postId: seedPostId,
  authorId: 'student-2',
  authorName: 'Student Two',
  authorIsUctVerified: false,
  content: 'Also check prerequisite chains before choosing electives.',
  createdAt: '2026-06-27T10:30:00.000Z',
};

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({ user }),
}));

vi.mock('../lib/forumApi', () => ({
  createComment: (...args: unknown[]) => mocks.createComment(...args),
  createReport: vi.fn(),
  getComments: (...args: unknown[]) => mocks.getComments(...args),
  getPost: (...args: unknown[]) => mocks.getPost(...args),
}));

vi.mock('../lib/fileApi', () => ({
  getFilesForComment: (...args: unknown[]) => mocks.getFilesForComment(...args),
  getFilesForPost: (...args: unknown[]) => mocks.getFilesForPost(...args),
  uploadLinkedFiles: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual =
    await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useParams: () => ({ id: seedPostId }) };
});

describe('PostDetailPage seeded posts', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.getPost.mockResolvedValue(seedPost);
    mocks.getComments.mockResolvedValue([seedComment]);
    mocks.getFilesForPost.mockResolvedValue([]);
    mocks.getFilesForComment.mockResolvedValue([]);
    mocks.createComment.mockResolvedValue({
      id: 'comment-new',
      postId: seedPostId,
      authorId: 'user-1',
      authorName: 'orange',
      authorIsUctVerified: false,
      content: 'Thanks, this helps.',
      createdAt: '2026-07-03T10:00:00.000Z',
    });
  });

  it('treats seeded real posts like normal posts that can receive comments', async () => {
    const userAction = userEvent.setup();

    render(
      <MemoryRouter>
        <PostDetailPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText('Seeded post content.')).toBeInTheDocument();
    expect(screen.queryByText(/read-only/i)).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Report' }).length).toBeGreaterThan(0);

    await userAction.type(
      screen.getByPlaceholderText('Write a helpful reply...'),
      'Thanks, this helps.',
    );
    await userAction.click(screen.getByRole('button', { name: 'Post comment' }));

    expect(mocks.createComment).toHaveBeenCalledWith(
      { postId: seedPostId, content: 'Thanks, this helps.' },
      user,
    );
    expect(await screen.findByText('Thanks, this helps.')).toBeInTheDocument();
  });
});
