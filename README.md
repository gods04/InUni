# InUni

InUni is a simple university forum MVP built with React, Vite, TypeScript, Tailwind CSS, React Router, and Supabase. It is local-first: if Supabase environment variables are empty, the app runs in demo mode with mock posts and browser localStorage.

## Features

- Home feed with categories, previews, authors, comment counts, and relative time
- Categories: Study, Campus Life, Questions, Lost & Found, Confessions, General
- Post detail page with comments
- Create post page with an anonymous toggle
- Email sign up and login through Supabase Auth
- Profile page with current user info and own posts
- Report button on posts
- Supabase SQL schema with RLS policies

## Local Setup

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

## Environment Variables

Create a `.env` file from `.env.example`:

```bash
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-public-anon-key
```

Only use the public anon key in the frontend. Never put a Supabase service role key in this project.

If both values are blank, InUni runs in demo mode. Demo login accepts any email/password and stores demo posts/comments in your browser.

## Supabase Setup

1. Create a free Supabase project.
2. Open the Supabase SQL editor.
3. Run `supabase/schema.sql`.
4. Copy your project URL and anon key into `.env`.
5. Restart `npm run dev`.

The schema creates:

- `profiles`
- `posts`
- `comments`
- `post_likes`
- `reports`

RLS policies allow anyone to read posts/comments, logged-in users to create posts/comments, users to manage their own posts/comments, and logged-in users to report posts.

## Routes

- `/` home feed
- `/post/:id` post detail
- `/create` create post
- `/login` auth
- `/profile` profile

## Free Hosting Options

Recommended first deployment path: Vercel or Cloudflare Pages.

For Vercel:

1. Push this folder to a GitHub repository.
2. Import the repository in Vercel.
3. Use the default Vite settings:
   - Build command: `npm run build`
   - Output directory: `dist`
4. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the Vercel project environment variables.

For Cloudflare Pages:

1. Push this folder to GitHub.
2. Create a Pages project from the repository.
3. Use:
   - Framework preset: Vite
   - Build command: `npm run build`
   - Build output directory: `dist`
4. Add the same two Supabase environment variables.

For GitHub Pages:

```bash
npm run build -- --base=/InUni/
```

Then publish the `dist` folder with GitHub Pages or a GitHub Actions workflow. If your repository name is not `InUni`, replace `/InUni/` with `/<your-repo-name>/`.

## Ad Placement Notes

The app includes subtle reserved ad spaces in the feed sidebar and below post discussions. They are placeholders only and do not load any ad network script yet.

When adding Google AdSense or another ad network later:

- Keep ad units visible and clearly labeled as ads or sponsored content.
- Do not hide ads, disguise ads as forum posts, or place them where users may click by accident.
- Keep the forum content readable first, especially on mobile.
- Add the ad network script only after your site is deployed and approved by that provider.

## Project Structure

```text
src/
  components/
  hooks/
  lib/
  pages/
  types/
  App.tsx
  main.tsx
supabase/
  schema.sql
```

## Next Steps

- Create a Supabase project and run the schema.
- Add `.env` values and test real sign up/login.
- Add edit/delete UI for posts if needed.
- Add a small moderation dashboard later if reports need review inside the app.
