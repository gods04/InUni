import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getComments, getPost, getPosts } from './forumApi';

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  getPublicUrl: vi.fn((path: string) => ({
    data: { publicUrl: `https://cdn.inuni.test/${path}` },
  })),
  storageFrom: vi.fn(),
}));

vi.mock('./supabase', () => ({
  isSupabaseConfigured: true,
  supabase: {
    from: (...args: unknown[]) => mocks.from(...args),
    storage: {
      from: (...args: unknown[]) => mocks.storageFrom(...args),
    },
  },
}));

interface QueryResult {
  data: unknown;
  error: { message?: string } | null;
}

function createQuery(result: QueryResult = { data: null, error: null }) {
  const query = {
    eq: vi.fn(() => query),
    in: vi.fn(() => query),
    maybeSingle: vi.fn(() => Promise.resolve(result)),
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

const postRow = {
  id: 'post-1',
  title: 'Study plan',
  content: 'How are you preparing?',
  category: 'academics',
  author_id: 'owner-1',
  is_anonymous: false,
  created_at: '2026-06-16T10:00:00.000Z',
};

describe('forumApi Supabase boundary', () => {
  beforeEach(() => {
    mocks.from.mockReset();
    mocks.getPublicUrl.mockClear();
    mocks.storageFrom.mockReset();
    mocks.storageFrom.mockReturnValue({
      getPublicUrl: mocks.getPublicUrl,
    });
  });

  it('loads posts when public profiles do not expose avatar paths yet', async () => {
    const postsQuery = createQuery({ data: [postRow], error: null });
    const profileQuery = createQuery({
      data: null,
      error: { message: 'column public_profiles.avatar_path does not exist' },
    });
    const commentCountQuery = createQuery({ data: [], error: null });
    const fallbackProfileQuery = createQuery({
      data: [
        {
          id: 'owner-1',
          username: 'student',
          display_name: 'Student One',
          is_uct_verified: true,
        },
      ],
      error: null,
    });
    queueQueries(postsQuery, profileQuery, commentCountQuery, fallbackProfileQuery);

    const posts = await getPosts();

    expect(posts).toHaveLength(1);
    expect(posts[0]).toMatchObject({
      authorAvatarUrl: null,
      authorIsUctVerified: true,
      authorName: 'Student One',
      commentCount: 0,
      title: 'Study plan',
    });
    expect(profileQuery.select).toHaveBeenCalledWith(
      'id, username, display_name, avatar_path, is_uct_verified',
    );
    expect(fallbackProfileQuery.select).toHaveBeenCalledWith(
      'id, username, display_name, is_uct_verified',
    );
    expect(mocks.storageFrom).not.toHaveBeenCalled();
  });

  it('shows curated UCT seed posts when the production forum is still empty', async () => {
    const postsQuery = createQuery({ data: [], error: null });
    queueQueries(postsQuery);

    const posts = await getPosts();

    expect(posts.length).toBeGreaterThan(3);
    expect(
      posts.find(
        (post) =>
          post.title ===
          'Exam study spaces: what is actually calm late at night?',
      ),
    ).toMatchObject({
      category: 'Study',
      title: 'Exam study spaces: what is actually calm late at night?',
      authorName: 'yxxche006',
      authorIsUctVerified: true,
    });
    expect(posts.some((post) => post.category === 'Campus Life')).toBe(true);
    expect(posts.some((post) => post.category === 'Questions')).toBe(true);
  });

  it('filters curated seed posts by category when the production forum is empty', async () => {
    const postsQuery = createQuery({ data: [], error: null });
    queueQueries(postsQuery);

    const posts = await getPosts('Questions');

    expect(posts.length).toBeGreaterThan(0);
    expect(posts.every((post) => post.category === 'Questions')).toBe(true);
  });

  it('opens curated seed post details and comments when the database has no matching row', async () => {
    const postQuery = createQuery({ data: null, error: null });
    const commentsQuery = createQuery({ data: [], error: null });
    queueQueries(postQuery, commentsQuery);

    const post = await getPost('11111111-1111-4111-8111-111111111111');
    const comments = await getComments('11111111-1111-4111-8111-111111111111');

    expect(post).toMatchObject({
      id: '11111111-1111-4111-8111-111111111111',
      title: 'Exam study spaces: what is actually calm late at night?',
      commentCount: 2,
    });
    expect(comments).toHaveLength(2);
    expect(comments[0]).toMatchObject({
      authorName: 'orange',
      content: expect.stringContaining('Baxter'),
    });
  });
});
