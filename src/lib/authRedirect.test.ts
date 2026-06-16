import { describe, expect, it } from 'vitest';
import { getAuthRedirectUrl } from './authRedirect';

describe('getAuthRedirectUrl', () => {
  it('returns the profile route by default', () => {
    expect(getAuthRedirectUrl('https://inuni.co.za/')).toBe(
      'https://inuni.co.za/profile',
    );
  });

  it('uses an absolute-path destination', () => {
    expect(
      getAuthRedirectUrl(
        'https://inuni-uct.pages.dev/',
        '/reset-password',
      ),
    ).toBe('https://inuni-uct.pages.dev/reset-password');
  });

  it('normalizes a destination without a leading slash', () => {
    expect(
      getAuthRedirectUrl('http://127.0.0.1:5173/', 'reset-password'),
    ).toBe(
      'http://127.0.0.1:5173/reset-password',
    );
  });
});
