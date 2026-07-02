import {
  getCuratedSeedComments,
  getCuratedSeedPost,
  getCuratedSeedPosts,
  isCuratedSeedPostId,
} from './curatedSeedForum';
import { mockForumStore } from './mockStore';
import { getPostSlug, isUuidPostIdentifier, slugifyPostTitle } from './postSlug';
import { isSupabaseConfigured, supabase } from './supabase';
import {
  isMissingAvatarPathError,
  isMissingPostSlugError,
} from './supabaseCompat';
import type {
  Category,
  ForumComment,
  ForumUser,
  NewCommentInput,
  NewPostInput,
  Post,
  ReportTarget,
  UpdatePostInput,
} from '../types/forum';

interface ProfileRow {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_path: string | null;
  is_uct_verified: boolean;
}

interface PostRow {
  id: string;
  slug?: string | null;
  title: string;
  content: string;
  category: Category;
  author_id: string;
  is_anonymous: boolean;
  created_at: string;
  updated_at: string | null;
}

interface CommentRow {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
}

const publicProfileSelectWithAvatar =
  'id, username, display_name, avatar_path, is_uct_verified';
const publicProfileSelectWithoutAvatar =
  'id, username, display_name, is_uct_verified';
const postSelectWithSlug =
  'id, slug, title, content, category, author_id, is_anonymous, created_at, updated_at';
const postSelectWithoutSlug =
  'id, title, content, category, author_id, is_anonymous, created_at, updated_at';
const postSelect = postSelectWithSlug;

function requireSupabase() {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  return supabase;
}

function getAuthorName(row: PostRow, profile?: ProfileRow): string {
  if (row.is_anonymous) {
    return 'Anonymous';
  }

  return profile?.display_name || profile?.username || 'Student';
}

function getAvatarUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('data:') || path.startsWith('http')) return path;
  const client = requireSupabase();
  return client.storage.from('inuni-avatars').getPublicUrl(path).data.publicUrl;
}

async function getProfilesMap(userIds: string[]): Promise<Map<string, ProfileRow>> {
  const client = requireSupabase();
  const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));

  if (uniqueIds.length === 0) {
    return new Map();
  }

  const { data, error } = await client
    .from('public_profiles')
    .select(publicProfileSelectWithAvatar)
    .in('id', uniqueIds);

  if (error) {
    if (!isMissingAvatarPathError(error)) {
      throw new Error(error.message);
    }

    const fallback = await client
      .from('public_profiles')
      .select(publicProfileSelectWithoutAvatar)
      .in('id', uniqueIds);

    if (fallback.error) {
      throw new Error(fallback.error.message);
    }

    return new Map(
      ((fallback.data ?? []) as Omit<ProfileRow, 'avatar_path'>[]).map(
        (profile) => [
          profile.id,
          {
            ...profile,
            avatar_path: null,
          },
        ],
      ),
    );
  }

  return new Map((data ?? []).map((profile) => [profile.id, profile as ProfileRow]));
}

async function getCommentCounts(postIds: string[]): Promise<Map<string, number>> {
  const client = requireSupabase();
  const counts = new Map<string, number>();

  if (postIds.length === 0) {
    return counts;
  }

  const { data, error } = await client.from('comments').select('post_id').in('post_id', postIds);

  if (error) {
    throw new Error(error.message);
  }

  for (const row of (data ?? []) as Array<{ post_id: string }>) {
    counts.set(row.post_id, (counts.get(row.post_id) ?? 0) + 1);
  }

  return counts;
}

function mapPost(row: PostRow, profile: ProfileRow | undefined, commentCount: number): Post {
  return {
    id: row.id,
    slug: row.slug || slugifyPostTitle(row.title),
    title: row.title,
    content: row.content,
    category: row.category,
    authorId: row.author_id,
    authorName: getAuthorName(row, profile),
    authorAvatarUrl: row.is_anonymous ? null : getAvatarUrl(profile?.avatar_path),
    authorIsUctVerified: profile?.is_uct_verified ?? false,
    isAnonymous: row.is_anonymous,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    commentCount,
  };
}

function mergeWithCuratedSeedPosts(posts: Post[], category?: Category): Post[] {
  const postIds = new Set(posts.map((post) => post.id));
  const seedPosts = getCuratedSeedPosts(category).filter(
    (post) => !postIds.has(post.id),
  );

  return [...posts, ...seedPosts].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
}

function mapComment(row: CommentRow, profile: ProfileRow | undefined): ForumComment {
  return {
    id: row.id,
    postId: row.post_id,
    authorId: row.author_id,
    authorName: profile?.display_name || profile?.username || 'Student',
    authorAvatarUrl: getAvatarUrl(profile?.avatar_path),
    authorIsUctVerified: profile?.is_uct_verified ?? false,
    content: row.content,
    createdAt: row.created_at,
  };
}

