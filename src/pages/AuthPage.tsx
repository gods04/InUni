import { useState } from 'react';
import type { FormEvent } from 'react';
import { LogIn } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ErrorState } from '../components/ErrorState';
import { PageHeader } from '../components/PageHeader';
import { PasswordField } from '../components/PasswordField';
import { Seo } from '../components/Seo';
import { useAuth } from '../hooks/useAuth';
import {
  acceptLegalAgreement,
  hasAcceptedLegalAgreement,
} from '../lib/legalAgreement';

type AuthMode = 'login' | 'signup' | 'recovery';

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getProtectedRouteMessage(from?: string): string | null {
  if (from === '/create') {
    return 'Log in to create a post or share something with the forum.';
  }

  if (from === '/profile') {
    return 'Log in to view your profile, posts, and uploaded files.';
  }

  return from ? 'Log in to continue.' : null;
}

function getAuthErrorMessage(error: string, mode: AuthMode): string {
  const normalizedError = error.toLowerCase();

  if (normalizedError.includes('invalid login credentials')) {
    return 'Email or password is incorrect. Check both and try again.';
  }

  if (normalizedError.includes('email not confirmed')) {
    return 'Please confirm your email before logging in.';
  }

  if (
    mode === 'signup' &&
    (normalizedError.includes('already registered') ||
      normalizedError.includes('already exists'))
  ) {
    return 'An account already exists for this email. Log in instead.';
  }

  if (
    normalizedError.includes('invalid email') ||
    normalizedError.includes('valid email') ||
    normalizedError.includes('email address')
  ) {
    return 'Enter a valid email address.';
  }

  if (
    mode === 'signup' &&
    normalizedError.includes('password') &&
    (normalizedError.includes('6') ||
      normalizedError.includes('weak') ||
      normalizedError.includes('short'))
  ) {
    return 'Password must be at least 6 characters.';
  }

  if (
    normalizedError.includes('supabase is not configured') ||
    (normalizedError.includes('provider') &&
      normalizedError.includes('not configured'))
  ) {
    return 'Authentication is not fully configured yet. Please contact the site administrator.';
  }

  return error;
}

