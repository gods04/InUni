import { mockComments, mockPosts, mockProfiles } from './mockData';
import { getFileReviewCount } from './adminFileApi';
import { getPreview } from './format';
import { getLocalTrafficSnapshot } from './localAnalytics';
import { getOpenReports } from './adminApi';
import { getPostPath } from './postSlug';
import type { ModerationReport } from './adminApi';
import { isSupabaseConfigured, supabase } from './supabase';
import { isMissingPostSlugError } from './supabaseCompat';
import type { ForumComment, ForumUser, Post, Profile } from '../types/forum';
import type { InUniFile } from '../types/files';

export type AdminDashboardActivityKind =
  | 'Comment'
  | 'File'
  | 'Post'
  | 'Report'
  | 'Signup';

export interface AdminDashboardActivityItem {
  id: string;
  kind: AdminDashboardActivityKind;
  title: string;
  detail: string;
  createdAt: string;
  href: string;
}

export interface AdminDashboardMetrics {
  commentsToday: number;
  filesNeedReview: number;
  newUsersToday: number;
  openReports: number;
  pageViewsToday: number;
  postsToday: number;
  totalComments: number;
  totalFiles: number;
  totalPosts: number;
  totalUsers: number;
  trafficSourceLabel: string;
  visitorsToday: number;
  recentActivity: AdminDashboardActivityItem[];
}

const postsKey = 'inuni.posts';
const commentsKey = 'inuni.comments';
const profilesKey = 'inuni.profiles';
const demoUserKey = 'inuni.demoUser';
const filesKey = 'inuni.files';
const recentActivityLimit = 5;

function requireSupabase() {
  if (!supabase) throw new Error('Supabase is not configured.');
  return supabase;
}

function readList<T>(key: string, fallback: T[]): T[] {
  if (typeof window === 'undefined') return fallback;

  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;

  try {
    return JSON.parse(raw) as T[];
  } catch {
    return fallback;
  }
}

function readProfiles(): Profile[] {
  const profiles = readList<Profile>(profilesKey, mockProfiles);
  if (typeof window === 'undefined') return profiles;

  const rawUser = window.localStorage.getItem(demoUserKey);
  if (!rawUser) return profiles;

  try {
    const currentUser = JSON.parse(rawUser) as ForumUser;
    return profiles.some((profile) => profile.id === currentUser.profile.id)
      ? profiles
      : [currentUser.profile, ...profiles];
  } catch {
    return profiles;
  }
}

function isToday(createdAt: string, now = new Date()): boolean {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  return new Date(createdAt).getTime() >= start.getTime();
}

function sortRecentActivity(
  items: AdminDashboardActivityItem[],
): AdminDashboardActivityItem[] {
  return [...items]
    .sort(
      (left, right) =>
        new Date(right.createdAt).getTime() -
        new Date(left.createdAt).getTime(),
    )
    .slice(0, recentActivityLimit);
}

function buildRecentActivity({
  comments,
  files,
  posts,
  profiles,
  reports,
}: {
  comments: ForumComment[];
  files: InUniFile[];
  posts: Post[];
  profiles: Profile[];
  reports: ModerationReport[];
}): AdminDashboardActivityItem[] {
  const postsById = new Map(posts.map((post) => [post.id, post]));

  return sortRecentActivity([
    ...reports.map((report) => ({
      id: `report-${report.id}`,
      kind: 'Report' as const,
      title: report.contentTitle,
      detail: 'Report opened',
      createdAt: report.createdAt,
      href: '/admin/reports',
    })),
    ...files.map((file) => ({
      id: `file-${file.id}`,
      kind: 'File' as const,
      title: file.displayFilename,
      detail: `${file.ownerName} uploaded a file`,
      createdAt: file.createdAt,
      href: '/admin/files',
    })),
    ...posts.map((post) => ({
      id: `post-${post.id}`,
      kind: 'Post' as const,
      title: post.title,
      detail: `${post.authorName} posted in ${post.category}`,
      createdAt: post.createdAt,
      href: getPostPath(post),
    })),
    ...comments.map((comment) => ({
      id: `comment-${comment.id}`,
      kind: 'Comment' as const,
      title: getPreview(comment.content),
      detail: `${comment.authorName} commented`,
      createdAt: comment.createdAt,
      href: postsById.has(comment.postId)
        ? getPostPath(postsById.get(comment.postId) as Post)
        : `/post/${comment.postId}`,
    })),
    ...profiles.map((profile) => ({
      id: `signup-${profile.id}`,
      kind: 'Signup' as const,
      title: profile.displayName,
      detail: `New ${profile.role} account`,
      createdAt: profile.createdAt,
      href: '/admin/users',
    })),
  ]);
}

interface SupabaseActivityPostRow {
  id: string;
  slug?: string | null;
  title: string;
  category: Post['category'];
  created_at: string;
}

interface SupabaseActivityCommentRow {
  id: string;
  post_id: string;
  content: string;
  created_at: string;
}

interface SupabaseActivityProfileRow {
  id: string;
  display_name: string | null;
  username: string | null;
  role: Profile['role'];
  created_at: string;
}

interface SupabaseActivityFileRow {
  id: string;
  display_filename: string;
  created_at: string;
}

async function getRecentRows<T>(
  table: 'comments' | 'files' | 'posts' | 'profiles',
  select: string,
): Promise<T[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from(table)
    .select(select)
    .order('created_at', { ascending: false })
    .limit(recentActivityLimit);

  if (error) {
    throw new Error(`Could not load dashboard activity: ${error.message}`);
  }

  return (data ?? []) as T[];
}

