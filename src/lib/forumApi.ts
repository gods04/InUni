import { mockForumStore } from './mockStore';
import { isSupabaseConfigured, supabase } from './supabase';
import type {
  Category,
  ForumComment,
  ForumUser,
  NewCommentInput,
  NewPostInput,
  Post,
  ReportInput,
} from '../types/forum';

interface ProfileRow {
  id: string;
  username: string | null;
  display_name: string | null;
  is_uct_verified: boolean;
}

interface PostRow {
  id: string;
  title: string;
  content: string;
  category: Category;
  author_id: string;
  is_anonymous: boolean;
  created_at: string;
}

interface CommentRow {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
}

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

async function getProfilesMap(userIds: string[]): Promise<Map<string, ProfileRow>> {
  const client = requireSupabase();
  const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));

  if (uniqueIds.length === 0) {
    return new Map();
  }

  const { data, error } = await client
    .from('public_profiles')
    .select('id, username, display_name, is_uct_verified')
    .in('id', uniqueIds);

  if (error) {
    throw new Error(error.message);
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
    title: row.title,
    content: row.content,
    category: row.category,
    authorId: row.author_id,
    authorName: getAuthorName(row, profile),
    authorIsUctVerified: profile?.is_uct_verified ?? false,
    isAnonymous: row.is_anonymous,
    createdAt: row.created_at,
    commentCount,
  };
}

function mapComment(row: CommentRow, profile: ProfileRow | undefined): ForumComment {
  return {
    id: row.id,
    postId: row.post_id,
    authorId: row.author_id,
    authorName: profile?.display_name || profile?.username || 'Student',
    authorIsUctVerified: profile?.is_uct_verified ?? false,
    content: row.content,
    createdAt: row.created_at,
  };
}

export async function getPosts(category?: Category): Promise<Post[]> {
  if (!isSupabaseConfigured) {
    return mockForumStore.getPosts(category);
  }

  const client = requireSupabase();
  const query = client
    .from('posts')
    .select('id, title, content, category, author_id, is_anonymous, created_at')
    .order('created_at', { ascending: false });

  const { data, error } = category ? await query.eq('category', category) : await query;

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as PostRow[];
  const [profiles, commentCounts] = await Promise.all([
    getProfilesMap(rows.map((row) => row.author_id)),
    getCommentCounts(rows.map((row) => row.id)),
  ]);

  return rows.map((row) => mapPost(row, profiles.get(row.author_id), commentCounts.get(row.id) ?? 0));
}

export async function getPost(postId: string): Promise<Post | null> {
  if (!isSupabaseConfigured) {
    return mockForumStore.getPost(postId);
  }

  const client = requireSupabase();
  const { data, error } = await client
    .from('posts')
    .select('id, title, content, category, author_id, is_anonymous, created_at')
    .eq('id', postId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const row = data as PostRow;
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
  const profiles = await getProfilesMap(rows.map((row) => row.author_id));

  return rows.map((row) => mapComment(row, profiles.get(row.author_id)));
}

export async function createPost(input: NewPostInput, user: ForumUser): Promise<Post> {
  if (!isSupabaseConfigured) {
    return mockForumStore.createPost(input, user);
  }

  const client = requireSupabase();
  const { data, error } = await client
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

  if (error) {
    throw new Error(error.message);
  }

  const post = await getPost((data as { id: string }).id);
  if (!post) {
    throw new Error('Post was created but could not be loaded.');
  }

  return post;
}

export async function createComment(input: NewCommentInput, user: ForumUser): Promise<ForumComment> {
  if (!isSupabaseConfigured) {
    return mockForumStore.createComment(input, user);
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

export async function reportPost(input: ReportInput, user: ForumUser): Promise<void> {
  if (!isSupabaseConfigured) {
    return mockForumStore.reportPost(input, user);
  }

  const client = requireSupabase();
  const { error } = await client.from('reports').insert({
    post_id: input.postId,
    reporter_id: user.id,
    reason: input.reason,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function getUserPosts(userId: string): Promise<Post[]> {
  if (!isSupabaseConfigured) {
    return mockForumStore.getUserPosts(userId);
  }

  const client = requireSupabase();
  const { data, error } = await client
    .from('posts')
    .select('id, title, content, category, author_id, is_anonymous, created_at')
    .eq('author_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as PostRow[];
  const [profiles, commentCounts] = await Promise.all([
    getProfilesMap(rows.map((row) => row.author_id)),
    getCommentCounts(rows.map((row) => row.id)),
  ]);

  return rows.map((row) => mapPost(row, profiles.get(row.author_id), commentCounts.get(row.id) ?? 0));
}
