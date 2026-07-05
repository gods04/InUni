import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  action?: ReactNode;
  children?: ReactNode;
  description: ReactNode;
  eyebrow?: ReactNode;
  icon?: LucideIcon;
  media?: ReactNode;
  title: ReactNode;
}

export function PageHeader({
  action,
  children,
  description,
  eyebrow,
  icon: Icon,
  media,
  title,
}: PageHeaderProps) {
  return (
    <section className="panel overflow-hidden">
      <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="min-w-0">
          {eyebrow || Icon || media ? (
            <div className="flex flex-wrap items-center gap-3">
              {media ? (
                media
              ) : Icon ? (
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                  <Icon aria-hidden="true" className="h-5 w-5" strokeWidth={2.25} />
                </span>
              ) : null}
              {eyebrow ? (
                <span className="rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                  {eyebrow}
                </span>
              ) : null}
            </div>
          ) : null}
          <h1 className="mt-4 text-2xl font-semibold tracking-normal text-ink sm:text-3xl">
            {title}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
            {description}
          </p>
        </div>
        {action ? (
          <div className="flex flex-wrap gap-2 lg:justify-end">{action}</div>
        ) : null}
      </div>
      {children ? (
        <div className="border-t border-line bg-slate-50/70 px-5 py-4 sm:px-6">
          {children}
        </div>
      ) : null}
    </section>
  );
}
