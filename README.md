# InUni

InUni is a local-first University of Cape Town community forum MVP. It uses
React, Vite, TypeScript, Tailwind CSS, React Router, and Supabase.

## MVP features

- Email registration, login, password recovery, logout, and session restoration
- Editable profile display names and profile photos
- UCT Verified status for confirmed `@uct.ac.za` and `@myuct.ac.za` accounts
- Six forum categories
- Named and anonymous posts
- Comments
- Post and comment file attachments
- Public Shared Files browsing, reporting, and admin approval
- Public food tools with a meal wheel, fridge-ingredient recipe matching,
  detailed heat/time recipe steps, and budget-based campus menu suggestions
- Post and comment reporting with duplicate protection
- A simple profile with account status, own posts, uploaded files, and profile
  identity controls
- Administrator report review, file review, content deletion, and user bans
- Supabase Row Level Security for public reading and protected participation
- Browser-based demo mode when Supabase is not configured

The six categories are Study, Campus Life, Questions, Lost & Found,
Confessions, and General.

## Deferred roadmap

These ideas are intentionally outside version 1 and are recorded for later:
Word-to-PDF, advertising, self-hosted virus scanning, and complex analytics.

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
VITE_INUNI_DEMO_MODE=false
```

Only use the Supabase public anon key in the frontend. Never add the
service-role key to this repository, Vite variables, or hosting settings.

## Demo mode

Leave both Supabase environment variables blank, or start Vite with
`VITE_INUNI_DEMO_MODE=true`, to use local demo data. Posts, comments, files,
reports, and moderation state are stored in browser localStorage.

- Any email and password can be used for a demo student account.
- Use `admin@inuni.local` to open the demo administrator pages.
- Clearing site data resets the demo.

## Supabase setup

1. Create a free Supabase project.
2. Open its SQL Editor.
3. Run [`supabase/schema.sql`](supabase/schema.sql).
4. Create the storage buckets described in File storage setup.
5. Add the project URL and public anon key to `.env`.
6. In Authentication > URL Configuration, add the local and production
   redirect URLs listed below.
7. Restart the Vite development server.
8. Sign up, confirm the email, test password recovery, and test posting and
   comments.
9. Run the scenarios in [`supabase/tests/rls.sql`](supabase/tests/rls.sql)
   in a disposable project before production use.

The schema creates `profiles`, `posts`, `comments`, `reports`, `files`,
`file_links`, and `file_reports`. RLS lets anyone read forum content, public
profile names/photos, and approved Shared Files metadata, while active
authenticated users can participate. Banned users can still read public posts,
comments, and approved file listings but cannot edit profile details, post,
comment, upload, download, or report files.

If the project already has the older InUni schema, do not run the full schema
again. Run
[`supabase/migrations/20260616_existing_project_files_upgrade.sql`](supabase/migrations/20260616_existing_project_files_upgrade.sql)
instead.

## File storage setup

The first files phase uses a private Supabase Storage bucket named
`inuni-files`. Profile photos use a public Supabase Storage bucket named
`inuni-avatars` so avatars can render beside public posts and comments.

Create the bucket in Supabase Storage:

- Name: `inuni-files`
- Public bucket: off
- File size limit: `5MB`

Create the profile photo bucket in Supabase Storage:

- Name: `inuni-avatars`
- Public bucket: on
- File size limit: `2MB`
- Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`

Approved Shared Files metadata can be browsed while logged out. Downloads and
previews use short-lived signed URLs generated after login. Do not make the
bucket public. The database schema adds Storage object policies for uploads,
signed URL creation, and moderator deletion in this bucket.

The app keeps file metadata in Postgres so storage can later move to a
self-hosted S3-compatible service or a server with ClamAV scanning. Profile
records store only the avatar object path; the frontend resolves it to the
public bucket URL.

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

### Google OAuth setup

The login page includes a Google sign-in option. Before enabling it for real
users, configure the provider in Supabase:

1. In Google Cloud, create an OAuth client for the Supabase callback URL shown
   in Authentication > Providers > Google.
2. In Supabase, open Authentication > Providers > Google, enable the provider,
   and add the Google client ID and client secret.
3. In Authentication > URL Configuration, keep the `/profile` redirect URLs
   listed above. Google sign-in returns users to `/profile`.
4. Confirm that Google accounts using `@uct.ac.za` or `@myuct.ac.za` emails
   receive the profile-level UCT Verified badge after Supabase confirms the
   email address.
5. Test locally and on the deployed Cloudflare Pages URL before announcing the
   option.

If Google is not configured, the app shows a setup message instead of signing in.

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
- `/tools` student tools hub
- `/tools/food` food tools for random meal picks, detailed fridge recipes, and
  budget menu suggestions
- `/login` registration and login
- `/reset-password` password reset link landing page
- `/profile` current user profile
- `/admin` admin dashboard overview
- `/admin/reports` moderation report review queue
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
