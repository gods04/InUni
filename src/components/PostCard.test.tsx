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
  authorAvatarUrl: 'https://example.com/avatar.png',
  authorIsUctVerified: true,
  isAnonymous: false,
  createdAt: new Date().toISOString(),
  commentCount: 2,
};

const longHandbookUrl =
  'https://uct.ac.za/sites/default/files/media/documents/2026-ebe-handbook-7a-final-web.pdf';

describe('PostCard', () => {
  it('shows UCT verification for a named verified author', () => {
    render(
      <MemoryRouter>
        <PostCard post={post} />
      </MemoryRouter>,
    );
    expect(screen.getByText('UCT Verified')).toBeInTheDocument();
  });

  it('shows a named author avatar', () => {
    render(
      <MemoryRouter>
        <PostCard post={post} />
      </MemoryRouter>,
    );

    expect(screen.getByLabelText('Amahle avatar')).toBeInTheDocument();
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
    expect(screen.queryByLabelText('Amahle avatar')).not.toBeInTheDocument();
  });

  it('uses readable labels for long URL previews', () => {
    render(
      <MemoryRouter>
        <PostCard
          post={{
            ...post,
            content: `Official handbook link: ${longHandbookUrl}`,
          }}
        />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(/Engineering and the Built Environment UG Handbook PDF/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByText((content) => content.includes(longHandbookUrl)),
    ).not.toBeInTheDocument();
  });
});
