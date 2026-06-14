interface AdSlotProps {
  label?: string;
  size?: string;
}

export function AdSlot({ label = 'Advertisement', size = '300 x 250' }: AdSlotProps) {
  return (
    <aside className="rounded-lg border border-dashed border-slate-300 bg-white/55 p-3 text-center shadow-sm">
      <p className="text-[0.68rem] font-bold uppercase text-slate-400">{label}</p>
      <div className="mt-2 grid min-h-36 place-items-center rounded-md bg-slate-50/85 px-4 py-6">
        <div>
          <p className="text-sm font-bold text-slate-500">Future ad space</p>
          <p className="mt-1 text-xs text-slate-400">{size}</p>
        </div>
      </div>
    </aside>
  );
}
