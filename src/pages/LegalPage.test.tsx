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

  it('explains the terms, privacy notice, and community rules', () => {
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
    expect(screen.getByText(/University of Cape Town/i)).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'User content and moderation' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: 'What personal information we process',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Community Rules' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/POPIA/i)).toBeInTheDocument();
  });

  it('uses privacy-first page chrome for the privacy route', () => {
    render(
      <MemoryRouter initialEntries={['/privacy']}>
        <LegalPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', { name: 'Privacy Policy' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/account email, display name/i)).toBeInTheDocument();
  });

  it('uses community-first page chrome for the community rules route', () => {
    render(
      <MemoryRouter initialEntries={['/community-rules']}>
        <LegalPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', { name: 'Community Rules' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Do not post harassment/i)).toBeInTheDocument();
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
