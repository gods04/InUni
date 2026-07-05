import { render, screen } from '@testing-library/react';
import { Wrench } from 'lucide-react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { PageHeader } from './PageHeader';

describe('PageHeader', () => {
  it('renders a consistent product header with icon, copy, and actions', () => {
    render(
      <MemoryRouter>
        <PageHeader
          action={<a href="/tools/food">Open food tools</a>}
          description="Quick campus actions with calm spacing and useful context."
          eyebrow="UCT utilities"
          icon={Wrench}
          title="Student tools"
        />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', { name: 'Student tools' }),
    ).toBeInTheDocument();
    expect(screen.getByText('UCT utilities')).toBeInTheDocument();
    expect(
      screen.getByText('Quick campus actions with calm spacing and useful context.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open food tools' })).toHaveAttribute(
      'href',
      '/tools/food',
    );
  });
});
