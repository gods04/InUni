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

export interface ForumUser {
  id: string;
  email: string;
  displayName: string;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  category: Category;
  authorId: string;
  authorName: string;
  isAnonymous: boolean;
  createdAt: string;
  commentCount: number;
}

export interface ForumComment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
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

export interface ReportInput {
  postId: string;
  reason: string;
}
