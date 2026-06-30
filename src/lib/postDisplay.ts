import type { Post } from '../types/forum';

export function isPostEdited(post: Pick<Post, 'createdAt' | 'updatedAt'>): boolean {
  if (!post.updatedAt) return false;
  return new Date(post.updatedAt).getTime() > new Date(post.createdAt).getTime();
}
