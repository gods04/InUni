import { Link } from 'react-router-dom';

export function LoginPrompt({ message }: { message: string }) {
  return (
    <div className="panel grid gap-4 p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <img src="/brand/inuni-logo-mark-dark.png" alt="" className="h-12 w-12 object-contain" />
        <div>
          <p className="text-sm font-semibold text-brand-700">Account needed</p>
          <p className="mt-1 text-sm leading-6 text-slate-700">{message}</p>
        </div>
      </div>
      <Link className="primary-button w-fit" to="/login">
        Go to login
      </Link>
    </div>
  );
}
