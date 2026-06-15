# Password Recovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a tested Supabase password-recovery request flow and a secure new-password page that matches InUni's existing authentication UI.

**Architecture:** Extend the existing redirect helper and `AuthContextValue` instead of introducing another service layer. `AuthPage` gains a local recovery mode, while a focused public `ResetPasswordPage` handles recovery-session readiness, local password validation, the Supabase password update, sign-out, and navigation back to login.

**Tech Stack:** React 19, React Router 7, TypeScript, Supabase Auth, Tailwind CSS, Vitest, Testing Library

---

## File Structure

- Modify `src/lib/authRedirect.ts`: build approved auth redirect URLs for profile and password-reset destinations.
- Modify `src/lib/authRedirect.test.ts`: verify production and local redirect paths.
- Modify `src/hooks/useAuth.tsx`: expose recovery request, password update, and auth-session readiness.
- Modify `src/hooks/useAuth.test.tsx`: cover demo recovery behavior and the new context contract.
- Modify `src/pages/AuthPage.tsx`: add recovery mode and login-success state.
- Modify `src/pages/AuthPage.test.tsx`: cover recovery form interaction and neutral success messaging.
- Create `src/pages/ResetPasswordPage.tsx`: validate and submit a new password.
- Create `src/pages/ResetPasswordPage.test.tsx`: cover invalid sessions, validation, provider errors, and successful navigation.
- Modify `src/App.tsx`: register `/reset-password`.
- Modify `src/App.test.tsx`: verify the public reset route renders.

### Task 1: Destination-Aware Auth Redirects

**Files:**
- Modify: `src/lib/authRedirect.ts`
- Modify: `src/lib/authRedirect.test.ts`

- [ ] **Step 1: Write failing redirect tests**

Replace `src/lib/authRedirect.test.ts` with:

```ts
import { describe, expect, it } from 'vitest';
import { getAuthRedirectUrl } from './authRedirect';

describe('getAuthRedirectUrl', () => {
  it('builds the default profile redirect', () => {
    expect(getAuthRedirectUrl('https://inuni.co.za/')).toBe(
      'https://inuni.co.za/profile',
    );
  });

  it('builds a password-reset redirect', () => {
    expect(
      getAuthRedirectUrl(
        'https://inuni-uct.pages.dev/',
        '/reset-password',
      ),
    ).toBe('https://inuni-uct.pages.dev/reset-password');
  });

  it('normalizes a destination without a leading slash', () => {
    expect(
      getAuthRedirectUrl('http://127.0.0.1:5173/', 'reset-password'),
    ).toBe('http://127.0.0.1:5173/reset-password');
  });
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```powershell
npm test -- src/lib/authRedirect.test.ts
```

Expected: the password-reset tests fail because `getAuthRedirectUrl` ignores the second argument.

- [ ] **Step 3: Implement destination-aware redirects**

Replace `src/lib/authRedirect.ts` with:

```ts
export function getAuthRedirectUrl(
  origin = window.location.origin,
  destination = '/profile',
) {
  const normalizedOrigin = origin.replace(/\/+$/, '');
  const normalizedDestination = destination.startsWith('/')
    ? destination
    : `/${destination}`;

  return `${normalizedOrigin}${normalizedDestination}`;
}
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run:

```powershell
npm test -- src/lib/authRedirect.test.ts
```

Expected: 3 tests pass.

- [ ] **Step 5: Commit**

```powershell
git add src/lib/authRedirect.ts src/lib/authRedirect.test.ts
git commit -m "feat: support password recovery redirects"
```

### Task 2: Extend the Authentication Context

**Files:**
- Modify: `src/hooks/useAuth.tsx`
- Modify: `src/hooks/useAuth.test.tsx`

- [ ] **Step 1: Add a failing context contract test**

Add this harness and test to `src/hooks/useAuth.test.tsx`:

