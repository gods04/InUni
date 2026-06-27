import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PostDetailPage } from './PostDetailPage';

const mocks = vi.hoisted(() => ({
  getComments: vi.fn(),
  getFilesForComment: vi.fn(),
  getFilesForPost: vi.fn(),
  getPost: vi.fn(),
}));

const post = {
  id: 'post-1',
  title: 'Public question',
  content: 'Post content should be public.',
  category: 'Questions',
  authorId: 'author-1',
  authorName: 'Author',
  authorIsUctVerified: true,
  isAnonymous: false,
  createdAt: '2026-06-16T10:00:00.000Z',
  commentCount: 1,
};

const comment = {
  id: 'comment-1',
  postId: 'post-1',
  authorId: 'user-2',
  authorName: 'Student Two',
  authorIsUctVerified: false,
  content: 'Existing comment should be public.',
  createdAt: '2026-06-16T10:10:00.000Z',
};

const longHandbookUrl =
  'https://uct.ac.za/sites/default/files/media/documents/uct_ac_za/405/2026_Engineering%20and%20the%20Built%20Environment_UG_Handbook_7a.pdf';

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({ user: null }),
}));

vi.mock('../lib/forumApi', () => ({
  createComment: vi.fn(),
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
  return { ...actual, useParams: () => ({ id: 'post-1' }) };
});

describe('PostDetailPage public access', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.getPost.mockResolvedValue(post);
    mocks.getComments.mockResolvedValue([comment]);
    mocks.getFilesForPost.mockRejectedValue(new Error('Could not load files.'));
    mocks.getFilesForComment.mockRejectedValue(new Error('Could not load files.'));
  });

  it('shows the post and comments to logged-out visitors even when files require login', async () => {
    render(
      <MemoryRouter>
        <PostDetailPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText('Post content should be public.')).toBeInTheDocument();
    expect(screen.getByText('Existing comment should be public.')).toBeInTheDocument();
    expect(screen.queryByText('Could not load files.')).not.toBeInTheDocument();
    expect(screen.getByText('Only logged-in users can comment.')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Log in to comment' }),
    ).toHaveAttribute('href', '/login');
    expect(mocks.getFilesForPost).not.toHaveBeenCalled();
    expect(mocks.getFilesForComment).not.toHaveBeenCalled();
  });

  it('wraps long resource URLs inside the post body', async () => {
    mocks.getPost.mockResolvedValue({
      ...post,
      content: `Official handbook link:\n\n${longHandbookUrl}`,
    });

    render(
      <MemoryRouter>
        <PostDetailPage />
      </MemoryRouter>,
    );

    const postBody = await screen.findByText((content) =>
      content.includes(longHandbookUrl),
    );

    expect(postBody).toHaveClass('break-words');
  });
});
