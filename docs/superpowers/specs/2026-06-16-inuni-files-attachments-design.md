# InUni Files and Attachments Design

**Date:** 2026-06-16  
**Status:** Approved design  
**Audience:** University of Cape Town students  
**Primary language:** English

## 1. Product Goal

Add file sharing to InUni without turning the forum into a complicated document
management product. The first files phase adds:

1. Attachments on posts.
2. Attachments on comments.
3. A Shared Files library for approved reusable study resources.
4. File reports, auto-hide, and administrator review.
5. A storage boundary that starts on Supabase Storage and can later move to
   self-hosted storage with ClamAV scanning.

The feature must feel like a natural extension of the current InUni website.
It should keep the same header, page width, panel style, buttons, typography,
and calm forum layout.

## 2. Confirmed Scope

### Included

- Common file uploads: images, PDFs, Word, PowerPoint, Excel, text files, and
  archives.
- Post attachments.
- Comment attachments.
- Shared Files library at `/files`.
- Optional 200-character file description.
- Optional "Submit to Shared Files" checkbox while attaching files to a post
  or comment.
- Shared Files metadata:
  - Course code, free text with a format hint.
  - Campus or faculty.
  - Tags.
- Image and PDF preview.
- Office files and archives as download-only.
- Login-required downloads.
- Private storage bucket with 5-minute signed download links.
- Per-file reporting with report type and optional note.
- Auto-hide after 3 unique user reports.
- Administrator file review at `/admin/files`.
- Profile page section for "My uploaded files" and visible statuses.
- Scan status fields for future ClamAV integration.

### Not Included

- Automatic virus scanning in phase one.
- Online preview for Word, PowerPoint, Excel, or archives.
- Email notifications.
- Public unauthenticated downloads.
- Full course-code validation or a maintained UCT course database.
- Cloudflare R2 in phase one.
- A custom backend download proxy in phase one.
- A complex dashboard UI.

## 3. Product Rules

### Upload Limits

- Maximum file size: 100MB.
- Maximum attachments per post: 5.
- Maximum attachments per comment: 5.
- Maximum upload total per user per rolling day: 1GB.
- These limits may increase later after real usage is understood.

### Access

- All logged-in, non-banned users can upload files.
- All logged-in, non-banned users can download files.
- All logged-in, non-banned users can report files.
- Visitors may browse public forum content but must log in for file download,
  upload, or reporting.
- Banned users can read public forum content but cannot upload, download, or
  report files.

### Anonymous Content

If a file is attached to an anonymous post or comment, normal users see only
the file information. Administrators can see the real uploader for moderation.

### Rejection and Deletion

When an administrator rejects a pending Shared Files submission, the file and
its metadata are permanently deleted. This keeps the first release simple. The
profile page only shows uploaded files that still exist, with statuses such as
public, pending review, and hidden.

## 4. Visual and Navigation Design

The file UI must match the existing InUni website. It should not use a new
dashboard style or dense enterprise table layout.

### Global Navigation

Add a `Files` navigation link beside the existing forum destinations:

- Forum
- Files
- Create
- Profile
- Admin, visible only to administrators

### `/files`

The Files page is only for browsing, searching, previewing, downloading, and
reporting approved Shared Files. It must not show the create-post attachment
area or administrator review widgets.

The layout uses the existing page shell and panel style:

- Page title: `Shared files`
- Search input.
- Filter chips or compact controls:
  - Sort by newest, downloads, reports, or filename.
  - Course code.
  - File type.
  - Tags.
  - Campus or faculty.
- A simple file list with lightweight row separation.
- Each file row shows:
  - File type.
  - File name.
  - Optional description.
  - Course code.
  - Size.
  - Tags.
  - Preview, when image or PDF.
  - Download.
  - Report.

### `/create`

The attachment area belongs under the create-post form only.

Create Post additions:

- Attachment picker under the content field.
- Upload limit copy: max 100MB per file, 5 files per post, 1GB per day.
- One row per selected file:
  - File name.
  - Type.
  - Size.
  - Upload progress or status.
  - Optional description.
  - Remove action.
  - Submit to Shared Files checkbox.
