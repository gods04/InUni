# InUni Platform Design

**Date:** 2026-06-14  
**Status:** Approved design  
**Audience:** University of Cape Town students  
**Primary language:** English

## 1. Product Summary

InUni is a modern campus community platform for University of Cape Town students. Its core is a trustworthy university forum, supported by a student toolbox, shared academic files, local food and budget tools, and a focused moderation dashboard.

The first production version includes:

- Forum posts, comments, categories, reports, profiles, and anonymous posting
- Images and files attached to posts
- A searchable Shared Files page
- A student toolbox
- Basic browser-side Word-to-PDF conversion
- UCT and Cape Town food recommendations
- South African student recipes and budget meal planning
- Daily luck as a clearly entertainment-only tool
- Administrator moderation, user management, basic analytics, and venue-data review

The product is not a marketplace, delivery platform, private messaging service, or AI recommendation platform.

## 2. Product Principles

1. **Forum first:** Community discussion remains the most prominent feature.
2. **Useful, not noisy:** Tools and ads must not distract from forum content.
3. **Local relevance:** Food, pricing, language, and recipes reflect UCT and South African student life.
4. **Trust by design:** Clear identities, UCT verification, moderation, file provenance, and audit records support credibility.
5. **Free-first infrastructure:** Use free hosting and Supabase allowances while usage is small.
6. **Progressive complexity:** Browser-side and curated-data solutions come before expensive services or custom servers.

## 3. Technical Architecture

### Frontend

- React
- Vite
- TypeScript
- Tailwind CSS
- React Router

The existing Vite application remains the foundation. It will be reorganised into feature-focused modules without introducing a large framework migration.

### Backend

Supabase provides:

- Email/password authentication
- PostgreSQL database
- Row Level Security
- File storage
- User profiles and roles

Small serverless functions may be added later for tasks that cannot safely run in the browser. The first Word-to-PDF implementation runs locally in the browser and does not require a conversion server.

### Deployment

- Frontend: Vercel or Cloudflare Pages
- Backend: Supabase
- Source control: GitHub

The frontend uses only the Supabase public anon key. Service-role keys are never exposed to browser code.

## 4. Information Architecture

### Public and Student Routes

- `/` — forum feed
- `/post/:id` — full post, attachments, comments, report action
- `/create` — create a post with attachments
- `/files` — Shared Files library
- `/tools` — toolbox overview
- `/tools/word-to-pdf` — basic local document conversion
- `/tools/food` — on-campus and off-campus food recommendations
- `/tools/how-to-cook` — recipe matching by ingredients and equipment
- `/tools/budget-meals` — Rand-based meal and grocery suggestions
- `/tools/daily-luck` — deterministic entertainment result
- `/login` — sign up and login
- `/profile` — account information and user's posts

### Administrator Routes

- `/admin` — overview and basic statistics
- `/admin/reports` — report queue
- `/admin/content` — post, comment, and attachment moderation
- `/admin/users` — ban and unban users
- `/admin/venues` — venue, menu, and price management
- `/admin/submissions` — student venue and price submissions

All administrator routes require both a frontend role check and Supabase-enforced permissions.

## 5. Unified Visual System

The approved direction is **Balanced Community**, a modern Apple-inspired campus interface.

### Palette

- Background: cool white and very light grey
- Surfaces: white
- Primary text: charcoal
- Secondary text: cool medium grey
- Primary accent: low-saturation blue
- Destructive actions: restrained red
- Status colours appear only when semantically necessary

Green may remain as a restrained category or positive-status colour, but it is not part of the logo or primary brand identity.

### Layout

- Mobile-first
- Generous whitespace
- Forum content occupies the primary column
- Desktop pages may use a quiet right rail for campus information and compliant advertisements
- Mobile hides the right rail and moves permitted ads between content sections or to the bottom
- Tools and Admin use focused work surfaces, not marketing-style landing pages

### Components

- Post and tool cards use 16–20px corner radii
- Buttons use large but controlled radii
- Shadows remain soft and restrained
- Typography has clear title, section, body, and metadata levels
- Navigation remains predictable across Forum, Shared Files, Tools, Profile, and Admin
- No decorative blobs, strong gradients, excessive colour, or exaggerated animation

### Advertising

- Ad units remain visually secondary
- Ads are clearly labelled as “Advertisement” or approved equivalent
- Ads cannot resemble posts, download buttons, navigation, or moderation controls
- Placements cannot cause accidental clicks
- Forum readability takes priority over revenue

## 6. Authentication and Profiles

Any valid email address may register in the first version.

Users with a confirmed `@uct.ac.za` address receive a visible **UCT Verified** badge. The badge is calculated from the confirmed authentication email and cannot be manually assigned by the user.

