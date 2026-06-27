import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ForumUser } from '../types/forum';
import { ProfilePage } from './ProfilePage';

const mocks = vi.hoisted(() => ({
  createSignedDownloadUrl: vi.fn(),
  getUserFiles: vi.fn(),
  getUserPosts: vi.fn(),
  removeProfilePhoto: vi.fn(),
  updateDisplayName: vi.fn(),
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

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: testUser,
    isDemoMode: false,
    removeProfilePhoto: mocks.removeProfilePhoto,
    updateDisplayName: mocks.updateDisplayName,
    uploadProfilePhoto: mocks.uploadProfilePhoto,
  }),
}));

vi.mock('../lib/fileApi', () => ({
  createSignedDownloadUrl: (...args: unknown[]) =>
    mocks.createSignedDownloadUrl(...args),
  getUserFiles: (...args: unknown[]) => mocks.getUserFiles(...args),
}));

vi.mock('../lib/forumApi', () => ({
  getUserPosts: (...args: unknown[]) => mocks.getUserPosts(...args),
}));

describe('ProfilePage identity editing', () => {
  beforeEach(() => {
    testUser.email = 'student@uct.ac.za';
    testUser.emailConfirmed = true;
    testUser.profile.avatarUrl = null;
    testUser.profile.avatarPath = null;
    testUser.profile.isUctVerified = true;
    mocks.createSignedDownloadUrl.mockReset();
    mocks.getUserFiles.mockReset();
    mocks.getUserPosts.mockReset();
    mocks.removeProfilePhoto.mockReset();
    mocks.updateDisplayName.mockReset();
    mocks.uploadProfilePhoto.mockReset();
    mocks.createSignedDownloadUrl.mockResolvedValue({
      url: 'mock://download/file-1',
      expiresAt: '2026-06-16T10:05:00.000Z',
    });
    mocks.getUserFiles.mockResolvedValue([]);
    mocks.getUserPosts.mockResolvedValue([]);
    mocks.removeProfilePhoto.mockResolvedValue({});
    mocks.updateDisplayName.mockResolvedValue({});
    mocks.uploadProfilePhoto.mockResolvedValue({});
  });

  it('shows fallback initials and saves a changed display name', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
    );

    expect(await screen.findByLabelText('Student One avatar')).toHaveTextContent(
      'SO',
    );

    const displayName = screen.getByLabelText('Display name');
    expect(displayName).toHaveClass('field-input');
    expect(displayName).not.toHaveClass('input-field');

    await user.clear(displayName);
    await user.type(displayName, 'New Student');
    await user.click(screen.getByRole('button', { name: 'Save profile' }));

    expect(mocks.updateDisplayName).toHaveBeenCalledWith('New Student');
    expect(await screen.findByText('Profile updated.')).toBeInTheDocument();
  });

  it('uses the profile UCT verification state for the account badge', async () => {
    testUser.email = 'student@gmail.com';
    testUser.emailConfirmed = true;
    testUser.profile.isUctVerified = true;

    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
    );

    expect(await screen.findByText('UCT Verified')).toBeInTheDocument();
    expect(screen.queryByText('Email not UCT verified')).not.toBeInTheDocument();
  });

  it('uses a custom upload profile picture control', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
    );
    const photo = new File(['avatar'], 'avatar.png', { type: 'image/png' });

    expect(
      await screen.findByRole('button', { name: 'Upload profile picture' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('Remove photo')).not.toBeInTheDocument();

    await user.upload(screen.getByLabelText('Upload profile picture'), photo);

    expect(mocks.uploadProfilePhoto).toHaveBeenCalledWith(photo);
    expect(await screen.findByText('Profile photo updated.')).toBeInTheDocument();
    expect(mocks.removeProfilePhoto).not.toHaveBeenCalled();
  });

  it('uses change photo wording when the account already has a profile photo', async () => {
    testUser.profile.avatarUrl = 'https://cdn.inuni.test/avatar.png';

    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole('button', { name: 'Change photo' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Change photo')).toHaveAttribute(
      'type',
      'file',
    );
    expect(screen.queryByText('Remove photo')).not.toBeInTheDocument();
  });
});
