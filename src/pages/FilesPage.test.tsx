import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { LinkedFile } from '../types/files';
import { FilesPage } from './FilesPage';

const mocks = vi.hoisted(() => ({
  authUser: null as null | {
    id: string;
    email: string;
    emailConfirmed: boolean;
    profile: {
      id: string;
      username: string;
      displayName: string;
      role: 'student';
      isBanned: boolean;
      banReason: string | null;
      createdAt: string;
    };
  },
  createSignedDownloadUrl: vi.fn(),
  getSharedFiles: vi.fn(),
  reportFile: vi.fn(),
}));

function makeSharedFile(): LinkedFile {
  return {
    id: 'file-1',
    ownerId: 'user-1',
    ownerName: 'Student',
    storageProvider: 'mock',
    storageBucket: 'mock-files',
    storagePath: 'path',
    originalFilename: 'guide.pdf',
    displayFilename: 'guide.pdf',
    mimeType: 'application/pdf',
    extension: 'pdf',
    sizeBytes: 1024,
    description: 'Study guide',
    status: 'available',
    scanStatus: 'not_scanned',
    downloadCount: 0,
    reportCount: 0,
    createdAt: '2026-06-16T00:00:00.000Z',
    updatedAt: '2026-06-16T00:00:00.000Z',
    links: [
      {
        id: 'link-1',
        fileId: 'file-1',
        linkType: 'shared_file',
        postId: null,
        commentId: null,
        sharedStatus: 'approved',
        courseCode: 'CSC1010H',
        campusOrFaculty: 'Science',
        tags: ['study'],
        createdAt: '2026-06-16T00:00:00.000Z',
      },
    ],
  };
}

vi.mock('../lib/fileApi', () => ({
  createSignedDownloadUrl: (...args: unknown[]) =>
    mocks.createSignedDownloadUrl(...args),
  getSharedFiles: (...args: unknown[]) => mocks.getSharedFiles(...args),
  reportFile: (...args: unknown[]) => mocks.reportFile(...args),
}));

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({ user: mocks.authUser }),
}));

describe('FilesPage', () => {
  beforeEach(() => {
    mocks.authUser = null;
    mocks.createSignedDownloadUrl.mockReset();
    mocks.getSharedFiles.mockReset();
    mocks.reportFile.mockReset();
    mocks.getSharedFiles.mockResolvedValue([makeSharedFile()]);
    mocks.reportFile.mockResolvedValue(undefined);
    mocks.createSignedDownloadUrl.mockResolvedValue({
      url: 'mock://download/file-1',
      expiresAt: '2026-06-16T00:05:00.000Z',
    });
  });

  it('renders shared files and keeps page-specific content separated', async () => {
    render(
      <MemoryRouter>
        <FilesPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText('guide.pdf')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Newest' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Downloads' })).toBeInTheDocument();
    expect(screen.queryByText('Create post attachment area')).not.toBeInTheDocument();
    expect(screen.queryByText('Admin file review')).not.toBeInTheDocument();
  });

  it('shows shared file metadata to logged-out visitors but gates file actions', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <FilesPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText('guide.pdf')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Preview' }));
    expect(
      screen.getByText('Log in to preview or download files.'),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Download' }));
    expect(
      screen.getByText('Log in to preview or download files.'),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Report guide.pdf' }));
    expect(screen.getByText('Log in to report files.')).toBeInTheDocument();
    expect(mocks.createSignedDownloadUrl).not.toHaveBeenCalled();
    expect(mocks.reportFile).not.toHaveBeenCalled();
  });

  it('updates filters used to load shared files', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <FilesPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText('Search shared files'), 'guide');
    await user.type(screen.getByLabelText('Course code'), 'CSC1010H');
    await user.selectOptions(screen.getByLabelText('File type'), 'pdf');

    await waitFor(() =>
      expect(mocks.getSharedFiles).toHaveBeenLastCalledWith(
        expect.objectContaining({
          courseCode: 'CSC1010H',
          fileKind: 'pdf',
          query: 'guide',
        }),
      ),
    );
  });

  it('uses a system-fault message when shared file listings fail to load', async () => {
    mocks.getSharedFiles.mockRejectedValue(new Error('Could not load files.'));

    render(
      <MemoryRouter>
        <FilesPage />
      </MemoryRouter>,
    );

    expect(
      await screen.findByText(
        'File listings are temporarily unavailable. Please try again later.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText('Could not load files.')).not.toBeInTheDocument();
  });

  it('submits file reports for active signed-in users', async () => {
    const user = userEvent.setup();
    mocks.authUser = {
      id: 'user-2',
      email: 'student@uct.ac.za',
      emailConfirmed: true,
      profile: {
        id: 'user-2',
        username: 'student',
        displayName: 'Student Two',
        role: 'student',
        isBanned: false,
        banReason: null,
        createdAt: '2026-06-16T00:00:00.000Z',
      },
    };

    render(
      <MemoryRouter>
        <FilesPage />
      </MemoryRouter>,
    );

    await screen.findByText('guide.pdf');
    await user.click(screen.getByRole('button', { name: 'Report guide.pdf' }));
    await user.selectOptions(screen.getByLabelText('Reason'), 'privacy');
    await user.type(screen.getByLabelText('Optional note'), 'Contains student info.');
    await user.click(screen.getByRole('button', { name: 'Submit report' }));

    expect(mocks.reportFile).toHaveBeenCalledWith(
      {
        fileId: 'file-1',
        reportType: 'privacy',
        note: 'Contains student info.',
      },
      expect.objectContaining({ id: 'user-2' }),
    );
  });
});
