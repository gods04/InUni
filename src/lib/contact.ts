export function normalizeContactEmail(email?: string | null) {
  const trimmedEmail = email?.trim() ?? '';
  return trimmedEmail.includes('@') ? trimmedEmail : '';
}

export const contactEmail = normalizeContactEmail(
  import.meta.env.VITE_CONTACT_EMAIL,
);

export function getContactMailto(
  subject = 'InUni contact',
  email = contactEmail,
) {
  const normalizedEmail = normalizeContactEmail(email);
  if (!normalizedEmail) return null;

  return `mailto:${normalizedEmail}?subject=${encodeURIComponent(subject)}`;
}
