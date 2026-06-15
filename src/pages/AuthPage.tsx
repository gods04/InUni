import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ErrorState } from '../components/ErrorState';
import { useAuth } from '../hooks/useAuth';

type AuthMode = 'login' | 'signup';

export function AuthPage() {
  const navigate = useNavigate();
  const { signIn, signUp, isDemoMode } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.');
      return;
    }

    setSubmitting(true);

    try {
      const result =
        mode === 'login'
          ? await signIn(email.trim(), password)
          : await signUp(email.trim(), password);

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.message) {
        setMessage(result.message);
        return;
      }

      navigate('/profile');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto grid w-full max-w-md gap-5">
      <div className="panel p-5 sm:p-6">
        <img src="/brand/inuni-logo-horizontal-dark.png" alt="InUni" className="h-16 w-auto object-contain" />
        <h1 className="section-title">{mode === 'login' ? 'Log in' : 'Sign up'}</h1>
        <p className="mt-1 text-sm text-slate-600">
          {isDemoMode
            ? 'Demo mode accepts any email and password locally.'
            : 'Use Supabase Auth with email and password.'}
        </p>
      </div>

      <form className="panel grid gap-4 p-5 sm:p-6" onSubmit={handleSubmit}>
        <label className="grid gap-2">
          <span className="field-label">Email</span>
          <input
            className="field-input"
            type="email"
            autoComplete="email"
            placeholder="you@university.edu"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>

        <label className="grid gap-2">
          <span className="field-label">Password</span>
          <input
            className="field-input"
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            placeholder="At least 6 characters"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>

        {error ? <ErrorState message={error} /> : null}
        {message ? (
          <div className="rounded-lg border border-brand-100 bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-700">
            {message}
          </div>
        ) : null}

        <button className="primary-button" type="submit" disabled={submitting}>
          {submitting ? 'Please wait...' : mode === 'login' ? 'Log in' : 'Create account'}
        </button>

        <button
          className="secondary-button"
          type="button"
          onClick={() => {
            setMode((current) => (current === 'login' ? 'signup' : 'login'));
            setError(null);
            setMessage(null);
          }}
        >
          {mode === 'login' ? 'Need an account? Sign up' : 'Already have an account? Log in'}
        </button>
      </form>
    </div>
  );
}
