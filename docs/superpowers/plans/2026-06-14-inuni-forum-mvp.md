# InUni Forum MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a deployable UCT-focused forum MVP with authentication, UCT verification, posts, comments, reports, simple profiles, and administrator moderation.

**Architecture:** Keep the existing React/Vite application and place business rules in small pure TypeScript modules that are testable without Supabase. Supabase remains the production authentication/database boundary, while the existing local mock mode implements the same interfaces for development. Administrator access and banned-user restrictions are enforced both in frontend guards and PostgreSQL RLS/helper functions.

**Tech Stack:** React 19, Vite 8, TypeScript 6, Tailwind CSS 3, React Router 7, Supabase JS 2, Vitest, React Testing Library, jsdom.

---

## File Structure

### Application foundation

- `package.json` — test scripts and test dependencies
- `vite.config.ts` — Vitest/jsdom configuration
- `src/test/setup.ts` — shared DOM matchers and test cleanup
- `src/index.css` — approved white/grey/charcoal/muted-blue design tokens
- `src/components/AppLayout.tsx` — forum navigation and conditional Admin link
- Delete `src/components/AdSlot.tsx` — ads are outside MVP

### Domain and authentication

- `src/types/forum.ts` — forum, profile, report, and role types
- `src/lib/permissions.ts` — UCT verification, role, and ban capability rules
- `src/lib/validation.ts` — post, comment, and report validation
- `src/hooks/useAuth.tsx` — session plus current profile
- `src/components/UctVerifiedBadge.tsx` — reusable verified badge
- `src/components/ProtectedRoute.tsx` — login-required guard
- `src/components/AdminRoute.tsx` — administrator-only guard
- `src/components/BanNotice.tsx` — clear banned-user message

### Forum

- `src/lib/forumApi.ts` — posts, comments, profiles, and reports API
- `src/lib/mockStore.ts` — matching local development implementation
- `src/lib/mockData.ts` — demo profiles, posts, comments, reports
- `src/components/PostCard.tsx` — feed post card
- `src/components/CommentList.tsx` — comments plus admin delete action
- `src/components/ReportDialog.tsx` — post/comment report form
- `src/pages/HomePage.tsx` — feed and categories
- `src/pages/CreatePostPage.tsx` — named/anonymous post creation
- `src/pages/PostDetailPage.tsx` — post, comments, and reports
- `src/pages/ProfilePage.tsx` — simple current-user profile

### Administration

- `src/lib/adminApi.ts` — report queue, delete, search, ban, and unban operations
- `src/lib/mockAdminStore.ts` — local development admin operations
- `src/components/ConfirmDialog.tsx` — destructive-action confirmation
- `src/pages/AdminPage.tsx` — moderation overview and report queue
- `src/pages/AdminUsersPage.tsx` — user search and ban management
- `src/App.tsx` — student and administrator routes

### Backend and documentation

- `supabase/schema.sql` — complete MVP schema and RLS
- `supabase/tests/rls.sql` — manual SQL policy verification scenarios
- `.env.example` — Supabase public variables only
- `README.md` — local setup, admin bootstrap, Supabase, and deployment

---

### Task 1: Add the automated test foundation

**Files:**
- Modify: `package.json`
- Modify: `vite.config.ts`
- Create: `src/test/setup.ts`
- Create: `src/lib/validation.test.ts`
- Create: `src/lib/validation.ts`

- [ ] **Step 1: Install the test dependencies**

Run:

```powershell
npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

Expected: npm exits `0` and updates `package.json` plus `package-lock.json`.

- [ ] **Step 2: Add test scripts and Vitest configuration**

Add these scripts to `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "test": "vitest run",
    "test:watch": "vitest",
    "preview": "vite preview"
  }
}
```

Update `vite.config.ts`:

```ts
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
  },
});
```

Create `src/test/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => cleanup());
```

- [ ] **Step 3: Write failing validation tests**

Create `src/lib/validation.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  validateComment,
  validatePost,
  validateReportReason,
} from './validation';

describe('validatePost', () => {
  it('rejects a blank title', () => {
    expect(validatePost({ title: '  ', content: 'Useful content' })).toBe(
      'Title is required.',
    );
  });

  it('rejects a title longer than 120 characters', () => {
    expect(validatePost({ title: 'a'.repeat(121), content: 'Useful content' })).toBe(
      'Title must be 120 characters or fewer.',
    );
  });

  it('accepts a valid post', () => {
    expect(validatePost({ title: 'Study group', content: 'Meet at 14:00.' })).toBeNull();
  });
});

describe('validateComment', () => {
  it('rejects blank comments', () => {
    expect(validateComment('   ')).toBe('Comment is required.');
  });
});

