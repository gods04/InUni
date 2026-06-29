import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Post } from '../types/forum';
import { HomePage } from './HomePage';

const mocks = vi.hoisted(() => ({
  currentUser: null as unknown,
  getFilesForPost: vi.fn(),
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

vi.mock('../lib/fileApi', () => ({
  createSignedPreviewUrl: vi.fn(),
  getFilesForPost: (...args: unknown[]) => mocks.getFilesForPost(...args),
}));

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({ user: mocks.currentUser }),
}));

describe('HomePage', () => {
  beforeEach(() => {
    mocks.currentUser = null;
    mocks.getFilesForPost.mockReset();
    mocks.getFilesForPost.mockResolvedValue([]);
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

  it('loads and shows post attachments in the feed for logged-in users', async () => {
    mocks.currentUser = {
      id: 'user-1',
      email: 'student@uct.ac.za',
      emailConfirmed: true,
      profile: {
        id: 'user-1',
        username: 'student',
        displayName: 'Student',
        role: 'student',
        isBanned: false,
        banReason: null,
        isUctVerified: true,
        createdAt: '2026-06-16T00:00:00.000Z',
      },
    };
    mocks.getPosts.mockResolvedValue([
      makePost({
        id: 'post-with-file',
        title: 'Photo from campus',
      }),
    ]);
    mocks.getFilesForPost.mockResolvedValue([
      {
        id: 'file-1',
        ownerId: 'user-1',
        ownerName: 'Student',
        storageProvider: 'mock',
        storageBucket: 'mock-files',
        storagePath: 'user-1/file-1/timetable.pdf',
        originalFilename: 'timetable.pdf',
        displayFilename: 'timetable.pdf',
        mimeType: 'application/pdf',
        extension: 'pdf',
        sizeBytes: 2048,
        description: '',
        status: 'available',
        scanStatus: 'not_scanned',
        downloadCount: 0,
        reportCount: 0,
        createdAt: '2026-06-16T00:00:00.000Z',
        updatedAt: '2026-06-16T00:00:00.000Z',
        links: [],
      },
    ]);

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    expect(await screen.findByText('timetable.pdf')).toBeInTheDocument();
    expect(mocks.getFilesForPost).toHaveBeenCalledWith('post-with-file');
  });
});
