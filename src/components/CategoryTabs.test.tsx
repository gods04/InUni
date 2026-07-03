import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CategoryTabs } from './CategoryTabs';

describe('CategoryTabs', () => {
  it('keeps category filtering accessible while hinting that mobile tabs scroll', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(
      <CategoryTabs value="All" onChange={onChange} />,
    );

    const tabs = screen.getByRole('group', {
      name: 'Filter posts by category',
    });
    const wrapper = tabs.parentElement;
    const scrollHint = container.querySelector('[aria-hidden="true"]');

    expect(wrapper).toHaveClass('max-w-full', 'overflow-hidden');
    expect(tabs).toHaveClass('overflow-x-auto');
    expect(tabs).toHaveClass('min-w-0', 'w-full');
    expect(tabs).toHaveClass('pr-10');
    expect(scrollHint).toHaveClass(
      'pointer-events-none',
      'bg-gradient-to-l',
      'sm:hidden',
    );

    expect(
      screen.queryByRole('button', { name: 'Study' }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Academics' }));

    expect(onChange).toHaveBeenCalledWith('Academics');
  });
});