```tsx
function PasswordRecoveryHarness() {
  const {
    hasAuthSession,
    requestPasswordReset,
    updatePassword,
  } = useAuth();
  const [message, setMessage] = useState('');

  return (
    <div>
      <span>{hasAuthSession ? 'session' : 'no session'}</span>
      <button
        type="button"
        onClick={() => {
          void requestPasswordReset('student@demo.local').then((result) =>
            setMessage(result.message ?? result.error ?? ''),
          );
        }}
      >
        Request reset
      </button>
      <button
        type="button"
        onClick={() => {
          void updatePassword('password123').then((result) =>
            setMessage(result.message ?? result.error ?? ''),
          );
        }}
      >
        Update password
      </button>
      <span>{message}</span>
    </div>
  );
}

it('explains that password recovery is unavailable in demo mode', async () => {
  const user = userEvent.setup();
  render(
    <AuthProvider>
      <PasswordRecoveryHarness />
    </AuthProvider>,
  );

  expect(screen.getByText('no session')).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: 'Request reset' }));
  expect(
    await screen.findByText(
      'Password recovery requires Supabase configuration.',
    ),
  ).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: 'Update password' }));
  expect(
    await screen.findByText(
      'Password recovery requires Supabase configuration.',
    ),
  ).toBeInTheDocument();
});
```

Also add `useState` to the React imports.

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```powershell
npm test -- src/hooks/useAuth.test.tsx
```

Expected: TypeScript/test compilation fails because the three new context members do not exist.

- [ ] **Step 3: Extend the context interface and session state**

Add these members to `AuthContextValue`:

```ts
hasAuthSession: boolean;
requestPasswordReset: (email: string) => Promise<AuthResult>;
updatePassword: (password: string) => Promise<AuthResult>;
```

Add state beside the existing `user` state:

```ts
const [hasAuthSession, setHasAuthSession] = useState(false);
```

In demo initialization, set session readiness from the stored user:

```ts
const demoUser = readDemoUser();
setUser(demoUser);
setHasAuthSession(Boolean(demoUser));
```

At the start of `hydrate`, synchronize session readiness:

```ts
setHasAuthSession(Boolean(sessionUser));
```

After demo sign-in and signup, set:

```ts
setHasAuthSession(true);
```

When signing out, set:

```ts
setHasAuthSession(false);
```

- [ ] **Step 4: Add the recovery methods**

Add these entries to the memoized context value:

```ts
hasAuthSession,
async requestPasswordReset(email: string) {
  if (!isSupabaseConfigured || !supabase) {
    return {
      message: 'Password recovery requires Supabase configuration.',
    };
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: getAuthRedirectUrl(
      window.location.origin,
      '/reset-password',
    ),
  });

  if (error) {
    return { error: error.message };
  }

  return {
    message:
      'If an account exists for that email, a password reset link has been sent.',
  };
},
async updatePassword(password: string) {
  if (!isSupabaseConfigured || !supabase) {
    return {
      message: 'Password recovery requires Supabase configuration.',
    };
  }

  const { error } = await supabase.auth.updateUser({ password });
  return error ? { error: error.message } : {};
},
```

Include `hasAuthSession` in the `useMemo` dependency array.

- [ ] **Step 5: Run the focused test and verify GREEN**

Run:

```powershell
npm test -- src/hooks/useAuth.test.tsx
```

Expected: all auth-context tests pass.

- [ ] **Step 6: Commit**

```powershell
git add src/hooks/useAuth.tsx src/hooks/useAuth.test.tsx
git commit -m "feat: add password recovery auth actions"
```

### Task 3: Add Recovery Mode to the Login Page

**Files:**
- Modify: `src/pages/AuthPage.tsx`
- Modify: `src/pages/AuthPage.test.tsx`

- [ ] **Step 1: Add failing recovery-mode tests**

Extend the hoisted mocks in `src/pages/AuthPage.test.tsx`:

