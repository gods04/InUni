import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Post } from '../types/forum';
import { HomePage } from './HomePage';

const mocks = vi.hoisted(() => ({
  getPosts: vi.fn(),
}));

function makePost(overrides: Partial<Post>): Post {
  return {
    id: 'post-1',
    title: 'Default post',
    content: 'Default post content',
    category: 'General',
    authorId: 'user-1',
    authorName: 'Student',
    authorAvatarUrl: null,
    authorIsUctVerified: true,
    isAnonymous: false,
    createdAt: '2026-06-16T00:00:00.000Z',
    commentCount: 0,
    ...overrides,
  };
}

vi.mock('../lib/forumApi', () => ({
  createReport: vi.fn(),
  getPosts: (...args: unknown[]) => mocks.getPosts(...args),
}));

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({ user: null }),
}));

describe('HomePage', () => {
  beforeEach(() => {
    mocks.getPosts.mockReset();
    mocks.getPosts.mockResolvedValue([
      makePost({
        id: 'quiet-spaces',
        title: 'Quiet places on campus after 6pm',
        content: 'The library gets crowded after lectures.',
        category: 'Campus Life',
      }),
      makePost({
        id: 'study-notes',
        title: 'Best way to organize notes before finals?',
        content: 'What study systems are working for everyone?',
        category: 'Study',
      }),
    ]);
  });

  it('filters visible posts by search text without hiding the forum controls', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole('heading', {
        name: 'Quiet places on campus after 6pm',
      }),
    ).toBeInTheDocument();

    await user.type(screen.getByRole('searchbox', { name: 'Search posts' }), 'notes');

    expect(
      screen.getByRole('heading', {
        name: 'Best way to organize notes before finals?',
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', {
        name: 'Quiet places on campus after 6pm',
      }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Study' })).toBeInTheDocument();
  });

  it('shows a compact empty state when a post search has no matches', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    await screen.findByRole('heading', {
      name: 'Quiet places on campus after 6pm',
    });

    await user.type(screen.getByRole('searchbox', { name: 'Search posts' }), 'nonexistent');

    await waitFor(() =>
      expect(screen.queryAllByRole('article')).toHaveLength(0),
    );
    expect(screen.getByText('No posts found')).toBeInTheDocument();
    expect(
      screen.getByText('Try another search or category.'),
    ).toBeInTheDocument();
    expect(
      within(screen.getByText('No posts found').closest('section') ?? document.body)
        .queryByRole('link', { name: 'Create post' }),
    ).not.toBeInTheDocument();
  });
});
