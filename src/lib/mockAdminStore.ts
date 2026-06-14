import { getPreview } from './format';
import {
  mockComments,
  mockPosts,
  mockProfiles,
} from './mockData';
import type { ModerationReport } from './adminApi';
import type { ForumComment, ForumUser, Post, Profile, Report } from '../types/forum';

const postsKey = 'inuni.posts';
const commentsKey = 'inuni.comments';
const reportsKey = 'inuni.reports';
const profilesKey = 'inuni.profiles';
const demoUserKey = 'inuni.demoUser';

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

function writeList<T>(key: string, value: T[]): void {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(key, JSON.stringify(value));
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

export const mockAdminStore = {
  async getOpenReports(): Promise<ModerationReport[]> {
    const reports = readList<Report>(reportsKey, []);
    const posts = readList<Post>(postsKey, mockPosts);
    const comments = readList<ForumComment>(commentsKey, mockComments);

    return reports
      .filter((report) => report.status === 'open')
      .map((report) => {
        if (report.target.type === 'post') {
          const postId = report.target.postId;
          const post = posts.find(
            (item) => item.id === postId,
          );
          return {
            ...report,
            contentTitle: post?.title ?? 'Deleted post',
            contentPreview: getPreview(post?.content ?? 'Content unavailable.'),
          };
        }

        const commentId = report.target.commentId;
        const comment = comments.find(
          (item) => item.id === commentId,
        );
        return {
          ...report,
          contentTitle: 'Reported comment',
          contentPreview: getPreview(
            comment?.content ?? 'Content unavailable.',
          ),
        };
      });
  },

  async resolveReport(
    reportId: string,
    status: 'resolved' | 'dismissed',
    resolutionNote: string,
  ): Promise<void> {
    const reports = readList<Report>(reportsKey, []);
    writeList(
      reportsKey,
      reports.map((report) =>
        report.id === reportId
          ? {
              ...report,
              status,
              resolutionNote,
              resolvedBy: 'demo-admin@inuni.local',
              resolvedAt: new Date().toISOString(),
            }
          : report,
      ),
    );
  },

  async deleteReportedPost(postId: string): Promise<void> {
    const posts = readList<Post>(postsKey, mockPosts);
    const comments = readList<ForumComment>(commentsKey, mockComments);
    writeList(
      postsKey,
      posts.filter((post) => post.id !== postId),
    );
    writeList(
      commentsKey,
      comments.filter((comment) => comment.postId !== postId),
    );
  },

  async deleteReportedComment(commentId: string): Promise<void> {
    const comments = readList<ForumComment>(commentsKey, mockComments);
    writeList(
      commentsKey,
      comments.filter((comment) => comment.id !== commentId),
    );
  },

  async searchUsers(query: string): Promise<Profile[]> {
    const normalized = query.trim().toLowerCase();
    return readProfiles()
      .filter(
        (profile) =>
          !normalized ||
          profile.displayName.toLowerCase().includes(normalized) ||
          profile.username.toLowerCase().includes(normalized),
      )
      .slice(0, 20);
  },

  async setUserBan(
    userId: string,
    banned: boolean,
    reason: string | null,
  ): Promise<void> {
    const profiles = readProfiles().map((profile) =>
      profile.id === userId
        ? {
            ...profile,
            isBanned: banned,
            banReason: banned ? reason : null,
          }
        : profile,
    );
    writeList(profilesKey, profiles);
  },
};
