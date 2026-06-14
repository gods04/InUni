import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AdminPage } from './AdminPage';

const { deleteReportedPost, resolveReport } = vi.hoisted(() => ({
  deleteReportedPost: vi.fn().mockResolvedValue(undefined),
  resolveReport: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../lib/adminApi', () => ({
  getOpenReports: vi.fn().mockResolvedValue([
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
  ]),
  deleteReportedPost,
  deleteReportedComment: vi.fn(),
  resolveReport,
}));

describe('AdminPage', () => {
  it('renders the open report queue', async () => {
    render(
      <MemoryRouter>
        <AdminPage />
      </MemoryRouter>,
    );
    expect(await screen.findByText('Reported post')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Delete post' }),
    ).toBeInTheDocument();
  });

  it('resolves a report before deleting its target', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AdminPage />
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

    expect(resolveReport).toHaveBeenCalled();
    expect(deleteReportedPost).toHaveBeenCalled();
    expect(resolveReport.mock.invocationCallOrder[0]).toBeLessThan(
      deleteReportedPost.mock.invocationCallOrder[0],
    );
  });
});
