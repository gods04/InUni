import { mockComments, mockPosts } from './mockData';
import { getDisplayName } from './format';
import { isUctVerifiedEmail } from './permissions';
import type {
  Category,
  ForumComment,
  ForumUser,
  NewCommentInput,
  NewPostInput,
  Post,
  Report,
  ReportTarget,
} from '../types/forum';

const postsKey = 'inuni.posts';
const commentsKey = 'inuni.comments';
const reportsKey = 'inuni.reports';

function createId(prefix: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function readList<T>(key: string, fallback: T[]): T[] {
  if (typeof window === 'undefined') {
    return fallback;
  }

  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return fallback;
  }

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

function getPostsFromStore(): Post[] {
  const posts = readList<Post>(postsKey, mockPosts);
  const comments = readList<ForumComment>(commentsKey, mockComments);

  return posts.map((post) => ({
    ...post,
    commentCount: comments.filter((comment) => comment.postId === post.id).length,
  }));
}

function getCommentsFromStore(): ForumComment[] {
  return readList<ForumComment>(commentsKey, mockComments);
}

export const mockForumStore = {
  async getPosts(category?: Category): Promise<Post[]> {
    const posts = getPostsFromStore();
    const filtered = category ? posts.filter((post) => post.category === category) : posts;

    return filtered.sort(
      (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    );
  },

  async getPost(postId: string): Promise<Post | null> {
    return getPostsFromStore().find((post) => post.id === postId) ?? null;
  },

  async getComments(postId: string): Promise<ForumComment[]> {
    return getCommentsFromStore()
      .filter((comment) => comment.postId === postId)
      .sort(
        (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
      );
  },

  async createPost(input: NewPostInput, user: ForumUser): Promise<Post> {
    const post: Post = {
      id: createId('post'),
      title: input.title,
      content: input.content,
      category: input.category,
      authorId: user.id,
      authorName: input.isAnonymous
        ? 'Anonymous'
        : user.profile.displayName || getDisplayName(user.email),
      authorIsUctVerified: isUctVerifiedEmail(
        user.email,
        user.emailConfirmed,
      ),
      isAnonymous: input.isAnonymous,
      createdAt: new Date().toISOString(),
      commentCount: 0,
    };

    const posts = [post, ...getPostsFromStore()];
    writeList(postsKey, posts);
    return post;
  },

  async createComment(input: NewCommentInput, user: ForumUser): Promise<ForumComment> {
    const comment: ForumComment = {
      id: createId('comment'),
      postId: input.postId,
      authorId: user.id,
      authorName: user.profile.displayName || getDisplayName(user.email),
      authorIsUctVerified: isUctVerifiedEmail(
        user.email,
        user.emailConfirmed,
      ),
      content: input.content,
      createdAt: new Date().toISOString(),
    };

    const comments = [...getCommentsFromStore(), comment];
    writeList(commentsKey, comments);
    return comment;
  },

  async createReport(
    target: ReportTarget,
    reason: string,
    user: ForumUser,
  ): Promise<void> {
    const reports = readList<Report>(reportsKey, []);
    const duplicate = reports.some(
      (report) =>
        report.reporterId === user.id &&
        JSON.stringify(report.target) === JSON.stringify(target),
    );

    if (duplicate) {
      throw new Error('You have already reported this content.');
    }

    const report: Report = {
      id: createId('report'),
      reporterId: user.id,
      target,
      reason: reason.trim(),
      status: 'open',
      resolvedBy: null,
      resolutionNote: null,
      createdAt: new Date().toISOString(),
      resolvedAt: null,
    };

    writeList(reportsKey, [...reports, report]);
  },

  async getUserPosts(userId: string): Promise<Post[]> {
    return getPostsFromStore()
      .filter((post) => post.authorId === userId)
      .sort(
        (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
      );
  },
};
