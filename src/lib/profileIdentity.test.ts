import { describe, expect, it } from 'vitest';
import {
  PROFILE_PHOTO_MAX_SIZE_BYTES,
  getAvatarInitials,
  validateDisplayName,
  validateProfilePhoto,
} from './profileIdentity';

describe('profile identity helpers', () => {
  it('validates display names for profile editing', () => {
    expect(validateDisplayName(' Student One ')).toBeNull();
    expect(validateDisplayName('')).toBe(
      'Display name must be between 1 and 80 characters.',
    );
    expect(validateDisplayName('x'.repeat(81))).toBe(
      'Display name must be between 1 and 80 characters.',
    );
  });

  it('accepts only small image files for profile photos', () => {
    const photo = new File(['avatar'], 'avatar.png', { type: 'image/png' });
    const textFile = new File(['notes'], 'notes.txt', { type: 'text/plain' });
    const largePhoto = new File(
      [new Uint8Array(PROFILE_PHOTO_MAX_SIZE_BYTES + 1)],
      'large.png',
      { type: 'image/png' },
    );

    expect(validateProfilePhoto(photo)).toBeNull();
    expect(validateProfilePhoto(textFile)).toBe(
      'Profile photos must be PNG, JPG, or WebP images.',
    );
    expect(validateProfilePhoto(largePhoto)).toBe(
      'Profile photos must be 2MB or smaller.',
    );
  });

  it('creates stable avatar initials from a display name', () => {
    expect(getAvatarInitials('Student One')).toBe('SO');
    expect(getAvatarInitials('amahle')).toBe('A');
    expect(getAvatarInitials('')).toBe('IN');
  });
});
