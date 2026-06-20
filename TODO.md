# InUni TODO

Use this file when deciding what to build next. If the user asks "what should
we do now?", check this list first and remind them about the deferred security
items.

## Product direction

InUni should stay forum-first: the main experience is still posting, reading,
asking, answering, and sharing useful student resources. Extra tools should
support that community instead of turning the site into a crowded dashboard.

## Current priority

- [x] Turn `/admin` into a calm metrics dashboard with compact links to
      report/file/user tools.
- [x] Add a mobile hamburger menu so the main navigation stays compact on small
      screens.
- [x] Add search across posts and shared files before adding more content
      sections.
- [x] Add show/hide password controls on login, signup, and password reset
      forms.
- [x] Add a dark-mode foundation that follows the user's system theme.

## UCT-first, multi-university-ready

- [ ] Keep the public product UCT-first until UCT has enough real users,
      posts, files, and campus-specific value.
- [ ] Avoid hard-coding UCT too deeply in future database design. Prefer
      university-aware fields such as `university_id`, `campus_id`, and
      `faculty_id` when adding larger schema changes.
- [ ] Keep UCT email verification working now, but design the verification
      rules so more university email domains can be added later.
- [ ] Keep campus tools, classroom finder data, course codes, building aliases,
      and admin metrics scoped in a way that can later belong to one university.
- [ ] Avoid showing a university picker until there is at least one real
      non-UCT pilot. Do not add empty universities just to look bigger.
- [ ] If expanding later, add one university at a time as a pilot rather than
      opening all South African universities at once.
- [ ] Keep brand language flexible enough that InUni can become a network of
      university communities, while the first live community remains UCT.
- [ ] Long-term, support a global "all students" forum alongside university
      spaces, so users can browse all South African university discussions or
      filter down to one university.
- [ ] Let each post, file, tool, and announcement belong either to the global
      community or to a specific university.
- [ ] Add university verification badges later, such as UCT Verified, Wits
      Verified, UJ Verified, or Stellenbosch Verified, based on approved
      university email domains.
- [ ] Keep university-specific spaces protected by that university's
      verification rules when needed, while allowing public reading where it
      makes sense.
- [ ] Do not show empty global or university sections too early. Add the global
      forum and university switcher only after UCT has enough activity.

## Simplicity rules

- [ ] Keep the top navigation small. Do not add a new nav item for every new
      feature.
- [x] Put secondary tools such as classroom finder, food tools, Word-to-PDF,
      and future utilities inside a simple "Tools" or "Campus tools" page.
- [ ] Keep the forum feed clean: one primary create action, clear categories,
      search/filter controls, and no oversized marketing-style sections.
- [ ] Use progressive disclosure: show simple cards/buttons first, then details
      after the user clicks.
- [x] Avoid crowded admin screens. Admin should show concise health metrics and
      compact action buttons without turning every action into a large card.
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
- [x] The current admin page needs to feel like a control center, with queues
      moved to their own focused review pages.
- [x] The site needs search before it needs many more content sections. Without
      search, more content will feel like clutter.
- [x] The app needs a clearer "student utility" structure before adding more
      tools. A tools hub is safer than adding many separate pages to the nav.
- [ ] Empty states should stay useful but compact. Large empty panels make the
      app feel bigger than the content inside it.
- [ ] Mobile density needs special care because this product will often be used
      while walking, in class, or quickly between lectures.

## Next product work

- [x] Turn `/admin` into an admin dashboard with metrics directly below the
      header controls.
- [x] Keep the current moderation report queue available on its own page,
      `/admin/reports`.
- [x] Add a "View reports" button on the admin dashboard, with a red badge
      showing the number of open reports when the count is greater than 0.
- [x] Keep "View files" on the admin dashboard with the existing red review
      count badge.
- [x] Keep "Manage users" as a dashboard action.
- [x] Add a compact tools hub before adding more standalone utility pages.