- When Submit to Shared Files is checked, show inline metadata fields:
  - Course code, with a hint such as `CSC1010H`.
  - Campus or faculty.
  - Tags.

### Comments

Comment attachments use the same rules but a more compact picker underneath the
comment form. The comment list shows attachments under each comment, not in a
separate page section.

### `/post/:id`

Post detail shows attachments directly under the post body. Comment attachments
appear under the relevant comment. The visual treatment should match current
post and comment components: simple rows, small badges, and restrained actions.

### `/profile`

The profile page gets a "My uploaded files" section. It lists files that still
exist and shows status:

- Public.
- Pending review.
- Hidden while moderators review reports.

### `/admin` and `/admin/files`

The existing `/admin` page remains the moderation overview. It can show counts
and links for:

- Open post/comment reports.
- Pending Shared Files.
- Auto-hidden files.

Detailed file moderation belongs on `/admin/files`.

`/admin/files` keeps the same site style:

- Page title: `File review`.
- Simple count panels.
- Tabs for `Pending Shared Files` and `Auto-hidden files`.
- A clear review list.
- Actions:
  - Approve.
  - Reject and delete.
  - Restore hidden file.
  - Delete hidden file.

Administrators can see the real uploader even when the file is attached to
anonymous content.

## 5. Data Model

Use a unified file model, not separate upload systems for posts, comments, and
Shared Files.

### Enums

- `file_status`: `uploading`, `available`, `pending_review`,
  `hidden_by_reports`
- `shared_file_status`: `pending`, `approved`
- `file_scan_status`: `not_scanned`, `pending`, `clean`, `flagged`, `failed`
- `file_link_type`: `post`, `comment`, `shared_file`
- `file_report_type`: `copyright`, `malicious_file`, `privacy`, `harassment`,
  `other`

### `files`

Stores shared metadata for every uploaded file:

- `id`
- `owner_id`
- `storage_provider`
- `storage_bucket`
- `storage_path`
- `original_filename`
- `display_filename`
- `mime_type`
- `extension`
- `size_bytes`
- `description`
- `status`
- `scan_status`
- `download_count`
- `created_at`
- `updated_at`

### `file_links`

Connects a file to one context per row. A file can have more than one link, for
example a post attachment plus an optional Shared Files submission.

Fields:

- `id`
- `file_id`
- `link_type`
- `post_id`
- `comment_id`
- `shared_status`, for Shared Files review
- `course_code`
- `campus_or_faculty`
- `tags`
- `created_at`

Constraints:

- A `post` link must have `post_id`.
- A `comment` link must have `comment_id`.
- A `shared_file` link must have Shared Files metadata and review status.

### `file_reports`

Stores user reports for files:

- `id`
- `file_id`
- `reporter_id`
- `report_type`
- `note`
- `created_at`

Constraints:

- A user can report the same file once.
- When a file receives 3 reports from distinct users, the file status becomes
  `hidden_by_reports`.

## 6. Storage Provider

Introduce a TypeScript `storageProvider` interface:

- `reserveUpload`
- `uploadFile`
- `finalizeUpload`
- `createSignedDownloadUrl`
- `createPreviewUrl`
- `deleteFile`

The first implementation uses Supabase Storage.

Future implementations can target:

- Self-hosted storage.
- MinIO or another S3-compatible service.
- Cloudflare R2.

The UI and moderation logic should call the provider boundary rather than the
Supabase SDK directly.

## 7. Supabase Storage

Phase one uses a private Supabase Storage bucket.

Rules:

- Bucket is private.
- Bucket file size limit is 100MB.
- Storage paths are scoped by user and file ID.
- Downloads use signed URLs that expire after 5 minutes.
- Image and PDF previews also use short-lived signed URLs and require login.
- Upload flow creates a database reservation before upload so the app can check
  daily quota, attachment count, ban status, and ownership before accepting a
  file.
- `download_count` increments when the app creates a signed download URL, so
  the Shared Files page can sort by downloads without exposing public links.

Supabase remains the default because it matches the current authentication,
database, and RLS model. The provider interface keeps migration open for a
future self-hosted storage service.

## 8. Security and Moderation

### File Reports

File reports use a category plus optional note:

- Copyright.
- Malicious file.
- Privacy.
- Harassment.
- Other.

