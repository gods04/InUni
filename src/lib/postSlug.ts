import type { Post } from '../types/forum';

const fallbackSlug = 'post';
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function slugifyPostTitle(title: string): string {
  const slug = title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || fallbackSlug;
}

export function getPostSlug(post: Pick<Post, 'slug' | 'title'>): string {
  return post.slug || slugifyPostTitle(post.title);
}

export function getPostPath(post: Pick<Post, 'id' | 'slug' | 'title'>): string {
  return `/post/${getPostSlug(post)}`;
}

export function isUuidPostIdentifier(identifier: string): boolean {
  return uuidPattern.test(identifier);
}
