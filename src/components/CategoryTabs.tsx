import { categories, type CategoryFilter } from '../types/forum';

interface CategoryTabsProps {
  value: CategoryFilter;
  onChange: (category: CategoryFilter) => void;
}

export function CategoryTabs({ value, onChange }: CategoryTabsProps) {
  const options: CategoryFilter[] = ['All', ...categories];

  return (
    <div className="relative max-w-full overflow-hidden">
      <div
        aria-label="Filter posts by category"
        className="flex min-w-0 w-full gap-1 overflow-x-auto rounded-lg border border-line bg-panel p-1 pr-10 shadow-sm"
        role="group"
      >
        {options.map((category) => {
          const isActive = value === category;

          return (
            <button
              className={[
                'shrink-0 rounded-full px-3.5 py-2 text-sm font-semibold transition duration-200',
                isActive
                  ? 'bg-brand-700 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-ink',
              ].join(' ')}
              key={category}
              type="button"
              onClick={() => onChange(category)}
            >
              {category}
            </button>
          );
        })}
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-1 right-1 w-10 rounded-r-lg bg-gradient-to-l from-panel via-panel/95 to-panel/0 sm:hidden"
      />
    </div>
  );
}
