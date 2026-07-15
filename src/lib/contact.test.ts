import { describe, expect, it } from 'vitest';
import { getContactMailto, normalizeContactEmail } from './contact';

describe('contact helpers', () => {
  it('does not build a mail link when no project inbox is configured', () => {
    expect(normalizeContactEmail(undefined)).toBe('');
    expect(normalizeContactEmail('')).toBe('');
    expect(getContactMailto('InUni idea', '')).toBeNull();
  });

  it('builds a mail link only for a configured contact address', () => {
    expect(normalizeContactEmail(' team@example.com ')).toBe(
      'team@example.com',
    );
    expect(getContactMailto('InUni idea', 'team@example.com')).toBe(
      'mailto:team@example.com?subject=InUni%20idea',
    );
  });
});
