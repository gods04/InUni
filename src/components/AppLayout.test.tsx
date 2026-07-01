import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ForumUser, UserRole } from '../types/forum';
import { AppLayout } from './AppLayout';
import { legalAgreementStorageKey, termsVersion } from '../lib/legalAgreement';

const { authState, getFileReviewCount, signOut } = vi.hoisted(() => ({
  authState: {
    user: null as ForumUser | null,
  },
  getFileReviewCount: vi.fn().mockResolvedValue(4),
  signOut: vi.fn().mockResolvedValue(undefined),
}));

function makeUser(role: UserRole): ForumUser {
  return {
    id: `${role}-1`,
    email: `${role}@inuni.local`,
    emailConfirmed: true,
    profile: {
      id: `${role}-1`,
      username: role,
      displayName: role === 'admin' ? 'Admin' : 'Student',
      role,
      isBanned: false,
      banReason: null,
      isUctVerified: role === 'student',
      createdAt: '2026-06-17T00:00:00.000Z',
    },
  };
}

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: authState.user,
    isDemoMode: false,
    signOut,
  }),
}));

vi.mock('../lib/adminFileApi', () => ({
  getFileReviewCount,
}));

describe('AppLayout', () => {
  beforeEach(() => {
    window.localStorage.setItem(
      legalAgreementStorageKey,
      JSON.stringify({
        acceptedAt: '2026-07-01T00:00:00.000Z',
        version: termsVersion,
      }),
    );
    authState.user = makeUser('admin');
    getFileReviewCount.mockClear();
    getFileReviewCount.mockResolvedValue(4);
  });

  it('shows a review count badge on the admin nav link', async () => {
    render(
      <MemoryRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<p>Forum content</p>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    const adminLink = await screen.findByRole('link', { name: /Admin/ });

    expect(within(adminLink).getByText('4')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Tools' })).toBeInTheDocument();
  });

  it('uses a full-width header bar with the logo separated from right-side nav', async () => {
    render(
      <MemoryRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<p>Forum content</p>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    await screen.findByRole('link', { name: /Admin/ });

    const headerShell = screen
      .getByLabelText('InUni home')
      .closest('header')
      ?.firstElementChild;

    expect(headerShell).toHaveClass('max-w-none');
    expect(headerShell).not.toHaveClass('max-w-5xl');
  });

  it('shows standard legal policy links in the footer', () => {
    render(
      <MemoryRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<p>Forum content</p>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

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
  });

  it('leaves the admin nav link unbadged when no files need review', async () => {
    getFileReviewCount.mockResolvedValue(0);

    render(
      <MemoryRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<p>Forum content</p>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    const adminLink = await screen.findByRole('link', { name: /Admin/ });

    expect(within(adminLink).queryByText('0')).not.toBeInTheDocument();
    expect(
      within(adminLink).queryByText(/files need review/),
    ).not.toBeInTheDocument();
  });

  it('opens and closes the mobile navigation menu', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<p>Forum content</p>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    const menuButton = screen.getByRole('button', {
      name: 'Open navigation',
    });
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('dialog', { name: 'Navigation' })).not.toBeInTheDocument();

    await user.click(menuButton);

    const menu = screen.getByRole('dialog', { name: 'Navigation' });
    expect(menuButton).toHaveAttribute('aria-expanded', 'true');
    expect(within(menu).getByRole('link', { name: 'Forum' })).toBeInTheDocument();
    expect(within(menu).getByRole('link', { name: 'Files' })).toBeInTheDocument();
    expect(within(menu).getByRole('link', { name: 'Create' })).toBeInTheDocument();
    expect(within(menu).getByRole('link', { name: 'Tools' })).toBeInTheDocument();
    expect(within(menu).getByRole('link', { name: 'Profile' })).toBeInTheDocument();
    expect(within(menu).getByRole('link', { name: /Admin/ })).toBeInTheDocument();
    expect(within(menu).getByText('4')).toBeInTheDocument();

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog', { name: 'Navigation' })).not.toBeInTheDocument();
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes the mobile menu after choosing a route', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<p>Forum content</p>} />
            <Route path="/files" element={<p>Files content</p>} />
            <Route path="/tools" element={<p>Tools content</p>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: 'Open navigation' }));
    await user.click(
      within(screen.getByRole('dialog', { name: 'Navigation' })).getByRole(
        'link',
        { name: 'Tools' },
      ),
    );

    expect(screen.queryByRole('dialog', { name: 'Navigation' })).not.toBeInTheDocument();
    expect(await screen.findByText('Tools content')).toBeInTheDocument();
  });

  it('hides the admin nav link from student accounts', () => {
    authState.user = makeUser('student');

    render(
      <MemoryRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<p>Forum content</p>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.queryByRole('link', { name: /Admin/ })).not.toBeInTheDocument();
    expect(getFileReviewCount).not.toHaveBeenCalled();
  });

  it('keeps the admin nav link out of the mobile menu for visitors', async () => {
    authState.user = null;
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<p>Forum content</p>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: 'Open navigation' }));

    const menu = screen.getByRole('dialog', { name: 'Navigation' });
    expect(within(menu).queryByRole('link', { name: /Admin/ })).not.toBeInTheDocument();
    expect(within(menu).getByRole('link', { name: 'Login' })).toBeInTheDocument();
    expect(getFileReviewCount).not.toHaveBeenCalled();
  });

  it('blocks first-time visitors with the legal agreement gate', async () => {
    window.localStorage.removeItem(legalAgreementStorageKey);
    authState.user = null;
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<p>Forum content</p>} />
            <Route path="/terms" element={<p>Terms content</p>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    const dialog = screen.getByRole('dialog', {
      name: 'Terms, Privacy & Disclaimer',
    });

    expect(within(dialog).getByText(/You need to agree/i)).toBeInTheDocument();
    expect(within(dialog).getByRole('link', { name: 'Read full terms' })).toHaveAttribute('href', '/terms');

    await user.click(within(dialog).getByRole('button', { name: 'I agree' }));

    expect(
      screen.queryByRole('dialog', { name: 'Terms, Privacy & Disclaimer' }),
    ).not.toBeInTheDocument();
    expect(
      JSON.parse(window.localStorage.getItem(legalAgreementStorageKey) ?? '{}'),
    ).toMatchObject({ version: termsVersion });
  });

  it('keeps legal policy routes readable before agreement', () => {
    window.localStorage.removeItem(legalAgreementStorageKey);
    authState.user = null;

    for (const path of ['/privacy', '/terms', '/community-rules']) {
      const { unmount } = render(
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path={path} element={<p>Legal content</p>} />
            </Route>
          </Routes>
        </MemoryRouter>,
      );

      expect(screen.getByText('Legal content')).toBeInTheDocument();
      expect(
        screen.queryByRole('dialog', { name: 'Terms, Privacy & Disclaimer' }),
      ).not.toBeInTheDocument();

      unmount();
    }
  });
});