describe('validateReportReason', () => {
  it('requires a meaningful reason', () => {
    expect(validateReportReason('bad')).toBe('Please provide at least 10 characters.');
  });
});
```

- [ ] **Step 4: Run the tests and verify RED**

Run:

```powershell
npm test -- src/lib/validation.test.ts
```

Expected: FAIL because `src/lib/validation.ts` does not exist.

- [ ] **Step 5: Implement the validation helpers**

Create `src/lib/validation.ts`:

```ts
interface PostDraft {
  title: string;
  content: string;
}

export function validatePost({ title, content }: PostDraft): string | null {
  if (!title.trim()) return 'Title is required.';
  if (title.trim().length > 120) return 'Title must be 120 characters or fewer.';
  if (!content.trim()) return 'Content is required.';
  return null;
}

export function validateComment(content: string): string | null {
  return content.trim() ? null : 'Comment is required.';
}

export function validateReportReason(reason: string): string | null {
  return reason.trim().length >= 10 ? null : 'Please provide at least 10 characters.';
}
```

- [ ] **Step 6: Run tests and build**

Run:

```powershell
npm test
npm run build
```

Expected: all tests pass and Vite build exits `0`.

- [ ] **Step 7: Commit**

```powershell
git add package.json package-lock.json vite.config.ts src/test/setup.ts src/lib/validation.ts src/lib/validation.test.ts
git commit -m "test: add InUni MVP test foundation"
```

---

### Task 2: Establish roles, verification, and ban capability rules

**Files:**
- Modify: `src/types/forum.ts`
- Create: `src/lib/permissions.ts`
- Create: `src/lib/permissions.test.ts`
- Create: `src/components/UctVerifiedBadge.tsx`
- Create: `src/components/BanNotice.tsx`

- [ ] **Step 1: Write failing permission tests**

Create `src/lib/permissions.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  canModerate,
  canParticipate,
  isUctVerifiedEmail,
} from './permissions';
import type { Profile } from '../types/forum';

const student: Profile = {
  id: 'student-1',
  username: 'student',
  displayName: 'Student',
  role: 'student',
  isBanned: false,
  banReason: null,
  createdAt: '2026-06-14T00:00:00.000Z',
};

describe('isUctVerifiedEmail', () => {
  it('accepts a confirmed UCT address case-insensitively', () => {
    expect(isUctVerifiedEmail('Name@UCT.AC.ZA', true)).toBe(true);
  });

  it('rejects unconfirmed and non-UCT addresses', () => {
    expect(isUctVerifiedEmail('name@uct.ac.za', false)).toBe(false);
    expect(isUctVerifiedEmail('name@gmail.com', true)).toBe(false);
  });
});

describe('capabilities', () => {
  it('blocks banned students from participation', () => {
    expect(canParticipate({ ...student, isBanned: true })).toBe(false);
  });

  it('allows only admins to moderate', () => {
    expect(canModerate(student)).toBe(false);
    expect(canModerate({ ...student, role: 'admin' })).toBe(true);
  });
});
```

- [ ] **Step 2: Run the tests and verify RED**

Run:

```powershell
npm test -- src/lib/permissions.test.ts
```

Expected: FAIL because `Profile` and permission helpers are missing.

- [ ] **Step 3: Extend domain types**

Replace the user/profile section in `src/types/forum.ts` with:

```ts
export type UserRole = 'student' | 'admin';

export interface Profile {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
  isBanned: boolean;
  banReason: string | null;
  createdAt: string;
}

export interface ForumUser {
  id: string;
  email: string;
  emailConfirmed: boolean;
  profile: Profile;
}
```

Keep the existing category, post, comment, and input types. Replace direct `displayName` reads on `ForumUser` in later tasks with `user.profile.displayName`.

- [ ] **Step 4: Implement permission helpers**

Create `src/lib/permissions.ts`:

```ts
import type { Profile } from '../types/forum';

export function isUctVerifiedEmail(
  email: string | null | undefined,
  emailConfirmed: boolean,
): boolean {
  return Boolean(emailConfirmed && email?.trim().toLowerCase().endsWith('@uct.ac.za'));
}

export function canParticipate(profile: Profile | null): boolean {
  return Boolean(profile && !profile.isBanned);
}

