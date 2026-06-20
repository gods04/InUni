import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import type { LinkedFile } from '../types/files';
import type { ForumComment } from '../types/forum';
import { CommentList } from './CommentList';

const comment: ForumComment = {
  id: 'comment-1',
  postId: 'post-1',
  authorId: 'user-1',
  authorName: 'Student One',
  authorAvatarUrl: 'https://example.com/student-one.png',
  authorIsUctVerified: true,
  content: 'Helpful comment.',
  createdAt: '2026-06-16T10:00:00.000Z',
};

const attachment: LinkedFile = {
  id: 'file-1',
  ownerId: 'user-1',
  ownerName: 'Student One',
  storageProvider: 'mock',
  storageBucket: 'mock-files',
  storagePath: 'user-1/file-1/comment-notes.pdf',
  originalFilename: 'comment-notes.pdf',
  displayFilename: 'comment-notes.pdf',
  mimeType: 'application/pdf',
  extension: 'pdf',
  sizeBytes: 4096,
  description: 'Comment attachment',
  status: 'available',
  scanStatus: 'not_scanned',
  downloadCount: 0,
  reportCount: 0,
  createdAt: '2026-06-16T10:00:00.000Z',
  updatedAt: '2026-06-16T10:00:00.000Z',
  links: [],
};

describe('CommentList attachments', () => {
  it('renders files attached to a comment', () => {
    render(
      <MemoryRouter>
        <CommentList
          comments={[comment]}
          filesByCommentId={{ 'comment-1': [attachment] }}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('comment-notes.pdf')).toBeInTheDocument();
  });

  it('shows the comment author avatar', () => {
    render(
      <MemoryRouter>
        <CommentList comments={[comment]} />
      </MemoryRouter>,
    );

    expect(screen.getByLabelText('Student One avatar')).toBeInTheDocument();
  });
});
