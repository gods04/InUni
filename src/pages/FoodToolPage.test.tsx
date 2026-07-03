import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { FoodToolPage } from './FoodToolPage';

describe('FoodToolPage', () => {
  it('shows the three food tool choices before a mode is selected', () => {
    render(
      <MemoryRouter>
        <FoodToolPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Food tools' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'What should I eat today?' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'What can I make?' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Budget meals' })).toBeInTheDocument();
    expect(screen.queryByText('Recipe database')).not.toBeInTheDocument();
    expect(screen.queryByText('Fridge matcher')).not.toBeInTheDocument();
    expect(screen.queryByText('Budget scanner')).not.toBeInTheDocument();
  });

  it('draws a meal in the what-to-eat mode', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <FoodToolPage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: 'What should I eat today?' }));
    await user.click(screen.getByRole('button', { name: 'Spin meal wheel' }));

    const wheel = screen.getByRole('region', { name: 'Meal wheel' });
    expect(within(wheel).getByText(/Estimated time:/)).toBeInTheDocument();
    expect(
      within(wheel).getByRole('heading', { level: 2 }),
    ).toBeInTheDocument();
  });

  it('matches recipes from ingredients the user has at home', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <FoodToolPage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: 'What can I make?' }));
    await user.type(
      screen.getByLabelText('Ingredients I have'),
      'rice, beans, tomato, curry powder',
    );
    await user.click(screen.getByRole('button', { name: 'Find recipes' }));

    const beanCurryCard = screen
      .getByRole('heading', { name: 'Bean curry and rice' })
      .closest('article');

    expect(beanCurryCard).not.toBeNull();

    const beanCurry = within(beanCurryCard as HTMLElement);
    expect(beanCurry.getByText('Detailed method')).toBeInTheDocument();
    expect(beanCurry.getByText('Medium-high heat')).toBeInTheDocument();
    expect(beanCurry.getByText('12 min')).toBeInTheDocument();
    expect(
      beanCurry.getByText('Rice is tender and most water is absorbed.'),
    ).toBeInTheDocument();
    expect(beanCurry.getByText('30 min total')).toBeInTheDocument();
  });

  it('filters campus menu items by budget', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <FoodToolPage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: 'Budget meals' }));
    await user.clear(screen.getByLabelText('Budget amount'));
    await user.type(screen.getByLabelText('Budget amount'), '50');

    expect(screen.getByText('Chicken mayo sandwich')).toBeInTheDocument();
    expect(screen.queryByText('Chicken schnitzel plate')).not.toBeInTheDocument();
  });
});
