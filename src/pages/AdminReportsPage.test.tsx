import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminReportsPage } from './AdminReportsPage';

const mocks = vi.hoisted(() => ({
  deleteReportedComment: vi.fn(),
  deleteReportedPost: vi.fn(),
  getOpenReports: vi.fn(),
  resolveReport: vi.fn(),
}));

vi.mock('../lib/adminApi', () => ({
  deleteReportedComment: (...args: unknown[]) =>
    mocks.deleteReportedComment(...args),
  deleteReportedPost: (...args: unknown[]) => mocks.deleteReportedPost(...args),
  getOpenReports: (...args: unknown[]) => mocks.getOpenReports(...args),
  resolveReport: (...args: unknown[]) => mocks.resolveReport(...args),
}));

describe('AdminReportsPage', () => {
  beforeEach(() => {
    mocks.deleteReportedComment.mockReset();
    mocks.deleteReportedPost.mockReset();
    mocks.getOpenReports.mockReset();
    mocks.resolveReport.mockReset();
    mocks.deleteReportedComment.mockResolvedValue(undefined);
    mocks.deleteReportedPost.mockResolvedValue(undefined);
    mocks.resolveReport.mockResolvedValue(undefined);
    mocks.getOpenReports.mockResolvedValue([
      {
        id: 'report-1',
        target: { type: 'post', postId: 'post-1' },
        reason: 'This contains targeted harassment.',
        status: 'open',
        reporterId: 'user-2',
        resolvedBy: null,
        resolutionNote: null,
        createdAt: '2026-06-14T00:00:00.000Z',
        resolvedAt: null,
        contentTitle: 'Reported post',
        contentPreview: 'Post preview',
      },
    ]);
  });

  it('renders the open report queue on its own route page', async () => {
    render(
      <MemoryRouter>
        <AdminReportsPage />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole('heading', { name: 'Reports queue' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Reported post')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Delete post' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Admin dashboard' })).toHaveAttribute(
      'href',
      '/admin',
    );
  });

  it('resolves a report before deleting its target', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AdminReportsPage />
      </MemoryRouter>,
    );

    await user.click(
      await screen.findByRole('button', { name: 'Delete post' }),
    );
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Delete post',
      }),
    );

    expect(mocks.resolveReport).toHaveBeenCalled();
    expect(mocks.deleteReportedPost).toHaveBeenCalled();
    expect(mocks.resolveReport.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.deleteReportedPost.mock.invocationCallOrder[0],
    );
  });
});
