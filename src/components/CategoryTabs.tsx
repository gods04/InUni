import { categories, type CategoryFilter } from '../types/forum';

interface CategoryTabsProps {
  value: CategoryFilter;
  onChange: (category: CategoryFilter) => void;
}

export function CategoryTabs({ value, onChange }: CategoryTabsProps) {
  const options: CategoryFilter[] = ['All', ...categories];

  return (
    <div
      className="flex gap-2 overflow-x-auto rounded-lg border border-white/90 bg-white/70 p-1 shadow-sm"
      aria-label="Filter posts by category"
    >
      {options.map((category) => {
        const isActive = value === category;

        return (
          <button
            className={[
              'shrink-0 rounded-lg border px-3 py-2 text-sm font-bold transition',
              isActive
                ? 'border-slate-950 bg-slate-950 text-white shadow-sm'
                : 'border-transparent bg-transparent text-slate-600 hover:border-emerald-100 hover:bg-emerald-50 hover:text-slate-950',
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
