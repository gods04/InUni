export function LoadingState({ label = 'Loading InUni...' }: { label?: string }) {
  return (
    <div className="panel p-5">
      <div className="flex items-center gap-3 text-sm font-semibold text-slate-600">
        <span className="h-3 w-3 rounded-full bg-brand-600 shadow-[0_0_0_4px_rgba(95,127,163,0.14)]" />
        {label}
      </div>
    </div>
  );
}
