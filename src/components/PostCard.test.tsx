import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { LinkedFile } from '../types/files';
import { PostCard } from './PostCard';

const mocks = vi.hoisted(() => ({
  createSignedPreviewUrl: vi.fn(),
  currentUser: null as unknown,
}));

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({ user: mocks.currentUser }),
}));

vi.mock('../lib/fileApi', () => ({
  createSignedPreviewUrl: (...args: unknown[]) =>
    mocks.createSignedPreviewUrl(...args),
}));

const post = {
  id: 'post-1',
  title: 'UCT study spaces',
  content: 'Where can we study after hours?',
  category: 'Academics' as const,
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

const user = {
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

function makeFile(overrides: Partial<LinkedFile>): LinkedFile {
  return {
    id: 'file-1',
    ownerId: 'user-1',
    ownerName: 'Student',
    storageProvider: 'mock',
    storageBucket: 'mock-files',
    storagePath: 'user-1/file-1/notes.pdf',
    originalFilename: 'notes.pdf',
    displayFilename: 'notes.pdf',
    mimeType: 'application/pdf',
    extension: 'pdf',
    sizeBytes: 4096,
    description: '',
    status: 'available',
    scanStatus: 'not_scanned',
    downloadCount: 0,
    reportCount: 0,
    createdAt: '2026-06-16T10:00:00.000Z',
    updatedAt: '2026-06-16T10:00:00.000Z',
    links: [],
    ...overrides,
  };
}

describe('PostCard', () => {
  beforeEach(() => {
    mocks.currentUser = null;
    mocks.createSignedPreviewUrl.mockReset();
    mocks.createSignedPreviewUrl.mockResolvedValue({
      url: 'https://files.inuni.test/photo.jpg',
      expiresAt: '2026-06-16T10:05:00.000Z',
    });
  });

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

  it('separates post metadata from post actions', () => {
    render(
      <MemoryRouter>
        <PostCard post={post} />
      </MemoryRouter>,
    );

    expect(screen.getByLabelText('Post metadata')).toHaveTextContent('Amahle');
    expect(screen.getByLabelText('Post metadata')).toHaveTextContent(
      '2 comments',
    );
    expect(screen.getByLabelText('Post actions')).toHaveTextContent('Log in to report');
  });

  it('marks unanswered posts as needing a first reply', () => {
    render(
      <MemoryRouter>
        <PostCard post={{ ...post, commentCount: 0 }} />
      </MemoryRouter>,
    );

    expect(screen.getByText('Needs first reply')).toBeInTheDocument();
    expect(screen.getByLabelText('Post metadata')).toHaveTextContent(
      '0 comments',
    );
  });

  it('links to the post comments from the card actions', () => {
    render(
      <MemoryRouter>
        <PostCard
          post={{
            ...post,
            slug: 'uct-study-spaces',
          }}
        />
      </MemoryRouter>,
    );

    const commentLink = screen.getByRole('link', { name: 'Comment' });

    expect(screen.getByLabelText('Post actions')).toContainElement(commentLink);
    expect(commentLink).toHaveAttribute('href', '/post/uct-study-spaces#comments');
  });

  it('shows the feed report action as a bordered red button', () => {
    mocks.currentUser = user;

    render(
      <MemoryRouter>
        <PostCard post={post} />
      </MemoryRouter>,
    );

    const reportButton = screen.getByRole('button', { name: 'Report' });

    expect(reportButton).toHaveClass('border');
    expect(reportButton).toHaveClass('border-red-200');
    expect(reportButton).toHaveClass('text-red-700');
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

  it('shows attached non-image files in the feed card', () => {
    render(
      <MemoryRouter>
        <PostCard
          post={{
            ...post,
            attachments: [
              makeFile({
                displayFilename: 'lecture-notes.pdf',
                originalFilename: 'lecture-notes.pdf',
              }),
            ],
          }}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('Attachments')).toBeInTheDocument();
    expect(screen.getByText('lecture-notes.pdf')).toBeInTheDocument();
  });

  it('shows image attachment previews for logged-in users', async () => {
    mocks.currentUser = user;

    render(
      <MemoryRouter>
        <PostCard
          post={{
            ...post,
            attachments: [
              makeFile({
                id: 'image-1',
                displayFilename: 'campus-photo.jpg',
                originalFilename: 'campus-photo.jpg',
                mimeType: 'image/jpeg',
                extension: 'jpg',
              }),
            ],
          }}
        />
      </MemoryRouter>,
    );

    const image = await screen.findByRole('img', {
      name: 'campus-photo.jpg preview',
    });

    expect(image).toHaveAttribute('src', 'https://files.inuni.test/photo.jpg');
    expect(mocks.createSignedPreviewUrl).toHaveBeenCalledWith('image-1', user);
  });

  it('does not request image signed URLs for logged-out users', () => {
    render(
      <MemoryRouter>
        <PostCard
          post={{
            ...post,
            attachments: [
              makeFile({
                id: 'image-1',
                displayFilename: 'campus-photo.jpg',
                originalFilename: 'campus-photo.jpg',
                mimeType: 'image/jpeg',
                extension: 'jpg',
              }),
            ],
          }}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('campus-photo.jpg')).toBeInTheDocument();
    expect(mocks.createSignedPreviewUrl).not.toHaveBeenCalled();
  });

  it('does not show an edited badge when the update timestamp changed', () => {
    render(
      <MemoryRouter>
        <PostCard
          post={{
            ...post,
            createdAt: '2026-06-16T10:00:00.000Z',
            updatedAt: '2026-06-16T10:15:00.000Z',
          }}
        />
      </MemoryRouter>,
    );

    expect(screen.queryByText('Edited')).not.toBeInTheDocument();
  });
});
