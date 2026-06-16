import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FileReportDialog } from './FileReportDialog';

describe('FileReportDialog', () => {
  it('submits a report type with an optional note', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onClose = vi.fn();

    render(
      <FileReportDialog
        fileId="file-1"
        onClose={onClose}
        onSubmit={onSubmit}
        open
      />,
    );

    await user.selectOptions(screen.getByLabelText('Reason'), 'malicious_file');
    await user.type(screen.getByLabelText('Optional note'), 'This archive opens an installer.');
    await user.click(screen.getByRole('button', { name: 'Submit report' }));

    expect(onSubmit).toHaveBeenCalledWith({
      fileId: 'file-1',
      reportType: 'malicious_file',
      note: 'This archive opens an installer.',
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('requires a report type before submission', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <FileReportDialog
        fileId="file-1"
        onClose={vi.fn()}
        onSubmit={onSubmit}
        open
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Submit report' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Choose a report reason.');
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