After 3 unique reports, the file is hidden from normal users and enters the
admin review queue. The uploader only sees:

> This file is hidden while moderators review reports.

They do not see report details or reporter identity.

### Admin Actions

Administrators can:

- Approve a pending Shared Files submission.
- Reject a pending Shared Files submission, deleting the file and metadata.
- Restore an auto-hidden file.
- Delete an auto-hidden file.

### Scan Status

Automatic scanning is not implemented in phase one. The data model still stores
scan status so a future self-hosted ClamAV worker can update files to clean,
flagged, or failed.

## 9. API Boundaries

Add a file API layer rather than spreading file logic across pages.

Suggested modules:

- `src/types/files.ts`
- `src/lib/fileValidation.ts`
- `src/lib/fileApi.ts`
- `src/lib/storageProvider.ts`
- `src/lib/supabaseStorageProvider.ts`
- `src/lib/mockFileStore.ts`
- `src/lib/adminFileApi.ts`

The mock store must support the same behavior in demo mode:

- Upload metadata.
- Attachment links.
- Shared Files pending and approval states.
- File reports.
- Auto-hide after 3 unique reporters.
- Signed-link-like behavior simulated locally.

## 10. Error Handling

The UI must handle:

- Too many files.
- File too large.
- Daily upload limit reached.
- Unsupported file type.
- Upload failure.
- Download link creation failure.
- Login required.
- Banned account restriction.
- Duplicate file report.
- File hidden after reports.
- File rejected or deleted by an administrator.

Recoverable errors must preserve form input and selected files where possible.

## 11. Testing Strategy

### Unit Tests

- File size validation.
- Daily quota validation.
- Attachment count validation.
- File type classification.
- Preview eligibility.
- Signed link expiry constant.
- Report threshold behavior.

### Component Tests

- Attachment picker.
- File row/card.
- File report dialog.
- Shared Files filters.
- Profile uploaded files section.
- Admin file review queue.

### API and Store Tests

- Create file metadata.
- Link file to post.
- Link file to comment.
- Submit file to Shared Files.
- Approve Shared Files.
- Reject and delete Shared Files.
- Prevent duplicate file reports.
- Auto-hide after 3 unique reports.
- Restore hidden file.
- Delete hidden file.

### Supabase Verification

SQL scenarios should verify:

- Anonymous users cannot download, upload, or report files.
- Active users can upload within limits.
- Banned users cannot upload, download, or report.
- Users cannot see private uploader identity for anonymous content.
- Administrators can see uploader identity.
- Administrators can approve, reject, restore, and delete files.
- Signed downloads require authentication.

### Browser Checks

Check mobile and desktop layouts for:

- `/files`
- `/create`
- `/post/:id`
- `/profile`
- `/admin`
- `/admin/files`

The layout must not overflow at 320px width.

## 12. Implementation Phases

1. Add file types, validation helpers, mock store shape, and tests.
2. Add Supabase schema, storage bucket documentation, RLS, and SQL scenarios.
3. Add storage provider interface and Supabase provider.
4. Add reusable attachment picker and file row components.
5. Wire post and comment attachments.
6. Add Shared Files page and filters.
7. Add file reporting and auto-hide.
8. Add profile uploaded files section.
9. Add `/admin/files` review page and `/admin` overview counts.
10. Run full tests, build, and browser verification.

## 13. Acceptance Criteria

- Files page keeps the same simple website style as the current forum.
- Files page does not contain create-post attachment UI.
- Files page does not contain admin review UI.
- Create-post attachment UI appears under the create form.
- Comment attachment UI appears under the comment form.
- Admin file review appears under `/admin/files`.
- Post and comment attachments work.
- Shared Files submissions require approval before appearing publicly.
- Image and PDF preview works.
- Office files and archives are download-only.
- Downloads require login and use 5-minute signed links.
- Banned users cannot upload, download, or report files.
- File reports use type plus optional note.
- 3 unique reports auto-hide a file.
- Administrators can approve, reject/delete, restore, and delete files.
- Profile shows existing uploaded files and their statuses.
- Scan status fields exist for future ClamAV integration.
- Tests pass.
- Production build passes.
