# InUni TODO

Use this file when deciding what to build next. If the user asks "what should
we do now?", check this list first and remind them about the deferred security
items.

## Product direction

InUni should stay forum-first: the main experience is still posting, reading,
asking, answering, and sharing useful student resources. Extra tools should
support that community instead of turning the site into a crowded dashboard.

## Simplicity rules

- [ ] Keep the top navigation small. Do not add a new nav item for every new
      feature.
- [ ] Put secondary tools such as classroom finder, food tools, Word-to-PDF,
      and future utilities inside a simple "Tools" or "Campus tools" page.
- [ ] Keep the forum feed clean: one primary create action, clear categories,
      search/filter controls, and no oversized marketing-style sections.
- [ ] Use progressive disclosure: show simple cards/buttons first, then details
      after the user clicks.
- [ ] Avoid crowded admin screens. Admin should show concise health metrics and
      action buttons, with queues on their own pages.
- [ ] Prefer fewer, stronger features over many half-finished features.
- [ ] Every new feature should answer: "Does this help UCT students find help,
      share resources, or navigate campus faster?"
- [ ] Before adding a major feature, decide where it lives so the homepage and
      top nav do not become messy.
- [ ] Design mobile first for student workflows. Many users will open InUni on
      a phone between classes, while walking, or during a lecture break.

## Sharp critique to address

- [ ] The product has a strong forum base, but it can easily become too broad if
      Files, Admin, classroom finder, food tools, and document tools all compete
      at the same visual level.
- [ ] The current admin page feels like a queue page, not a control center.
      Move queues behind buttons and make `/admin` a calm overview.
- [ ] The site needs search before it needs many more content sections. Without
      search, more content will feel like clutter.
- [ ] The app needs a clearer "student utility" structure before adding more
      tools. A tools hub is safer than adding many separate pages to the nav.
- [ ] Empty states should stay useful but compact. Large empty panels make the
      app feel bigger than the content inside it.
- [ ] Mobile density needs special care because this product will often be used
      while walking, in class, or quickly between lectures.

## Next product work

- [ ] Turn `/admin` into an admin dashboard instead of showing the moderation
      queue directly.
- [ ] Move the current moderation report queue to its own page, likely
      `/admin/reports`.
- [ ] Add a "Review reports" button on the admin dashboard, with a red badge
      showing the number of open reports when the count is greater than 0.
- [ ] Keep "Review files" on the admin dashboard with the existing red review
      count badge.
- [ ] Keep "Manage users" as a dashboard action.
- [ ] Add a compact tools hub before adding more standalone utility pages.

## Login and account experience

- [ ] Add a Google login option on the login page.
- [ ] Configure Supabase Google OAuth provider and production/local redirect
      URLs before enabling Google login live.
- [ ] Add show/hide password controls on login, registration, and password
      reset forms.
- [ ] Improve login and signup error messages so users know whether the issue
      is email confirmation, wrong password, invalid email, or provider setup.
- [ ] Keep UCT verification rules clear when using Google login, especially for
      `@uct.ac.za` and `@myuct.ac.za` accounts.

## Navigation and information architecture

- [ ] Decide the long-term top nav shape before adding more features. A likely
      direction is Forum, Files, Create, Tools, Profile, Admin.
- [ ] Keep Admin visible only for admins.
- [ ] Group classroom finder, document tools, food tools, and future utilities
      under Tools instead of adding them all to the main nav.
- [ ] Add search as a first-class action, but keep it visually lightweight.
- [ ] Add route-level empty states that are shorter and more action-oriented.
- [ ] Review mobile navigation before adding any new top-level page.

## Public reading and login gates

- [ ] Keep posts and comments readable when the visitor is logged out.
- [ ] Require login only for participation actions such as creating posts,
      commenting, uploading files, downloading files, reporting, and account
      settings.
- [ ] If a logged-out visitor opens a post with attachments, never block the
      post or comments because file metadata or downloads require login.
- [ ] Use compact login prompts beside gated actions instead of replacing the
      whole public page.
- [ ] Add regression tests whenever a public route gains a new login-gated
      subfeature.

## Mobile experience

- [ ] Audit every main route on common mobile widths before adding more major
      features.
- [ ] Use a mobile hamburger menu: keep the header compact with the logo and a
      three-line menu button, then show navigation options after tapping it.
