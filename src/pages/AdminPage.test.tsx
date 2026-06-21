import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminPage } from './AdminPage';

const mocks = vi.hoisted(() => ({
  deleteReportedComment: vi.fn(),
  deleteReportedPost: vi.fn(),
  getAdminDashboardMetrics: vi.fn(),
  getFileReviewCount: vi.fn(),
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

vi.mock('../lib/adminFileApi', () => ({
  getFileReviewCount: (...args: unknown[]) => mocks.getFileReviewCount(...args),
}));

vi.mock('../lib/adminDashboardApi', () => ({
  getAdminDashboardMetrics: (...args: unknown[]) =>
    mocks.getAdminDashboardMetrics(...args),
}));

describe('AdminPage', () => {
  beforeEach(() => {
    mocks.deleteReportedComment.mockReset();
    mocks.deleteReportedPost.mockReset();
    mocks.getAdminDashboardMetrics.mockReset();
    mocks.getFileReviewCount.mockReset();
    mocks.getOpenReports.mockReset();
    mocks.resolveReport.mockReset();
    mocks.deleteReportedComment.mockResolvedValue(undefined);
    mocks.deleteReportedPost.mockResolvedValue(undefined);
    mocks.getFileReviewCount.mockResolvedValue(3);
    mocks.getAdminDashboardMetrics.mockResolvedValue({
      commentsToday: 9,
      filesNeedReview: 3,
      newUsersToday: 4,
      openReports: 2,
      pageViewsToday: 131,
      postsToday: 7,
      totalComments: 28,
      totalFiles: 6,
      totalPosts: 12,
      totalUsers: 18,
      trafficSourceLabel: 'Local browser tracker',
      visitorsToday: 42,
      recentActivity: [
        {
          id: 'report-report-1',
          kind: 'Report',
          title: 'Reported post',
          detail: 'Report opened',
          createdAt: '2026-06-16T10:30:00.000Z',
          href: '/admin/reports',
        },
        {
          id: 'file-file-1',
          kind: 'File',
          title: 'guide.pdf',
          detail: 'Student uploaded a file',
          createdAt: '2026-06-16T10:15:00.000Z',
          href: '/admin/files',
        },
      ],
    });
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
      {
        id: 'report-2',
        target: { type: 'comment', commentId: 'comment-1' },
        reason: 'This contains private information.',
        status: 'open',
        reporterId: 'user-3',
        resolvedBy: null,
        resolutionNote: null,
        createdAt: '2026-06-15T00:00:00.000Z',
        resolvedAt: null,
        contentTitle: 'Reported comment',
        contentPreview: 'Comment preview',
      },
    ]);
  });

  it('renders traffic and community metrics above the report queue', async () => {
    render(
      <MemoryRouter>
        <AdminPage />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole('heading', { name: 'Admin dashboard' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Visitors today')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Page views today')).toBeInTheDocument();
    expect(screen.getByText('131')).toBeInTheDocument();
    expect(screen.getByText('Total users')).toBeInTheDocument();
    expect(screen.getByText('18')).toBeInTheDocument();
    expect(screen.getByText('Posts today')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    const reportsLink = screen.getByRole('link', { name: /View reports/ });
    expect(reportsLink).toHaveAttribute('href', '/admin/reports');
    expect(within(reportsLink).getByText('2')).toBeInTheDocument();
    const reviewFilesLink = await screen.findByRole('link', {
      name: /View files/,
    });
    expect(reviewFilesLink).toHaveAttribute('href', '/admin/files');
    expect(within(reviewFilesLink).getByText('3')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Manage users' })).toHaveAttribute(
      'href',
      '/admin/users',
    );
    expect(screen.getByRole('heading', { name: 'Recent activity' })).toBeInTheDocument();
    const reportActivity = screen.getByRole('link', { name: /Reported post/ });
    expect(reportActivity).toHaveAttribute('href', '/admin/reports');
    expect(within(reportActivity).getByText('Report')).toBeInTheDocument();
    expect(within(reportActivity).getByText('Report opened')).toBeInTheDocument();
    const fileActivity = screen.getByRole('link', { name: /guide.pdf/ });
    expect(fileActivity).toHaveAttribute('href', '/admin/files');
    expect(screen.queryByText('Moderation queue')).not.toBeInTheDocument();
    expect(
      screen.queryByText('Moderation queue is clear'),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Post preview')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Delete post' }),
    ).not.toBeInTheDocument();
  });

  it('keeps dashboard metric cards compact on mobile widths', async () => {
    render(
      <MemoryRouter>
        <AdminPage />
      </MemoryRouter>,
    );

    const firstMetricsGrid = (
      await screen.findByText('Visitors today')
    ).closest('section');
    const secondMetricsGrid = screen
      .getByText('Comments today')
      .closest('section');

    expect(firstMetricsGrid).toHaveClass('grid-cols-2');
    expect(firstMetricsGrid).toHaveClass('lg:grid-cols-4');
    expect(secondMetricsGrid).toHaveClass('grid-cols-2');
    expect(secondMetricsGrid).toHaveClass('lg:grid-cols-4');
  });
});
