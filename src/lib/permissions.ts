import type { Profile } from '../types/forum';

export function isUctVerifiedEmail(
  email: string | null | undefined,
  emailConfirmed: boolean,
): boolean {
  return Boolean(
    emailConfirmed && email?.trim().toLowerCase().endsWith('@uct.ac.za'),
  );
}

export function canParticipate(profile: Profile | null): boolean {
  return Boolean(profile && !profile.isBanned);
}

export function canModerate(profile: Profile | null): boolean {
  return profile?.role === 'admin';
}
