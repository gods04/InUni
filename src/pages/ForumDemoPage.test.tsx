import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { ForumDemoPage } from './ForumDemoPage';

describe('ForumDemoPage', () => {
  it('renders the demo feed and filters the sample posts', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <ForumDemoPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', { name: 'UCT community forum' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: 'Writing Centre before essay deadlines: worth it?',
      }),
    ).toBeInTheDocument();

    const categoryFilter = screen.getByRole('group', {
      name: 'Filter demo posts by category',
    });
    await user.click(
      within(categoryFilter).getByRole('button', { name: 'Confessions' }),
    );

    const feed = screen.getByRole('feed', { name: 'Forum demo posts' });
    expect(
      within(feed).getByRole('heading', {
        name: 'I like someone from my tutorial and it is getting obvious',
      }),
    ).toBeInTheDocument();
    expect(
      within(feed).queryByRole('heading', {
        name: 'Writing Centre before essay deadlines: worth it?',
      }),
    ).not.toBeInTheDocument();

    await user.type(
      screen.getByRole('searchbox', { name: 'Search demo posts' }),
      'shuttle',
    );

    expect(
      within(feed).getByRole('heading', {
        name: 'Has the shuttle app been reliable after 7pm?',
      }),
    ).toBeInTheDocument();
  });
});
