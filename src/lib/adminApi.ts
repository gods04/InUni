import { mockAdminStore } from './mockAdminStore';
import { getPreview } from './format';
import { isSupabaseConfigured, supabase } from './supabase';
import type {
  Profile,
  Report,
  ReportStatus,
  UserRole,
} from '../types/forum';

export interface ModerationReport extends Report {
  contentTitle: string;
  contentPreview: string;
}

interface ReportRow {
  id: string;
  reporter_id: string;
  post_id: string | null;
  comment_id: string | null;
  reason: string;
  status: ReportStatus;
  resolved_by: string | null;
  resolution_note: string | null;
  created_at: string;
  resolved_at: string | null;
}

interface ProfileRow {
  id: string;
  username: string;
  display_name: string;
  role: UserRole;
  is_banned: boolean;
  ban_reason: string | null;
  created_at: string;
}

function requireSupabase() {
  if (!supabase) throw new Error('Supabase is not configured.');
  return supabase;
}

function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    role: row.role,
    isBanned: row.is_banned,
    banReason: row.ban_reason,
    createdAt: row.created_at,
  };
}

export async function getOpenReports(): Promise<ModerationReport[]> {
  if (!isSupabaseConfigured) return mockAdminStore.getOpenReports();

  const client = requireSupabase();
  const { data, error } = await client
    .from('reports')
    .select(
      'id, reporter_id, post_id, comment_id, reason, status, resolved_by, resolution_note, created_at, resolved_at',
    )
    .eq('status', 'open')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Could not load reports: ${error.message}`);
  const rows = (data ?? []) as ReportRow[];
  const postIds = rows
    .map((row) => row.post_id)
    .filter((id): id is string => Boolean(id));
  const commentIds = rows
    .map((row) => row.comment_id)
    .filter((id): id is string => Boolean(id));

  const [postsResult, commentsResult] = await Promise.all([
    postIds.length
      ? client.from('posts').select('id, title, content').in('id', postIds)
      : Promise.resolve({ data: [], error: null }),
    commentIds.length
      ? client.from('comments').select('id, content').in('id', commentIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (postsResult.error) {
    throw new Error(`Could not load reported posts: ${postsResult.error.message}`);
  }
  if (commentsResult.error) {
    throw new Error(
      `Could not load reported comments: ${commentsResult.error.message}`,
    );
  }

  const posts = new Map(
    (postsResult.data ?? []).map((post) => [
      post.id as string,
      post as { id: string; title: string; content: string },
    ]),
  );
  const comments = new Map(
    (commentsResult.data ?? []).map((comment) => [
      comment.id as string,
      comment as { id: string; content: string },
    ]),
  );

  return rows.map((row) => {
    const target =
      row.post_id
        ? ({ type: 'post', postId: row.post_id } as const)
        : ({ type: 'comment', commentId: row.comment_id as string } as const);
    const post = row.post_id ? posts.get(row.post_id) : null;
    const comment = row.comment_id ? comments.get(row.comment_id) : null;

    return {
      id: row.id,
      reporterId: row.reporter_id,
      target,
      reason: row.reason,
      status: row.status,
      resolvedBy: row.resolved_by,
      resolutionNote: row.resolution_note,
      createdAt: row.created_at,
      resolvedAt: row.resolved_at,
      contentTitle: post?.title ?? 'Reported comment',
      contentPreview: getPreview(
        post?.content ?? comment?.content ?? 'Content unavailable.',
      ),
    };
  });
}

export async function resolveReport(
  reportId: string,
  status: 'resolved' | 'dismissed',
  resolutionNote: string,
): Promise<void> {
  if (!isSupabaseConfigured) {
    return mockAdminStore.resolveReport(reportId, status, resolutionNote);
  }

  const client = requireSupabase();
  const { data: authData } = await client.auth.getUser();
  if (!authData.user) throw new Error('Administrator session required.');

  const { error } = await client
    .from('reports')
    .update({
      status,
      resolution_note: resolutionNote.trim() || null,
      resolved_by: authData.user.id,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', reportId);

  if (error) throw new Error(`Could not update report: ${error.message}`);
}

export async function deleteReportedPost(postId: string): Promise<void> {
  if (!isSupabaseConfigured) return mockAdminStore.deleteReportedPost(postId);
  const { error } = await requireSupabase().from('posts').delete().eq('id', postId);
  if (error) throw new Error(`Could not delete post: ${error.message}`);
}

export async function deleteReportedComment(commentId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    return mockAdminStore.deleteReportedComment(commentId);
  }
  const { error } = await requireSupabase()
    .from('comments')
    .delete()
    .eq('id', commentId);
  if (error) throw new Error(`Could not delete comment: ${error.message}`);
}

export async function searchUsers(query: string): Promise<Profile[]> {
  if (!isSupabaseConfigured) return mockAdminStore.searchUsers(query);
  const client = requireSupabase();
  const safeQuery = query.trim().replace(/[,%()]/g, '');
  let request = client
    .from('profiles')
    .select(
      'id, username, display_name, role, is_banned, ban_reason, created_at',
    )
    .order('display_name')
    .limit(20);

  if (safeQuery) {
    request = request.or(
      `display_name.ilike.%${safeQuery}%,username.ilike.%${safeQuery}%`,
    );
  }

  const { data, error } = await request;
  if (error) throw new Error(`Could not search users: ${error.message}`);
  return ((data ?? []) as ProfileRow[]).map(mapProfile);
}

export async function setUserBan(
  userId: string,
  banned: boolean,
  reason: string | null,
): Promise<void> {
  if (!isSupabaseConfigured) {
    return mockAdminStore.setUserBan(userId, banned, reason);
  }

  const { error } = await requireSupabase().rpc('set_user_ban', {
    target_user: userId,
    banned,
    reason,
  });
  if (error) throw new Error(`Could not update account status: ${error.message}`);
}
