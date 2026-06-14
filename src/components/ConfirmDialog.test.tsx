import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmDialog } from './ConfirmDialog';

describe('ConfirmDialog', () => {
  it('requires explicit confirmation for destructive actions', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        confirmLabel="Delete post"
        message="This permanently removes the post and comments."
        onCancel={vi.fn()}
        onConfirm={onConfirm}
        open
        title="Delete post?"
      />,
    );

    expect(onConfirm).not.toHaveBeenCalled();
    await user.click(
      screen.getByRole('button', { name: 'Delete post' }),
    );
    expect(onConfirm).toHaveBeenCalledOnce();
  });
});
