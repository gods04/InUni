import type { Profile } from '../types/forum';

export function isUctVerifiedEmail(
  email: string | null | undefined,
  emailConfirmed: boolean,
): boolean {
  const normalizedEmail = email?.trim().toLowerCase();

  return Boolean(
    emailConfirmed &&
      (normalizedEmail?.endsWith('@uct.ac.za') ||
        normalizedEmail?.endsWith('@myuct.ac.za')),
  );
}

export function canParticipate(profile: Profile | null): boolean {
  return Boolean(profile && !profile.isBanned);
}

export function canModerate(profile: Profile | null): boolean {
  return profile?.role === 'admin';
}
