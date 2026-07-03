import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { ToolsPage } from './ToolsPage';

describe('ToolsPage', () => {
  it('shows available student tools and planned utilities', () => {
    render(
      <MemoryRouter>
        <ToolsPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', { name: 'Student tools' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Forum' })).toHaveAttribute(
      'href',
      '/',
    );
    expect(
      screen.getByRole('link', { name: 'Shared files' }),
    ).toHaveAttribute('href', '/files');
    expect(screen.getByRole('link', { name: 'Create post' })).toHaveAttribute(
      'href',
      '/create',
    );
    expect(screen.getByRole('link', { name: 'Food tools' })).toHaveAttribute(
      'href',
      '/tools/food',
    );
    expect(screen.getByText('Classroom finder')).toBeInTheDocument();
    expect(screen.getByText('Document tools')).toBeInTheDocument();
    expect(screen.getAllByText('Planned')).toHaveLength(2);
  });
});
