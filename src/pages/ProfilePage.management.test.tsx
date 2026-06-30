import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ForumUser, Post } from '../types/forum';
import { ProfilePage } from './ProfilePage';

const mocks = vi.hoisted(() => ({
  createSignedDownloadUrl: vi.fn(),
  deleteFile: vi.fn(),
  deletePost: vi.fn(),
  getUserFiles: vi.fn(),
  getUserPosts: vi.fn(),
  updateDisplayName: vi.fn(),
  updatePost: vi.fn(),
  uploadProfilePhoto: vi.fn(),
}));

const testUser: ForumUser = {
  id: 'user-1',
  email: 'student@uct.ac.za',
  emailConfirmed: true,
  profile: {
    id: 'user-1',
    username: 'student',
    displayName: 'Student One',
    avatarUrl: null,
    avatarPath: null,
    role: 'student',
    isBanned: false,
    banReason: null,
    isUctVerified: true,
    createdAt: '2026-06-16T00:00:00.000Z',
  },
};

const ownPost: Post = {
  id: 'post-1',
  title: 'Draft handbook question',
  content: 'Where should I check EBE course rules?',
  category: 'General',
  authorId: 'user-1',
  authorName: 'Student One',
  authorAvatarUrl: null,
  authorIsUctVerified: true,
  isAnonymous: false,
  createdAt: '2026-06-16T10:00:00.000Z',
  updatedAt: '2026-06-16T10:00:00.000Z',
  commentCount: 2,
};

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: testUser,
    isDemoMode: false,
    updateDisplayName: mocks.updateDisplayName,
    uploadProfilePhoto: mocks.uploadProfilePhoto,
  }),
}));

vi.mock('../lib/fileApi', () => ({
  createSignedDownloadUrl: (...args: unknown[]) =>
    mocks.createSignedDownloadUrl(...args),
  deleteFile: (...args: unknown[]) => mocks.deleteFile(...args),
  getUserFiles: (...args: unknown[]) => mocks.getUserFiles(...args),
}));

vi.mock('../lib/forumApi', () => ({
  deletePost: (...args: unknown[]) => mocks.deletePost(...args),
  getUserPosts: (...args: unknown[]) => mocks.getUserPosts(...args),
  updatePost: (...args: unknown[]) => mocks.updatePost(...args),
}));

describe('ProfilePage post management', () => {
  beforeEach(() => {
    mocks.createSignedDownloadUrl.mockReset();
    mocks.deleteFile.mockReset();
    mocks.deletePost.mockReset();
    mocks.getUserFiles.mockReset();
    mocks.getUserPosts.mockReset();
    mocks.updateDisplayName.mockReset();
    mocks.updatePost.mockReset();
    mocks.uploadProfilePhoto.mockReset();
    mocks.createSignedDownloadUrl.mockResolvedValue({
      url: 'mock://download/file-1',
      expiresAt: '2026-06-16T10:05:00.000Z',
    });
    mocks.deletePost.mockResolvedValue(undefined);
    mocks.getUserFiles.mockResolvedValue([]);
    mocks.getUserPosts.mockResolvedValue([ownPost]);
    mocks.updateDisplayName.mockResolvedValue({});
    mocks.updatePost.mockResolvedValue({
      ...ownPost,
      title: 'Updated handbook question',
      content: 'I found the EBE rules but want to confirm electives.',
      category: 'Questions',
      updatedAt: '2026-06-16T11:00:00.000Z',
    });
    mocks.uploadProfilePhoto.mockResolvedValue({});
  });

  it('shows view, edit, and delete actions for posts created by the current user', async () => {
    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
    );

    expect(await screen.findByText('Draft handbook question')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'View Draft handbook question' }),
    ).toHaveAttribute('href', '/post/post-1');
    expect(
      screen.getByRole('button', { name: 'Edit Draft handbook question' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Delete Draft handbook question' }),
    ).toBeInTheDocument();
  });

  it('reuses post validation before saving profile edits', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
    );

    await user.click(
      await screen.findByRole('button', { name: 'Edit Draft handbook question' }),
    );
    await user.clear(screen.getByLabelText('Title'));
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByText('Title is required.')).toBeInTheDocument();
    expect(mocks.updatePost).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText('Title'), 'Updated handbook question');
    await user.clear(screen.getByLabelText('Content'));
    await user.type(
      screen.getByLabelText('Content'),
      'I found the EBE rules but want to confirm electives.',
    );
    await user.selectOptions(screen.getByLabelText('Category'), 'Questions');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(mocks.updatePost).toHaveBeenCalledWith(
      'post-1',
      {
        title: 'Updated handbook question',
        content: 'I found the EBE rules but want to confirm electives.',
        category: 'Questions',
        isAnonymous: false,
      },
      testUser,
    );
    expect(await screen.findByText('Changes saved.')).toBeInTheDocument();
    expect(await screen.findByText('Updated handbook question')).toBeInTheDocument();
  });

  it('requires confirmation before deleting a profile post', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
    );

    await user.click(
      await screen.findByRole('button', {
        name: 'Delete Draft handbook question',
      }),
    );

    expect(screen.getByRole('dialog', { name: 'Delete post?' })).toBeInTheDocument();
    expect(mocks.deletePost).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Delete post' }));

    expect(mocks.deletePost).toHaveBeenCalledWith('post-1', testUser);
    await waitFor(() =>
      expect(screen.queryByText('Draft handbook question')).not.toBeInTheDocument(),
    );
    expect(screen.getByText('No posts yet')).toBeInTheDocument();
  });
});
