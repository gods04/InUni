import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { ContactPage } from './ContactPage';

describe('ContactPage', () => {
  it('offers a quiet project contact path without exposing personal details', () => {
    render(
      <MemoryRouter>
        <ContactPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', { name: 'Contact InUni' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Ideas and feedback')).toBeInTheDocument();
    expect(screen.getByText('Bugs or safety issues')).toBeInTheDocument();
    expect(screen.getByText('Help build InUni')).toBeInTheDocument();
    expect(
      screen.getByText('Societies and campus groups'),
    ).toBeInTheDocument();

    expect(
      screen.getByText('Project inbox coming soon'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Share an idea' })).toHaveAttribute(
      'href',
      '/create',
    );
    expect(screen.queryByText('hello@inuni.co.za')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Email InUni' }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/Please do not send passwords/i)).toBeInTheDocument();
    expect(screen.queryByText(/phone/i)).not.toBeInTheDocument();
  });
});
