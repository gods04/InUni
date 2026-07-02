import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { ForumComment } from '../types/forum';
import { CommentList } from './CommentList';

const baseComment: ForumComment = {
  id: 'comment-1',
  postId: 'post-1',
  authorId: 'student-1',
  authorName: 'Student One',
  authorAvatarUrl: null,
  authorIsUctVerified: false,
  content: 'Helpful comment.',
  createdAt: '2026-06-16T10:00:00.000Z',
};

describe('CommentList author badge', () => {
  it('marks comments written by the original post author', () => {
    render(
      <MemoryRouter>
        <CommentList comments={[baseComment]} postAuthorId="student-1" />
      </MemoryRouter>,
    );

    const badge = screen.getByText('Author');

    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('rounded-full');
    expect(badge).toHaveClass('text-[0.65rem]');
  });

  it('does not mark comments written by other users', () => {
    render(
      <MemoryRouter>
        <CommentList comments={[baseComment]} postAuthorId="student-2" />
      </MemoryRouter>,
    );

    expect(screen.queryByText('Author')).not.toBeInTheDocument();
  });

  it('uses a compact red button style for comment report actions', () => {
    render(
      <MemoryRouter>
        <CommentList comments={[baseComment]} onReport={vi.fn()} />
      </MemoryRouter>,
    );

    const reportButton = screen.getByRole('button', { name: 'Report' });

    expect(reportButton).toHaveClass('text-xs');
    expect(reportButton).toHaveClass('px-2.5');
    expect(reportButton).toHaveClass('py-1');
    expect(reportButton).toHaveClass('text-red-700');
  });
});
