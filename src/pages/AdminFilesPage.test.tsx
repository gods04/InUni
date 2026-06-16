import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { LinkedFile } from '../types/files';
import { AdminFilesPage } from './AdminFilesPage';

const mocks = vi.hoisted(() => ({
  approveSharedFile: vi.fn(),
  deleteHiddenFile: vi.fn(),
  getAutoHiddenFiles: vi.fn(),
  getPendingSharedFiles: vi.fn(),
  rejectSharedFile: vi.fn(),
  restoreHiddenFile: vi.fn(),
}));

function makeLinkedFile(overrides: Partial<LinkedFile>): LinkedFile {
  return {
    id: 'file-1',
    ownerId: 'user-1',
    ownerName: 'Ayanda M.',
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
    links: [],
    ...overrides,
  };
}

vi.mock('../lib/adminFileApi', () => ({
  approveSharedFile: (...args: unknown[]) => mocks.approveSharedFile(...args),
  deleteHiddenFile: (...args: unknown[]) => mocks.deleteHiddenFile(...args),
  getAutoHiddenFiles: (...args: unknown[]) => mocks.getAutoHiddenFiles(...args),
  getPendingSharedFiles: (...args: unknown[]) =>
    mocks.getPendingSharedFiles(...args),
  rejectSharedFile: (...args: unknown[]) => mocks.rejectSharedFile(...args),
  restoreHiddenFile: (...args: unknown[]) => mocks.restoreHiddenFile(...args),
}));

describe('AdminFilesPage', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.getPendingSharedFiles.mockResolvedValue([
      makeLinkedFile({ id: 'pending-file', displayFilename: 'guide.pdf' }),
    ]);
    mocks.getAutoHiddenFiles.mockResolvedValue([
      makeLinkedFile({
        id: 'hidden-file',
        displayFilename: 'unsafe.zip',
        mimeType: 'application/zip',
        extension: 'zip',
        status: 'hidden_by_reports',
        reportCount: 3,
      }),
    ]);
    mocks.approveSharedFile.mockResolvedValue(undefined);
    mocks.rejectSharedFile.mockResolvedValue(undefined);
    mocks.restoreHiddenFile.mockResolvedValue(undefined);
    mocks.deleteHiddenFile.mockResolvedValue(undefined);
  });

  it('renders pending Shared Files review queue', async () => {
    render(
      <MemoryRouter>
        <AdminFilesPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText('guide.pdf')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Approve' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reject' })).toBeInTheDocument();
  });

  it('approves pending Shared Files and removes them from the queue', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AdminFilesPage />
      </MemoryRouter>,
    );

    await user.click(await screen.findByRole('button', { name: 'Approve' }));

    expect(mocks.approveSharedFile).toHaveBeenCalledWith('pending-file');
    await waitFor(() => expect(screen.queryByText('guide.pdf')).not.toBeInTheDocument());
  });

  it('rejects pending Shared Files after confirmation', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AdminFilesPage />
      </MemoryRouter>,
    );

    await user.click(await screen.findByRole('button', { name: 'Reject' }));
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Reject file',
      }),
    );

    expect(mocks.rejectSharedFile).toHaveBeenCalledWith('pending-file');
  });

  it('restores hidden files from the hidden queue', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AdminFilesPage />
      </MemoryRouter>,
    );

    await user.click(await screen.findByRole('button', { name: 'Auto-hidden files' }));
    await user.click(await screen.findByRole('button', { name: 'Restore' }));

    expect(mocks.restoreHiddenFile).toHaveBeenCalledWith('hidden-file');
  });
});