## Login and account experience

- [ ] Add a Google login option on the login page.
- [ ] Configure Supabase Google OAuth provider and production/local redirect
      URLs before enabling Google login live.
- [x] Add show/hide password controls on login, registration, and password
      reset forms.
- [x] Improve login and signup error messages so users know whether the issue
      is email confirmation, wrong password, invalid email, or provider setup.
- [ ] Keep UCT verification rules clear when using Google login, especially for
      `@uct.ac.za` and `@myuct.ac.za` accounts.

## Profile and identity

- [x] Let users edit their display name from the profile page.
- [x] Let users upload, replace, and remove a profile photo.
- [x] Show a stable fallback avatar, such as initials, when a user has not
      uploaded a photo.
- [x] Show user display names and avatars consistently on posts, comments, and
      profile pages.
- [x] Add profile avatars to shared file owner rows.
- [x] Add image type and size limits for profile photos.
- [ ] Add image dimension or cropping checks later if avatars need stricter
      visual consistency.
- [x] Decide whether profile photos use Supabase Storage first or wait for the
      future app-owned storage layer.
- [x] Keep profile editing unavailable for banned users if participation is
      restricted.
- [x] Add tests for display name updates, avatar fallback behavior, and profile
      photo upload errors.

## Navigation and information architecture

- [x] Decide the long-term top nav shape before adding more features. A likely
      direction is Forum, Files, Create, Tools, Profile, Admin.
- [x] Keep Admin visible only for admins.
- [x] Group classroom finder, document tools, food tools, and future utilities
      under Tools instead of adding them all to the main nav.
- [ ] Add search as a first-class action, but keep it visually lightweight.
- [ ] Add route-level empty states that are shorter and more action-oriented.
- [ ] Review mobile navigation before adding any new top-level page.

## Public reading and login gates

- [ ] Keep posts and comments readable when the visitor is logged out.
- [ ] Keep approved Shared Files listings readable when the visitor is logged
      out.
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
- [x] Use a mobile hamburger menu: keep the header compact with the logo and a
      three-line menu button, then show navigation options after tapping it.
- [x] Keep desktop navigation as a normal top navigation while mobile uses the
      hamburger menu.
- [x] Make the hamburger menu easy to close by tapping a close button, choosing
      a route, pressing Escape, or tapping outside the menu.
- [x] Show the same review badges inside the mobile menu, such as Admin file
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

- [x] Add dark mode support for users whose phone or browser uses a dark system
      theme.
- [x] Follow the user's system theme by default with `prefers-color-scheme`.
- [ ] Consider adding a manual Light / Dark / System theme setting later.
- [x] Define proper dark-mode colors for backgrounds, panels, borders, text,
      muted text, buttons, badges, forms, file cards, and admin screens.
- [ ] Make sure red review badges, danger buttons, links, and success/error
      states keep enough contrast in dark mode.
- [ ] Test login, forum feed, create post, file upload, profile, admin dashboard,
      admin review queues, and classroom finder in both light and dark mode.
- [x] Avoid pure black and pure white surfaces; use comfortable contrast that
      still feels like the same InUni design.

## Admin dashboard metrics

- [x] Show today's traffic at a glance.
- [x] Show daily active users or unique visitors.
- [x] Show today's new signups.
- [x] Show today's posts and comments.
- [ ] Show today's file uploads and downloads if download tracking is added.
- [x] Show open moderation reports and files needing review.
- [x] Add a simple recent activity section for admin monitoring.
- [ ] Decide whether analytics should be stored in Supabase tables, a separate
      analytics service, or server logs after the app has a backend.

## Files and attachments

- [x] Improve the admin file review page with clearer uploader, course, file
      type, report count, and review reason information.
- [x] Add better file preview/download controls for moderators.
- [x] Add clearer user-facing errors for oversized or blocked uploads.
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
- [x] Search across posts and shared files.
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
