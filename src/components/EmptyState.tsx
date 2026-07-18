import type { ReactNode } from 'react';
import { BrandLogo } from './BrandLogo';

interface EmptyStateProps {
  title: string;
  message: string;
  action?: ReactNode;
}

export function EmptyState({ title, message, action }: EmptyStateProps) {
  return (
    <div className="panel grid place-items-center px-5 py-5 text-center sm:px-6">
      <div className="max-w-sm">
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-lg bg-brand-50">
          <BrandLogo
            aria-hidden="true"
            className="h-10 w-10 object-contain"
            variant="mark"
          />
        </div>
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        <p className="mt-1.5 text-sm leading-6 text-slate-600">{message}</p>
        {action ? <div className="mt-4">{action}</div> : null}
      </div>
    </div>
  );
}
