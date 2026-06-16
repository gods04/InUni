import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { useAuth } from '../hooks/useAuth';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const {
    hasPasswordRecoverySession,
    loading,
    signOut,
    updatePassword,
  } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmation) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await updatePassword(password);
      if (result.error) {
        setError(result.error);
        return;
      }

      await signOut();
      navigate('/login', {
        replace: true,
        state: { passwordReset: true },
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <LoadingState label="Checking your reset link..." />;
  }

  if (!hasPasswordRecoverySession) {
    return (
      <div className="mx-auto w-full max-w-md panel p-5 sm:p-6">
        <img
          src="/brand/inuni-logo-horizontal-dark.png"
          alt="InUni"
          className="h-16 w-auto object-contain"
        />
        <h1 className="section-title">Reset link expired</h1>
        <p className="mt-2 text-sm text-slate-600">
          This password reset link is invalid or has expired.
        </p>
        <Link
          className="primary-button mt-5 w-full"
          to="/login"
          state={{ authMode: 'recovery' }}
        >
          Request a new reset link
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-md gap-5">
      <div className="panel p-5 sm:p-6">
        <img
          src="/brand/inuni-logo-horizontal-dark.png"
          alt="InUni"
          className="h-16 w-auto object-contain"
        />
        <h1 className="section-title">Choose a new password</h1>
        <p className="mt-1 text-sm text-slate-600">
          Use at least 6 characters for your new password.
        </p>
      </div>

      <form className="panel grid gap-4 p-5 sm:p-6" onSubmit={handleSubmit}>
        <label className="grid gap-2">
          <span className="field-label">New password</span>
          <input
            className="field-input"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>

        <label className="grid gap-2">
          <span className="field-label">Confirm password</span>
          <input
            className="field-input"
            type="password"
            autoComplete="new-password"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
          />
        </label>

        {error ? <ErrorState message={error} /> : null}

        <button className="primary-button" type="submit" disabled={submitting}>
          {submitting ? 'Updating...' : 'Update password'}
        </button>
      </form>
    </div>
  );
}
