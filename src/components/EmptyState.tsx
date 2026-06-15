import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  message: string;
  action?: ReactNode;
}

export function EmptyState({ title, message, action }: EmptyStateProps) {
  return (
    <div className="panel grid place-items-center px-6 py-12 text-center">
      <div className="max-w-md">
        <div className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-lg bg-brand-50">
          <img src="/brand/inuni-logo-mark-dark.png" alt="" className="h-16 w-16 object-contain" />
        </div>
        <h2 className="text-xl font-semibold text-ink">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{message}</p>
        {action ? <div className="mt-5">{action}</div> : null}
      </div>
    </div>
  );
}