async function getPostRows(category?: Category): Promise<PostRow[]> {
  const client = requireSupabase();
  const query = client
    .from('posts')
    .select(postSelectWithSlug)
    .order('created_at', { ascending: false });

  const result = category ? await query.eq('category', category) : await query;

  if (result.error && isMissingPostSlugError(result.error)) {
    const fallbackQuery = client
      .from('posts')
      .select(postSelectWithoutSlug)
      .order('created_at', { ascending: false });
    const fallbackResult = category
      ? await fallbackQuery.eq('category', category)
      : await fallbackQuery;

    if (fallbackResult.error) {
      throw new Error(fallbackResult.error.message);
    }

    return (fallbackResult.data ?? []) as PostRow[];
  }

  if (result.error) {
    throw new Error(result.error.message);
  }

  return (result.data ?? []) as PostRow[];
}

async function getPostRowById(postId: string): Promise<PostRow | null> {
  const client = requireSupabase();
  const result = await client
    .from('posts')
    .select(postSelectWithSlug)
    .eq('id', postId)
    .maybeSingle();

  if (result.error && isMissingPostSlugError(result.error)) {
    const fallbackResult = await client
      .from('posts')
      .select(postSelectWithoutSlug)
      .eq('id', postId)
      .maybeSingle();

    if (fallbackResult.error) {
      throw new Error(fallbackResult.error.message);
    }

    return (fallbackResult.data as PostRow | null) ?? null;
  }

  if (result.error) {
    throw new Error(result.error.message);
  }

  return (result.data as PostRow | null) ?? null;
}

export async function getPosts(category?: Category): Promise<Post[]> {
  if (!isSupabaseConfigured) {
    return mockForumStore.getPosts(category);
  }

  const rows = await getPostRows(category);

  if (rows.length === 0) {
    return getCuratedSeedPosts(category);
  }

  const [profiles, commentCounts] = await Promise.all([
    getProfilesMap(rows.map((row) => row.author_id)),
    getCommentCounts(rows.map((row) => row.id)),
  ]);

  const posts = rows.map((row) =>
    mapPost(row, profiles.get(row.author_id), commentCounts.get(row.id) ?? 0),
  );

  return mergeWithCuratedSeedPosts(posts, category);
}

export async function getPost(postIdentifier: string): Promise<Post | null> {
  if (!isSupabaseConfigured) {
    return mockForumStore.getPost(postIdentifier);
  }

  if (!isUuidPostIdentifier(postIdentifier)) {
    const client = requireSupabase();
    const result = await client
      .from('posts')
      .select(postSelectWithSlug)
      .eq('slug', postIdentifier)
      .maybeSingle();

    if (result.error && isMissingPostSlugError(result.error)) {
      const posts = await getPosts();
      return (
        posts.find((post) => getPostSlug(post) === postIdentifier) ??
        getCuratedSeedPost(postIdentifier)
      );
    }

    if (result.error) {
      throw new Error(result.error.message);
    }

    if (!result.data) {
      return getCuratedSeedPost(postIdentifier);
    }

    const row = result.data as PostRow;
    const [profiles, commentCounts] = await Promise.all([
      getProfilesMap([row.author_id]),
      getCommentCounts([row.id]),
    ]);

    return mapPost(row, profiles.get(row.author_id), commentCounts.get(row.id) ?? 0);
  }

  const row = await getPostRowById(postIdentifier);

  if (!row) {
    return getCuratedSeedPost(postIdentifier);
  }

  const [profiles, commentCounts] = await Promise.all([
    getProfilesMap([row.author_id]),
    getCommentCounts([row.id]),
  ]);

  return mapPost(row, profiles.get(row.author_id), commentCounts.get(row.id) ?? 0);
}

export async function getComments(postId: string): Promise<ForumComment[]> {
  if (!isSupabaseConfigured) {
    return mockForumStore.getComments(postId);
  }

  const client = requireSupabase();
  const { data, error } = await client
    .from('comments')
    .select('id, post_id, author_id, content, created_at')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as CommentRow[];

  if (rows.length === 0 && getCuratedSeedPost(postId)) {
    return getCuratedSeedComments(postId);
  }

  const profiles = await getProfilesMap(rows.map((row) => row.author_id));

  return rows.map((row) => mapComment(row, profiles.get(row.author_id)));
}

export async function createPost(input: NewPostInput, user: ForumUser): Promise<Post> {
  if (!isSupabaseConfigured) {
    return mockForumStore.createPost(input, user);
  }

  const client = requireSupabase();
  let result = await client
    .from('posts')
    .insert({
      author_id: user.id,
      title: input.title,
      slug: slugifyPostTitle(input.title),
      content: input.content,
      category: input.category,
      is_anonymous: input.isAnonymous,
    })
    .select('id')
    .single();

  if (result.error && isMissingPostSlugError(result.error)) {
    result = await client
      .from('posts')
      .insert({
        author_id: user.id,
        title: input.title,
        content: input.content,
        category: input.category,
        is_anonymous: input.isAnonymous,
      })
      .select('id')
      .single();
  }

  if (result.error) {
    throw new Error(result.error.message);
  }

  const post = await getPost((result.data as { id: string }).id);
  if (!post) {
    throw new Error('Post was created but could not be loaded.');
  }

  return post;
}

