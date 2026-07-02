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

export function isMissingPostSlugError(error: unknown): boolean {
  const candidate = error as { code?: string; message?: string } | null;
  const message =
    typeof candidate?.message === 'string'
      ? candidate.message.toLowerCase()
      : String(error ?? '').toLowerCase();

  return (
    message.includes('slug') &&
    (message.includes('does not exist') ||
      message.includes('could not find') ||
      message.includes('schema cache') ||
      candidate?.code === '42703')
  );
}

export function isMissingRpcFunctionError(
  error: unknown,
  functionName: string,
): boolean {
  const candidate = error as { code?: string; message?: string } | null;
  const message =
    typeof candidate?.message === 'string'
      ? candidate.message.toLowerCase()
      : String(error ?? '').toLowerCase();
  const normalizedFunctionName = functionName.toLowerCase();

  return (
    message.includes(normalizedFunctionName) &&
    (message.includes('could not find') ||
      message.includes('schema cache') ||
      candidate?.code === 'PGRST202')
  );
}
