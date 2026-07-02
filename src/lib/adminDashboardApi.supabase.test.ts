import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getAdminDashboardMetrics } from './adminDashboardApi';

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  getFileReviewCount: vi.fn(),
  getLocalTrafficSnapshot: vi.fn(),
  getOpenReports: vi.fn(),
}));

vi.mock('./supabase', () => ({
  isSupabaseConfigured: true,
  supabase: {
    from: (...args: unknown[]) => mocks.from(...args),
  },
}));

vi.mock('./adminApi', () => ({
  getOpenReports: (...args: unknown[]) => mocks.getOpenReports(...args),
}));

vi.mock('./adminFileApi', () => ({
  getFileReviewCount: (...args: unknown[]) =>
    mocks.getFileReviewCount(...args),
}));

vi.mock('./localAnalytics', () => ({
  getLocalTrafficSnapshot: (...args: unknown[]) =>
    mocks.getLocalTrafficSnapshot(...args),
}));

interface QueryResult {
  count?: number | null;
  data: unknown;
  error: { code?: string; message?: string } | null;
}

function createQuery(result: QueryResult = { data: null, error: null }) {
  const query = {
    gte: vi.fn(() => query),
    limit: vi.fn(() => query),
    order: vi.fn(() => query),
    select: vi.fn(() => query),
    then: (
      resolve: (value: QueryResult) => unknown,
      reject: (reason: unknown) => unknown,
    ) => Promise.resolve(result).then(resolve, reject),
  };

  return query;
}

function queueQueries(...queries: ReturnType<typeof createQuery>[]) {
  mocks.from.mockImplementation(() => {
    const nextQuery = queries.shift();
    if (!nextQuery) throw new Error('Unexpected Supabase query');
    return nextQuery;
  });
}

function countQuery(count: number) {
  return createQuery({ count, data: null, error: null });
}

describe('adminDashboardApi Supabase boundary', () => {
  beforeEach(() => {
    mocks.from.mockReset();
    mocks.getFileReviewCount.mockReset();
    mocks.getLocalTrafficSnapshot.mockReset();
    mocks.getOpenReports.mockReset();
    mocks.getFileReviewCount.mockResolvedValue(0);
    mocks.getLocalTrafficSnapshot.mockReturnValue({
      pageViewsToday: 12,
      trafficSourceLabel: 'local browser',
      visitorsToday: 3,
    });
    mocks.getOpenReports.mockResolvedValue([]);
  });

  it('loads recent posts when the slug migration has not reached Supabase yet', async () => {
    const totalUsersQuery = countQuery(4);
    const newUsersTodayQuery = countQuery(1);
    const totalPostsQuery = countQuery(2);
    const postsTodayQuery = countQuery(1);
    const totalCommentsQuery = countQuery(3);
    const commentsTodayQuery = countQuery(1);
    const totalFilesQuery = countQuery(5);
    const postsWithSlugQuery = createQuery({
      data: null,
      error: { code: '42703', message: 'column posts.slug does not exist' },
    });
    const commentsQuery = createQuery({ data: [], error: null });
    const profilesQuery = createQuery({ data: [], error: null });
    const filesQuery = createQuery({ data: [], error: null });
    const legacyPostsQuery = createQuery({
      data: [
        {
          id: 'post-1',
          title: 'Study plan',
          category: 'Questions',
          created_at: '2026-07-02T10:00:00.000Z',
        },
      ],
      error: null,
    });

    queueQueries(
      totalUsersQuery,
      newUsersTodayQuery,
      totalPostsQuery,
      postsTodayQuery,
      totalCommentsQuery,
      commentsTodayQuery,
      totalFilesQuery,
      postsWithSlugQuery,
      commentsQuery,
      profilesQuery,
      filesQuery,
      legacyPostsQuery,
    );

    const metrics = await getAdminDashboardMetrics();

    expect(postsWithSlugQuery.select).toHaveBeenCalledWith(
      'id, slug, title, category, created_at',
    );
    expect(legacyPostsQuery.select).toHaveBeenCalledWith(
      'id, title, category, created_at',
    );
    expect(metrics.recentActivity[0]).toMatchObject({
      href: '/post/study-plan',
      kind: 'Post',
      title: 'Study plan',
    });
  });
});