export async function updatePost(
  postId: string,
  input: UpdatePostInput,
  user: ForumUser,
): Promise<Post> {
  if (!isSupabaseConfigured) {
    return mockForumStore.updatePost(postId, input, user);
  }

  if (isCuratedSeedPostId(postId)) {
    throw new Error('Starter posts are read-only.');
  }

  const client = requireSupabase();
  let result = await client
    .from('posts')
    .update({
      title: input.title,
      slug: slugifyPostTitle(input.title),
      content: input.content,
      category: input.category,
      is_anonymous: input.isAnonymous,
    })
    .eq('id', postId)
    .eq('author_id', user.id)
    .select(postSelect)
    .maybeSingle();

  if (result.error && isMissingPostSlugError(result.error)) {
    result = await client
      .from('posts')
      .update({
        title: input.title,
        content: input.content,
        category: input.category,
        is_anonymous: input.isAnonymous,
      })
      .eq('id', postId)
      .eq('author_id', user.id)
      .select(postSelectWithoutSlug)
      .maybeSingle();
  }

  if (result.error) {
    throw new Error(result.error.message);
  }

  if (!result.data) {
    throw new Error('You can only edit posts you created.');
  }

  const row = result.data as PostRow;
  const [profiles, commentCounts] = await Promise.all([
    getProfilesMap([row.author_id]),
    getCommentCounts([row.id]),
  ]);

  return mapPost(row, profiles.get(row.author_id), commentCounts.get(row.id) ?? 0);
}

export async function deletePost(postId: string, user: ForumUser): Promise<void> {
  if (!isSupabaseConfigured) {
    return mockForumStore.deletePost(postId, user);
  }

  if (isCuratedSeedPostId(postId)) {
    throw new Error('Starter posts are read-only.');
  }

  const client = requireSupabase();
  const { error } = await client
    .from('posts')
    .delete()
    .eq('id', postId)
    .eq('author_id', user.id);

  if (error) {
    throw new Error(error.message);
  }
}

export async function createComment(input: NewCommentInput, user: ForumUser): Promise<ForumComment> {
  if (!isSupabaseConfigured) {
    return mockForumStore.createComment(input, user);
  }

  if (isCuratedSeedPostId(input.postId)) {
    throw new Error(
      'Starter posts are read-only. Create a new post to continue this conversation.',
    );
  }

  const client = requireSupabase();
  const { data, error } = await client
    .from('comments')
    .insert({
      post_id: input.postId,
      author_id: user.id,
      content: input.content,
    })
    .select('id, post_id, author_id, content, created_at')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const row = data as CommentRow;
  const profiles = await getProfilesMap([row.author_id]);
  return mapComment(row, profiles.get(row.author_id));
}

export async function createReport(
  target: ReportTarget,
  reason: string,
  user: ForumUser,
): Promise<void> {
  if (!isSupabaseConfigured) {
    return mockForumStore.createReport(target, reason, user);
  }

  const client = requireSupabase();
  const { error } = await client.from('reports').insert({
    reporter_id: user.id,
    post_id: target.type === 'post' ? target.postId : null,
    comment_id: target.type === 'comment' ? target.commentId : null,
    reason: reason.trim(),
  });

  if (error) {
    if (error.code === '23505') {
      throw new Error('You have already reported this content.');
    }
    throw new Error(error.message);
  }
}

export async function getUserPosts(userId: string): Promise<Post[]> {
  if (!isSupabaseConfigured) {
    return mockForumStore.getUserPosts(userId);
  }

  const client = requireSupabase();
  const result = await client
    .from('posts')
    .select(postSelectWithSlug)
    .eq('author_id', userId)
    .order('created_at', { ascending: false });

  if (result.error && isMissingPostSlugError(result.error)) {
    const fallbackResult = await client
      .from('posts')
      .select(postSelectWithoutSlug)
      .eq('author_id', userId)
      .order('created_at', { ascending: false });

    if (fallbackResult.error) {
      throw new Error(fallbackResult.error.message);
    }

    const rows = (fallbackResult.data ?? []) as PostRow[];
    const [profiles, commentCounts] = await Promise.all([
      getProfilesMap(rows.map((row) => row.author_id)),
      getCommentCounts(rows.map((row) => row.id)),
    ]);

    return rows.map((row) =>
      mapPost(row, profiles.get(row.author_id), commentCounts.get(row.id) ?? 0),
    );
  }

  if (result.error) {
    throw new Error(result.error.message);
  }

  const rows = (result.data ?? []) as PostRow[];
  const [profiles, commentCounts] = await Promise.all([
    getProfilesMap(rows.map((row) => row.author_id)),
    getCommentCounts(rows.map((row) => row.id)),
  ]);

  return rows.map((row) =>
    mapPost(row, profiles.get(row.author_id), commentCounts.get(row.id) ?? 0),
  );
}