```ts
const { signIn, signUp, requestPasswordReset } = vi.hoisted(() => ({
  signIn: vi.fn().mockResolvedValue({}),
  signUp: vi.fn().mockResolvedValue({}),
  requestPasswordReset: vi.fn().mockResolvedValue({
    message:
      'If an account exists for that email, a password reset link has been sent.',
  }),
}));
```

Return `requestPasswordReset` from the `useAuth` mock and add:

```tsx
it('switches to recovery mode and requests a reset link', async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <AuthPage />
    </MemoryRouter>,
  );

  await user.click(
    screen.getByRole('button', { name: 'Forgot password?' }),
  );
  expect(
    screen.getByRole('heading', { name: 'Reset your password' }),
  ).toBeInTheDocument();
  expect(screen.queryByLabelText('Password')).not.toBeInTheDocument();

  await user.type(screen.getByLabelText('Email'), '  student@uct.ac.za  ');
  await user.click(screen.getByRole('button', { name: 'Send reset link' }));

  expect(requestPasswordReset).toHaveBeenCalledWith('student@uct.ac.za');
  expect(
    await screen.findByText(
      'If an account exists for that email, a password reset link has been sent.',
    ),
  ).toBeInTheDocument();
});

it('requires an email before requesting a reset link', async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <AuthPage />
    </MemoryRouter>,
  );

  await user.click(
    screen.getByRole('button', { name: 'Forgot password?' }),
  );
  await user.click(screen.getByRole('button', { name: 'Send reset link' }));

  expect(screen.getByText('Email is required.')).toBeInTheDocument();
  expect(requestPasswordReset).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```powershell
npm test -- src/pages/AuthPage.test.tsx
```

Expected: the new tests fail because no recovery controls exist.

- [ ] **Step 3: Implement recovery mode**

Update the page mode and context destructuring:

```ts
type AuthMode = 'login' | 'signup' | 'recovery';

const {
  signIn,
  signUp,
  requestPasswordReset,
  isDemoMode,
} = useAuth();
```

At the top of `handleSubmit`, validate recovery mode without changing the
existing login/signup message:

```ts
if (mode === 'recovery' && !email.trim()) {
  setError('Email is required.');
  return;
}

if (mode !== 'recovery' && (!email.trim() || !password.trim())) {
  setError('Email and password are required.');
  return;
}
```

Use this request selection:

```ts
const result =
  mode === 'recovery'
    ? await requestPasswordReset(email.trim())
    : mode === 'login'
      ? await signIn(email.trim(), password)
      : await signUp(email.trim(), password);
```

Only navigate after successful login/signup:

```ts
if (mode === 'recovery') {
  setMessage(
    result.message ??
      'If an account exists for that email, a password reset link has been sent.',
  );
  return;
}

navigate('/profile');
```

Render the recovery heading and description:

```tsx
<h1 className="section-title">
  {mode === 'login'
    ? 'Log in'
    : mode === 'signup'
      ? 'Sign up'
      : 'Reset your password'}
</h1>
<p className="mt-1 text-sm text-slate-600">
  {mode === 'recovery'
    ? 'Enter your account email and we will send you a secure reset link.'
    : isDemoMode
      ? 'Demo mode accepts any email and password locally.'
      : 'Use Supabase Auth with email and password.'}
</p>
```

Render the password field only when `mode !== 'recovery'`. In login mode,
add this button after the password field:

```tsx
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
```

Use `Send reset link` as the recovery submit label. In recovery mode, replace
the signup/login toggle with:

```tsx
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
```

- [ ] **Step 4: Run the focused tests and verify GREEN**

Run:

```powershell
npm test -- src/pages/AuthPage.test.tsx
```

Expected: all authentication-page tests pass.

- [ ] **Step 5: Commit**

```powershell
git add src/pages/AuthPage.tsx src/pages/AuthPage.test.tsx
git commit -m "feat: add forgot password form"
```

### Task 4: Build the New-Password Page and Route

**Files:**
- Create: `src/pages/ResetPasswordPage.tsx`
- Create: `src/pages/ResetPasswordPage.test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`

- [ ] **Step 1: Write failing reset-page tests**

Create `src/pages/ResetPasswordPage.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ResetPasswordPage } from './ResetPasswordPage';

