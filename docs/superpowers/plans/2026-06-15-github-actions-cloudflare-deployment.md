# GitHub Actions Cloudflare Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Automatically test, build, and deploy every `master` commit to the existing `inuni-uct` Cloudflare Pages project.

**Architecture:** A single GitHub Actions workflow installs the locked npm dependencies, runs the complete test suite, builds Vite with the public Supabase configuration, and invokes Wrangler only after those checks pass. Cloudflare and Supabase values are supplied through GitHub repository secrets, so no credentials are committed and failed checks leave the previous production deployment untouched.

**Tech Stack:** GitHub Actions, Node.js 24, npm, Vitest, Vite, Cloudflare Wrangler, Cloudflare Pages

---

### Task 1: Add the deployment workflow

**Files:**
- Create: `.github/workflows/deploy-cloudflare-pages.yml`

- [ ] **Step 1: Create the workflow**

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches:
      - master
  workflow_dispatch:

concurrency:
  group: cloudflare-pages-production
  cancel-in-progress: true

permissions:
  contents: read
  deployments: write

jobs:
  deploy:
    name: Test, build, and deploy
    runs-on: ubuntu-latest
    timeout-minutes: 15
    env:
      VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
      VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}

    steps:
      - name: Check out repository
        uses: actions/checkout@v6

      - name: Set up Node.js
        uses: actions/setup-node@v6
        with:
          node-version: 24
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test -- --run

      - name: Build production site
        run: npm run build

      - name: Deploy to Cloudflare Pages
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: >-
            pages deploy dist
            --project-name=inuni-uct
            --branch=master
            --commit-hash=${{ github.sha }}
            --commit-message="${{ github.event.head_commit.message || 'Manual production deployment' }}"
          gitHubToken: ${{ secrets.GITHUB_TOKEN }}
```

- [ ] **Step 2: Parse the workflow as YAML**

Run:

```powershell
node -e "import('yaml').then(({parse})=>{const fs=require('fs');parse(fs.readFileSync('.github/workflows/deploy-cloudflare-pages.yml','utf8'));console.log('workflow yaml valid')})"
```

Expected: `workflow yaml valid`

If the project does not expose a YAML parser, use Ruby's bundled parser:

```powershell
ruby -e "require 'yaml'; YAML.load_file('.github/workflows/deploy-cloudflare-pages.yml'); puts 'workflow yaml valid'"
```

- [ ] **Step 3: Confirm no literal credential is present**

Run:

```powershell
Select-String -Path .github\workflows\deploy-cloudflare-pages.yml -Pattern 'amjragmxxztmbtfgychp|sb_publishable_' -Quiet
```

Expected: no output and exit status indicating no match.

- [ ] **Step 4: Commit the workflow**

```powershell
git add .github/workflows/deploy-cloudflare-pages.yml
git commit -m "ci: deploy master to Cloudflare Pages"
```

### Task 2: Document automatic deployment

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Replace the manual Cloudflare instructions**

Document that pushes to `master` run tests, build, and deploy to the existing
Pages project. List these required GitHub repository secrets:

```text
CLOUDFLARE_ACCOUNT_ID
CLOUDFLARE_API_TOKEN
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

State that `CLOUDFLARE_API_TOKEN` requires Cloudflare Pages edit permission,
and that database passwords, Supabase secret keys, and service-role keys must
never be added.

- [ ] **Step 2: Verify documentation and source formatting**

Run:

```powershell
git diff --check
```

Expected: exit code 0 with no whitespace errors.

- [ ] **Step 3: Commit the documentation**

```powershell
git add README.md
git commit -m "docs: explain automatic Cloudflare deployment"
```

### Task 3: Run local pre-deployment checks

**Files:**
- Verify: `package-lock.json`
- Verify: `src/**`
- Verify: `.github/workflows/deploy-cloudflare-pages.yml`

- [ ] **Step 1: Run the complete test suite**

Run:

```powershell
npm test -- --run
```

Expected: all test files and tests pass.

- [ ] **Step 2: Build with the local Supabase configuration**

Run:

```powershell
npm run build
```

Expected: TypeScript and Vite exit successfully and create `dist`.

- [ ] **Step 3: Confirm local credentials remain untracked**

Run:

```powershell
git check-ignore -v .env
git grep -n "sb_publishable_"
```

