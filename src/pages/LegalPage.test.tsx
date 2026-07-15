import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { legalAgreementStorageKey, termsVersion } from '../lib/legalAgreement';
import { LegalPage } from './LegalPage';

describe('LegalPage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('explains the terms page separately from privacy and rules', () => {
    render(
      <MemoryRouter>
        <LegalPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', { name: 'Terms of Service' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute(
      'href',
      '/privacy',
    );
    expect(
      screen.getByRole('link', { name: 'Terms of Service' }),
    ).toHaveAttribute('href', '/terms');
    expect(
      screen.getByRole('link', { name: 'Community Rules' }),
    ).toHaveAttribute('href', '/community-rules');
    expect(screen.getByText(/InUni is an independent student community/i)).toBeInTheDocument();
    expect(screen.getAllByText(/University of Cape Town/i).length).toBeGreaterThan(0);
    expect(
      screen.getByRole('heading', { name: 'Using InUni' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'No official advice' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Information we collect' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Academic honesty' }),
    ).not.toBeInTheDocument();
  });

  it('uses privacy-specific content for the privacy route', () => {
    render(
      <MemoryRouter initialEntries={['/privacy']}>
        <LegalPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', { name: 'Privacy Policy' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Information we collect' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/account email, display name/i)).toBeInTheDocument();
    expect(screen.getByText(/anonymous display option/i)).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'No official advice' }),
    ).not.toBeInTheDocument();
  });

  it('uses community-specific content for the community rules route', () => {
    render(
      <MemoryRouter initialEntries={['/community-rules']}>
        <LegalPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', { name: 'Community Rules' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Academic honesty' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Optional anonymous posting is for display only/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Information we collect' }),
    ).not.toBeInTheDocument();
  });

  it('shows the current legal version date', () => {
    render(
      <MemoryRouter initialEntries={['/terms']}>
        <LegalPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(`Version ${termsVersion}`),
    ).toBeInTheDocument();
  });

  it('lets visitors accept the current terms version from the page', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <LegalPage />
      </MemoryRouter>,
    );

    await user.click(
      screen.getByRole('button', { name: 'I agree and continue' }),
    );

    expect(
      JSON.parse(
        window.localStorage.getItem(legalAgreementStorageKey) ?? '{}',
      ),
    ).toMatchObject({
      version: termsVersion,
    });
  });
});
