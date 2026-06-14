export function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-rose-200 bg-rose-50/95 px-4 py-3 text-sm font-semibold text-rose-800">
      {message}
    </div>
  );
}
