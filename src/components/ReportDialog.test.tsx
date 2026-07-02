import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ReportDialog } from './ReportDialog';

describe('ReportDialog', () => {
  it('renders the overlay outside the parent card container', () => {
    const { getByTestId } = render(
      <div data-testid="post-card-shell">
        <ReportDialog
          open
          target={{ type: 'post', postId: 'post-1' }}
          onClose={vi.fn()}
          onSubmit={vi.fn()}
        />
      </div>,
    );

    const cardShell = getByTestId('post-card-shell');
    const dialog = screen.getByRole('dialog', { name: 'Report content' });

    expect(cardShell).not.toContainElement(dialog);
  });

  it('requires a meaningful reason before submission', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <ReportDialog
        open
        target={{ type: 'post', postId: 'post-1' }}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    await user.type(screen.getByLabelText('Reason'), 'bad');
    await user.click(
      screen.getByRole('button', { name: 'Submit report' }),
    );

    expect(
      screen.getByText('Please provide at least 10 characters.'),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
