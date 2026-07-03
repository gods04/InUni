import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createComment,
  createPost,
  deletePost,
  getComments,
  getPost,
  getPosts,
  updatePost,
} from './forumApi';
import type { ForumUser } from '../types/forum';

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
  error: { code?: string; message?: string } | null;
}

function createQuery(result: QueryResult = { data: null, error: null }) {
  const query = {
    eq: vi.fn(() => query),
    delete: vi.fn(() => query),
    in: vi.fn(() => query),
    insert: vi.fn(() => query),
    like: vi.fn(() => query),
    maybeSingle: vi.fn(() => Promise.resolve(result)),
    order: vi.fn(() => query),
    select: vi.fn(() => query),
    single: vi.fn(() => Promise.resolve(result)),
    update: vi.fn(() => query),
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
  updated_at: '2026-06-16T10:00:00.000Z',
};

const user: ForumUser = {
  id: 'user-1',
  email: 'orange@uct.ac.za',
  emailConfirmed: true,
  profile: {
    id: 'user-1',
    username: 'orange',
    displayName: 'orange',
    role: 'student',
    isBanned: false,
    banReason: null,
    isUctVerified: false,
    createdAt: '2026-06-16T00:00:00.000Z',
  },
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

  it('loads posts with generated slugs when the slug migration has not been applied yet', async () => {
    const postsQuery = createQuery({
      data: null,
      error: { code: '42703', message: 'column posts.slug does not exist' },
    });
    const legacyPostsQuery = createQuery({ data: [postRow], error: null });
    const profileQuery = createQuery({
      data: [
        {
          id: 'owner-1',
          username: 'student',
          display_name: 'Student One',
          avatar_path: null,
          is_uct_verified: true,
        },
      ],
      error: null,
    });
    const commentCountQuery = createQuery({ data: [], error: null });
    queueQueries(postsQuery, legacyPostsQuery, profileQuery, commentCountQuery);

    const posts = await getPosts();
    const post = posts.find((item) => item.id === 'post-1');

    expect(post).toMatchObject({
      id: 'post-1',
      slug: 'study-plan',
      title: 'Study plan',
    });
    expect(legacyPostsQuery.select).toHaveBeenCalledWith(
      'id, title, content, category, author_id, is_anonymous, created_at, updated_at',
    );
  });

  it('does not create virtual seeded posts when Supabase has no posts', async () => {
    const postsQuery = createQuery({ data: [], error: null });
    queueQueries(postsQuery);

    const posts = await getPosts();

    expect(posts).toEqual([]);
  });

  it('returns no virtual details or comments for missing seed rows', async () => {
    const postQuery = createQuery({ data: null, error: null });
    const commentsQuery = createQuery({ data: [], error: null });
    queueQueries(postQuery, commentsQuery);

    const post = await getPost('engineering-handbook-where-do-i-check-course-rules');
    const comments = await getComments('99999999-9999-4999-8999-999999999991');

    expect(post).toBeNull();
    expect(comments).toEqual([]);
  });

  it('creates comments on migrated seed post ids through Supabase', async () => {
    const insertQuery = createQuery({
      data: {
        id: 'comment-1',
        post_id: '99999999-9999-4999-8999-999999999991',
        author_id: 'user-1',
        content: 'This can be commented on now.',
        created_at: '2026-07-03T10:00:00.000Z',
      },
      error: null,
    });
    const profileQuery = createQuery({
      data: [
        {
          id: 'user-1',
          username: 'orange',
          display_name: 'orange',
          avatar_path: null,
          is_uct_verified: false,
        },
      ],
      error: null,
    });
    queueQueries(insertQuery, profileQuery);

    const comment = await createComment(
      {
        postId: '99999999-9999-4999-8999-999999999991',
        content: 'This can be commented on now.',
      },
      user,
    );

    expect(insertQuery.insert).toHaveBeenCalledWith({
      post_id: '99999999-9999-4999-8999-999999999991',
      author_id: 'user-1',
      content: 'This can be commented on now.',
    });
    expect(comment).toMatchObject({
      authorName: 'orange',
      content: 'This can be commented on now.',
      postId: '99999999-9999-4999-8999-999999999991',
    });
  });

  it('creates posts against legacy databases before the slug migration is applied', async () => {
    const existingSlugsQuery = createQuery({
      data: null,
      error: { code: '42703', message: 'column posts.slug does not exist' },
    });
    const insertWithSlugQuery = createQuery({
      data: null,
      error: {
        message: "Could not find the 'slug' column of 'posts' in the schema cache",
      },
    });
    const legacyInsertQuery = createQuery({
      data: { id: 'post-1' },
      error: null,
    });
    const loadPostQuery = createQuery({
      data: {
        ...postRow,
        id: 'post-1',
        title: 'New UCT question',
      },
      error: null,
    });
    const profileQuery = createQuery({
      data: [
        {
          id: 'owner-1',
          username: 'student',
          display_name: 'Student One',
          avatar_path: null,
          is_uct_verified: true,
        },
      ],
      error: null,
    });
    const commentCountQuery = createQuery({ data: [], error: null });
    queueQueries(
      existingSlugsQuery,
      insertWithSlugQuery,
      legacyInsertQuery,
      loadPostQuery,
      profileQuery,
      commentCountQuery,
    );

    const post = await createPost(
      {
        title: 'New UCT question',
        content: 'Where should I ask?',
        category: 'Questions',
        isAnonymous: false,
      },
      user,
    );

    expect(insertWithSlugQuery.insert).toHaveBeenCalledWith(
      expect.objectContaining({ slug: 'new-uct-question' }),
    );
    const legacyInsertCalls = legacyInsertQuery.insert.mock.calls as unknown[][];
    const legacyPayload = legacyInsertCalls[0]?.[0] as
      | Record<string, unknown>
      | undefined;

    expect(legacyPayload).toBeDefined();
    expect(legacyPayload).not.toHaveProperty('slug');
    expect(post).toMatchObject({
      id: 'post-1',
      slug: 'new-uct-question',
      title: 'New UCT question',
    });
  });

  it('creates duplicate-titled posts with incrementing slug suffixes', async () => {
    const existingSlugsQuery = createQuery({
      data: [
        {
          id: 'existing-post-1',
          slug: 'new-uct-question',
          title: 'New UCT question',
        },
        {
          id: 'existing-post-2',
          slug: 'new-uct-question-2',
          title: 'New UCT question',
        },
      ],
      error: null,
    });
    const insertQuery = createQuery({
      data: { id: 'post-3' },
      error: null,
    });
    const loadPostQuery = createQuery({
      data: {
        ...postRow,
        id: 'post-3',
        slug: 'new-uct-question-3',
        title: 'New UCT question',
      },
      error: null,
    });
    const profileQuery = createQuery({
      data: [
        {
          id: 'owner-1',
          username: 'student',
          display_name: 'Student One',
          avatar_path: null,
          is_uct_verified: true,
        },
      ],
      error: null,
    });
    const commentCountQuery = createQuery({ data: [], error: null });
    queueQueries(
      existingSlugsQuery,
      insertQuery,
      loadPostQuery,
      profileQuery,
      commentCountQuery,
    );

    const post = await createPost(
      {
        title: 'New UCT question',
        content: 'Where should I ask?',
        category: 'Questions',
        isAnonymous: false,
      },
      user,
    );

    expect(existingSlugsQuery.like).toHaveBeenCalledWith(
      'slug',
      'new-uct-question%',
    );
    expect(insertQuery.insert).toHaveBeenCalledWith(
      expect.objectContaining({ slug: 'new-uct-question-3' }),
    );
    expect(post).toMatchObject({
      id: 'post-3',
      slug: 'new-uct-question-3',
    });
  });

  it('updates posts through the current author boundary and maps edited time', async () => {
    const existingSlugsQuery = createQuery({ data: [], error: null });
    const updateQuery = createQuery({
      data: {
        ...postRow,
        author_id: 'user-1',
        title: 'Updated title',
        content: 'Updated content',
        category: 'Questions',
        is_anonymous: true,
        updated_at: '2026-06-16T11:00:00.000Z',
      },
      error: null,
    });
    const profileQuery = createQuery({
      data: [
        {
          id: 'user-1',
          username: 'orange',
          display_name: 'orange',
          avatar_path: null,
          is_uct_verified: false,
        },
      ],
      error: null,
    });
    const commentCountQuery = createQuery({ data: [], error: null });
    queueQueries(existingSlugsQuery, updateQuery, profileQuery, commentCountQuery);

    const post = await updatePost(
      'post-1',
      {
        title: 'Updated title',
        content: 'Updated content',
        category: 'Questions',
        isAnonymous: true,
      },
      user,
    );

    expect(updateQuery.update).toHaveBeenCalledWith({
      title: 'Updated title',
      slug: 'updated-title',
      content: 'Updated content',
      category: 'Questions',
      is_anonymous: true,
    });
    expect(updateQuery.eq).toHaveBeenCalledWith('id', 'post-1');
    expect(updateQuery.eq).toHaveBeenCalledWith('author_id', 'user-1');
    expect(post).toMatchObject({
      id: 'post-1',
      title: 'Updated title',
      updatedAt: '2026-06-16T11:00:00.000Z',
    });
  });

  it('updates posts with a suffix when the new title collides with another post', async () => {
    const existingSlugsQuery = createQuery({
      data: [
        {
          id: 'other-post',
          slug: 'updated-title',
          title: 'Updated title',
        },
      ],
      error: null,
    });
    const updateQuery = createQuery({
      data: {
        ...postRow,
        author_id: 'user-1',
        slug: 'updated-title-2',
        title: 'Updated title',
        content: 'Updated content',
        category: 'Questions',
        is_anonymous: true,
        updated_at: '2026-06-16T11:00:00.000Z',
      },
      error: null,
    });
    const profileQuery = createQuery({
      data: [
        {
          id: 'user-1',
          username: 'orange',
          display_name: 'orange',
          avatar_path: null,
          is_uct_verified: false,
        },
      ],
      error: null,
    });
    const commentCountQuery = createQuery({ data: [], error: null });
    queueQueries(existingSlugsQuery, updateQuery, profileQuery, commentCountQuery);

    const post = await updatePost(
      'post-1',
      {
        title: 'Updated title',
        content: 'Updated content',
        category: 'Questions',
        isAnonymous: true,
      },
      user,
    );

    expect(updateQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({ slug: 'updated-title-2' }),
    );
    expect(post).toMatchObject({
      id: 'post-1',
      slug: 'updated-title-2',
    });
  });

  it('deletes posts through the current author boundary', async () => {
    const deleteQuery = createQuery({ data: null, error: null });
    queueQueries(deleteQuery);

    await deletePost('post-1', user);

    expect(deleteQuery.delete).toHaveBeenCalled();
    expect(deleteQuery.eq).toHaveBeenCalledWith('id', 'post-1');
    expect(deleteQuery.eq).toHaveBeenCalledWith('author_id', 'user-1');
  });
});