export function canModerate(profile: Profile | null): boolean {
  return profile?.role === 'admin';
}
```

- [ ] **Step 5: Add the reusable status components**

Create `src/components/UctVerifiedBadge.tsx`:

```tsx
export function UctVerifiedBadge() {
  return (
    <span
      className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700"
      title="Confirmed University of Cape Town email"
    >
      UCT Verified
    </span>
  );
}
```

Create `src/components/BanNotice.tsx`:

```tsx
export function BanNotice({ reason }: { reason: string | null }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
      <strong>Your account is restricted.</strong>
      <p className="mt-1">{reason || 'Contact an administrator for more information.'}</p>
    </div>
  );
}
```

- [ ] **Step 6: Run tests and build**

Run:

```powershell
npm test -- src/lib/permissions.test.ts
npm run build
```

Expected: permission tests pass. The build may expose existing `ForumUser.displayName` references; update those references to `user.profile.displayName` without adding new behaviour, then rerun until the build passes.

- [ ] **Step 7: Commit**

```powershell
git add src/types/forum.ts src/lib/permissions.ts src/lib/permissions.test.ts src/components/UctVerifiedBadge.tsx src/components/BanNotice.tsx
git commit -m "feat: add profile roles and UCT verification rules"
```

---

### Task 3: Replace the Supabase schema with the secure MVP model

**Files:**
- Modify: `supabase/schema.sql`
- Create: `supabase/tests/rls.sql`
- Modify: `README.md`

- [ ] **Step 1: Write the SQL policy test scenarios first**

Create `supabase/tests/rls.sql`:

```sql
-- Run after supabase/schema.sql in a disposable Supabase project.
-- Replace UUID values with users created in auth.users before running.

-- Required actors:
-- student_id: normal student
-- banned_id: banned student
-- admin_id: admin

-- Verify manually with SET LOCAL request.jwt.claim.sub and authenticated role:
-- 1. anon can SELECT posts/comments but cannot INSERT.
-- 2. student can INSERT a post/comment/report for their own ID.
-- 3. banned user cannot INSERT posts/comments/reports.
-- 4. student cannot SELECT all reports or update another profile's role/ban.
-- 5. admin can SELECT reports, update report status, delete posts/comments,
--    and update is_banned/ban_reason but cannot change a user's id.

select
  'profiles' as table_name,
  count(*) as policy_count
from pg_policies
where schemaname = 'public' and tablename = 'profiles'
union all
select 'posts', count(*) from pg_policies
where schemaname = 'public' and tablename = 'posts'
union all
select 'comments', count(*) from pg_policies
where schemaname = 'public' and tablename = 'comments'
union all
select 'reports', count(*) from pg_policies
where schemaname = 'public' and tablename = 'reports';
```

- [ ] **Step 2: Run the policy inventory and verify RED against the current schema**

Run `supabase/schema.sql` and then `supabase/tests/rls.sql` in a disposable Supabase SQL editor.

Expected: the current schema lacks role, ban, comment reports, resolution fields, and administrator policies. Record these as expected failures before replacing the schema.

- [ ] **Step 3: Replace `supabase/schema.sql`**

The new schema must include these exact data constraints:

```sql
create type public.user_role as enum ('student', 'admin');
create type public.report_status as enum ('open', 'resolved', 'dismissed');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  display_name text not null,
  role public.user_role not null default 'student',
  is_banned boolean not null default false,
  ban_reason text,
  created_at timestamptz not null default now()
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid references public.posts(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  reason text not null check (char_length(trim(reason)) >= 10),
  status public.report_status not null default 'open',
  resolved_by uuid references public.profiles(id) on delete set null,
  resolution_note text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  constraint reports_one_target check (
    (post_id is not null and comment_id is null)
    or (post_id is null and comment_id is not null)
  )
);

create unique index reports_unique_post_reporter
on public.reports (reporter_id, post_id)
where post_id is not null;

create unique index reports_unique_comment_reporter
on public.reports (reporter_id, comment_id)
where comment_id is not null;
```

Add helper functions that derive permission from `auth.uid()`:

```sql
create or replace function public.current_profile_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.current_profile_can_participate()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_banned = false
  );
$$;
```

Implement RLS matching the specification:

- Public SELECT for posts/comments and only public profile display fields through a `public_profiles` view.
- Own-profile SELECT plus admin SELECT on full `profiles`.
- Users may update only `username` and `display_name` through a restricted RPC or column privilege; they cannot self-change `role`, `is_banned`, or `ban_reason`.
- Inserts for posts/comments/reports require `current_profile_can_participate()` and matching author/reporter ID.
- Report SELECT/UPDATE is admin-only, except a reporter may read their own report.
- Post/comment DELETE allows owner or admin.
- Profile ban fields are updated through an admin-only `set_user_ban(target_user uuid, banned boolean, reason text)` security-definer function.
- `handle_new_user()` creates `student` profiles and never trusts role metadata from signup.

- [ ] **Step 4: Add admin bootstrap instructions**

Add this exact section to `README.md`:

````md
## Create the first administrator

After signing up normally, run this once in the Supabase SQL editor:

```sql
update public.profiles
set role = 'admin'
where id = '<your-auth-user-uuid>';
```

Never add an admin role to signup metadata or expose the service-role key.
````

- [ ] **Step 5: Run the schema and policy scenarios**

Run in a disposable Supabase project:

1. `supabase/schema.sql`
2. `supabase/tests/rls.sql`
3. Manual actor scenarios listed in the SQL comments

Expected: schema succeeds from an empty public schema; all five actor scenarios behave as documented.

- [ ] **Step 6: Commit**

```powershell
git add supabase/schema.sql supabase/tests/rls.sql README.md
git commit -m "feat: secure forum roles bans and reports with RLS"
```

---

### Task 4: Load the authenticated profile and guard routes

**Files:**
- Modify: `src/hooks/useAuth.tsx`
- Create: `src/components/ProtectedRoute.tsx`
- Create: `src/components/AdminRoute.tsx`
- Create: `src/components/AdminRoute.test.tsx`
- Create: `src/pages/AuthPage.test.tsx`
- Modify: `src/components/AppLayout.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Write the failing admin route test**

