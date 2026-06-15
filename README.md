# InUni

InUni is a local-first University of Cape Town community forum MVP. It uses
React, Vite, TypeScript, Tailwind CSS, React Router, and Supabase.

## MVP features

- Email registration, login, logout, and session restoration
- UCT Verified status for confirmed `@uct.ac.za` accounts
- Six forum categories
- Named and anonymous posts
- Comments
- Post and comment reporting with duplicate protection
- A simple profile with account status and own posts
- Administrator report review, content deletion, and user bans
- Supabase Row Level Security for public reading and protected participation
- Browser-based demo mode when Supabase is not configured

The six categories are Study, Campus Life, Questions, Lost & Found,
Confessions, and General.

## Deferred roadmap

These ideas are intentionally outside version 1 and are recorded for later:
Word-to-PDF, food tools, budget meals, South African recipes, advertising,
post attachments, shared files, and complex analytics.

## Run locally

```bash
npm install
npm test
npm run build
npm run dev
```

Vite prints the local URL, normally `http://localhost:5173`.

## Environment variables

Copy `.env.example` to `.env` and add:

```bash
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-public-anon-key
```

Only use the Supabase public anon key in the frontend. Never add the
service-role key to this repository, Vite variables, or hosting settings.

## Demo mode

Leave both environment variables blank to use local demo data. Posts,
comments, reports, and moderation state are stored in browser localStorage.

- Any email and password can be used for a demo student account.
- Use `admin@inuni.local` to open the demo administrator pages.
- Clearing site data resets the demo.

## Supabase setup

1. Create a free Supabase project.
2. Open its SQL Editor.
3. Run [`supabase/schema.sql`](supabase/schema.sql).
4. Add the project URL and public anon key to `.env`.
5. Restart the Vite development server.
6. Sign up, confirm the email, and test posting and comments.
7. Run the scenarios in [`supabase/tests/rls.sql`](supabase/tests/rls.sql)
   in a disposable project before production use.

The schema creates `profiles`, `posts`, `comments`, and `reports`. RLS lets
anyone read forum content, while active authenticated users can participate.
Banned users can still read but cannot post, comment, or report.

## Create the first administrator

After signing up normally, run this once in the Supabase SQL Editor:

```sql
update public.profiles
set role = 'admin'
where id = '<your-auth-user-uuid>';
```

Never put an admin role in signup metadata.

## Routes

- `/` forum feed
- `/post/:id` post and comments
- `/create` create a post
- `/login` registration and login
- `/profile` current user profile
- `/admin` open report queue
- `/admin/users` user search and bans

## Free deployment

Push this repository to GitHub first. Vercel is the simplest initial host:

1. Import the GitHub repository into Vercel.
2. Keep build command `npm run build`.
3. Keep output directory `dist`.
4. Add the two `VITE_SUPABASE_*` environment variables.
5. Deploy.

For Cloudflare Pages:

1. Connect the GitHub repository.
2. Select the Vite framework preset.
3. Use build command `npm run build`.
4. Use output directory `dist`.
5. Add the same environment variables.

`vercel.json` and `public/_redirects` keep React Router URLs working after a
page refresh on Vercel and Cloudflare Pages.

## Community safety

Reports are private to moderators. Administrators should review context before
deleting content or banning a user, record clear ban reasons, and avoid
collecting sensitive information in public posts. Anonymous posts hide the
author from the community UI but remain associated with an account in the
database for moderation.

## Project structure

```text
src/
  components/
  hooks/
  lib/
  pages/
  test/
  types/
supabase/
  schema.sql
  tests/rls.sql
```