async function getRecentPostRows(): Promise<SupabaseActivityPostRow[]> {
  const client = requireSupabase();
  const result = await client
    .from('posts')
    .select('id, slug, title, category, created_at')
    .order('created_at', { ascending: false })
    .limit(recentActivityLimit);

  if (result.error && isMissingPostSlugError(result.error)) {
    const fallbackResult = await client
      .from('posts')
      .select('id, title, category, created_at')
      .order('created_at', { ascending: false })
      .limit(recentActivityLimit);

    if (fallbackResult.error) {
      throw new Error(
        `Could not load dashboard activity: ${fallbackResult.error.message}`,
      );
    }

    return (fallbackResult.data ?? []) as SupabaseActivityPostRow[];
  }

  if (result.error) {
    throw new Error(`Could not load dashboard activity: ${result.error.message}`);
  }

  return (result.data ?? []) as SupabaseActivityPostRow[];
}

async function getSupabaseCount(
  table: 'comments' | 'files' | 'posts' | 'profiles',
  after?: string,
): Promise<number> {
  const client = requireSupabase();
  let query = client.from(table).select('id', { count: 'exact', head: true });

  if (after) {
    query = query.gte('created_at', after);
  }

  const { count, error } = await query;
  if (error) throw new Error(`Could not load dashboard metrics: ${error.message}`);
  return count ?? 0;
}

async function getSupabaseMetrics(): Promise<AdminDashboardMetrics> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayIso = todayStart.toISOString();
  const traffic = getLocalTrafficSnapshot();
  const [openReports, filesNeedReview] = await Promise.all([
    getOpenReports(),
    getFileReviewCount(),
  ]);
  const [
    totalUsers,
    newUsersToday,
    totalPosts,
    postsToday,
    totalComments,
    commentsToday,
    totalFiles,
    recentPosts,
    recentComments,
    recentProfiles,
    recentFiles,
  ] = await Promise.all([
    getSupabaseCount('profiles'),
    getSupabaseCount('profiles', todayIso),
    getSupabaseCount('posts'),
    getSupabaseCount('posts', todayIso),
    getSupabaseCount('comments'),
    getSupabaseCount('comments', todayIso),
    getSupabaseCount('files'),
    getRecentPostRows(),
    getRecentRows<SupabaseActivityCommentRow>(
      'comments',
      'id, post_id, content, created_at',
    ),
    getRecentRows<SupabaseActivityProfileRow>(
      'profiles',
      'id, display_name, username, role, created_at',
    ),
    getRecentRows<SupabaseActivityFileRow>(
      'files',
      'id, display_filename, created_at',
    ),
  ]);
  const recentActivity = sortRecentActivity([
    ...openReports.map((report) => ({
      id: `report-${report.id}`,
      kind: 'Report' as const,
      title: report.contentTitle,
      detail: 'Report opened',
      createdAt: report.createdAt,
      href: '/admin/reports',
    })),
    ...recentFiles.map((file) => ({
      id: `file-${file.id}`,
      kind: 'File' as const,
      title: file.display_filename,
      detail: 'File uploaded',
      createdAt: file.created_at,
      href: '/admin/files',
    })),
    ...recentPosts.map((post) => ({
      id: `post-${post.id}`,
      kind: 'Post' as const,
      title: post.title,
      detail: `New post in ${post.category}`,
      createdAt: post.created_at,
      href: getPostPath({
        id: post.id,
        slug: post.slug ?? undefined,
        title: post.title,
      }),
    })),
    ...recentComments.map((comment) => ({
      id: `comment-${comment.id}`,
      kind: 'Comment' as const,
      title: getPreview(comment.content),
      detail: 'New comment',
      createdAt: comment.created_at,
      href: `/post/${comment.post_id}`,
    })),
    ...recentProfiles.map((profile) => ({
      id: `signup-${profile.id}`,
      kind: 'Signup' as const,
      title: profile.display_name || profile.username || 'Student',
      detail: `New ${profile.role} account`,
      createdAt: profile.created_at,
      href: '/admin/users',
    })),
  ]);

  return {
    commentsToday,
    filesNeedReview,
    newUsersToday,
    openReports: openReports.length,
    pageViewsToday: traffic.pageViewsToday,
    postsToday,
    totalComments,
    totalFiles,
    totalPosts,
    totalUsers,
    trafficSourceLabel: traffic.trafficSourceLabel,
    visitorsToday: traffic.visitorsToday,
    recentActivity,
  };
}

async function getDemoMetrics(): Promise<AdminDashboardMetrics> {
  const traffic = getLocalTrafficSnapshot();
  const posts = readList<Post>(postsKey, mockPosts);
  const comments = readList<ForumComment>(commentsKey, mockComments);
  const profiles = readProfiles();
  const files = readList<InUniFile>(filesKey, []);
  const [openReports, filesNeedReview] = await Promise.all([
    getOpenReports(),
    getFileReviewCount(),
  ]);
  const recentActivity = buildRecentActivity({
    comments,
    files,
    posts,
    profiles,
    reports: openReports,
  });

  return {
    commentsToday: comments.filter((comment) => isToday(comment.createdAt)).length,
    filesNeedReview,
    newUsersToday: profiles.filter((profile) => isToday(profile.createdAt)).length,
    openReports: openReports.length,
    pageViewsToday: traffic.pageViewsToday,
    postsToday: posts.filter((post) => isToday(post.createdAt)).length,
    totalComments: comments.length,
    totalFiles: files.length,
    totalPosts: posts.length,
    totalUsers: profiles.length,
    trafficSourceLabel: traffic.trafficSourceLabel,
    visitorsToday: traffic.visitorsToday,
    recentActivity,
  };
}

export async function getAdminDashboardMetrics(): Promise<AdminDashboardMetrics> {
  return isSupabaseConfigured ? getSupabaseMetrics() : getDemoMetrics();
}
