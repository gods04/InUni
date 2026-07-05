import { useState } from 'react';
import type { FormEvent } from 'react';
import { KeyRound } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { PageHeader } from '../components/PageHeader';
import { PasswordField } from '../components/PasswordField';
import { Seo } from '../components/Seo';
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
    return (
      <>
        <Seo
          canonicalPath="/reset-password"
          description="Reset an InUni account password."
          noindex
          title="Reset password | InUni"
        />
        <LoadingState label="Checking your reset link..." />
      </>
    );
  }

  if (!hasPasswordRecoverySession) {
    return (
      <div className="mx-auto grid w-full max-w-md gap-5">
        <Seo
          canonicalPath="/reset-password"
          description="Reset an InUni account password."
          noindex
          title="Reset password | InUni"
        />
        <PageHeader
          description="This password reset link is invalid or has expired."
          eyebrow="Account recovery"
          icon={KeyRound}
          title="Reset link expired"
        />
        <Link
          className="primary-button w-full"
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
      <Seo
        canonicalPath="/reset-password"
        description="Reset an InUni account password."
        noindex
        title="Reset password | InUni"
      />
      <PageHeader
        description="Use at least 6 characters for your new password."
        eyebrow="Account recovery"
        icon={KeyRound}
        title="Choose a new password"
      />

      <form className="panel grid gap-4 p-5 sm:p-6" onSubmit={handleSubmit}>
        <PasswordField
          autoComplete="new-password"
          label="New password"
          onChange={setPassword}
          value={password}
        />

        <PasswordField
          autoComplete="new-password"
          label="Confirm password"
          onChange={setConfirmation}
          value={confirmation}
        />

        {error ? <ErrorState message={error} /> : null}

        <button className="primary-button" type="submit" disabled={submitting}>
          {submitting ? 'Updating...' : 'Update password'}
        </button>
      </form>
    </div>
  );
}
