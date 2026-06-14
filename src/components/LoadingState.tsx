export function LoadingState({ label = 'Loading InUni...' }: { label?: string }) {
  return (
    <div className="panel p-5">
      <div className="flex items-center gap-3 text-sm font-bold text-slate-600">
        <span className="h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]" />
        {label}
      </div>
    </div>
  );
}