- [ ] Keep desktop navigation as a normal top navigation while mobile uses the
      hamburger menu.
- [ ] Make the hamburger menu easy to close by tapping a close button, choosing
      a route, pressing Escape, or tapping outside the menu.
- [ ] Show the same review badges inside the mobile menu, such as Admin file
      review counts.
- [ ] Keep primary actions thumb-friendly, especially Create, Search, Upload,
      Download, Report, and Admin review actions.
- [ ] Make post cards, file cards, and admin queues scan well on mobile without
      oversized empty space.
- [ ] Ensure attachment upload, file review, login, signup, and password reset
      forms fit comfortably on small screens.
- [ ] Test classroom finder routes on mobile first because that feature is most
      likely used while moving around campus.
- [ ] Avoid hover-only interactions. Everything important must work by tap.
- [ ] Check text wrapping, button sizes, and badge placement on mobile before
      shipping each UI change.

## Theme and dark mode

- [ ] Add dark mode support for users whose phone or browser uses a dark system
      theme.
- [ ] Follow the user's system theme by default with `prefers-color-scheme`.
- [ ] Consider adding a manual Light / Dark / System theme setting later.
- [ ] Define proper dark-mode colors for backgrounds, panels, borders, text,
      muted text, buttons, badges, forms, file cards, and admin screens.
- [ ] Make sure red review badges, danger buttons, links, and success/error
      states keep enough contrast in dark mode.
- [ ] Test login, forum feed, create post, file upload, profile, admin dashboard,
      admin review queues, and classroom finder in both light and dark mode.
- [ ] Avoid pure black and pure white surfaces; use comfortable contrast that
      still feels like the same InUni design.

## Admin dashboard metrics

- [ ] Show today's traffic at a glance.
- [ ] Show daily active users or unique visitors.
- [ ] Show today's new signups.
- [ ] Show today's posts and comments.
- [ ] Show today's file uploads and downloads if download tracking is added.
- [ ] Show open moderation reports and files needing review.
- [ ] Add a simple recent activity section for admin monitoring.
- [ ] Decide whether analytics should be stored in Supabase tables, a separate
      analytics service, or server logs after the app has a backend.

## Files and attachments

- [ ] Improve the admin file review page with clearer uploader, course, file
      type, report count, and review reason information.
- [ ] Add better file preview/download controls for moderators.
- [ ] Add clearer user-facing errors for oversized or blocked uploads.
- [ ] Later, move storage from Supabase Storage to the app's own storage layer
      when the backend is ready.

## Campus navigation and classroom finder

- [ ] Add a classroom finder where users can enter their current location and
      destination classroom, building, or lecture venue.
- [ ] Provide step-by-step walking directions using campus landmarks, for
      example "walk forward until you see LS Building, then go up the stairs".
- [ ] Build a campus location database for buildings, entrances, lecture rooms,
      stairs, ramps, lifts, gates, and common landmarks.
- [ ] Support building aliases and short names such as "LS", "Leslie Social",
      course venue abbreviations, and room codes.
- [ ] Add route options such as fastest route, easiest route, accessible route,
      and route with fewer stairs.
- [ ] Let users choose manual start location first; only add live location later
      if privacy and permission handling are clear.
- [ ] Avoid storing precise user location unless it is genuinely needed.
- [ ] Add a feedback button so students can report wrong directions, blocked
      paths, construction, or confusing landmarks.

## Safety and security reminders

- [ ] Add stricter file type allowlists.
- [ ] Add stronger download permission checks when moving file access behind a
      backend.
- [ ] Add ClamAV self-hosted file scanning before allowing larger file uploads.
- [ ] Add rate limits for posting, commenting, reporting, uploads, and
      downloads.
- [ ] Add audit logs for admin actions such as deleting posts, rejecting files,
      restoring hidden files, and banning users.
- [ ] Review Supabase RLS policies again before production scale.

## Community features to consider later

- [ ] Notifications for replies, comments, and moderation decisions.
- [ ] Search across posts and shared files.
- [ ] Better profile pages and user activity history.
- [ ] Saved posts or bookmarked files.
- [ ] Course/faculty filters for the forum and shared files.

## Deferred ideas from the README

- [ ] Word-to-PDF tools.
- [ ] Food tools.
- [ ] Budget meals.
- [ ] South African recipes.
- [ ] Advertising.
- [ ] Complex analytics.