Create `src/components/AdminRoute.test.tsx`:

```tsx
import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AdminRoute } from './AdminRoute';

vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '../hooks/useAuth';

describe('AdminRoute', () => {
  it('shows an access denied state for a student', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: 'student-1',
        email: 'student@uct.ac.za',
        emailConfirmed: true,
        profile: {
          id: 'student-1',
          username: 'student',
          displayName: 'Student',
          role: 'student',
          isBanned: false,
          banReason: null,
          createdAt: '2026-06-14T00:00:00.000Z',
        },
      },
      loading: false,
      isDemoMode: true,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    });

    render(
      <MemoryRouter>
        <AdminRoute>
          <div>Admin content</div>
        </AdminRoute>
      </MemoryRouter>,
    );

    expect(screen.getByText('Administrator access required')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```powershell
npm test -- src/components/AdminRoute.test.tsx
```

Expected: FAIL because `AdminRoute` does not exist.

- [ ] **Step 3: Add registration and login regression tests**

Create `src/pages/AuthPage.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AuthPage } from './AuthPage';

const { signIn, signUp } = vi.hoisted(() => ({
  signIn: vi.fn().mockResolvedValue({}),
  signUp: vi.fn().mockResolvedValue({}),
}));

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    signIn,
    signUp,
    isDemoMode: true,
  }),
}));

describe('AuthPage', () => {
  it('submits the login form', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><AuthPage /></MemoryRouter>);

    await user.type(screen.getByLabelText('Email'), 'student@uct.ac.za');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(signIn).toHaveBeenCalledWith('student@uct.ac.za', 'password123');
  });

  it('switches to signup and submits registration', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><AuthPage /></MemoryRouter>);

    await user.click(screen.getByRole('button', { name: 'Need an account? Sign up' }));
    await user.type(screen.getByLabelText('Email'), 'new@uct.ac.za');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(signUp).toHaveBeenCalledWith('new@uct.ac.za', 'password123');
  });
});
```

Run:

```powershell
npm test -- src/pages/AuthPage.test.tsx
```

Expected: PASS against the existing auth page before profile refactoring.

- [ ] **Step 4: Refactor `useAuth` to load profiles**

Update `src/hooks/useAuth.tsx` so:

- Supabase user mapping sets `emailConfirmed` from `Boolean(user.email_confirmed_at)`.
- It fetches `id, username, display_name, role, is_banned, ban_reason, created_at` from `profiles`.
- It maps snake_case rows to the `Profile` interface.
- Demo users receive a persisted demo profile.
- A demo administrator is available only when the email is exactly `admin@inuni.local`.
- `ensureProfile` does not write role or ban fields.
- Auth loading remains true until both session and profile loading finish.

Use this mapping:

```ts
function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    role: row.role,
    isBanned: row.is_banned,
    banReason: row.ban_reason,
    createdAt: row.created_at,
  };
}
```

- [ ] **Step 5: Implement route guards**

Create `src/components/ProtectedRoute.tsx`:

```tsx
import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LoadingState } from './LoadingState';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingState label="Checking your account..." />;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return children;
}
```

Create `src/components/AdminRoute.tsx`:

```tsx
import type { ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { canModerate } from '../lib/permissions';
import { EmptyState } from './EmptyState';
import { LoadingState } from './LoadingState';

export function AdminRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingState label="Checking administrator access..." />;
  if (!canModerate(user?.profile ?? null)) {
    return (
      <EmptyState
        title="Administrator access required"
        message="This page is available only to InUni moderators."
      />
    );
  }

  return children;
}
```

- [ ] **Step 6: Wire route and navigation guards**

Update `src/App.tsx`:

```tsx
<Route
  path="/create"
  element={
    <ProtectedRoute>
      <CreatePostPage />
    </ProtectedRoute>
  }
/>
<Route
  path="/profile"
  element={
    <ProtectedRoute>
      <ProfilePage />
    </ProtectedRoute>
  }
