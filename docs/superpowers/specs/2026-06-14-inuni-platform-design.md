# InUni Forum MVP Design

**Date:** 2026-06-14  
**Status:** Revised and approved scope
**Audience:** University of Cape Town students  
**Primary language:** English

## 1. Product Goal

InUni MVP is a clean, trustworthy campus forum for University of Cape Town students. The first release focuses only on the smallest complete community loop:

1. A user creates an account or logs in.
2. The user browses categorised campus posts.
3. The user creates a named or anonymous post.
4. Other users comment.
5. Users report harmful content.
6. An administrator reviews reports, removes content, and bans abusive users.

The MVP must work locally and be deployable with free hosting. It must not become a toolbox, file-sharing platform, food application, or analytics product during this phase.

## 2. Confirmed MVP Scope

### Included

- User registration
- User login and logout
- UCT Verified badge
- Forum feed
- Post categories
- Create post
- Anonymous posting
- Post detail
- Comments
- Reports
- Administrator report review
- Administrator post deletion
- Administrator comment deletion
- Administrator user ban and unban
- Simple user profile
- Responsive Apple-inspired visual system
- Loading, empty, error, and unauthorised states
- Supabase database, authentication, and Row Level Security

### Not Included in MVP

- Word-to-PDF
- Food recommendation tools
- Budget meal planning
- Recipes or How to Cook
- Advertisements
- Images or file attachments
- Shared Files
- Venue and price submissions
- Complex analytics
- Private messaging
- Realtime chat
- Mobile application
- AI recommendations

These features remain recorded in the post-MVP roadmap and must not be forgotten.

## 3. Product Principles

1. **Forum first:** Every MVP decision supports campus discussion.
2. **Small but complete:** Finish authentication, posting, commenting, reporting, and moderation before expanding.
3. **Trust by design:** UCT verification, ownership rules, reports, bans, and server-enforced permissions are foundational.
4. **Local relevance:** English copy reflects University of Cape Town and South African student life.
5. **Free-first infrastructure:** Use Vercel or Cloudflare Pages with Supabase.
6. **Simple extension path:** The schema and navigation should allow future features without implementing them now.

## 4. Technical Architecture

### Frontend

- React
- Vite
- TypeScript
- Tailwind CSS
- React Router

The existing Vite project remains the base. New code follows feature-focused, beginner-friendly modules and avoids unnecessary dependencies.

### Backend

Supabase provides:

- Email/password authentication
- PostgreSQL database
- Row Level Security
- Profiles and roles

No custom backend server or Serverless Function is required for the MVP.

### Deployment

- Source control: GitHub
- Frontend: Vercel or Cloudflare Pages
- Backend: Supabase

The frontend uses only `VITE_SUPABASE_URL` and the public anon key. A service-role key is never exposed to browser code.

## 5. Routes

### Public and Student Routes

- `/` — forum feed
- `/post/:id` — post detail and comments
- `/create` — create a post
- `/login` — sign up and login
- `/profile` — simple current-user profile and own posts

### Administrator Routes

- `/admin` — compact moderation overview and report queue
- `/admin/users` — search, ban, and unban users

The report queue may include post and comment actions on one page. Separate analytics, audit, venue, and content-library pages are not required for the MVP.

## 6. Unified Visual System

The approved direction is **Balanced Community**, adapted to the smaller MVP.

### Visual Style

- Modern Apple-inspired campus community
- White and cool light-grey foundations
- Charcoal primary text
- Cool grey secondary text
- Low-saturation blue primary accent
- Green only for restrained positive or category states
- Monochrome black-and-white logo
- Generous whitespace
- Clear typography hierarchy
- Soft, restrained shadows
- No gradients, decorative blobs, excessive colours, or exaggerated animation

### Layout

- Mobile-first
- Forum feed is the main visual focus
- Desktop may use a quiet right rail for useful campus context only
- No ad placeholders in the MVP
- Post cards use 16–20px corner radii
- Buttons are simple with comfortably rounded corners
- Admin pages are denser and operational, while retaining the same palette and components

