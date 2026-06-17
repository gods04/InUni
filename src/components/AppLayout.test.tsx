import { render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppLayout } from './AppLayout';

const { getFileReviewCount, signOut } = vi.hoisted(() => ({
  getFileReviewCount: vi.fn().mockResolvedValue(4),
  signOut: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: 'admin-1',
      email: 'admin@inuni.local',
      emailConfirmed: true,
      profile: {
        id: 'admin-1',
        username: 'admin',
        displayName: 'Admin',
        role: 'admin',
        isBanned: false,
        banReason: null,
        createdAt: '2026-06-17T00:00:00.000Z',
      },
    },
    isDemoMode: false,
    signOut,
  }),
}));

vi.mock('../lib/adminFileApi', () => ({
  getFileReviewCount,
}));

describe('AppLayout', () => {
  beforeEach(() => {
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

    const adminLink = await screen.findByRole('link', { name: 'Admin' });

    expect(within(adminLink).getByText('4')).toBeInTheDocument();
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

    const adminLink = await screen.findByRole('link', { name: 'Admin' });

    expect(within(adminLink).queryByText('0')).not.toBeInTheDocument();
    expect(
      within(adminLink).queryByText(/files need review/),
    ).not.toBeInTheDocument();
  });
});