/>
<Route
  path="/admin"
  element={
    <AdminRoute>
      <AdminPage />
    </AdminRoute>
  }
/>
<Route
  path="/admin/users"
  element={
    <AdminRoute>
      <AdminUsersPage />
    </AdminRoute>
  }
/>
```

Use temporary page modules exporting headings if Task 7 pages do not yet exist:

```tsx
export function AdminPage() {
  return <h1 className="section-title">Moderation</h1>;
}
```

In `AppLayout`, show the Admin link only when `user.profile.role === 'admin'`.

- [ ] **Step 7: Run tests and build**

Run:

```powershell
npm test -- src/components/AdminRoute.test.tsx src/pages/AuthPage.test.tsx
npm test
npm run build
```

Expected: all tests and build pass.

- [ ] **Step 8: Commit**

```powershell
git add src/hooks/useAuth.tsx src/components/ProtectedRoute.tsx src/components/AdminRoute.tsx src/components/AdminRoute.test.tsx src/pages/AuthPage.test.tsx src/components/AppLayout.tsx src/App.tsx src/pages/AdminPage.tsx src/pages/AdminUsersPage.tsx
git commit -m "feat: load profiles and guard student admin routes"
```

---

### Task 5: Complete the forum and simple profile experience

**Files:**
- Modify: `src/lib/forumApi.ts`
- Modify: `src/lib/mockStore.ts`
- Modify: `src/lib/mockData.ts`
- Modify: `src/components/PostCard.tsx`
- Modify: `src/components/CommentList.tsx`
- Modify: `src/pages/HomePage.tsx`
- Modify: `src/pages/CreatePostPage.tsx`
- Modify: `src/pages/PostDetailPage.tsx`
- Modify: `src/pages/ProfilePage.tsx`
- Create: `src/pages/CreatePostPage.test.tsx`
- Create: `src/components/PostCard.test.tsx`

- [ ] **Step 1: Write failing post-card verification tests**

Create `src/components/PostCard.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { PostCard } from './PostCard';

const post = {
  id: 'post-1',
  title: 'UCT study spaces',
  content: 'Where can we study after hours?',
  category: 'Study' as const,
  authorId: 'user-1',
  authorName: 'Amahle',
  authorIsUctVerified: true,
  isAnonymous: false,
  createdAt: new Date().toISOString(),
  commentCount: 2,
};

