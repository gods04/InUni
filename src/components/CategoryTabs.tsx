import { categories, type CategoryFilter } from '../types/forum';

interface CategoryTabsProps {
  value: CategoryFilter;
  onChange: (category: CategoryFilter) => void;
}

export function CategoryTabs({ value, onChange }: CategoryTabsProps) {
  const options: CategoryFilter[] = ['All', ...categories];

  return (
    <div
      className="flex gap-1 overflow-x-auto rounded-lg border border-line bg-white p-1"
      aria-label="Filter posts by category"
    >
      {options.map((category) => {
        const isActive = value === category;

        return (
          <button
            className={[
              'shrink-0 rounded-full border px-3 py-2 text-sm font-semibold transition',
              isActive
                ? 'border-brand-100 bg-brand-50 text-brand-700'
                : 'border-transparent bg-transparent text-slate-600 hover:bg-slate-100 hover:text-ink',
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
  );
}
