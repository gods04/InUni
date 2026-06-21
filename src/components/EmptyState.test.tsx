import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('uses a compact default layout while preserving optional actions', () => {
    render(
      <EmptyState
        action={<button type="button">Try again</button>}
        message="There is nothing here yet."
        title="Nothing found"
      />,
    );

    const title = screen.getByRole('heading', { name: 'Nothing found' });
    const panel = title.closest('.panel');
    const logo = screen.getByRole('presentation', { hidden: true });

    expect(panel).toHaveClass('py-5');
    expect(panel).not.toHaveClass('py-12');
    expect(title).toHaveClass('text-base');
    expect(logo).toHaveClass('h-10', 'w-10');
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
});
