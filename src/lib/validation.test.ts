import { describe, expect, it } from 'vitest';
import {
  validateComment,
  validatePost,
  validateReportReason,
} from './validation';

describe('validatePost', () => {
  it('rejects a blank title', () => {
    expect(validatePost({ title: '  ', content: 'Useful content' })).toBe(
      'Title is required.',
    );
  });

  it('rejects a title longer than 120 characters', () => {
    expect(
      validatePost({ title: 'a'.repeat(121), content: 'Useful content' }),
    ).toBe('Title must be 120 characters or fewer.');
  });

  it('accepts a valid post', () => {
    expect(
      validatePost({ title: 'Study group', content: 'Meet at 14:00.' }),
    ).toBeNull();
  });
});

describe('validateComment', () => {
  it('rejects blank comments', () => {
    expect(validateComment('   ')).toBe('Comment is required.');
  });
});

describe('validateReportReason', () => {
  it('requires a meaningful reason', () => {
    expect(validateReportReason('bad')).toBe(
      'Please provide at least 10 characters.',
    );
  });
});
