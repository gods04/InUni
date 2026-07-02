import { mockComments, mockPosts } from './mockData';
import { getDisplayName } from './format';
import { getPostSlug, slugifyPostTitle } from './postSlug';
import type {
  Category,
  ForumComment,
  ForumUser,
  NewCommentInput,
  NewPostInput,
  Post,
  Profile,
  Report,
  ReportTarget,
  UpdatePostInput,
} from '../types/forum';

const postsKey = 'inuni.posts';
const commentsKey = 'inuni.comments';
const reportsKey = 'inuni.reports';
const profilesKey = 'inuni.profiles';

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
  const profiles = readList<Profile>(profilesKey, []);

  return posts.map((post) => ({
    ...post,
    authorName: post.isAnonymous
      ? 'Anonymous'
      : profiles.find((profile) => profile.id === post.authorId)?.displayName ??
        post.authorName,
    authorAvatarUrl: post.isAnonymous
      ? null
      : profiles.find((profile) => profile.id === post.authorId)?.avatarUrl ??
        post.authorAvatarUrl ??
        null,
    authorIsUctVerified: post.isAnonymous
      ? post.authorIsUctVerified
      : profiles.find((profile) => profile.id === post.authorId)
          ?.isUctVerified ?? post.authorIsUctVerified,
    commentCount: comments.filter((comment) => comment.postId === post.id).length,
  }));
}

function getCommentsFromStore(): ForumComment[] {
  const profiles = readList<Profile>(profilesKey, []);

  return readList<ForumComment>(commentsKey, mockComments).map((comment) => {
    const profile = profiles.find((item) => item.id === comment.authorId);
    return {
      ...comment,
      authorName: profile?.displayName ?? comment.authorName,
      authorAvatarUrl: profile?.avatarUrl ?? comment.authorAvatarUrl ?? null,
      authorIsUctVerified:
        profile?.isUctVerified ?? comment.authorIsUctVerified,
    };
  });
}

export const mockForumStore = {
  async getPosts(category?: Category): Promise<Post[]> {
    const posts = getPostsFromStore();
    const filtered = category ? posts.filter((post) => post.category === category) : posts;

    return filtered.sort(
      (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    );
  },

  async getPost(postIdentifier: string): Promise<Post | null> {
    return (
      getPostsFromStore().find(
        (post) =>
          post.id === postIdentifier || getPostSlug(post) === postIdentifier,
      ) ?? null
    );
  },

  async getComments(postId: string): Promise<ForumComment[]> {
    return getCommentsFromStore()
      .filter((comment) => comment.postId === postId)
      .sort(
        (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
      );
  },

  async createPost(input: NewPostInput, user: ForumUser): Promise<Post> {
    const timestamp = new Date().toISOString();
    const post: Post = {
      id: createId('post'),
      slug: slugifyPostTitle(input.title),
      title: input.title,
      content: input.content,
      category: input.category,
      authorId: user.id,
      authorName: input.isAnonymous
        ? 'Anonymous'
        : user.profile.displayName || getDisplayName(user.email),
      authorAvatarUrl: input.isAnonymous ? null : user.profile.avatarUrl ?? null,
      authorIsUctVerified: user.profile.isUctVerified,
      isAnonymous: input.isAnonymous,
      createdAt: timestamp,
      updatedAt: timestamp,
      commentCount: 0,
    };

    const posts = [post, ...getPostsFromStore()];
    writeList(postsKey, posts);
    return post;
  },

  async updatePost(
    postId: string,
    input: UpdatePostInput,
    user: ForumUser,
  ): Promise<Post> {
    const posts = getPostsFromStore();
    const post = posts.find((item) => item.id === postId);

    if (!post || post.authorId !== user.id) {
      throw new Error('You can only edit posts you created.');
    }

    const updatedPost: Post = {
      ...post,
      slug: slugifyPostTitle(input.title),
      title: input.title,
      content: input.content,
      category: input.category,
      isAnonymous: input.isAnonymous,
      authorName: input.isAnonymous
        ? 'Anonymous'
        : user.profile.displayName || getDisplayName(user.email),
      authorAvatarUrl: input.isAnonymous ? null : user.profile.avatarUrl ?? null,
      authorIsUctVerified: user.profile.isUctVerified,
      updatedAt: new Date().toISOString(),
    };

    writeList(
      postsKey,
      posts.map((item) => (item.id === postId ? updatedPost : item)),
    );

    return updatedPost;
  },

  async deletePost(postId: string, user: ForumUser): Promise<void> {
    const posts = getPostsFromStore();
    const post = posts.find((item) => item.id === postId);

    if (!post || post.authorId !== user.id) {
      throw new Error('You can only delete posts you created.');
    }

    writeList(
      postsKey,
      posts.filter((item) => item.id !== postId),
    );
    writeList(
      commentsKey,
      getCommentsFromStore().filter((comment) => comment.postId !== postId),
    );
    writeList(
      reportsKey,
      readList<Report>(reportsKey, []).filter(
        (report) =>
          report.target.type !== 'post' || report.target.postId !== postId,
      ),
    );
  },

  async createComment(input: NewCommentInput, user: ForumUser): Promise<ForumComment> {
    const comment: ForumComment = {
      id: createId('comment'),
      postId: input.postId,
      authorId: user.id,
      authorName: user.profile.displayName || getDisplayName(user.email),
      authorAvatarUrl: user.profile.avatarUrl ?? null,
      authorIsUctVerified: user.profile.isUctVerified,
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
