export const PROFILE_PHOTO_MAX_SIZE_BYTES = 2 * 1024 * 1024;

const allowedProfilePhotoMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

export function validateDisplayName(displayName: string): string | null {
  const trimmed = displayName.trim();
  return trimmed.length >= 1 && trimmed.length <= 80
    ? null
    : 'Display name must be between 1 and 80 characters.';
}

export function validateProfilePhoto(file: File): string | null {
  if (!allowedProfilePhotoMimeTypes.has(file.type.toLowerCase())) {
    return 'Profile photos must be PNG, JPG, or WebP images.';
  }

  return file.size <= PROFILE_PHOTO_MAX_SIZE_BYTES
    ? null
    : 'Profile photos must be 2MB or smaller.';
}

export function getAvatarInitials(displayName: string): string {
  const parts = displayName
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return 'IN';
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      resolve(String(reader.result ?? ''));
    });
    reader.addEventListener('error', () => {
      reject(new Error('Could not read profile photo.'));
    });
    reader.readAsDataURL(file);
  });
}
