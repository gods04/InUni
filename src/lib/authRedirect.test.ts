import { describe, expect, it } from 'vitest';
import { getAuthRedirectUrl } from './authRedirect';

describe('getAuthRedirectUrl', () => {
  it('returns the profile route for the current app origin', () => {
    expect(getAuthRedirectUrl('https://inuni-uct.pages.dev')).toBe(
      'https://inuni-uct.pages.dev/profile',
    );
  });

  it('removes a trailing slash before adding the profile route', () => {
    expect(getAuthRedirectUrl('http://127.0.0.1:5173/')).toBe(
      'http://127.0.0.1:5173/profile',
    );
  });
});