Expected: `.env` is ignored and `git grep` returns no credential value.

- [ ] **Step 4: Push the implementation commits**

```powershell
git push origin master
```

The first workflow run may fail because repository secrets are intentionally
configured in Task 4.

### Task 4: Configure repository secrets

**Files:**
- No repository file changes

- [ ] **Step 1: Create a scoped Cloudflare API token**

Open:

```text
https://dash.cloudflare.com/profile/api-tokens
```

Create a custom token with:

```text
Account / Cloudflare Pages / Edit
Account resources / Include / Chenzhi050404@gmail.com's Account
```

Copy the token once and do not place it in source files, screenshots, chat
messages, or shell history.

- [ ] **Step 2: Add the Cloudflare account ID**

Run with the authenticated GitHub CLI:

```powershell
"826931f461a19ce97b20edbffba047c0" |
  & "C:\Program Files\GitHub CLI\gh.exe" secret set CLOUDFLARE_ACCOUNT_ID --repo gods04/InUni
```

Expected: GitHub confirms the secret was set.

- [ ] **Step 3: Add the Cloudflare API token from the clipboard**

After copying the token in the Cloudflare dashboard, run:

```powershell
Get-Clipboard |
  & "C:\Program Files\GitHub CLI\gh.exe" secret set CLOUDFLARE_API_TOKEN --repo gods04/InUni
```

Expected: GitHub confirms the secret was set without printing its value.

- [ ] **Step 4: Add the Supabase project URL**

Run:

```powershell
"https://amjragmxxztmbtfgychp.supabase.co" |
  & "C:\Program Files\GitHub CLI\gh.exe" secret set VITE_SUPABASE_URL --repo gods04/InUni
```

- [ ] **Step 5: Add the Supabase publishable key from local `.env`**

Run:

```powershell
$publishableKey = (
  Get-Content .env |
  Where-Object { $_ -like 'VITE_SUPABASE_ANON_KEY=*' }
) -replace '^VITE_SUPABASE_ANON_KEY=', ''

$publishableKey |
  & "C:\Program Files\GitHub CLI\gh.exe" secret set VITE_SUPABASE_ANON_KEY --repo gods04/InUni
```

- [ ] **Step 6: Verify secret names**

Run:

```powershell
& "C:\Program Files\GitHub CLI\gh.exe" secret list --repo gods04/InUni
```

Expected: all four required names are listed. GitHub never displays values.

### Task 5: Trigger and verify automatic deployment

**Files:**
- No repository file changes

- [ ] **Step 1: Trigger the workflow manually**

Run:

```powershell
& "C:\Program Files\GitHub CLI\gh.exe" workflow run deploy-cloudflare-pages.yml --repo gods04/InUni
```

- [ ] **Step 2: Watch the run through completion**

Run:

```powershell
$runId = & "C:\Program Files\GitHub CLI\gh.exe" run list `
  --repo gods04/InUni `
  --workflow deploy-cloudflare-pages.yml `
  --limit 1 `
  --json databaseId `
  --jq '.[0].databaseId'

& "C:\Program Files\GitHub CLI\gh.exe" run watch $runId `
  --repo gods04/InUni `
  --exit-status
```

Expected: install, tests, build, and deploy all succeed.

- [ ] **Step 3: Confirm Cloudflare deployed the GitHub commit**

Run:

```powershell
npx.cmd wrangler pages deployment list --project-name inuni-uct --json
```

Expected: the newest production deployment source matches `git rev-parse HEAD`.

- [ ] **Step 4: Verify production routes**

Run:

```powershell
$urls = @(
  'https://inuni-uct.pages.dev/',
  'https://inuni-uct.pages.dev/login',
  'https://inuni-uct.pages.dev/profile',
  'https://inuni-uct.pages.dev/admin'
)

foreach ($url in $urls) {
  $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 30
  Write-Output "$($response.StatusCode) $url"
}
```

Expected: every route returns HTTP 200.

- [ ] **Step 5: Verify the live browser runtime**

Open `https://inuni-uct.pages.dev`, confirm the Demo mode banner is absent,
the login page says it uses Supabase Auth, and no page or console error occurs.

- [ ] **Step 6: Confirm repository synchronization**

Run:

```powershell
git status --short
git rev-list --left-right --count origin/master...master
```

Expected: clean status and `0 0`.