Profiles include:

- User ID
- Username
- Display name
- Avatar
- Role: `student` or `admin`
- Ban status and optional ban reason
- UCT verification status
- Created timestamp

A banned user may read public content but cannot create posts, comments, uploads, reports, or venue submissions.

## 7. Forum

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
- Author or “Anonymous”
- UCT Verified badge where applicable and non-anonymous
- Comment count
- Relative creation time
- Attachment indicator
- Report action

### Post Detail

The detail view shows:

- Full content
- Author metadata or Anonymous
- Images with previews
- Downloadable file attachments
- Comments
- Comment form for eligible users
- Report action

### Anonymous Posts

Anonymous posting hides the author's public identity but retains the authenticated owner ID in the database for ownership and moderation.

## 8. Attachments and Shared Files

### Attachment Rules

- Allowed images: JPEG, PNG, and WebP
- Allowed documents: PDF, DOCX, PPTX, and XLSX
- Maximum file size: 10 MB
- Maximum attachments per post: 5
- Both client and server/storage rules validate type, size, and ownership

Images display previews before and after publishing. Documents display filename, extension, size, and download action.

If one upload fails, the user can retry that file without losing the post draft or successful uploads.

### Storage

Files are stored in a private Supabase Storage bucket. Database records contain:

- Attachment ID
- Post ID
- Uploader ID
- Original filename
- MIME type
- Size
- Storage path
- Attachment kind
- Moderation status
- Created timestamp

Downloads use controlled signed URLs rather than permanent public bucket URLs.

### Shared Files

Every shared file must belong to a forum post. `/files` aggregates eligible attachments and supports:

- Text search
- Category filtering
- Course tag filtering
- File-type filtering
- Sort by newest or most downloaded when download tracking exists

Hiding or deleting a post removes its attachments from Shared Files. Administrators can hide or remove unsafe attachments from the moderation queue.

## 9. Student Toolbox

### Toolbox Home

The toolbox shows concise tool cards with purpose, privacy notes, and current capability. It does not imitate a marketing landing page.

### Word to PDF

The first version performs a basic DOCX-to-PDF conversion in the browser.

- Files are not uploaded
- The interface labels the feature **Basic conversion**
- Users are warned that complex tables, fonts, headers, footers, and pagination may change
- Unsupported or damaged documents produce a clear error

A future high-fidelity version may use a dedicated conversion service or container running LibreOffice, subject to hosting cost and resource limits.

### Daily Luck

Daily Luck is deterministic for a user and date, so refreshing does not repeatedly change the result.

It includes:

- A light-hearted score
- A short positive message
- A clear “For entertainment only” notice

No result is presented as factual prediction, medical advice, financial advice, or academic guidance.

## 10. Food and Budget Tools

### What Should I Eat?

The user chooses:

- On campus or off campus
- Rand budget
- Meal type
- Dietary preferences
- Optional distance or campus area

Results come from a curated venue and menu dataset. Each result includes:

- Venue
- Suggested meal
- Estimated price
- Location context
- Dietary labels
- “Price is an estimate” notice

### Venue Data Governance

Administrators maintain the public venue list. Students can submit:

- A new venue
- A menu item
- A price correction
- A closure or availability update

Submissions remain private until approved. The administrator can approve, edit, or reject them with a reason.

### How to Cook

This tool follows the structural idea of clear, community-maintained recipes while using an original South African student recipe dataset.

Users provide:

- Available ingredients
- Available equipment
- Maximum time
- Cooking skill
- Dietary restrictions
- Optional budget for missing ingredients

Common equipment includes:

- Microwave
- Hot plate
- One pot
- Frying pan
- Air fryer
- Kettle
- Oven

Recipes store:

- Name and description
- South African or student-life context
- Ingredients and quantities
- Optional substitutions
- Required equipment
- Preparation and cooking time
- Difficulty
- Estimated cost per serving
- Servings
- Allergens
- Dietary tags
- Load-shedding-friendly flag
- Clear ordered steps
- Moderation and publication status

The starter dataset prioritises affordable local meals and common ingredients, including pap, chakalaka, samp and beans, tomato bredie, student-style bunny chow, vetkoek, boerewors meals, Cape Malay-inspired curries, rice, pasta, oats, eggs, sandwiches, and vegetarian meals.

### Budget Meal Planner

The user enters a Rand amount such as `R100`. The tool compares:

- Buying a prepared meal
- Buying groceries for multiple meals
- Combining one prepared meal with groceries

Results include:

- Itemised estimated spend
- Number of meals or servings
- Remaining budget
- Suggested substitutions
- Estimate disclaimer

