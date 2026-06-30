import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { LinkedFile } from '../types/files';
import { FileList } from './FileList';

function makeLinkedFile(overrides: Partial<LinkedFile>): LinkedFile {
  return {
    id: 'file-1',
    ownerId: 'user-1',
    ownerName: 'Student One',
    ownerAvatarUrl: null,
    storageProvider: 'mock',
    storageBucket: 'mock-files',
    storagePath: 'user-1/file-1/notes.pdf',
    originalFilename: 'notes.pdf',
    displayFilename: 'notes.pdf',
    mimeType: 'application/pdf',
    extension: 'pdf',
    sizeBytes: 54 * 1024,
    description: 'Lecture notes',
    status: 'available',
    scanStatus: 'not_scanned',
    downloadCount: 2,
    reportCount: 0,
    createdAt: '2026-06-16T10:00:00.000Z',
    updatedAt: '2026-06-16T10:00:00.000Z',
    links: [],
    ...overrides,
  };
}

describe('FileList', () => {
  it('shows preview actions only for previewable files', async () => {
    const user = userEvent.setup();
    const onPreview = vi.fn();
    const onDownload = vi.fn();
    const files = [
      makeLinkedFile({ id: 'pdf', displayFilename: 'notes.pdf', mimeType: 'application/pdf' }),
      makeLinkedFile({
        id: 'zip',
        displayFilename: 'archive.zip',
        mimeType: 'application/zip',
        extension: 'zip',
      }),
    ];

    render(
      <FileList
        files={files}
        onDownload={onDownload}
        onPreview={onPreview}
      />,
    );

    const pdfRow = screen.getByLabelText('File notes.pdf');
    const zipRow = screen.getByLabelText('File archive.zip');

    await user.click(within(pdfRow).getByRole('button', { name: 'Preview' }));
    await user.click(within(zipRow).getByRole('button', { name: 'Download' }));

    expect(onPreview).toHaveBeenCalledWith(files[0]);
    expect(within(zipRow).queryByRole('button', { name: 'Preview' })).not.toBeInTheDocument();
    expect(onDownload).toHaveBeenCalledWith(files[1]);
  });

  it('reports a file through the provided callback', async () => {
    const user = userEvent.setup();
    const onReport = vi.fn();
    const file = makeLinkedFile({ id: 'file-report', displayFilename: 'unsafe.zip' });

    render(<FileList files={[file]} onReport={onReport} />);

    await user.click(screen.getByRole('button', { name: 'Report unsafe.zip' }));

    expect(onReport).toHaveBeenCalledWith(file);
  });

  it('deletes a file through the provided callback', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    const file = makeLinkedFile({
      id: 'file-delete',
      displayFilename: 'old-upload.pdf',
    });

    render(<FileList files={[file]} onDelete={onDelete} />);

    await user.click(screen.getByRole('button', { name: 'Delete old-upload.pdf' }));

    expect(onDelete).toHaveBeenCalledWith(file);
  });

  it('does not render preview or download actions without provided callbacks', () => {
    const file = makeLinkedFile({ id: 'file-readonly' });

    render(<FileList files={[file]} />);

    expect(screen.queryByRole('button', { name: 'Preview' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Download' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Delete/ })).not.toBeInTheDocument();
  });

  it('shows the uploaded file owner avatar', () => {
    const file = makeLinkedFile({
      ownerAvatarUrl: 'https://example.com/student-one.png',
    });

    render(<FileList files={[file]} />);

    const fileRow = screen.getByLabelText('File notes.pdf');
    expect(within(fileRow).getByLabelText('Student One avatar')).toBeInTheDocument();
  });
});
