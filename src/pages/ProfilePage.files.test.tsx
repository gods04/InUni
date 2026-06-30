import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { LinkedFile } from '../types/files';
import { ProfilePage } from './ProfilePage';

const mocks = vi.hoisted(() => ({
  createSignedDownloadUrl: vi.fn(),
  deleteFile: vi.fn(),
  deletePost: vi.fn(),
  getUserFiles: vi.fn(),
  getUserPosts: vi.fn(),
  updatePost: vi.fn(),
}));

const testUser = {
  id: 'user-1',
  email: 'student@uct.ac.za',
  emailConfirmed: true,
  profile: {
    id: 'user-1',
    username: 'student',
    displayName: 'Student One',
    role: 'student',
    isBanned: false,
    banReason: null,
    createdAt: '2026-06-16T00:00:00.000Z',
  },
};

function makeLinkedFile(): LinkedFile {
  return {
    id: 'file-1',
    ownerId: 'user-1',
    ownerName: 'Student One',
    storageProvider: 'mock',
    storageBucket: 'mock-files',
    storagePath: 'user-1/file-1/my-notes.pdf',
    originalFilename: 'my-notes.pdf',
    displayFilename: 'my-notes.pdf',
    mimeType: 'application/pdf',
    extension: 'pdf',
    sizeBytes: 2048,
    description: 'My notes',
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
  useAuth: () => ({ user: testUser, isDemoMode: false }),
}));

vi.mock('../lib/fileApi', () => ({
  createSignedDownloadUrl: (...args: unknown[]) =>
    mocks.createSignedDownloadUrl(...args),
  deleteFile: (...args: unknown[]) => mocks.deleteFile(...args),
  getUserFiles: (...args: unknown[]) => mocks.getUserFiles(...args),
}));

vi.mock('../lib/forumApi', () => ({
  deletePost: (...args: unknown[]) => mocks.deletePost(...args),
  getUserPosts: (...args: unknown[]) => mocks.getUserPosts(...args),
  updatePost: (...args: unknown[]) => mocks.updatePost(...args),
}));

describe('ProfilePage uploaded files', () => {
  beforeEach(() => {
    mocks.createSignedDownloadUrl.mockReset();
    mocks.deleteFile.mockReset();
    mocks.deletePost.mockReset();
    mocks.getUserFiles.mockReset();
    mocks.getUserPosts.mockReset();
    mocks.updatePost.mockReset();
    mocks.createSignedDownloadUrl.mockResolvedValue({
      url: 'mock://download/file-1',
      expiresAt: '2026-06-16T10:05:00.000Z',
    });
    mocks.deleteFile.mockResolvedValue(undefined);
    mocks.getUserFiles.mockResolvedValue([makeLinkedFile()]);
    mocks.getUserPosts.mockResolvedValue([]);
  });

  it('renders files uploaded by the current user', async () => {
    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
    );

    expect(await screen.findByText('My uploaded files')).toBeInTheDocument();
    expect(await screen.findByText('my-notes.pdf')).toBeInTheDocument();
    expect(mocks.getUserFiles).toHaveBeenCalledWith('user-1');
  });

  it('passes the current user when opening uploaded files', async () => {
    const user = userEvent.setup();
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
    );

    await user.click(await screen.findByRole('button', { name: 'Preview' }));

    expect(mocks.createSignedDownloadUrl).toHaveBeenCalledWith(
      'file-1',
      testUser,
    );
    expect(openSpy).toHaveBeenCalledWith(
      'mock://download/file-1',
      '_blank',
      'noopener,noreferrer',
    );

    openSpy.mockRestore();
  });

  it('prioritizes posts before uploaded files on the profile page', async () => {
    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
    );

    const postsHeading = await screen.findByRole('heading', {
      name: 'Your posts',
    });
    const filesHeading = await screen.findByRole('heading', {
      name: 'My uploaded files',
    });

    expect(
      postsHeading.compareDocumentPosition(filesHeading) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('requires confirmation before deleting an uploaded file', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
    );

    await user.click(
      await screen.findByRole('button', { name: 'Delete my-notes.pdf' }),
    );

    expect(screen.getByRole('dialog', { name: 'Delete file?' })).toBeInTheDocument();
    expect(mocks.deleteFile).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Delete file' }));

    expect(mocks.deleteFile).toHaveBeenCalledWith('file-1', testUser);
    expect(await screen.findByText('File deleted.')).toBeInTheDocument();
    expect(screen.queryByText('my-notes.pdf')).not.toBeInTheDocument();
  });
});