The first version uses curated price estimates rather than claiming real-time supermarket pricing.

## 11. Administrator Dashboard

The first administrator version is limited to four operational areas plus venue review.

### Overview

- Open reports
- Posts created today
- Active users
- Recent moderation actions
- Pending venue submissions

Statistics are operational summaries, not a full analytics platform.

### Reports

Administrators can:

- Review reported posts, comments, and attachments
- View the report reason and relevant context
- Dismiss a report
- Hide or remove content
- Add an internal note

### Content Moderation

Administrators can hide or remove posts, comments, and attachments. Sensitive actions require confirmation.

### User Management

Administrators can:

- Search users
- View basic activity and moderation history
- Ban a user with a reason
- Unban a user

### Audit Log

Every sensitive administrator action records:

- Administrator ID
- Action type
- Target type and ID
- Reason or note
- Timestamp

## 12. Database Model

The Supabase schema includes:

- `profiles`
- `posts`
- `comments`
- `post_likes`
- `post_attachments`
- `reports`
- `moderation_actions`
- `venues`
- `venue_items`
- `venue_submissions`
- `recipes`
- `recipe_ingredients`
- `recipe_equipment`

Daily Luck does not require a table in the first version. Posts and comments gain a visibility or moderation status instead of relying only on physical deletion.

## 13. Security and RLS

- Anyone can read public, visible posts and comments
- Anyone can read approved venues and published recipes
- Logged-in, non-banned users can create posts, comments, reports, attachments, and venue submissions
- Users can update or delete only their own eligible content
- Anonymous posts remain privately associated with their creator
- Only administrators can access pending submissions, moderation notes, audit records, and administrative operations
- Role checks are enforced in PostgreSQL policies and helper functions
- Storage policies restrict uploads by authentication, ownership, MIME type, and path convention
- The frontend never treats hidden navigation as an access-control mechanism

## 14. Error and Empty States

The application provides specific states for:

- Loading
- Empty feed or filter result
- Missing post
- Upload failure
- Unsupported file
- File too large
- Too many attachments
- Conversion failure
- No recipe match
- No venue match
- Insufficient budget
- Unauthenticated action
- Banned user action
- Administrator-only route
- Offline or backend error

Draft text remains intact when an upload or submission fails.

## 15. Testing Strategy

### Unit Tests

- File type, count, and size validation
- UCT email verification logic
- Banned-user capability checks
- Daily Luck determinism
- Recipe matching
- Budget calculations
- Venue recommendation filtering
- Administrator role checks

### Component Tests

- Attachment preview and removal
- Post creation with partial upload failure
- Toolbox forms and result states
- Report review actions
- Venue submission review

### Core User Flows

- Sign up and login
- UCT Verified badge
- Create a post
- Upload images and documents
- Comment
- Browse Shared Files
- Use each toolbox feature
- Submit a venue correction
- Administrator report resolution
- Administrator content removal
- Administrator ban and unban

### Backend Verification

Supabase RLS is tested with SQL scenarios for anonymous users, normal users, banned users, content owners, and administrators. Frontend tests alone are not accepted as proof of backend authorisation.

### Visual Verification

- Mobile and desktop screenshots
- Navigation and text overflow checks
- Attachment layouts
- Forum/right-rail balance
- Tool forms
- Administrator tables and action dialogs

## 16. Delivery Phases

### Phase 1: Foundation

- Adopt the approved visual system
- Restructure navigation
- Add roles, ban state, UCT verification, and updated RLS
- Add automated tests

### Phase 2: Forum Attachments

- Storage bucket and policies
- Post attachment upload and previews
- Shared Files page
- Attachment moderation

### Phase 3: Toolbox Core

- Toolbox home
- Basic Word-to-PDF
- Daily Luck
- Food recommendation
- Budget meal planner

### Phase 4: Recipes

- Recipe schema and starter South African dataset
- Ingredient and equipment matching
- Recipe detail views

### Phase 5: Administration

- Dashboard overview
- Reports and content moderation
- User bans
- Audit log
- Venue and price submissions

### Phase 6: Deployment

- GitHub repository
- Supabase production project
- Vercel or Cloudflare Pages deployment
- Environment variables
- Routing verification
- Privacy, terms, content rules, and ad-readiness review

## 17. Explicitly Deferred

- Private messaging
- Mobile application
- AI-generated recommendations
- Mandatory UCT-only registration
- Realtime chat
- Complex analytics
- Complex administrator hierarchy
- High-fidelity server-side Word conversion
- Delivery, ordering, payment, or marketplace features
- Live supermarket or restaurant pricing APIs