describe('PostCard', () => {
  it('shows UCT verification for a named verified author', () => {
    render(<MemoryRouter><PostCard post={post} /></MemoryRouter>);
    expect(screen.getByText('UCT Verified')).toBeInTheDocument();
  });

  it('does not expose verification on an anonymous post', () => {
    render(
      <MemoryRouter>
        <PostCard post={{ ...post, isAnonymous: true, authorName: 'Anonymous' }} />
      </MemoryRouter>,
    );
    expect(screen.queryByText('UCT Verified')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Write failing create-post behaviour tests**

Create `src/pages/CreatePostPage.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { CreatePostPage } from './CreatePostPage';

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: 'user-1',
      email: 'user@uct.ac.za',
      emailConfirmed: true,
      profile: {
        id: 'user-1',
        username: 'user',
        displayName: 'User',
        role: 'student',
        isBanned: false,
        banReason: null,
        createdAt: '2026-06-14T00:00:00.000Z',
      },
    },
  }),
}));

describe('CreatePostPage', () => {
  it('keeps the form and shows validation for a blank title', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><CreatePostPage /></MemoryRouter>);

    await user.type(screen.getByLabelText('Content'), 'A useful campus post');
    await user.click(screen.getByRole('button', { name: 'Publish post' }));

    expect(screen.getByText('Title is required.')).toBeInTheDocument();
    expect(screen.getByDisplayValue('A useful campus post')).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run the tests and verify RED**

Run:

```powershell
npm test -- src/components/PostCard.test.tsx src/pages/CreatePostPage.test.tsx
```

Expected: FAIL because posts do not expose verification and the create page does not use the shared validation/copy.

- [ ] **Step 4: Extend post and comment mappings**

Update `Post` in `src/types/forum.ts`:

```ts
export interface Post {
  id: string;
  title: string;
  content: string;
  category: Category;
  authorId: string;
  authorName: string;
  authorIsUctVerified: boolean;
  isAnonymous: boolean;
  createdAt: string;
  commentCount: number;
}
```

Update `ForumComment`:

```ts
export interface ForumComment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorIsUctVerified: boolean;
  content: string;
  createdAt: string;
}
```

In `forumApi.ts`, fetch profile display fields plus the user's confirmed email status through a safe database projection. Because `auth.users` is not public, add `is_uct_verified boolean` to `profiles`, set only by the signup trigger using confirmed-domain rules or update it from a secure database function after confirmation. Map it to `authorIsUctVerified`.

Update mock data/store to include the same boolean fields.

- [ ] **Step 5: Complete forum screens**

Apply these behaviours:

- Remove every `AdSlot` import and render from `HomePage` and `PostDetailPage`.
- Delete `src/components/AdSlot.tsx`.
- `HomePage` keeps category filters and newest-first feed.
- `PostCard` renders `UctVerifiedBadge` only for named verified posts.
- `CreatePostPage` calls `validatePost`, uses button copy `Publish post`, preserves form state after errors, and displays `BanNotice` instead of the form for banned users.
- `PostDetailPage` calls `validateComment`, blocks banned users with `BanNotice`, and shows verified badges for eligible comments.
- `ProfilePage` shows display name, email, UCT status, role when admin, ban notice when banned, and own posts.
- Keep plain-text posts/comments only.

- [ ] **Step 6: Run focused and full verification**

Run:

```powershell
npm test -- src/components/PostCard.test.tsx src/pages/CreatePostPage.test.tsx
npm test
npm run build
```

Expected: all tests pass and no `AdSlot` reference remains.

Run:

```powershell
Get-ChildItem src -Recurse -File | Select-String -Pattern 'AdSlot|Advertisement|Future ad space'
```

Expected: no output.

- [ ] **Step 7: Commit**

```powershell
git add src
git commit -m "feat: complete verified forum and simple profiles"
```

---

### Task 6: Add reports for posts and comments

**Files:**
- Modify: `src/types/forum.ts`
- Modify: `src/lib/forumApi.ts`
- Modify: `src/lib/mockStore.ts`
- Modify: `src/lib/mockData.ts`
- Create: `src/components/ReportDialog.tsx`
- Create: `src/components/ReportDialog.test.tsx`
- Modify: `src/components/PostCard.tsx`
- Modify: `src/components/CommentList.tsx`
- Modify: `src/pages/PostDetailPage.tsx`
- Delete: `src/components/ReportButton.tsx`

- [ ] **Step 1: Define report types**

Add to `src/types/forum.ts`:

```ts
export type ReportStatus = 'open' | 'resolved' | 'dismissed';
export type ReportTarget =
  | { type: 'post'; postId: string }
  | { type: 'comment'; commentId: string };

export interface Report {
  id: string;
  reporterId: string;
  target: ReportTarget;
  reason: string;
  status: ReportStatus;
  resolvedBy: string | null;
  resolutionNote: string | null;
  createdAt: string;
  resolvedAt: string | null;
}
```

- [ ] **Step 2: Write failing report dialog tests**

Create `src/components/ReportDialog.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ReportDialog } from './ReportDialog';

describe('ReportDialog', () => {
  it('requires a meaningful reason before submission', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <ReportDialog
        open
        target={{ type: 'post', postId: 'post-1' }}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    await user.type(screen.getByLabelText('Reason'), 'bad');
    await user.click(screen.getByRole('button', { name: 'Submit report' }));

    expect(screen.getByText('Please provide at least 10 characters.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 3: Run the test and verify RED**

Run:

```powershell
npm test -- src/components/ReportDialog.test.tsx
```

Expected: FAIL because `ReportDialog` does not exist.

- [ ] **Step 4: Implement the report dialog**

Create `src/components/ReportDialog.tsx` with:

- Native `<dialog>` or an accessible fixed overlay
- Labelled textarea
- Cancel and `Submit report` buttons
- `validateReportReason`
- Escape/close handling
- Disabled submitting state
- Server error display

Use this API:

```ts
interface ReportDialogProps {
  open: boolean;
  target: ReportTarget;
  onClose: () => void;
  onSubmit: (target: ReportTarget, reason: string) => Promise<void> | void;
}
```

- [ ] **Step 5: Implement report persistence**

Replace the old post-only `reportPost` API with:

```ts
export async function createReport(
  target: ReportTarget,
  reason: string,
  user: ForumUser,
): Promise<void>
```

Supabase insert mapping:

```ts
{
  reporter_id: user.id,
  post_id: target.type === 'post' ? target.postId : null,
  comment_id: target.type === 'comment' ? target.commentId : null,
  reason: reason.trim(),
}
```

Map unique-constraint errors to:

```text
You have already reported this content.
```

The mock store must enforce the same duplicate rule.

- [ ] **Step 6: Wire reports into posts and comments**

- Replace `ReportButton` with `ReportDialog` state in `PostCard` and `PostDetailPage`.
- Add a compact Report action to each comment in `CommentList`.
- Hide or disable report actions when logged out and direct users to login.
- Show `BanNotice` or a specific restricted message when a banned user tries to report.
- Delete `src/components/ReportButton.tsx`.

- [ ] **Step 7: Run tests and build**

Run:

```powershell
npm test -- src/components/ReportDialog.test.tsx
npm test
npm run build
```

Expected: all tests and build pass.

- [ ] **Step 8: Commit**

```powershell
git add src
git commit -m "feat: report forum posts and comments"
```

---

### Task 7: Build the administrator moderation experience

**Files:**
- Create: `src/lib/adminApi.ts`
- Create: `src/lib/mockAdminStore.ts`
- Create: `src/components/ConfirmDialog.tsx`
- Create: `src/components/ConfirmDialog.test.tsx`
- Modify: `src/pages/AdminPage.tsx`
- Modify: `src/pages/AdminUsersPage.tsx`
- Create: `src/pages/AdminPage.test.tsx`

- [ ] **Step 1: Write the failing confirmation test**

Create `src/components/ConfirmDialog.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmDialog } from './ConfirmDialog';

describe('ConfirmDialog', () => {
  it('requires explicit confirmation for destructive actions', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        open
        title="Delete post?"
        message="This permanently removes the post and comments."
        confirmLabel="Delete post"
        onCancel={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    expect(onConfirm).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Delete post' }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Write the failing admin report queue test**

Create `src/pages/AdminPage.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AdminPage } from './AdminPage';

vi.mock('../lib/adminApi', () => ({
  getOpenReports: vi.fn().mockResolvedValue([
    {
      id: 'report-1',
      target: { type: 'post', postId: 'post-1' },
      reason: 'This contains targeted harassment.',
      status: 'open',
      reporterId: 'user-2',
      resolvedBy: null,
      resolutionNote: null,
      createdAt: '2026-06-14T00:00:00.000Z',
      resolvedAt: null,
      contentTitle: 'Reported post',
      contentPreview: 'Post preview',
    },
  ]),
}));

describe('AdminPage', () => {
  it('renders the open report queue', async () => {
    render(<MemoryRouter><AdminPage /></MemoryRouter>);
    expect(await screen.findByText('Reported post')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete post' })).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run tests and verify RED**

Run:

```powershell
npm test -- src/components/ConfirmDialog.test.tsx src/pages/AdminPage.test.tsx
```

Expected: FAIL because the dialog and functional admin page do not exist.

- [ ] **Step 4: Implement the admin API boundary**

Create these exports in `src/lib/adminApi.ts`:

```ts
export interface ModerationReport extends Report {
  contentTitle: string;
  contentPreview: string;
}

export async function getOpenReports(): Promise<ModerationReport[]>;
export async function resolveReport(
  reportId: string,
  status: 'resolved' | 'dismissed',
  resolutionNote: string,
): Promise<void>;
export async function deleteReportedPost(postId: string): Promise<void>;
export async function deleteReportedComment(commentId: string): Promise<void>;
export async function searchUsers(query: string): Promise<Profile[]>;
export async function setUserBan(
  userId: string,
  banned: boolean,
  reason: string | null,
): Promise<void>;
```

Supabase implementation requirements:

- Query open reports plus target content.
- Call normal DELETE operations for posts/comments; RLS authorises admins.
- Call the `set_user_ban` RPC.
- Update report status/resolution fields after action.
- Return actionable errors rather than raw objects.

`mockAdminStore.ts` must implement the same interface over localStorage.

- [ ] **Step 5: Implement `ConfirmDialog`**

Use this interface:

```ts
interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  busy?: boolean;
  destructive?: boolean;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
}
```

The dialog must:

- Focus the confirmation surface
- Provide Cancel
- Use a restrained red style only when `destructive`
- Disable buttons while busy
- Never execute on initial render

- [ ] **Step 6: Implement the moderation page**

`AdminPage` must show:

- Heading `Moderation`
- Open report count
- Loading, empty, and error states
- Report reason and target preview
- `Dismiss report`
- `Delete post` or `Delete comment`
- Confirmation before delete
- Remove resolved items from local state after success

Do not add charts or complex analytics.

- [ ] **Step 7: Implement user search and bans**

`AdminUsersPage` must show:

- Search input
- Search button
- Display name, username, role, and ban status
- Ban action with required reason
- Unban action
- Confirmation dialog
- Empty and error states

Do not allow an administrator to ban their own current account in the UI. The database function should reject self-ban too.

- [ ] **Step 8: Run tests and build**

Run:

```powershell
npm test -- src/components/ConfirmDialog.test.tsx src/pages/AdminPage.test.tsx
npm test
npm run build
```

Expected: all tests and build pass.

- [ ] **Step 9: Commit**

```powershell
git add src/lib/adminApi.ts src/lib/mockAdminStore.ts src/components/ConfirmDialog.tsx src/components/ConfirmDialog.test.tsx src/pages/AdminPage.tsx src/pages/AdminPage.test.tsx src/pages/AdminUsersPage.tsx
git commit -m "feat: add forum moderation and user bans"
```

---

### Task 8: Apply the approved visual system and prepare deployment

**Files:**
- Modify: `src/index.css`
- Modify: `tailwind.config.js`
- Modify: `src/components/AppLayout.tsx`
- Modify: all files in `src/pages/`
- Modify: reusable state/card components in `src/components/`
- Modify: `README.md`
- Create: `vercel.json`
- Create: `public/_redirects`

- [ ] **Step 1: Add a visual-scope regression test**

Create `src/App.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import App from './App';

vi.mock('./hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    isDemoMode: true,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: ReactNode }) => children,
}));

describe('MVP navigation', () => {
  it('shows only forum MVP destinations for a signed-out visitor', () => {
    render(<MemoryRouter initialEntries={['/']}><App /></MemoryRouter>);
    expect(screen.getByRole('link', { name: 'Forum' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Login' })).toBeInTheDocument();
    expect(screen.queryByText('Tools')).not.toBeInTheDocument();
    expect(screen.queryByText('Shared Files')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```powershell
npm test -- src/App.test.tsx
```

Expected: FAIL until navigation copy and accessible labels match the MVP design.

- [ ] **Step 3: Apply design tokens**

Define a restrained palette in `tailwind.config.js`:

```js
extend: {
  colors: {
    ink: '#1d1f23',
    canvas: '#f5f6f8',
    line: '#e5e8ec',
    brand: {
      50: '#eef3f8',
      100: '#e1e9f2',
      600: '#5f7fa3',
      700: '#4d6b8d',
    },
  },
  boxShadow: {
    soft: '0 12px 36px rgba(29, 31, 35, 0.07)',
  },
}
```

Update `src/index.css` so:

- Body uses `bg-canvas text-ink`.
- `.panel` is white with `rounded-2xl`, border `line`, and `shadow-soft`.
- Primary buttons use muted blue.
- No gradients or decorative background patterns remain.
- Focus rings use accessible muted blue.
- No font size scales with viewport width.

- [ ] **Step 4: Polish all MVP screens**

Check and update:

- Header logo remains monochrome.
- Navigation labels are `Forum`, `Create`, `Profile`, `Login/Log out`, and conditional `Admin`.
- Forum desktop layout keeps content dominant and uses no ad rail.
- Cards use consistent 16–20px radii.
- Forms have clear labels and helper/error text.
- Admin pages are compact but visually consistent.
- Buttons and labels do not overflow at 320px width.
- Remove any remaining green primary-button styling; green remains only for category/positive status where useful.

- [ ] **Step 5: Add SPA deployment routing**

Create `vercel.json`:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

Create `public/_redirects`:

```text
/* /index.html 200
```

- [ ] **Step 6: Rewrite README for the MVP**

README must contain:

- MVP feature list only
- Deferred roadmap summary
- `npm install`, `npm test`, `npm run build`, `npm run dev`
- Supabase schema setup
- `.env` variables
- First-admin bootstrap
- Demo mode instructions
- Vercel and Cloudflare Pages settings
- Community safety note
- No service-role key warning

- [ ] **Step 7: Run complete verification**

Run:

```powershell
npm test
npm run build
git diff --check
```

Expected: zero test failures, build exit `0`, and no whitespace errors.

Start the app:

```powershell
npm run dev -- --host 127.0.0.1 --port 5173
```

Verify these routes manually at desktop and mobile widths:

```text
/
/login
/create
/profile
/post/<mock-post-id>
/admin
/admin/users
```

Expected:

- No horizontal overflow at 320px.
- No ads, tools, files, recipes, or analytics UI.
- Signed-out protected routes redirect to login.
- Student admin routes show access denied.
- Demo admin can use moderation pages.
- Empty/loading/error states are legible.

- [ ] **Step 8: Commit**

```powershell
git add .
git commit -m "feat: finish deployable InUni forum MVP"
```

---

## Final Acceptance Checklist

- [ ] Registration, login, logout, and session restoration work.
- [ ] Confirmed `@uct.ac.za` users display UCT Verified.
- [ ] Feed supports all six categories.
- [ ] Named and anonymous posts work.
- [ ] Comments work.
- [ ] Post and comment reports prevent duplicates.
- [ ] Banned users can read but cannot post, comment, or report.
- [ ] Administrators can review reports.
- [ ] Administrators can delete posts and comments.
- [ ] Administrators can ban and unban users.
- [ ] Profile shows identity, verification, account status, and own posts.
- [ ] RLS actor scenarios pass.
- [ ] No deferred feature appears in the MVP UI.
- [ ] Tests pass.
- [ ] Production build passes.
- [ ] Mobile and desktop visual checks pass.
- [ ] README documents local setup and free deployment.
