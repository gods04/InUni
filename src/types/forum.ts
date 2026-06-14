export const categories = [
  'Study',
  'Campus Life',
  'Questions',
  'Lost & Found',
  'Confessions',
  'General',
] as const;

export type Category = (typeof categories)[number];

export type CategoryFilter = Category | 'All';

export type UserRole = 'student' | 'admin';

export interface Profile {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
  isBanned: boolean;
  banReason: string | null;
  createdAt: string;
}

export interface ForumUser {
  id: string;
  email: string;
  emailConfirmed: boolean;
  profile: Profile;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  category: Category;
  authorId: string;
  authorName: string;
  authorIsUctVerified: boolean;
  isAnonymous: boolean;
  createdAt: string;
  commentCount: number;
}

export interface ForumComment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorIsUctVerified: boolean;
  content: string;
  createdAt: string;
}

export interface NewPostInput {
  title: string;
  content: string;
  category: Category;
  isAnonymous: boolean;
}

export interface NewCommentInput {
  postId: string;
  content: string;
}

export type ReportStatus = 'open' | 'resolved' | 'dismissed';

export type ReportTarget =
  | { type: 'post'; postId: string }
  | { type: 'comment'; commentId: string };

export interface Report {
  id: string;
  reporterId: string;
  target: ReportTarget;
  reason: string;
  status: ReportStatus;
  resolvedBy: string | null;
  resolutionNote: string | null;
  createdAt: string;
  resolvedAt: string | null;
}
