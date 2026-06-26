import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { LinkedFile } from '../types/files';
import { PostDetailPage } from './PostDetailPage';

const mocks = vi.hoisted(() => ({
  createComment: vi.fn(),
  createReport: vi.fn(),
  createSignedDownloadUrl: vi.fn(),
  getComments: vi.fn(),
  getFilesForComment: vi.fn(),
  getFilesForPost: vi.fn(),
  getPost: vi.fn(),
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

const post = {
  id: 'post-1',
  title: 'Attachment question',
  content: 'Detailed post content',
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
  content: 'Existing comment',
  createdAt: '2026-06-16T10:10:00.000Z',
};

function makeLinkedFile(
  id: string,
  filename: string,
  description: string,
): LinkedFile {
  return {
    id,
    ownerId: 'user-1',
    ownerName: 'Student One',
    storageProvider: 'mock',
    storageBucket: 'mock-files',
    storagePath: `user-1/${id}/${filename}`,
    originalFilename: filename,
    displayFilename: filename,
    mimeType: 'application/pdf',
    extension: 'pdf',
    sizeBytes: 4096,
    description,
    status: 'available',
    scanStatus: 'not_scanned',
    downloadCount: 0,
    reportCount: 0,
    createdAt: '2026-06-16T10:00:00.000Z',
    updatedAt: '2026-06-16T10:00:00.000Z',
    links: [],
  };
}

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({ user: testUser }),
}));

vi.mock('../lib/forumApi', () => ({
  createComment: (...args: unknown[]) => mocks.createComment(...args),
  createReport: (...args: unknown[]) => mocks.createReport(...args),
  getComments: (...args: unknown[]) => mocks.getComments(...args),
  getPost: (...args: unknown[]) => mocks.getPost(...args),
}));

vi.mock('../lib/fileApi', () => ({
  createSignedDownloadUrl: (...args: unknown[]) =>
    mocks.createSignedDownloadUrl(...args),
  getFilesForComment: (...args: unknown[]) => mocks.getFilesForComment(...args),
  getFilesForPost: (...args: unknown[]) => mocks.getFilesForPost(...args),
  uploadLinkedFiles: (...args: unknown[]) => mocks.uploadLinkedFiles(...args),
}));

vi.mock('react-router-dom', async () => {
  const actual =
    await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useParams: () => ({ id: 'post-1' }) };
});

describe('PostDetailPage attachments', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.getPost.mockResolvedValue(post);
    mocks.getComments.mockResolvedValue([comment]);
    mocks.getFilesForPost.mockResolvedValue([
      makeLinkedFile('post-file', 'syllabus.pdf', 'Post attachment'),
    ]);
    mocks.getFilesForComment.mockResolvedValue([
      makeLinkedFile('comment-file', 'comment-notes.pdf', 'Comment attachment'),
    ]);
    mocks.createComment.mockResolvedValue({
      ...comment,
      id: 'comment-new',
      content: 'Useful reply with attachment',
    });
    mocks.createReport.mockResolvedValue(undefined);
    mocks.createSignedDownloadUrl.mockResolvedValue({
      url: 'mock://download/post-file',
      expiresAt: '2026-06-16T10:05:00.000Z',
    });
    mocks.uploadLinkedFiles.mockResolvedValue([]);
  });

  it('loads and displays post and comment files', async () => {
    render(
      <MemoryRouter>
        <PostDetailPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText('syllabus.pdf')).toBeInTheDocument();
    expect(await screen.findByText('comment-notes.pdf')).toBeInTheDocument();
  });

  it('passes the current user when opening post attachments', async () => {
    const user = userEvent.setup();
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    render(
      <MemoryRouter>
        <PostDetailPage />
      </MemoryRouter>,
    );

    await screen.findByText('syllabus.pdf');
    await user.click(screen.getAllByRole('button', { name: 'Preview' })[0]);

    expect(mocks.createSignedDownloadUrl).toHaveBeenCalledWith(
      'post-file',
      testUser,
    );
    expect(openSpy).toHaveBeenCalledWith(
      'mock://download/post-file',
      '_blank',
      'noopener,noreferrer',
    );

    openSpy.mockRestore();
  });

  it('uploads selected files after creating a comment', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <PostDetailPage />
      </MemoryRouter>,
    );

    await screen.findByText('Detailed post content');
    await user.type(
      screen.getByPlaceholderText('Write a helpful reply...'),
      'Useful reply with attachment',
    );
    await user.upload(
      screen.getByLabelText('Attach files'),
      new File(['notes'], 'reply.pdf', { type: 'application/pdf' }),
    );
    await user.click(screen.getByRole('button', { name: 'Post comment' }));

    await waitFor(() =>
      expect(mocks.uploadLinkedFiles).toHaveBeenCalledWith(
        { type: 'comment', commentId: 'comment-new' },
        expect.arrayContaining([
          expect.objectContaining({
            file: expect.objectContaining({ name: 'reply.pdf' }),
          }),
        ]),
        expect.objectContaining({ id: 'user-1' }),
      ),
    );
  });
});