## 7. Authentication and Profiles

Any valid email address may register during the MVP.

### UCT Verified

A user receives a visible **UCT Verified** badge when:

- The authenticated email has been confirmed; and
- The normalised email ends in `@uct.ac.za`.

The badge is derived from the confirmed authentication email. Users cannot set it manually.

### Profile Data

`profiles` includes:

- `id`
- `username`
- `display_name`
- `role`: `student` or `admin`
- `is_banned`
- `ban_reason`
- `created_at`

The simple profile page shows:

- Display name
- Email
- UCT Verified status
- Account role when relevant
- User's own posts

Avatar upload, biography, followers, and profile customisation are deferred.

## 8. Forum

### Categories

- Study
- Campus Life
- Questions
- Lost & Found
- Confessions
- General

### Feed

Each post card shows:

- Title
- Category
- Preview text
- Author name or `Anonymous`
- UCT Verified badge for eligible non-anonymous authors
- Comment count
- Relative creation time
- Report action

The feed supports category filtering and newest-first ordering.

### Create Post

Logged-in, non-banned users can submit:

- Title
- Content
- Category
- Anonymous toggle

Title and content are required. Attachments, course tags, drafts, rich text, and editing are not required for this MVP.

### Post Detail

The post page shows:

- Full post
- Category
- Author or `Anonymous`
- UCT Verified badge when applicable
- Created time
- Comment count
- Comments
- Comment form
- Report action

### Anonymous Posts

Anonymous posting hides the author from normal users but retains `author_id` in the database. The owner and authorised administrators remain able to enforce ownership and moderation rules.

### Comments

Logged-in, non-banned users can add plain-text comments. The MVP does not require nested replies, reactions, editing, or attachments.

## 9. Reports and Moderation

### Reports

Logged-in, non-banned users can report a post or comment.

A report includes:

- Reporter
- Target type: post or comment
- Target ID
- Reason
- Status: `open`, `resolved`, or `dismissed`
- Created time
- Resolving administrator
- Optional resolution note

A user cannot repeatedly report the same target.

### Administrator Dashboard

The MVP administrator interface provides:

- Open report count
- Report queue
- Reported content context
- Delete post
- Delete comment
- Dismiss report
- Resolve report
- Search users
- Ban user with a reason
- Unban user

Sensitive actions require confirmation.

### Ban Behaviour

A banned user may:

- Log in
- Read public posts and comments
- View the reason for the ban

A banned user may not:

- Create posts
- Create comments
- Submit reports

Ban enforcement must exist in Supabase RLS or database helper functions, not only in frontend buttons.

### Deletion Behaviour

For the MVP, administrators may permanently delete reported posts and comments. Deleting a post cascades to its comments and reports as defined by the database.

Soft deletion and a full moderation audit log are post-MVP improvements.

## 10. Database Model

### `profiles`

- `id`
- `username`
- `display_name`
- `role`
- `is_banned`
- `ban_reason`
- `created_at`

### `posts`

- `id`
- `author_id`
- `title`
- `content`
- `category`
- `is_anonymous`
- `created_at`
- `updated_at`

### `comments`

- `id`
- `post_id`
- `author_id`
- `content`
- `created_at`
- `updated_at`

### `post_likes`

The existing table may remain in the schema, but likes are not exposed as an MVP feature and must not delay delivery.

### `reports`

- `id`
- `reporter_id`
- `target_type`
- `target_id`
- `reason`
- `status`
- `resolved_by`
- `resolution_note`
- `created_at`
- `resolved_at`

The schema may use separate nullable `post_id` and `comment_id` columns if that produces safer foreign keys than a polymorphic `target_id`. Exactly one target must be present.

## 11. Security and RLS

### Public Access

- Anyone can read posts.
- Anyone can read comments.
- Public profile reads expose only fields needed for author display and verification.

### Logged-in Users

