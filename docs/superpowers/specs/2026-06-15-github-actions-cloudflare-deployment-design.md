# GitHub Actions Cloudflare Deployment Design

## Goal

Automatically deploy the InUni production site whenever a commit reaches the
`master` branch, while preserving the existing
`https://inuni-uct.pages.dev` address.

## Approach

Keep the existing Cloudflare Pages Direct Upload project and use GitHub
Actions as the continuous integration and deployment service. This avoids
creating a second Pages project or changing Supabase redirect URLs.

## Workflow

The workflow runs on:

- Every push to `master`.
- Manual `workflow_dispatch` runs for recovery or testing.

It performs these steps in order:

1. Check out the exact commit.
2. Install the supported Node.js LTS release.
3. Install dependencies with `npm ci`.
4. Run the complete Vitest suite.
5. Build the Vite production bundle with the Supabase frontend variables.
6. Deploy `dist` to the existing `inuni-uct` Cloudflare Pages project.

Deployment does not run if installation, tests, or the build fails. The
current production deployment remains available when a workflow fails.

## Configuration

GitHub Actions uses these repository secrets:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

The Cloudflare token must be scoped to the InUni account with Pages edit
permission. No database password, Supabase secret key, or service-role key is
used.

Although the Supabase URL and publishable key are safe for browser use, they
are kept in GitHub Secrets so the workflow configuration remains consistent
and values can be changed without editing source files.

## Repository Changes

Add one workflow:

`/.github/workflows/deploy-cloudflare-pages.yml`

Update the README deployment section with the required secret names and
automatic deployment behavior.

No application code, database schema, Pages project name, production domain,
or Supabase redirect URL changes are required.

## Verification

Before committing the workflow:

- Validate the YAML structure.
- Run `npm test -- --run`.
- Run `npm run build`.
- Confirm no credential value is committed.

After configuring GitHub Secrets:

- Trigger the workflow manually or push a documentation-only commit.
- Confirm all workflow steps succeed.
- Confirm Cloudflare records the GitHub commit as a production deployment.
- Load the home, login, profile, and admin routes from
  `https://inuni-uct.pages.dev`.
- Confirm the live site uses Supabase mode and has no browser console errors.

## Recovery

If deployment fails, fix the failing workflow step and rerun it. Since
Cloudflare only receives `dist` after successful tests and build, the previous
production deployment remains active. Manual Wrangler deployment remains
available as a fallback.