const { updatePassword, signOut, navigate } = vi.hoisted(() => ({
  updatePassword: vi.fn().mockResolvedValue({}),
  signOut: vi.fn().mockResolvedValue(undefined),
  navigate: vi.fn(),
}));

let hasAuthSession = true;
let loading = false;

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    hasAuthSession,
    loading,
    updatePassword,
    signOut,
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>(
    'react-router-dom',
  );
  return { ...actual, useNavigate: () => navigate };
});

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    hasAuthSession = true;
    loading = false;
    updatePassword.mockReset().mockResolvedValue({});
    signOut.mockReset().mockResolvedValue(undefined);
    navigate.mockReset();
  });

  it('shows an invalid-link state without an auth session', () => {
    hasAuthSession = false;
    render(
      <MemoryRouter>
        <ResetPasswordPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', { name: 'Reset link expired' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Request a new reset link' }),
    ).toHaveAttribute('href', '/login');
  });

  it('rejects a short password', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ResetPasswordPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText('New password'), 'short');
    await user.type(screen.getByLabelText('Confirm password'), 'short');
    await user.click(screen.getByRole('button', { name: 'Update password' }));

    expect(
      screen.getByText('Password must be at least 6 characters.'),
    ).toBeInTheDocument();
  });

  it('rejects passwords that do not match', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ResetPasswordPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText('New password'), 'password123');
    await user.type(screen.getByLabelText('Confirm password'), 'password456');
    await user.click(screen.getByRole('button', { name: 'Update password' }));

    expect(screen.getByText('Passwords do not match.')).toBeInTheDocument();
  });

  it('updates the password, signs out, and returns to login', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ResetPasswordPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText('New password'), 'password123');
    await user.type(screen.getByLabelText('Confirm password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Update password' }));

    expect(updatePassword).toHaveBeenCalledWith('password123');
    expect(signOut).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith('/login', {
      replace: true,
      state: { passwordReset: true },
    });
  });

  it('keeps the form visible when Supabase rejects the update', async () => {
    updatePassword.mockResolvedValueOnce({ error: 'Recovery session expired' });
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ResetPasswordPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText('New password'), 'password123');
    await user.type(screen.getByLabelText('Confirm password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Update password' }));

    expect(screen.getByText('Recovery session expired')).toBeInTheDocument();
    expect(signOut).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the reset-page test and verify RED**

Run:

```powershell
npm test -- src/pages/ResetPasswordPage.test.tsx
```

Expected: compilation fails because `ResetPasswordPage` does not exist.

- [ ] **Step 3: Implement `ResetPasswordPage`**

Create `src/pages/ResetPasswordPage.tsx`:

```tsx
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { useAuth } from '../hooks/useAuth';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const {
    hasAuthSession,
    loading,
    updatePassword,
    signOut,
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

  if (!hasAuthSession) {
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
```

- [ ] **Step 4: Run the reset-page tests and verify GREEN**

Run:

```powershell
npm test -- src/pages/ResetPasswordPage.test.tsx
```

Expected: 5 tests pass.

- [ ] **Step 5: Add the public route and a failing route test**

Import and register the page in `src/App.tsx`:

```tsx
import { ResetPasswordPage } from './pages/ResetPasswordPage';
```

```tsx
<Route path="/reset-password" element={<ResetPasswordPage />} />
```

Add the new context members to the `useAuth` mock in `src/App.test.tsx`:

```ts
hasAuthSession: false,
requestPasswordReset: vi.fn(),
updatePassword: vi.fn(),
```

Add this test:

```tsx
it('renders the public password reset route', () => {
  render(
    <MemoryRouter initialEntries={['/reset-password']}>
      <App />
    </MemoryRouter>,
  );

  expect(
    screen.getByRole('heading', { name: 'Reset link expired' }),
  ).toBeInTheDocument();
});
```

- [ ] **Step 6: Show reset success on the login page**

In `src/pages/AuthPage.tsx`, import `useLocation` and read:

```ts
const location = useLocation();
const authState = location.state as {
  authMode?: AuthMode;
  passwordReset?: boolean;
} | null;
const passwordReset = authState?.passwordReset;
```

Initialize the mode from navigation state:

```ts
const [mode, setMode] = useState<AuthMode>(
  authState?.authMode === 'recovery' ? 'recovery' : 'login',
);
```

Initialize the message state with:

```ts
const [message, setMessage] = useState<string | null>(
  passwordReset ? 'Password updated. You can now log in.' : null,
);
```

- [ ] **Step 7: Add navigation-state tests**

Add this test to `src/pages/AuthPage.test.tsx`:

```tsx
it('opens recovery mode from navigation state', () => {
  render(
    <MemoryRouter
      initialEntries={[
        { pathname: '/login', state: { authMode: 'recovery' } },
      ]}
    >
      <AuthPage />
    </MemoryRouter>,
  );

  expect(
    screen.getByRole('heading', { name: 'Reset your password' }),
  ).toBeInTheDocument();
});

it('shows confirmation after a successful password update', () => {
  render(
    <MemoryRouter
      initialEntries={[
        { pathname: '/login', state: { passwordReset: true } },
      ]}
    >
      <AuthPage />
    </MemoryRouter>,
  );

  expect(
    screen.getByText('Password updated. You can now log in.'),
  ).toBeInTheDocument();
});
```

- [ ] **Step 8: Run the route and page tests**

Run:

```powershell
npm test -- src/App.test.tsx src/pages/AuthPage.test.tsx src/pages/ResetPasswordPage.test.tsx
```

Expected: all selected tests pass.

- [ ] **Step 9: Commit**

```powershell
git add src/App.tsx src/App.test.tsx src/pages/AuthPage.tsx src/pages/ResetPasswordPage.tsx src/pages/ResetPasswordPage.test.tsx
git commit -m "feat: add password reset page"
```

### Task 5: Full Verification and Production Configuration

**Files:**
- Verify: all source and test files changed above
- External configuration: Supabase Authentication URL Configuration

- [ ] **Step 1: Run the complete test suite**

Run:

```powershell
npm test
```

Expected: every Vitest test passes with zero failures.

- [ ] **Step 2: Run the production build**

Run:

```powershell
npm run build
```

Expected: TypeScript and Vite finish successfully and create `dist`.

- [ ] **Step 3: Confirm the worktree is clean except planned changes**

Run:

```powershell
git status --short
git log --oneline -5
```

Expected: no uncommitted source changes; the feature commits are visible.

- [ ] **Step 4: Add allowed Supabase redirect URLs**

In Supabase Dashboard, open:

`Authentication -> URL Configuration -> Redirect URLs`

Confirm these entries exist:

```text
https://inuni.co.za/reset-password
https://inuni-uct.pages.dev/reset-password
http://127.0.0.1:5173/reset-password
http://localhost:5173/reset-password
```

- [ ] **Step 5: Merge and push after review**

Merge the isolated feature branch into `master`, then run:

```powershell
git push origin master
```

Expected: GitHub Actions tests, builds, and deploys the updated site to
Cloudflare Pages.

- [ ] **Step 6: Verify the live flow**

On `https://inuni.co.za/login`:

1. Open `Forgot password?`.
2. Request one reset email.
3. Open the received Brevo/Supabase email.
4. Set a new password at `/reset-password`.
5. Confirm redirect to `/login`.
6. Log in with the new password.

Expected: the full production recovery flow succeeds without a 504 response,
and Brevo records the email as delivered.
