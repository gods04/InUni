interface PostDraft {
  title: string;
  content: string;
}

export function validatePost({ title, content }: PostDraft): string | null {
  if (!title.trim()) return 'Title is required.';
  if (title.trim().length > 120) {
    return 'Title must be 120 characters or fewer.';
  }
  if (!content.trim()) return 'Content is required.';
  return null;
}

export function validateComment(content: string): string | null {
  return content.trim() ? null : 'Comment is required.';
}

export function validateReportReason(reason: string): string | null {
  return reason.trim().length >= 10
    ? null
    : 'Please provide at least 10 characters.';
}
