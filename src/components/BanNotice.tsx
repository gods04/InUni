export function BanNotice({ reason }: { reason: string | null }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
      <strong>Your account is restricted.</strong>
      <p className="mt-1">
        {reason || 'Contact an administrator for more information.'}
      </p>
    </div>
  );
}
