interface FileReviewCountBadgeProps {
  count: number;
  label?: string;
}

export function FileReviewCountBadge({
  count,
  label = 'files need review',
}: FileReviewCountBadgeProps) {
  if (count <= 0) return null;

  return (
    <>
      <span
        aria-hidden="true"
        className="inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-xs font-bold leading-none text-white"
      >
        {count}
      </span>
      <span className="sr-only">
        {count} {label}
      </span>
    </>
  );
}