export function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const authState = location.state as {
    authMode?: AuthMode;
    from?: string;
    passwordReset?: boolean;
  } | null;
  const passwordReset = authState?.passwordReset;
  const protectedFromPath =
    typeof authState?.from === 'string' ? authState.from : undefined;
  const protectedRouteMessage = getProtectedRouteMessage(protectedFromPath);
  const {
    requestPasswordReset,
    signIn,
    signInWithGoogle,
    signUp,
    isDemoMode,
  } = useAuth();
  const [mode, setMode] = useState<AuthMode>(
    authState?.authMode === 'recovery' ? 'recovery' : 'login',
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(() =>
    hasAcceptedLegalAgreement(),
  );
  const [message, setMessage] = useState<string | null>(
    passwordReset ? 'Password updated. You can now log in.' : null,
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    const trimmedEmail = email.trim();

    if (mode === 'recovery' && !trimmedEmail) {
      setError('Email is required.');
      return;
    }

    if (mode !== 'recovery' && (!trimmedEmail || !password.trim())) {
      setError('Email and password are required.');
      return;
    }

    if (trimmedEmail && !isValidEmail(trimmedEmail)) {
      setError('Enter a valid email address.');
      return;
    }

    if (mode === 'signup' && password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (mode === 'signup' && !termsAccepted) {
      setError(
        'You need to agree to the Terms, Privacy Policy, Disclaimer, and Community Rules before creating an account.',
      );
      return;
    }

    setSubmitting(true);

    try {
      const result =
        mode === 'recovery'
          ? await requestPasswordReset(trimmedEmail)
          : mode === 'login'
            ? await signIn(trimmedEmail, password)
            : await signUp(trimmedEmail, password);

      if (result.error) {
        setError(getAuthErrorMessage(result.error, mode));
        return;
      }

      if (mode === 'signup') {
        acceptLegalAgreement();
      }

      if (mode === 'recovery') {
        setMessage(
          result.message ??
            'If an account exists for that email, a password reset link has been sent.',
        );
        return;
      }

      if (result.message) {
        setMessage(result.message);
        return;
      }

      navigate(protectedFromPath ?? '/profile');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogleSignIn() {
    setError(null);
    setMessage(null);
    setSubmitting(true);

    try {
      const result = await signInWithGoogle();
      if (result.error) {
        setError(getAuthErrorMessage(result.error, mode));
        return;
      }

      if (result.message) {
        setMessage(result.message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto grid w-full max-w-md gap-5">
      <Seo
        canonicalPath="/login"
        description="Log in to InUni to post, comment, upload files, and manage your UCT student forum profile."
        noindex
        title="Log in | InUni"
      />
      <PageHeader
        description={
          mode === 'recovery'
            ? 'Enter your account email and we will send you a secure reset link.'
            : isDemoMode
              ? 'Demo mode accepts any email and password locally.'
              : 'Log in to post, comment, upload files, and manage your profile.'
        }
        eyebrow="UCT student forum access"
        icon={LogIn}
        title={
          mode === 'login'
            ? 'Log in'
            : mode === 'signup'
              ? 'Sign up'
              : 'Reset your password'
        }
      >
        {protectedRouteMessage ? (
          <p className="text-sm font-semibold leading-6 text-brand-700">
            {protectedRouteMessage}
          </p>
        ) : null}
      </PageHeader>

      <form
        className="panel grid gap-4 p-5 sm:p-6"
        noValidate
        onSubmit={handleSubmit}
      >
        {mode !== 'recovery' ? (
          <>
            <button
              className="secondary-button"
              disabled={submitting}
              onClick={() => void handleGoogleSignIn()}
              type="button"
            >
              Continue with Google
            </button>
            <div
              aria-hidden="true"
              className="flex items-center gap-3 text-xs font-semibold uppercase text-slate-400"
            >
              <span className="h-px flex-1 bg-line" />
              <span>or</span>
              <span className="h-px flex-1 bg-line" />
            </div>
          </>
        ) : null}

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

        {mode !== 'recovery' ? (
          <PasswordField
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            label="Password"
            onChange={setPassword}
            placeholder="At least 6 characters"
            value={password}
          />
        ) : null}

        {mode === 'login' ? (
          <button
            className="w-fit text-sm font-semibold text-brand-700 hover:text-brand-600"
            type="button"
            onClick={() => {
              setMode('recovery');
              setError(null);
              setMessage(null);
            }}
          >
            Forgot password?
          </button>
        ) : null}

        {mode === 'signup' ? (
          <label className="flex gap-3 rounded-lg border border-line bg-slate-50 p-3 text-sm leading-6 text-slate-600">
            <input
              checked={termsAccepted}
              className="mt-1 h-4 w-4 shrink-0 rounded border-line text-brand-700 focus:ring-brand-100"
              onChange={(event) => setTermsAccepted(event.target.checked)}
              type="checkbox"
            />
            <span>
              I agree to the{' '}
              <Link
                className="font-semibold text-brand-700 hover:text-brand-600"
                to="/terms"
              >
                Terms, Privacy Policy, Disclaimer, and Community Rules
              </Link>
              .
            </span>
          </label>
        ) : null}

        {error ? <ErrorState message={error} /> : null}
        {message ? (
          <div className="rounded-lg border border-brand-100 bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-700">
            {message}
          </div>
        ) : null}

        <button className="primary-button" type="submit" disabled={submitting}>
          {submitting
            ? 'Please wait...'
            : mode === 'login'
              ? 'Log in'
              : mode === 'signup'
                ? 'Create account'
                : 'Send reset link'}
        </button>

        {mode === 'recovery' ? (
          <button
            className="secondary-button"
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
              setMessage(null);
            }}
          >
            Back to login
          </button>
        ) : (
          <button
            className="secondary-button"
            type="button"
            onClick={() => {
              setMode((current) =>
                current === 'login' ? 'signup' : 'login',
              );
              setError(null);
              setMessage(null);
            }}
          >
            {mode === 'login'
              ? 'Need an account? Sign up'
              : 'Already have an account? Log in'}
          </button>
        )}
      </form>
    </div>
  );
}
