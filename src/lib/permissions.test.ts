import { describe, expect, it } from 'vitest';
import {
  canModerate,
  canParticipate,
  isUctVerifiedEmail,
} from './permissions';
import type { Profile } from '../types/forum';

const student: Profile = {
  id: 'student-1',
  username: 'student',
  displayName: 'Student',
  role: 'student',
  isBanned: false,
  banReason: null,
  createdAt: '2026-06-14T00:00:00.000Z',
};

describe('isUctVerifiedEmail', () => {
  it('accepts a confirmed UCT address case-insensitively', () => {
    expect(isUctVerifiedEmail('Name@UCT.AC.ZA', true)).toBe(true);
  });

  it('accepts a confirmed myUCT student address case-insensitively', () => {
    expect(isUctVerifiedEmail('YXXCHE006@MYUCT.AC.ZA', true)).toBe(true);
  });

  it('rejects unconfirmed and non-UCT addresses', () => {
    expect(isUctVerifiedEmail('name@uct.ac.za', false)).toBe(false);
    expect(isUctVerifiedEmail('name@gmail.com', true)).toBe(false);
  });
});

describe('capabilities', () => {
  it('blocks banned students from participation', () => {
    expect(canParticipate({ ...student, isBanned: true })).toBe(false);
  });

  it('allows only admins to moderate', () => {
    expect(canModerate(student)).toBe(false);
    expect(canModerate({ ...student, role: 'admin' })).toBe(true);
  });
});
