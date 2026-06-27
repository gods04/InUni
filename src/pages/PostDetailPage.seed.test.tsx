import { render, screen } from '@testing-library/react';
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
  content: 'Starter post content.',
  category: 'General',
  authorId: 'seed-author-maya',
  authorName: 'Maya',
  authorIsUctVerified: false,
  isAnonymous: false,
  createdAt: '2026-06-27T10:00:00.000Z',
  commentCount: 2,
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

describe('PostDetailPage starter posts', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.getPost.mockResolvedValue(seedPost);
    mocks.getComments.mockResolvedValue([]);
    mocks.getFilesForPost.mockResolvedValue([]);
    mocks.getFilesForComment.mockResolvedValue([]);
  });

  it('shows a read-only state instead of a broken comment form', async () => {
    render(
      <MemoryRouter>
        <PostDetailPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText('Starter post content.')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Starter posts are read-only. Create a new post if you want to continue this conversation.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Create a new post' })).toHaveAttribute(
      'href',
      '/create',
    );
    expect(
      screen.queryByRole('button', { name: 'Post comment' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText('Write a helpful reply...'),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Report' })).not.toBeInTheDocument();
  });
});
