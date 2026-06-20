import { beforeEach, describe, expect, it } from 'vitest';
import { getAdminDashboardMetrics } from './adminDashboardApi';

function setLocalList(key: string, value: unknown[]): void {
  window.localStorage.setItem(key, JSON.stringify(value));
}

describe('adminDashboardApi', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it('builds a recent activity feed from demo community data', async () => {
    setLocalList('inuni.profiles', [
      {
        id: 'profile-1',
        username: 'newbie',
        displayName: 'New Student',
        role: 'student',
        isBanned: false,
        banReason: null,
        createdAt: '2026-06-16T10:00:00.000Z',
      },
    ]);
    setLocalList('inuni.posts', [
      {
        id: 'post-1',
        title: 'Welcome post',
        category: 'General',
        content: 'Hello InUni',
        authorId: 'profile-1',
        authorName: 'New Student',
        authorIsUctVerified: true,
        isAnonymous: false,
        createdAt: '2026-06-16T10:20:00.000Z',
        commentCount: 1,
      },
    ]);
    setLocalList('inuni.comments', [
      {
        id: 'comment-1',
        postId: 'post-1',
        authorId: 'profile-1',
        authorName: 'New Student',
        authorIsUctVerified: true,
        content: 'Quick reply',
        createdAt: '2026-06-16T10:10:00.000Z',
      },
    ]);
    setLocalList('inuni.files', [
      {
        id: 'file-1',
        ownerId: 'profile-1',
        ownerName: 'New Student',
        storageProvider: 'mock',
        storageBucket: 'mock-files',
        storagePath: 'profile-1/file-1/exam.pdf',
        originalFilename: 'exam.pdf',
        displayFilename: 'exam.pdf',
        mimeType: 'application/pdf',
        extension: 'pdf',
        sizeBytes: 1024,
        description: '',
        status: 'available',
        scanStatus: 'not_scanned',
        downloadCount: 0,
        reportCount: 0,
        createdAt: '2026-06-16T10:25:00.000Z',
        updatedAt: '2026-06-16T10:25:00.000Z',
      },
    ]);
    setLocalList('inuni.reports', [
      {
        id: 'report-1',
        target: { type: 'post', postId: 'post-1' },
        reason: 'This post needs moderator review.',
        status: 'open',
        reporterId: 'profile-1',
        resolvedBy: null,
        resolutionNote: null,
        createdAt: '2026-06-16T10:30:00.000Z',
        resolvedAt: null,
      },
    ]);

    const metrics = await getAdminDashboardMetrics();

    expect(metrics.recentActivity.map((item) => item.title)).toEqual([
      'Welcome post',
      'exam.pdf',
      'Welcome post',
      'Quick reply',
      'New Student',
    ]);
    expect(metrics.recentActivity[0]).toMatchObject({
      detail: 'Report opened',
      href: '/admin/reports',
      kind: 'Report',
    });
    expect(metrics.recentActivity[1]).toMatchObject({
      detail: 'New Student uploaded a file',
      href: '/admin/files',
      kind: 'File',
    });
    expect(metrics.recentActivity[4]).toMatchObject({
      detail: 'New student account',
      href: '/admin/users',
      kind: 'Signup',
    });
  });
});
