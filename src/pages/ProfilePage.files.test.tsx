import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { LinkedFile } from '../types/files';
import { ProfilePage } from './ProfilePage';

const mocks = vi.hoisted(() => ({
  createSignedDownloadUrl: vi.fn(),
  getUserFiles: vi.fn(),
  getUserPosts: vi.fn(),
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
  getUserFiles: (...args: unknown[]) => mocks.getUserFiles(...args),
}));

vi.mock('../lib/forumApi', () => ({
  getUserPosts: (...args: unknown[]) => mocks.getUserPosts(...args),
}));

describe('ProfilePage uploaded files', () => {
  beforeEach(() => {
    mocks.createSignedDownloadUrl.mockReset();
    mocks.getUserFiles.mockReset();
    mocks.getUserPosts.mockReset();
    mocks.createSignedDownloadUrl.mockResolvedValue({
      url: 'mock://download/file-1',
      expiresAt: '2026-06-16T10:05:00.000Z',
    });
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
});
