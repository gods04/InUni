import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { PostCard } from './PostCard';

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({ user: null }),
}));

const post = {
  id: 'post-1',
  title: 'UCT study spaces',
  content: 'Where can we study after hours?',
  category: 'Study' as const,
  authorId: 'user-1',
  authorName: 'Amahle',
  authorIsUctVerified: true,
  isAnonymous: false,
  createdAt: new Date().toISOString(),
  commentCount: 2,
};

describe('PostCard', () => {
  it('shows UCT verification for a named verified author', () => {
    render(
      <MemoryRouter>
        <PostCard post={post} />
      </MemoryRouter>,
    );
    expect(screen.getByText('UCT Verified')).toBeInTheDocument();
  });

  it('does not expose verification on an anonymous post', () => {
    render(
      <MemoryRouter>
        <PostCard
          post={{ ...post, isAnonymous: true, authorName: 'Anonymous' }}
        />
      </MemoryRouter>,
    );
    expect(screen.queryByText('UCT Verified')).not.toBeInTheDocument();
  });
});