- Non-banned users can create posts and comments.
- Non-banned users can create reports.
- Users can manage only their own eligible posts and comments if edit/delete UI is later exposed.
- Anonymous posts still belong to their authenticated creator.

### Administrators

- Administrators can read all reports.
- Administrators can update report status.
- Administrators can delete posts and comments.
- Administrators can update user ban fields.

### Enforcement

- Role and ban checks are enforced in PostgreSQL policies or security-definer helper functions.
- Frontend route guards improve UX but are not security boundaries.
- Administrator status cannot be self-assigned.
- The public anon key is the only Supabase key used in the browser.

## 12. UI States and Error Handling

The MVP includes explicit states for:

- Loading feed
- Empty feed
- Empty category
- Missing post
- No comments
- Authentication required
- Invalid form
- Supabase unavailable
- Submission failure
- Duplicate report
- Banned user action
- Administrator-only route
- Confirmation before destructive moderation

Form input remains intact after recoverable submission errors.

## 13. Testing Strategy

### Unit Tests

- UCT email verification
- Role checks
- Banned-user capability checks
- Post validation
- Comment validation
- Report target validation

### Component Tests

- Authentication form modes
- Create-post validation and anonymous toggle
- Comment submission states
- Report submission
- Administrator deletion confirmation
- Ban and unban controls

### Core Flow Tests

- Register and log in
- Show UCT Verified for a confirmed `@uct.ac.za` account
- Create named post
- Create anonymous post
- Filter categories
- Add comment
- Report post
- Report comment
- Administrator deletes post
- Administrator deletes comment
- Administrator bans and unbans user
- Profile shows current user's posts

### Backend Verification

Supabase policies are tested for:

- Anonymous visitor
- Normal user
- Banned user
- Content owner
- Administrator

Frontend tests alone are not proof of authorisation.

### Visual Verification

- Mobile and desktop screenshots
- Navigation fit
- Post-card hierarchy
- Form overflow
- Admin table/action layout
- Empty and error states

## 14. MVP Delivery Plan

### Phase 1: Foundation and Design

- Apply the approved white, grey, charcoal, and muted-blue system
- Simplify navigation to Forum, Create, Profile, and conditional Admin
- Add automated test tooling

### Phase 2: Authentication and Permissions

- Extend profile roles and ban state
- Add UCT Verified logic
- Add route guards
- Update Supabase RLS

### Phase 3: Forum Completion

- Feed and categories
- Named and anonymous posting
- Post detail
- Comments
- Simple profile

### Phase 4: Moderation

- Reports for posts and comments
- Administrator report queue
- Delete post and comment
- Ban and unban user

### Phase 5: Deployment

- Build verification
- GitHub repository
- Supabase production project
- Vercel or Cloudflare Pages deployment
- Environment variables
- SPA routing verification
- Basic privacy, terms, and community rules

## 15. Post-MVP Roadmap

The following features are deliberately deferred, not cancelled.

### Toolbox

- Toolbox home
- Basic browser-side Word-to-PDF
- Daily Luck

### Food and Budget

- On-campus and off-campus food recommendations
- Administrator-maintained UCT venue and menu data
- Student venue and price submissions with approval
- Rand-based budget meal planner
- How to Cook based on ingredients and equipment
- Original South African student recipe dataset

### Files and Media

- Images attached to posts
- Document attachments
- Supabase Storage
- Shared Files page
- File search and course filtering
- Attachment moderation

### Monetisation

- Clearly labelled, policy-compliant advertisement spaces
- Desktop right-rail placements
- Mobile placements that do not disrupt forum reading

### Platform Enhancements

- Soft deletion
- Moderation audit log
- Basic operational analytics
- Post editing
- Comment editing
- Likes
- Avatars and profile biography
- High-fidelity server-side Word conversion

### Still Not Planned

- Marketplace
- Delivery or ordering
- Payments
- Private messaging
- AI-generated recommendations
- Complex analytics
- Complex administrator hierarchy
