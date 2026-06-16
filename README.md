# InUni

InUni is a local-first University of Cape Town community forum MVP. It uses
React, Vite, TypeScript, Tailwind CSS, React Router, and Supabase.

## MVP features

- Email registration, login, password recovery, logout, and session restoration
- UCT Verified status for confirmed `@uct.ac.za` and `@myuct.ac.za` accounts
- Six forum categories
- Named and anonymous posts
- Comments
- Post and comment file attachments
- Shared Files browsing, reporting, and admin approval
- Post and comment reporting with duplicate protection
- A simple profile with account status, own posts, and uploaded files
- Administrator report review, file review, content deletion, and user bans
- Supabase Row Level Security for public reading and protected participation
- Browser-based demo mode when Supabase is not configured

The six categories are Study, Campus Life, Questions, Lost & Found,
Confessions, and General.

## Deferred roadmap

These ideas are intentionally outside version 1 and are recorded for later:
Word-to-PDF, food tools, budget meals, South African recipes, advertising,
self-hosted virus scanning, and complex analytics.

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
comments, files, reports, and moderation state are stored in browser
localStorage.

- Any email and password can be used for a demo student account.
- Use `admin@inuni.local` to open the demo administrator pages.
- Clearing site data resets the demo.

## Supabase setup

1. Create a free Supabase project.
2. Open its SQL Editor.
3. Run [`supabase/schema.sql`](supabase/schema.sql).
4. Create the private file bucket described in File storage setup.
5. Add the project URL and public anon key to `.env`.
6. In Authentication > URL Configuration, add the local and production
   redirect URLs listed below.
7. Restart the Vite development server.
8. Sign up, confirm the email, test password recovery, and test posting and
   comments.
9. Run the scenarios in [`supabase/tests/rls.sql`](supabase/tests/rls.sql)
   in a disposable project before production use.

The schema creates `profiles`, `posts`, `comments`, `reports`, `files`,
`file_links`, and `file_reports`. RLS lets anyone read forum content, while
active authenticated users can participate. Banned users can still read posts
and comments but cannot post, comment, upload, download, or report files.

## File storage setup

The first files phase uses a private Supabase Storage bucket named
`inuni-files`.

Create the bucket in Supabase Storage:

- Name: `inuni-files`
- Public bucket: off
- File size limit: `100MB`

Downloads and previews use short-lived signed URLs generated after login.
Do not make the bucket public. The database schema adds Storage object
policies for uploads, signed URL creation, and moderator deletion in this
bucket.

The app keeps file metadata in Postgres so storage can later move to a
self-hosted S3-compatible service or a server with ClamAV scanning.

### Auth redirect URLs

Add these Supabase redirect URLs before testing email links:

```text
https://inuni.co.za/profile
https://inuni.co.za/reset-password
https://inuni-uct.pages.dev/profile
https://inuni-uct.pages.dev/reset-password
http://localhost:5173/profile
http://localhost:5173/reset-password
http://127.0.0.1:5173/profile
http://127.0.0.1:5173/reset-password
```

If password reset emails time out, check Supabase Authentication SMTP settings.
For Brevo, port `2525` is usually safer than port `587` on Supabase.

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
- `/files` shared file library
- `/create` create a post
- `/login` registration and login
- `/reset-password` password reset link landing page
- `/profile` current user profile
- `/admin` open report queue
- `/admin/files` file review queue
- `/admin/users` user search and bans

## Free deployment

Push this repository to GitHub first. Vercel is the simplest initial host:

1. Import the GitHub repository into Vercel.
2. Keep build command `npm run build`.
3. Keep output directory `dist`.
4. Add the two `VITE_SUPABASE_*` environment variables.
5. Deploy.

The existing Cloudflare Pages project is deployed automatically by GitHub
Actions whenever a commit reaches `master`. The workflow runs the complete
test suite and production build before deploying `dist` to `inuni-uct`.

Configure these GitHub repository secrets:

```text
CLOUDFLARE_ACCOUNT_ID
CLOUDFLARE_API_TOKEN
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

The Cloudflare token needs Cloudflare Pages edit permission for the project
account. Never add a database password, Supabase secret key, or service-role
key to GitHub Actions or frontend environment variables.

The workflow can also be started manually from the repository's Actions page.
Manual Wrangler deployment remains available as a fallback.

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
