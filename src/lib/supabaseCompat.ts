export function isMissingAvatarPathError(error: unknown): boolean {
  const candidate = error as { code?: string; message?: string } | null;
  const message =
    typeof candidate?.message === 'string'
      ? candidate.message.toLowerCase()
      : String(error ?? '').toLowerCase();

  return (
    message.includes('avatar_path') &&
    (message.includes('does not exist') || candidate?.code === '42703')
  );
}
