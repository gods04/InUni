export function formatRelativeTime(value: string): string {
  const timestamp = new Date(value).getTime();
  const diffInSeconds = Math.max(1, Math.floor((Date.now() - timestamp) / 1000));

  if (diffInSeconds < 60) {
    return 'just now';
  }

  const units = [
    { label: 'year', seconds: 60 * 60 * 24 * 365 },
    { label: 'month', seconds: 60 * 60 * 24 * 30 },
    { label: 'day', seconds: 60 * 60 * 24 },
    { label: 'hour', seconds: 60 * 60 },
    { label: 'minute', seconds: 60 },
  ];

  const unit = units.find((item) => diffInSeconds >= item.seconds);
  if (!unit) {
    return 'just now';
  }

  const count = Math.floor(diffInSeconds / unit.seconds);
  return `${count} ${unit.label}${count === 1 ? '' : 's'} ago`;
}

export function getPreview(content: string, maxLength = 170): string {
  const compact = content.replace(/\s+/g, ' ').trim();
  if (compact.length <= maxLength) {
    return compact;
  }

  return `${compact.slice(0, maxLength).trim()}...`;
}

export function getDisplayName(email: string): string {
  return email.split('@')[0] || 'Student';
}
