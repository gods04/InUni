import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { FileUploadDraft } from '../types/files';
import { AttachmentPicker } from './AttachmentPicker';

function makeFile(name: string, type: string, size = 1024): File {
  return new File(['x'.repeat(size)], name, { type });
}

function AttachmentPickerHarness({
  maxFiles = 5,
}: {
  maxFiles?: number;
}) {
  const [value, setValue] = useState<FileUploadDraft[]>([]);

  return (
    <AttachmentPicker
      maxFiles={maxFiles}
      onChange={setValue}
      value={value}
    />
  );
}

describe('AttachmentPicker', () => {
  it('hints the supported upload extensions to the file picker', () => {
    render(<AttachmentPickerHarness />);

    expect(screen.getByLabelText('Attach files')).toHaveAttribute(
      'accept',
      '.pdf,.png,.jpg,.jpeg,.webp,.gif,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.txt,.md,.zip',
    );
  });

  it('adds selected files and lets students describe them', async () => {
    const user = userEvent.setup();
    render(<AttachmentPickerHarness />);

    await user.upload(
      screen.getByLabelText('Attach files'),
      makeFile('Week 5 notes.pdf', 'application/pdf'),
    );

    expect(screen.getByText('Week 5 notes.pdf')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Description for Week 5 notes.pdf'), 'Exam prep notes');

    expect(screen.getByLabelText('Description for Week 5 notes.pdf')).toHaveValue(
      'Exam prep notes',
    );
  });

  it('shows a limit message when the picker would exceed the attachment count', async () => {
    const user = userEvent.setup();
    render(<AttachmentPickerHarness maxFiles={1} />);

    await user.upload(
      screen.getByLabelText('Attach files'),
      [
        makeFile('first.pdf', 'application/pdf'),
        makeFile('second.pdf', 'application/pdf'),
      ],
    );

    expect(screen.getByRole('alert')).toHaveTextContent('You can attach up to 1 file.');
    expect(screen.queryByText('first.pdf')).not.toBeInTheDocument();
  });

  it('shows the upload size limit when a selected file is too large', async () => {
    const user = userEvent.setup();
    render(<AttachmentPickerHarness />);

    await user.upload(
      screen.getByLabelText('Attach files'),
      makeFile('large-notes.pdf', 'application/pdf', 5 * 1024 * 1024 + 1),
    );

    expect(screen.getByRole('alert')).toHaveTextContent(
      'This file is too large. Upload files up to 5MB each.',
    );
    expect(screen.queryByText('large-notes.pdf')).not.toBeInTheDocument();
  });

  it('rejects unsupported upload file types before adding drafts', async () => {
    const user = userEvent.setup({ applyAccept: false });
    render(<AttachmentPickerHarness />);

    await user.upload(
      screen.getByLabelText('Attach files'),
      makeFile('installer.exe', 'application/x-msdownload'),
    );

    expect(screen.getByRole('alert')).toHaveTextContent(
      'This file type cannot be uploaded yet. Try PDF, images, Office documents, spreadsheets, presentations, text files, or ZIP archives.',
    );
    expect(screen.queryByText('installer.exe')).not.toBeInTheDocument();
  });

  it('collects Shared Files review metadata for selected files', async () => {
    const user = userEvent.setup();
    render(<AttachmentPickerHarness />);

    await user.upload(
      screen.getByLabelText('Attach files'),
      makeFile('template.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'),
    );
    await user.click(screen.getByLabelText('Submit template.docx to Shared Files'));
    await user.type(screen.getByLabelText('Course code for template.docx'), 'PSYC1001');
    await user.type(screen.getByLabelText('Campus or faculty for template.docx'), 'Humanities');
    await user.type(screen.getByLabelText('Tags for template.docx'), 'template, essay');

    expect(screen.getByLabelText('Course code for template.docx')).toHaveValue('PSYC1001');
    expect(screen.getByLabelText('Campus or faculty for template.docx')).toHaveValue(
      'Humanities',
    );
    expect(screen.getByLabelText('Tags for template.docx')).toHaveValue('template, essay');
  });
});
