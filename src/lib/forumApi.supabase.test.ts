import { beforeEach, describe, expect, it, vi } from 'vitest';
import { curatedSeedComments } from './curatedSeedForum';
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

function extractUrls(text: string): string[] {
  return text.match(/https?:\/\/\S+/g) ?? [];
}

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
    const post = posts.find((item) => item.id === 'post-1');

    expect(post).toMatchObject({
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
      authorName: 'Maya',
      authorIsUctVerified: false,
    });
    expect(posts.some((post) => post.category === 'Campus Life')).toBe(true);
    expect(posts.some((post) => post.category === 'Questions')).toBe(true);
  });

  it('keeps curated seed posts visible after real posts are created', async () => {
    const postsQuery = createQuery({
      data: [
        {
          id: 'real-post-1',
          title: 'lonely as fuck',
          content: 'im looking for a partner because im lonely',
          category: 'Campus Life',
          author_id: 'real-user-1',
          is_anonymous: false,
          created_at: '2026-06-27T10:00:00.000Z',
        },
      ],
      error: null,
    });
    const profileQuery = createQuery({
      data: [
        {
          id: 'real-user-1',
          username: 'ur-dad',
          display_name: 'ur dad',
          avatar_path: null,
          is_uct_verified: false,
        },
      ],
      error: null,
    });
    const commentCountQuery = createQuery({ data: [], error: null });
    queueQueries(postsQuery, profileQuery, commentCountQuery);

    const posts = await getPosts();

    expect(posts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'real-post-1',
          title: 'lonely as fuck',
        }),
        expect.objectContaining({
          id: '99999999-9999-4999-8999-999999999991',
          title: 'Engineering handbook: where do I check course rules?',
        }),
        expect.objectContaining({
          id: '99999999-9999-4999-8999-999999999992',
          title: 'Commerce handbook link for BCom and BBusSc',
        }),
      ]),
    );
    expect(posts[0]).toMatchObject({
      id: 'real-post-1',
      authorName: 'ur dad',
      commentCount: 0,
    });
  });

  it('keeps curated seed authors fictional and avoids third-party source traces', async () => {
    const postsQuery = createQuery({ data: [], error: null });
    queueQueries(postsQuery);

    const posts = await getPosts();
    const forbiddenAuthorNames = [
      'chenxianjian9',
      'orange',
      'yxxche006',
    ];
    const forbiddenAuthorIds = [
      'a32e236a-a142-46c9-acab-c09a282e022a',
      'b28fdf5b-bc1c-4d94-b111-72a44a21363c',
      'd2efbdca-986e-4bce-a0a9-1e0b7d3cde6d',
      '323bc38c-75d0-4f9b-aefc-466c0aa61f96',
    ];
    const forbiddenCopyPattern = /Source:|Sources:|Instagram|Facebook|Reddit|u\//i;

    expect(posts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ authorName: 'Maya' }),
        expect.objectContaining({ authorName: 'Jeff' }),
        expect.objectContaining({ authorName: 'Bob' }),
      ]),
    );
    expect(
      posts.some((post) => forbiddenAuthorNames.includes(post.authorName)),
    ).toBe(false);
    expect(
      posts.some((post) => forbiddenAuthorIds.includes(post.authorId)),
    ).toBe(false);
    expect(posts.some((post) => forbiddenCopyPattern.test(post.content))).toBe(
      false,
    );
    expect(
      posts.flatMap((post) => extractUrls(post.content)).every((url) =>
        url.startsWith('https://uct.ac.za/'),
      ),
    ).toBe(true);
    expect(
      posts.flatMap((post) => extractUrls(post.content)).some((url) =>
        url.includes('/uct_ac_za/405/'),
      ),
    ).toBe(false);
    expect(posts.every((post) => !post.authorIsUctVerified)).toBe(true);
    expect(
      curatedSeedComments.some((comment) =>
        forbiddenAuthorIds.includes(comment.authorId),
      ),
    ).toBe(false);
    expect(
      curatedSeedComments.every((comment) => !comment.authorIsUctVerified),
    ).toBe(true);
  });

  it('includes public UCT handbook resource posts for Engineering and Commerce', async () => {
    const postsQuery = createQuery({ data: [], error: null });
    queueQueries(postsQuery);

    const posts = await getPosts('General');
    const engineering = posts.find(
      (post) =>
        post.title === 'Engineering handbook: where do I check course rules?',
    );
    const commerce = posts.find(
      (post) => post.title === 'Commerce handbook link for BCom and BBusSc',
    );

    expect(engineering).toMatchObject({
      category: 'General',
      authorName: 'Maya',
      isAnonymous: false,
    });
    expect(engineering?.content).toContain(
      'https://uct.ac.za/sites/default/files/media/documents/2026-ebe-handbook-7a-final-web.pdf',
    );
    expect(engineering?.content).toContain(
      'https://uct.ac.za/students/prospective-students/undergraduate-prospectus',
    );

    expect(commerce).toMatchObject({
      category: 'General',
      authorName: 'Jeff',
      isAnonymous: false,
    });
    expect(commerce?.content).toContain(
      'https://uct.ac.za/sites/default/files/media/documents/2026-commerce-handbook-6a-final-web.pdf',
    );
    expect(commerce?.content).toContain(
      'https://uct.ac.za/students/prospective-students/undergraduate-prospectus',
    );
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
      authorName: 'Lena',
      content: expect.stringContaining('Baxter'),
    });
    expect(
      comments.some((comment) =>
        ['chenxianjian9', 'orange', 'yxxche006'].includes(comment.authorName),
      ),
    ).toBe(false);
  });
});
