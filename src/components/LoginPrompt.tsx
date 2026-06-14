import { Link } from 'react-router-dom';

export function LoginPrompt({ message }: { message: string }) {
  return (
    <div className="panel p-5">
      <img src="/brand/inuni-logo-mark-dark.png" alt="" className="mb-4 h-16 w-16 object-contain" />
      <p className="text-sm leading-6 text-slate-700">{message}</p>
      <Link className="primary-button mt-4" to="/login">
        Go to login
      </Link>
    </div>
  );
}
