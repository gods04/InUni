# InUni Files and Attachments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build post attachments, comment attachments, a Shared Files library, file reporting, and administrator file moderation while keeping the existing InUni website style.

**Architecture:** Use one unified file metadata layer and link files to posts, comments, or Shared Files submissions through a small API boundary. Demo mode uses a local mock store with the same behavior, while production uses Supabase tables plus a private Supabase Storage bucket behind a `StorageProvider` interface. UI additions stay close to current panels, buttons, and page width rather than introducing a dashboard-style product.

**Tech Stack:** React 19, Vite 8, TypeScript 6, Tailwind CSS 3, React Router 7, Supabase JS 2, Vitest, React Testing Library, jsdom, Supabase Postgres/RLS, Supabase Storage.

---

## Scope Check

The approved spec is one cohesive subsystem: file uploads, file metadata, file display, file reporting, and file moderation. It should be implemented as one feature plan because the same `files` metadata, storage provider, and report rules are shared across post attachments, comment attachments, and Shared Files.

Do not implement the deferred ClamAV scanner. Add scan status fields and UI labels only.

---

## File Structure

### Domain and Validation

- Create: `src/types/files.ts` — file status, scan status, report type, file metadata, file links, upload draft, and filter/sort types.
- Create: `src/lib/fileValidation.ts` — file size, attachment count, daily quota, description length, preview eligibility, file type classification, and report threshold helpers.
- Create: `src/lib/fileValidation.test.ts` — pure unit tests for the helper rules.

### Storage and File API

- Create: `src/lib/storageProvider.ts` — provider interface and constants such as signed-link lifetime.
- Create: `src/lib/supabaseStorageProvider.ts` — Supabase Storage implementation.
- Create: `src/lib/fileApi.ts` — app-level read/write API for attachments, Shared Files, reports, previews, and downloads.
- Create: `src/lib/mockFileStore.ts` — localStorage-backed demo implementation.
- Create: `src/lib/fileApi.mock.test.ts` — behavior tests for mock uploads, reports, hiding, and signed links.

### Reusable UI

- Create: `src/components/AttachmentPicker.tsx` — file picker for create post and comments.
- Create: `src/components/AttachmentPicker.test.tsx` — upload limit, description, and Shared Files metadata tests.
- Create: `src/components/FileList.tsx` — simple file rows used by Shared Files, posts, comments, and profile.
- Create: `src/components/FileReportDialog.tsx` — category plus optional note report dialog.
- Create: `src/components/FileReportDialog.test.tsx` — category selection and submit tests.

### Pages and Wiring

- Modify: `src/types/forum.ts` — add optional `attachments` arrays to posts/comments and file-aware input types.
- Modify: `src/lib/forumApi.ts` — include attachments in post/comment creation and reads.
- Modify: `src/lib/mockStore.ts` — link attachments when creating demo posts/comments.
- Modify: `src/components/AppLayout.tsx` — add `Files` navigation link.
- Modify: `src/pages/CreatePostPage.tsx` — add `AttachmentPicker` under content.
- Modify: `src/pages/PostDetailPage.tsx` — show post attachments and add comment attachment picker.
- Modify: `src/components/CommentList.tsx` — show comment attachments.
- Create: `src/pages/FilesPage.tsx` — Shared Files library.
- Create: `src/pages/FilesPage.test.tsx` — simple page/filter behavior tests.
- Modify: `src/pages/ProfilePage.tsx` — add My uploaded files section.
- Modify: `src/App.tsx` — add `/files` route.

### Administration

- Create: `src/lib/adminFileApi.ts` — admin file queues and approve/reject/restore/delete actions.
- Create: `src/pages/AdminFilesPage.tsx` — `/admin/files` review page.
- Create: `src/pages/AdminFilesPage.test.tsx` — queue rendering and approve/reject actions.
- Modify: `src/pages/AdminPage.tsx` — add counts/links to file moderation without merging the full queue into `/admin`.
- Modify: `src/App.tsx` — add admin route for `/admin/files`.

### Supabase and Docs

- Modify: `supabase/schema.sql` — add file enums, tables, helper functions, RLS, and grants.
- Modify: `supabase/tests/rls.sql` — add file policy scenarios.
- Modify: `README.md` — add storage bucket setup and file feature notes.

---

## Task 1: Add File Domain Types and Validation

**Files:**
- Create: `src/types/files.ts`
- Create: `src/lib/fileValidation.ts`
- Create: `src/lib/fileValidation.test.ts`

- [ ] **Step 1: Write failing validation tests**

Create `src/lib/fileValidation.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  FILE_REPORT_HIDE_THRESHOLD,
  MAX_ATTACHMENTS_PER_CONTEXT,
  MAX_DAILY_UPLOAD_BYTES,
  MAX_FILE_SIZE_BYTES,
  classifyFileType,
  canPreviewFile,
  shouldAutoHideFile,
  validateAttachmentCount,
  validateDailyUpload,
  validateFileDescription,
  validateFileSize,
} from './fileValidation';

describe('file limits', () => {
  it('uses the approved upload limits', () => {
    expect(MAX_FILE_SIZE_BYTES).toBe(100 * 1024 * 1024);
    expect(MAX_ATTACHMENTS_PER_CONTEXT).toBe(5);
    expect(MAX_DAILY_UPLOAD_BYTES).toBe(1024 * 1024 * 1024);
  });

  it('rejects files over 100MB', () => {
    expect(validateFileSize(100 * 1024 * 1024 + 1)).toBe(
      'Files must be 100MB or smaller.',
    );
  });

  it('rejects more than five attachments in one context', () => {
    expect(validateAttachmentCount(6)).toBe('You can attach up to 5 files.');
  });

  it('rejects daily uploads above 1GB', () => {
    expect(validateDailyUpload(1024 * 1024 * 1024, 1)).toBe(
      'You have reached the 1GB daily upload limit.',
    );
  });
});

describe('file metadata', () => {
  it('limits descriptions to 200 characters', () => {
    expect(validateFileDescription('a'.repeat(201))).toBe(
      'File descriptions must be 200 characters or fewer.',
    );
  });

  it('classifies common file types', () => {
    expect(classifyFileType('notes.pdf', 'application/pdf')).toBe('pdf');
    expect(classifyFileType('photo.png', 'image/png')).toBe('image');
    expect(
      classifyFileType(
        'slides.pptx',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      ),
    ).toBe('presentation');
    expect(classifyFileType('archive.zip', 'application/zip')).toBe('archive');
  });

  it('previews only images and PDFs', () => {
    expect(canPreviewFile('image/png')).toBe(true);
    expect(canPreviewFile('application/pdf')).toBe(true);
    expect(canPreviewFile('application/zip')).toBe(false);
  });
});

describe('file reports', () => {
  it('auto-hides after three unique reports', () => {
    expect(FILE_REPORT_HIDE_THRESHOLD).toBe(3);
    expect(shouldAutoHideFile(2)).toBe(false);
    expect(shouldAutoHideFile(3)).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```powershell
npm test -- src/lib/fileValidation.test.ts
```

Expected: FAIL because `src/lib/fileValidation.ts` does not exist.

- [ ] **Step 3: Add file domain types**

Create `src/types/files.ts`:

```ts
export type FileStatus =
  | 'uploading'
  | 'available'
  | 'pending_review'
  | 'hidden_by_reports';

export type SharedFileStatus = 'pending' | 'approved';

export type FileScanStatus =
  | 'not_scanned'
  | 'pending'
  | 'clean'
  | 'flagged'
  | 'failed';

export type FileLinkType = 'post' | 'comment' | 'shared_file';

export type FileReportType =
  | 'copyright'
  | 'malicious_file'
  | 'privacy'
  | 'harassment'
  | 'other';

export type FileSort = 'newest' | 'downloads' | 'reports' | 'name';

export type FileKind =
  | 'image'
  | 'pdf'
  | 'document'
  | 'presentation'
  | 'spreadsheet'
  | 'text'
  | 'archive'
  | 'other';

export interface InUniFile {
  id: string;
  ownerId: string;
  ownerName: string;
  storageProvider: 'supabase' | 'mock';
  storageBucket: string;
  storagePath: string;
  originalFilename: string;
  displayFilename: string;
  mimeType: string;
  extension: string;
  sizeBytes: number;
  description: string;
  status: FileStatus;
  scanStatus: FileScanStatus;
  downloadCount: number;
  reportCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface FileLink {
  id: string;
  fileId: string;
  linkType: FileLinkType;
  postId: string | null;
  commentId: string | null;
  sharedStatus: SharedFileStatus | null;
  courseCode: string | null;
  campusOrFaculty: string | null;
  tags: string[];
  createdAt: string;
}

export interface LinkedFile extends InUniFile {
  links: FileLink[];
}

export interface FileUploadDraft {
  file: File;
  description: string;
  submitToSharedFiles: boolean;
  courseCode: string;
  campusOrFaculty: string;
  tags: string;
}

export interface FileReportInput {
  fileId: string;
  reportType: FileReportType;
  note: string;
}

export interface SharedFileFilters {
  query: string;
  courseCode: string;
  fileKind: FileKind | 'all';
  campusOrFaculty: string;
  tag: string;
  sort: FileSort;
}

export interface SignedFileUrl {
  url: string;
  expiresAt: string;
}
```

- [ ] **Step 4: Add validation helpers**

Create `src/lib/fileValidation.ts`:

```ts
import type { FileKind } from '../types/files';

export const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024;
export const MAX_ATTACHMENTS_PER_CONTEXT = 5;
export const MAX_DAILY_UPLOAD_BYTES = 1024 * 1024 * 1024;
export const MAX_FILE_DESCRIPTION_LENGTH = 200;
export const FILE_REPORT_HIDE_THRESHOLD = 3;
export const SIGNED_FILE_URL_TTL_SECONDS = 5 * 60;

const officeDocumentMimeTypes = new Set([
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const presentationMimeTypes = new Set([
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
]);

const spreadsheetMimeTypes = new Set([
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

const archiveExtensions = new Set(['zip', 'rar', '7z']);

function getExtension(filename: string): string {
  const parts = filename.toLowerCase().split('.');
  return parts.length > 1 ? parts.at(-1) ?? '' : '';
}

export function validateFileSize(sizeBytes: number): string | null {
  return sizeBytes <= MAX_FILE_SIZE_BYTES
    ? null
    : 'Files must be 100MB or smaller.';
}

export function validateAttachmentCount(count: number): string | null {
  return count <= MAX_ATTACHMENTS_PER_CONTEXT
    ? null
    : 'You can attach up to 5 files.';
}

export function validateDailyUpload(
  alreadyUploadedBytes: number,
  nextUploadBytes: number,
): string | null {
  return alreadyUploadedBytes + nextUploadBytes <= MAX_DAILY_UPLOAD_BYTES
    ? null
    : 'You have reached the 1GB daily upload limit.';
}

export function validateFileDescription(description: string): string | null {
  return description.length <= MAX_FILE_DESCRIPTION_LENGTH
    ? null
    : 'File descriptions must be 200 characters or fewer.';
}

export function canPreviewFile(mimeType: string): boolean {
  return mimeType.startsWith('image/') || mimeType === 'application/pdf';
}

export function classifyFileType(filename: string, mimeType: string): FileKind {
  const extension = getExtension(filename);

  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType === 'application/pdf' || extension === 'pdf') return 'pdf';
  if (officeDocumentMimeTypes.has(mimeType) || ['doc', 'docx'].includes(extension)) {
    return 'document';
  }
  if (presentationMimeTypes.has(mimeType) || ['ppt', 'pptx'].includes(extension)) {
    return 'presentation';
  }
  if (spreadsheetMimeTypes.has(mimeType) || ['xls', 'xlsx'].includes(extension)) {
    return 'spreadsheet';
  }
  if (mimeType.startsWith('text/') || extension === 'txt') return 'text';
  if (archiveExtensions.has(extension)) return 'archive';
  return 'other';
}

export function shouldAutoHideFile(uniqueReportCount: number): boolean {
  return uniqueReportCount >= FILE_REPORT_HIDE_THRESHOLD;
}
```

- [ ] **Step 5: Run focused tests**

Run:

```powershell
npm test -- src/lib/fileValidation.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add src/types/files.ts src/lib/fileValidation.ts src/lib/fileValidation.test.ts
git commit -m "feat: add file domain validation"
```

---

## Task 2: Build the Mock File Store and API Boundary

**Files:**
- Create: `src/lib/mockFileStore.ts`
- Create: `src/lib/fileApi.ts`
- Create: `src/lib/storageProvider.ts`
- Create: `src/lib/fileApi.mock.test.ts`

- [ ] **Step 1: Write failing mock API tests**

Create `src/lib/fileApi.mock.test.ts`:

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { createDemoUserForFiles, mockFileStore } from './mockFileStore';

const student = createDemoUserForFiles('student@uct.ac.za');
const reporterA = createDemoUserForFiles('reporter-a@uct.ac.za');
const reporterB = createDemoUserForFiles('reporter-b@uct.ac.za');
const reporterC = createDemoUserForFiles('reporter-c@uct.ac.za');

function makeFile(name: string, type: string, size = 1024): File {
  return new File(['x'.repeat(size)], name, { type });
}

describe('mockFileStore', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('uploads a post attachment and returns it by post id', async () => {
    const uploaded = await mockFileStore.uploadLinkedFiles({
      context: { type: 'post', postId: 'post-1' },
      drafts: [
        {
          file: makeFile('notes.pdf', 'application/pdf'),
          description: 'Week notes',
          submitToSharedFiles: false,
          courseCode: '',
          campusOrFaculty: '',
          tags: '',
        },
      ],
      user: student,
    });

    expect(uploaded).toHaveLength(1);
    expect(uploaded[0].displayFilename).toBe('notes.pdf');

    const attachments = await mockFileStore.getFilesForPost('post-1');
    expect(attachments.map((file) => file.displayFilename)).toEqual(['notes.pdf']);
  });

  it('keeps shared files pending until approved', async () => {
    const [file] = await mockFileStore.uploadLinkedFiles({
      context: { type: 'post', postId: 'post-1' },
      drafts: [
        {
          file: makeFile('guide.pdf', 'application/pdf'),
          description: 'Study guide',
          submitToSharedFiles: true,
          courseCode: 'CSC1010H',
          campusOrFaculty: 'Science',
          tags: 'study, week 5',
        },
      ],
      user: student,
    });

    expect(await mockFileStore.getSharedFiles({ sort: 'newest' })).toEqual([]);

    await mockFileStore.approveSharedFile(file.id);

    const sharedFiles = await mockFileStore.getSharedFiles({ sort: 'newest' });
    expect(sharedFiles).toHaveLength(1);
    expect(sharedFiles[0].links[0].courseCode).toBe('CSC1010H');
  });

  it('auto-hides after three unique reports', async () => {
    const [file] = await mockFileStore.uploadLinkedFiles({
      context: { type: 'post', postId: 'post-1' },
      drafts: [
        {
          file: makeFile('unsafe.zip', 'application/zip'),
          description: '',
          submitToSharedFiles: false,
          courseCode: '',
          campusOrFaculty: '',
          tags: '',
        },
      ],
      user: student,
    });

    await mockFileStore.reportFile({
      input: { fileId: file.id, reportType: 'malicious_file', note: '' },
      user: reporterA,
    });
    await mockFileStore.reportFile({
      input: { fileId: file.id, reportType: 'privacy', note: '' },
      user: reporterB,
    });
    await mockFileStore.reportFile({
      input: { fileId: file.id, reportType: 'copyright', note: '' },
      user: reporterC,
    });

    const [hiddenFile] = await mockFileStore.getHiddenFiles();
    expect(hiddenFile.id).toBe(file.id);
    expect(hiddenFile.status).toBe('hidden_by_reports');
  });

  it('prevents duplicate reports from the same user', async () => {
    const [file] = await mockFileStore.uploadLinkedFiles({
      context: { type: 'post', postId: 'post-1' },
      drafts: [
        {
          file: makeFile('notes.pdf', 'application/pdf'),
          description: '',
          submitToSharedFiles: false,
          courseCode: '',
          campusOrFaculty: '',
          tags: '',
        },
      ],
      user: student,
    });

    await mockFileStore.reportFile({
      input: { fileId: file.id, reportType: 'other', note: '' },
      user: reporterA,
    });

    await expect(
      mockFileStore.reportFile({
        input: { fileId: file.id, reportType: 'other', note: '' },
        user: reporterA,
      }),
    ).rejects.toThrow('You have already reported this file.');
  });
});
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```powershell
npm test -- src/lib/fileApi.mock.test.ts
```

Expected: FAIL because `mockFileStore` does not exist.

- [ ] **Step 3: Add storage provider interface**

Create `src/lib/storageProvider.ts`:

```ts
import type { SignedFileUrl } from '../types/files';
import { SIGNED_FILE_URL_TTL_SECONDS } from './fileValidation';

export { SIGNED_FILE_URL_TTL_SECONDS };

export interface StoredFileObject {
  bucket: string;
  path: string;
  provider: 'supabase' | 'mock';
}

export interface StorageProvider {
  uploadFile: (file: File, path: string) => Promise<StoredFileObject>;
  createSignedDownloadUrl: (path: string) => Promise<SignedFileUrl>;
  createPreviewUrl: (path: string) => Promise<SignedFileUrl>;
  deleteFile: (path: string) => Promise<void>;
}
```

- [ ] **Step 4: Implement the mock store**

Create `src/lib/mockFileStore.ts` using these exported functions and keys:

```ts
import type { ForumUser } from '../types/forum';
import type {
  FileLink,
  FileReportInput,
  FileStatus,
  FileUploadDraft,
  InUniFile,
  LinkedFile,
  SharedFileFilters,
} from '../types/files';
import {
  SIGNED_FILE_URL_TTL_SECONDS,
  classifyFileType,
  shouldAutoHideFile,
  validateAttachmentCount,
  validateDailyUpload,
  validateFileDescription,
  validateFileSize,
} from './fileValidation';

const filesKey = 'inuni.files';
const linksKey = 'inuni.fileLinks';
const reportsKey = 'inuni.fileReports';

interface StoredFileReport {
  id: string;
  fileId: string;
  reporterId: string;
  reportType: FileReportInput['reportType'];
  note: string;
  createdAt: string;
}

type FileContext =
  | { type: 'post'; postId: string }
  | { type: 'comment'; commentId: string };

export interface UploadLinkedFilesInput {
  context: FileContext;
  drafts: FileUploadDraft[];
  user: ForumUser;
}

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function readList<T>(key: string): T[] {
  const raw = window.localStorage.getItem(key);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

function writeList<T>(key: string, value: T[]): void {
  window.localStorage.setItem(key, JSON.stringify(value));
}

function getExtension(filename: string): string {
  const parts = filename.toLowerCase().split('.');
  return parts.length > 1 ? parts.at(-1) ?? '' : '';
}

function splitTags(tags: string): string[] {
  return tags
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function getLinkedFiles(files: InUniFile[], links: FileLink[]): LinkedFile[] {
  return files.map((file) => ({
    ...file,
    links: links.filter((link) => link.fileId === file.id),
  }));
}

function getReportsForFile(fileId: string): StoredFileReport[] {
  return readList<StoredFileReport>(reportsKey).filter(
    (report) => report.fileId === fileId,
  );
}

export function createDemoUserForFiles(email: string): ForumUser {
  const id = `demo-${email}`;
  return {
    id,
    email,
    emailConfirmed: true,
    profile: {
      id,
      username: email.split('@')[0],
      displayName: email.split('@')[0],
      role: email === 'admin@inuni.local' ? 'admin' : 'student',
      isBanned: false,
      banReason: null,
      createdAt: new Date().toISOString(),
    },
  };
}

export const mockFileStore = {
  async uploadLinkedFiles({
    context,
    drafts,
    user,
  }: UploadLinkedFilesInput): Promise<LinkedFile[]> {
    const countError = validateAttachmentCount(drafts.length);
    if (countError) throw new Error(countError);

    const nextBytes = drafts.reduce((sum, draft) => sum + draft.file.size, 0);
    const existingTodayBytes = readList<InUniFile>(filesKey)
      .filter((file) => file.ownerId === user.id)
      .reduce((sum, file) => sum + file.sizeBytes, 0);
    const quotaError = validateDailyUpload(existingTodayBytes, nextBytes);
    if (quotaError) throw new Error(quotaError);

    const files = readList<InUniFile>(filesKey);
    const links = readList<FileLink>(linksKey);
    const now = new Date().toISOString();
    const nextFiles: InUniFile[] = [];
    const nextLinks: FileLink[] = [];

    for (const draft of drafts) {
      const sizeError = validateFileSize(draft.file.size);
      if (sizeError) throw new Error(sizeError);

      const descriptionError = validateFileDescription(draft.description);
      if (descriptionError) throw new Error(descriptionError);

      const fileId = createId('file');
      const storagePath = `${user.id}/${fileId}/${draft.file.name}`;
      const file: InUniFile = {
        id: fileId,
        ownerId: user.id,
        ownerName: user.profile.displayName,
        storageProvider: 'mock',
        storageBucket: 'mock-files',
        storagePath,
        originalFilename: draft.file.name,
        displayFilename: draft.file.name,
        mimeType: draft.file.type || 'application/octet-stream',
        extension: getExtension(draft.file.name),
        sizeBytes: draft.file.size,
        description: draft.description.trim(),
        status: 'available',
        scanStatus: 'not_scanned',
        downloadCount: 0,
        reportCount: 0,
        createdAt: now,
        updatedAt: now,
      };

      nextFiles.push(file);
      nextLinks.push({
        id: createId('file-link'),
        fileId,
        linkType: context.type,
        postId: context.type === 'post' ? context.postId : null,
        commentId: context.type === 'comment' ? context.commentId : null,
        sharedStatus: null,
        courseCode: null,
        campusOrFaculty: null,
        tags: [],
        createdAt: now,
      });

      if (draft.submitToSharedFiles) {
        nextLinks.push({
          id: createId('file-link'),
          fileId,
          linkType: 'shared_file',
          postId: null,
          commentId: null,
          sharedStatus: 'pending',
          courseCode: draft.courseCode.trim() || null,
          campusOrFaculty: draft.campusOrFaculty.trim() || null,
          tags: splitTags(draft.tags),
          createdAt: now,
        });
      }
    }

    writeList(filesKey, [...nextFiles, ...files]);
    writeList(linksKey, [...nextLinks, ...links]);

    return getLinkedFiles(nextFiles, [...nextLinks, ...links]);
  },

  async getFilesForPost(postId: string): Promise<LinkedFile[]> {
    const files = readList<InUniFile>(filesKey);
    const links = readList<FileLink>(linksKey);
    const fileIds = new Set(
      links
        .filter((link) => link.linkType === 'post' && link.postId === postId)
        .map((link) => link.fileId),
    );
    return getLinkedFiles(
      files.filter((file) => fileIds.has(file.id) && file.status !== 'hidden_by_reports'),
      links,
    );
  },

  async getFilesForComment(commentId: string): Promise<LinkedFile[]> {
    const files = readList<InUniFile>(filesKey);
    const links = readList<FileLink>(linksKey);
    const fileIds = new Set(
      links
        .filter((link) => link.linkType === 'comment' && link.commentId === commentId)
        .map((link) => link.fileId),
    );
    return getLinkedFiles(
      files.filter((file) => fileIds.has(file.id) && file.status !== 'hidden_by_reports'),
      links,
    );
  },

  async getSharedFiles(filters: Partial<SharedFileFilters>): Promise<LinkedFile[]> {
    const files = readList<InUniFile>(filesKey);
    const links = readList<FileLink>(linksKey);
    const approvedSharedLinks = links.filter(
      (link) => link.linkType === 'shared_file' && link.sharedStatus === 'approved',
    );
    const approvedIds = new Set(approvedSharedLinks.map((link) => link.fileId));
    const linked = getLinkedFiles(
      files.filter((file) => approvedIds.has(file.id) && file.status === 'available'),
      links,
    );

    return linked.sort((left, right) => {
      if (filters.sort === 'downloads') return right.downloadCount - left.downloadCount;
      if (filters.sort === 'reports') return right.reportCount - left.reportCount;
      if (filters.sort === 'name') return left.displayFilename.localeCompare(right.displayFilename);
      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    });
  },

  async approveSharedFile(fileId: string): Promise<void> {
    const links = readList<FileLink>(linksKey);
    writeList(
      linksKey,
      links.map((link) =>
        link.fileId === fileId && link.linkType === 'shared_file'
          ? { ...link, sharedStatus: 'approved' }
          : link,
      ),
    );
  },

  async reportFile({
    input,
    user,
  }: {
    input: FileReportInput;
    user: ForumUser;
  }): Promise<void> {
    const reports = readList<StoredFileReport>(reportsKey);
    if (
      reports.some(
        (report) => report.fileId === input.fileId && report.reporterId === user.id,
      )
    ) {
      throw new Error('You have already reported this file.');
    }

    const nextReports = [
      ...reports,
      {
        id: createId('file-report'),
        fileId: input.fileId,
        reporterId: user.id,
        reportType: input.reportType,
        note: input.note.trim(),
        createdAt: new Date().toISOString(),
      },
    ];
    writeList(reportsKey, nextReports);

    const uniqueReporters = new Set(
      nextReports
        .filter((report) => report.fileId === input.fileId)
        .map((report) => report.reporterId),
    );

    const files = readList<InUniFile>(filesKey);
    writeList(
      filesKey,
      files.map((file) => {
        if (file.id !== input.fileId) return file;
        const status: FileStatus = shouldAutoHideFile(uniqueReporters.size)
          ? 'hidden_by_reports'
          : file.status;
        return {
          ...file,
          status,
          reportCount: uniqueReporters.size,
          updatedAt: new Date().toISOString(),
        };
      }),
    );
  },

  async getHiddenFiles(): Promise<LinkedFile[]> {
    const files = readList<InUniFile>(filesKey).filter(
      (file) => file.status === 'hidden_by_reports',
    );
    return getLinkedFiles(files, readList<FileLink>(linksKey));
  },

  async createSignedDownloadUrl(fileId: string): Promise<{ url: string; expiresAt: string }> {
    const expiresAt = new Date(
      Date.now() + SIGNED_FILE_URL_TTL_SECONDS * 1000,
    ).toISOString();
    return { url: `mock://download/${fileId}`, expiresAt };
  },
};
```

- [ ] **Step 5: Add app-level API wrapper**

Create `src/lib/fileApi.ts`:

```ts
import type { ForumUser } from '../types/forum';
import type {
  FileReportInput,
  FileUploadDraft,
  LinkedFile,
  SharedFileFilters,
  SignedFileUrl,
} from '../types/files';
import { isSupabaseConfigured } from './supabase';
import { mockFileStore } from './mockFileStore';

export type FileContext =
  | { type: 'post'; postId: string }
  | { type: 'comment'; commentId: string };

export async function uploadLinkedFiles(
  context: FileContext,
  drafts: FileUploadDraft[],
  user: ForumUser,
): Promise<LinkedFile[]> {
  if (!isSupabaseConfigured) {
    return mockFileStore.uploadLinkedFiles({ context, drafts, user });
  }

  throw new Error('Supabase file uploads require the Supabase storage implementation task.');
}

export async function getFilesForPost(postId: string): Promise<LinkedFile[]> {
  if (!isSupabaseConfigured) return mockFileStore.getFilesForPost(postId);
  return [];
}

export async function getFilesForComment(commentId: string): Promise<LinkedFile[]> {
  if (!isSupabaseConfigured) return mockFileStore.getFilesForComment(commentId);
  return [];
}

export async function getSharedFiles(
  filters: Partial<SharedFileFilters>,
): Promise<LinkedFile[]> {
  if (!isSupabaseConfigured) return mockFileStore.getSharedFiles(filters);
  return [];
}

export async function reportFile(
  input: FileReportInput,
  user: ForumUser,
): Promise<void> {
  if (!isSupabaseConfigured) return mockFileStore.reportFile({ input, user });
  throw new Error('Supabase file reports require the Supabase storage implementation task.');
}

export async function createSignedDownloadUrl(fileId: string): Promise<SignedFileUrl> {
  if (!isSupabaseConfigured) return mockFileStore.createSignedDownloadUrl(fileId);
  throw new Error('Supabase file downloads require the Supabase storage implementation task.');
}
```

- [ ] **Step 6: Run focused tests**

Run:

```powershell
npm test -- src/lib/fileApi.mock.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```powershell
git add src/lib/storageProvider.ts src/lib/mockFileStore.ts src/lib/fileApi.ts src/lib/fileApi.mock.test.ts
git commit -m "feat: add mock file API boundary"
```

---

## Task 3: Add Reusable File UI Components

**Files:**
- Create: `src/components/AttachmentPicker.tsx`
- Create: `src/components/AttachmentPicker.test.tsx`
- Create: `src/components/FileList.tsx`
- Create: `src/components/FileReportDialog.tsx`
- Create: `src/components/FileReportDialog.test.tsx`

- [ ] **Step 1: Write failing `AttachmentPicker` tests**

Create `src/components/AttachmentPicker.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { AttachmentPicker } from './AttachmentPicker';

function makeFile(name: string, type: string, size = 1024): File {
  return new File(['x'.repeat(size)], name, { type });
}

describe('AttachmentPicker', () => {
  it('shows selected files and lets users add descriptions', async () => {
    const user = userEvent.setup();
    render(<AttachmentPicker value={[]} onChange={() => undefined} />);

    const input = screen.getByLabelText('Choose files');
    await user.upload(input, makeFile('notes.pdf', 'application/pdf'));

    expect(screen.getByText('notes.pdf')).toBeInTheDocument();
    expect(screen.getByLabelText('Description for notes.pdf')).toBeInTheDocument();
  });

  it('shows Shared Files metadata fields when checked', async () => {
    const user = userEvent.setup();
    render(<AttachmentPicker value={[]} onChange={() => undefined} />);

    await user.upload(
      screen.getByLabelText('Choose files'),
      makeFile('guide.pdf', 'application/pdf'),
    );
    await user.click(screen.getByLabelText('Submit guide.pdf to Shared Files'));

    expect(screen.getByLabelText('Course code for guide.pdf')).toBeInTheDocument();
    expect(screen.getByLabelText('Campus or faculty for guide.pdf')).toBeInTheDocument();
    expect(screen.getByLabelText('Tags for guide.pdf')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Write failing `FileReportDialog` tests**

Create `src/components/FileReportDialog.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FileReportDialog } from './FileReportDialog';

describe('FileReportDialog', () => {
  it('submits report type and optional note', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <FileReportDialog
        fileId="file-1"
        fileName="notes.pdf"
        onClose={vi.fn()}
        onSubmit={onSubmit}
        open
      />,
    );

    await user.selectOptions(screen.getByLabelText('Report type'), 'privacy');
    await user.type(screen.getByLabelText('Optional note'), 'Contains personal information.');
    await user.click(screen.getByRole('button', { name: 'Submit report' }));

    expect(onSubmit).toHaveBeenCalledWith({
      fileId: 'file-1',
      reportType: 'privacy',
      note: 'Contains personal information.',
    });
  });
});
```

- [ ] **Step 3: Run tests and verify RED**

Run:

```powershell
npm test -- src/components/AttachmentPicker.test.tsx src/components/FileReportDialog.test.tsx
```

Expected: FAIL because the components do not exist.

- [ ] **Step 4: Implement `AttachmentPicker`**

Create `src/components/AttachmentPicker.tsx`:

```tsx
import type { ChangeEvent } from 'react';
import type { FileUploadDraft } from '../types/files';
import {
  validateAttachmentCount,
  validateFileDescription,
  validateFileSize,
} from '../lib/fileValidation';

interface AttachmentPickerProps {
  value: FileUploadDraft[];
  onChange: (value: FileUploadDraft[]) => void;
  compact?: boolean;
}

function createDraft(file: File): FileUploadDraft {
  return {
    file,
    description: '',
    submitToSharedFiles: false,
    courseCode: '',
    campusOrFaculty: '',
    tags: '',
  };
}

export function AttachmentPicker({
  value,
  onChange,
  compact = false,
}: AttachmentPickerProps) {
  const countError = validateAttachmentCount(value.length);

  function updateDraft(index: number, patch: Partial<FileUploadDraft>) {
    onChange(value.map((draft, currentIndex) =>
      currentIndex === index ? { ...draft, ...patch } : draft,
    ));
  }

  function removeDraft(index: number) {
    onChange(value.filter((_, currentIndex) => currentIndex !== index));
  }

  function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    const nextValue = [...value, ...files.map(createDraft)];
    onChange(nextValue.slice(0, 5));
    event.target.value = '';
  }

  return (
    <div className="grid gap-3 rounded-lg border border-dashed border-line bg-slate-50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold text-slate-900">Attach files</p>
          <p className="mt-1 text-sm text-slate-600">
            Max 100MB per file, 5 files per {compact ? 'comment' : 'post'}, 1GB per day.
          </p>
        </div>
        <label className="secondary-button cursor-pointer">
          Choose files
          <input
            aria-label="Choose files"
            className="sr-only"
            multiple
            onChange={handleFiles}
            type="file"
          />
        </label>
      </div>

      {countError ? (
        <p className="text-sm font-semibold text-red-700">{countError}</p>
      ) : null}

      {value.map((draft, index) => {
        const sizeError = validateFileSize(draft.file.size);
        const descriptionError = validateFileDescription(draft.description);
        return (
          <div className="grid gap-3 border-t border-line pt-3" key={`${draft.file.name}-${index}`}>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-start">
              <div>
                <p className="text-sm font-bold text-slate-900">{draft.file.name}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  {draft.file.type || 'Unknown type'} · {Math.ceil(draft.file.size / 1024)} KB
                </p>
                {sizeError ? (
                  <p className="mt-1 text-sm font-semibold text-red-700">{sizeError}</p>
                ) : null}
              </div>
              <button
                className="secondary-button"
                onClick={() => removeDraft(index)}
                type="button"
              >
                Remove
              </button>
            </div>

            <label className="grid gap-2">
              <span className="field-label">Description for {draft.file.name}</span>
              <input
                aria-label={`Description for ${draft.file.name}`}
                className="field-input"
                maxLength={200}
                value={draft.description}
                onChange={(event) =>
                  updateDraft(index, { description: event.target.value })
                }
              />
              {descriptionError ? (
                <span className="text-sm font-semibold text-red-700">
                  {descriptionError}
                </span>
              ) : null}
            </label>

            <label className="flex items-start gap-3 text-sm text-slate-700">
              <input
                aria-label={`Submit ${draft.file.name} to Shared Files`}
                checked={draft.submitToSharedFiles}
                className="mt-1 h-4 w-4 accent-brand-700"
                onChange={(event) =>
                  updateDraft(index, { submitToSharedFiles: event.target.checked })
                }
                type="checkbox"
              />
              <span>Submit to Shared Files for admin review</span>
            </label>

            {draft.submitToSharedFiles ? (
              <div className="grid gap-3 rounded-lg border border-brand-100 bg-white p-3 sm:grid-cols-3">
                <label className="grid gap-2">
                  <span className="field-label">Course code for {draft.file.name}</span>
                  <input
                    aria-label={`Course code for ${draft.file.name}`}
                    className="field-input"
                    placeholder="CSC1010H"
                    value={draft.courseCode}
                    onChange={(event) =>
                      updateDraft(index, { courseCode: event.target.value })
                    }
                  />
                </label>
                <label className="grid gap-2">
                  <span className="field-label">Campus or faculty for {draft.file.name}</span>
                  <input
                    aria-label={`Campus or faculty for ${draft.file.name}`}
                    className="field-input"
                    placeholder="Science"
                    value={draft.campusOrFaculty}
                    onChange={(event) =>
                      updateDraft(index, { campusOrFaculty: event.target.value })
                    }
                  />
                </label>
                <label className="grid gap-2">
                  <span className="field-label">Tags for {draft.file.name}</span>
                  <input
                    aria-label={`Tags for ${draft.file.name}`}
                    className="field-input"
                    placeholder="notes, week 5"
                    value={draft.tags}
                    onChange={(event) => updateDraft(index, { tags: event.target.value })}
                  />
                </label>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 5: Implement `FileReportDialog`**

Create `src/components/FileReportDialog.tsx`:

```tsx
import { useState } from 'react';
import type { FileReportInput, FileReportType } from '../types/files';

interface FileReportDialogProps {
  open: boolean;
  fileId: string;
  fileName: string;
  onClose: () => void;
  onSubmit: (input: FileReportInput) => void | Promise<void>;
}

const reportTypes: Array<{ value: FileReportType; label: string }> = [
  { value: 'copyright', label: 'Copyright' },
  { value: 'malicious_file', label: 'Malicious file' },
  { value: 'privacy', label: 'Privacy' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'other', label: 'Other' },
];

export function FileReportDialog({
  open,
  fileId,
  fileName,
  onClose,
  onSubmit,
}: FileReportDialogProps) {
  const [reportType, setReportType] = useState<FileReportType>('other');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({ fileId, reportType, note: note.trim() });
      setNote('');
      setReportType('other');
      onClose();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Could not submit report.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/30 px-4 py-6">
      <div className="panel w-full max-w-md p-5">
        <h2 className="text-xl font-semibold text-ink">Report file</h2>
        <p className="mt-1 text-sm text-slate-600">{fileName}</p>

        <label className="mt-4 grid gap-2">
          <span className="field-label">Report type</span>
          <select
            className="field-input"
            value={reportType}
            onChange={(event) => setReportType(event.target.value as FileReportType)}
          >
            {reportTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </label>

        <label className="mt-4 grid gap-2">
          <span className="field-label">Optional note</span>
          <textarea
            className="field-input min-h-24 resize-y"
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </label>

        {error ? <p className="mt-3 text-sm font-semibold text-red-700">{error}</p> : null}

        <div className="mt-5 flex justify-end gap-2">
          <button className="secondary-button" onClick={onClose} type="button">
            Cancel
          </button>
          <button
            className="danger-button"
            disabled={submitting}
            onClick={() => void handleSubmit()}
            type="button"
          >
            Submit report
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Implement `FileList`**

Create `src/components/FileList.tsx`:

```tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { createSignedDownloadUrl, reportFile } from '../lib/fileApi';
import { canPreviewFile } from '../lib/fileValidation';
import { useAuth } from '../hooks/useAuth';
import type { FileReportInput, LinkedFile } from '../types/files';
import { FileReportDialog } from './FileReportDialog';

interface FileListProps {
  files: LinkedFile[];
  emptyMessage?: string;
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.ceil(bytes / 1024))} KB`;
}

export function FileList({ files, emptyMessage = 'No files yet.' }: FileListProps) {
  const { user } = useAuth();
  const [reportingFile, setReportingFile] = useState<LinkedFile | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  async function download(file: LinkedFile) {
    if (!user) {
      setStatus('Log in to download files.');
      return;
    }
    const signedUrl = await createSignedDownloadUrl(file.id);
    window.location.assign(signedUrl.url);
  }

  async function submitReport(input: FileReportInput) {
    if (!user) throw new Error('Log in to report files.');
    await reportFile(input, user);
    setStatus('File report submitted.');
  }

  if (files.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-line bg-white px-4 py-6 text-sm text-slate-600">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="panel overflow-hidden">
      {files.map((file) => (
        <article
          className="grid gap-3 border-t border-slate-100 p-4 first:border-t-0 sm:grid-cols-[1fr_auto] sm:items-center"
          key={file.id}
        >
          <div>
            <h3 className="text-base font-bold text-ink">{file.displayFilename}</h3>
            {file.description ? (
              <p className="mt-1 text-sm leading-6 text-slate-600">{file.description}</p>
            ) : null}
            <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
              <span>{formatBytes(file.sizeBytes)}</span>
              <span>{file.extension.toUpperCase() || 'FILE'}</span>
              {file.status === 'hidden_by_reports' ? (
                <span className="text-amber-700">Hidden while moderators review reports</span>
              ) : null}
              {file.links.flatMap((link) => link.tags).map((tag) => (
                <span className="badge bg-slate-100 text-slate-700" key={tag}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            {canPreviewFile(file.mimeType) ? (
              <button
                className="secondary-button"
                onClick={() => void download(file)}
                type="button"
              >
                Preview
              </button>
            ) : null}
            {user ? (
              <button
                className="secondary-button"
                onClick={() => void download(file)}
                type="button"
              >
                Download
              </button>
            ) : (
              <Link className="secondary-button" to="/login">
                Log in to download
              </Link>
            )}
            {user ? (
              <button
                className="danger-button"
                onClick={() => setReportingFile(file)}
                type="button"
              >
                Report
              </button>
            ) : null}
          </div>
        </article>
      ))}
      {status ? <p className="border-t border-slate-100 p-4 text-sm text-slate-600">{status}</p> : null}
      {reportingFile ? (
        <FileReportDialog
          fileId={reportingFile.id}
          fileName={reportingFile.displayFilename}
          onClose={() => setReportingFile(null)}
          onSubmit={submitReport}
          open
        />
      ) : null}
    </div>
  );
}
```

- [ ] **Step 7: Run tests**

Run:

```powershell
npm test -- src/components/AttachmentPicker.test.tsx src/components/FileReportDialog.test.tsx
```

Expected: PASS.

- [ ] **Step 8: Commit**

```powershell
git add src/components/AttachmentPicker.tsx src/components/AttachmentPicker.test.tsx src/components/FileList.tsx src/components/FileReportDialog.tsx src/components/FileReportDialog.test.tsx
git commit -m "feat: add reusable file UI components"
```

---

## Task 4: Wire Post and Comment Attachments in Demo Mode

**Files:**
- Modify: `src/pages/CreatePostPage.tsx`
- Modify: `src/pages/PostDetailPage.tsx`
- Modify: `src/components/CommentList.tsx`
- Modify: `src/lib/forumApi.ts`
- Modify: `src/types/forum.ts`
- Create: `src/pages/CreatePostPage.attachments.test.tsx`

- [ ] **Step 1: Write failing create-post attachment test**

Create `src/pages/CreatePostPage.attachments.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { CreatePostPage } from './CreatePostPage';

const createPost = vi.fn().mockResolvedValue({ id: 'post-1' });
const uploadLinkedFiles = vi.fn().mockResolvedValue([]);

vi.mock('../lib/forumApi', () => ({
  createPost: (...args: unknown[]) => createPost(...args),
}));

vi.mock('../lib/fileApi', () => ({
  uploadLinkedFiles: (...args: unknown[]) => uploadLinkedFiles(...args),
}));

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: 'user-1',
      email: 'user@uct.ac.za',
      emailConfirmed: true,
      profile: {
        id: 'user-1',
        username: 'user',
        displayName: 'User',
        role: 'student',
        isBanned: false,
        banReason: null,
        createdAt: '2026-06-16T00:00:00.000Z',
      },
    },
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => vi.fn() };
});

describe('CreatePostPage attachments', () => {
  it('uploads selected files after creating the post', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <CreatePostPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByPlaceholderText('What do you want to discuss?'), 'Question');
    await user.type(screen.getByPlaceholderText('Write the full post...'), 'Useful content');
    await user.upload(
      screen.getByLabelText('Choose files'),
      new File(['notes'], 'notes.pdf', { type: 'application/pdf' }),
    );
    await user.click(screen.getByRole('button', { name: 'Publish post' }));

    expect(createPost).toHaveBeenCalled();
    expect(uploadLinkedFiles).toHaveBeenCalledWith(
      { type: 'post', postId: 'post-1' },
      expect.arrayContaining([expect.objectContaining({ description: '' })]),
      expect.objectContaining({ id: 'user-1' }),
    );
  });
});
```

- [ ] **Step 2: Run test and verify RED**

Run:

```powershell
npm test -- src/pages/CreatePostPage.attachments.test.tsx
```

Expected: FAIL because `CreatePostPage` does not render `AttachmentPicker`.

- [ ] **Step 3: Add attachment picker to create post**

Modify `src/pages/CreatePostPage.tsx`:

```tsx
import { AttachmentPicker } from '../components/AttachmentPicker';
import { uploadLinkedFiles } from '../lib/fileApi';
import type { FileUploadDraft } from '../types/files';
```

Add state:

```tsx
const [attachments, setAttachments] = useState<FileUploadDraft[]>([]);
```

After `createPost(...)` succeeds and before `navigate(...)`, add:

```tsx
if (attachments.length > 0) {
  await uploadLinkedFiles({ type: 'post', postId: post.id }, attachments, user);
}
```

Render this block below the anonymous checkbox and above the error state:

```tsx
<label className="grid gap-2">
  <span className="field-label">Attachments</span>
  <AttachmentPicker value={attachments} onChange={setAttachments} />
</label>
```

- [ ] **Step 4: Add attachments to comments**

Modify `src/pages/PostDetailPage.tsx`:

```tsx
import { AttachmentPicker } from '../components/AttachmentPicker';
import { uploadLinkedFiles } from '../lib/fileApi';
import type { FileUploadDraft } from '../types/files';
```

Add state:

```tsx
const [commentAttachments, setCommentAttachments] = useState<FileUploadDraft[]>([]);
```

After `createComment(...)` succeeds, add:

```tsx
if (commentAttachments.length > 0) {
  await uploadLinkedFiles(
    { type: 'comment', commentId: comment.id },
    commentAttachments,
    user,
  );
}
```

After successful comment submission, clear attachments:

```tsx
setCommentAttachments([]);
```

Render under the comment textarea:

```tsx
<AttachmentPicker
  compact
  value={commentAttachments}
  onChange={setCommentAttachments}
/>
```

- [ ] **Step 5: Load and display post/comment files**

Modify `src/pages/PostDetailPage.tsx`:

```tsx
import { FileList } from '../components/FileList';
import { getFilesForComment, getFilesForPost } from '../lib/fileApi';
import type { LinkedFile } from '../types/files';
```

Add state:

```tsx
const [postFiles, setPostFiles] = useState<LinkedFile[]>([]);
const [commentFiles, setCommentFiles] = useState<Record<string, LinkedFile[]>>({});
```

Inside the existing `loadPost` function, after `nextComments` is loaded:

```tsx
const [nextPostFiles, nextCommentFileEntries] = await Promise.all([
  getFilesForPost(id),
  Promise.all(
    nextComments.map(async (comment) => [
      comment.id,
      await getFilesForComment(comment.id),
    ] as const),
  ),
]);
```

Set state:

```tsx
setPostFiles(nextPostFiles);
setCommentFiles(Object.fromEntries(nextCommentFileEntries));
```

Render below the post content:

```tsx
{postFiles.length > 0 ? (
  <div className="mt-6">
    <h2 className="text-base font-semibold text-ink">Attachments</h2>
    <div className="mt-3">
      <FileList files={postFiles} />
    </div>
  </div>
) : null}
```

Pass `commentFiles` to `CommentList`:

```tsx
<CommentList
  comments={comments}
  filesByCommentId={commentFiles}
  onReport={user ? openReport : undefined}
  reportDisabled={Boolean(user && !canParticipate(user.profile))}
/>
```

- [ ] **Step 6: Update `CommentList` for attachments**

Modify `src/components/CommentList.tsx`:

```tsx
import { FileList } from './FileList';
import type { LinkedFile } from '../types/files';
```

Extend props:

```ts
filesByCommentId?: Record<string, LinkedFile[]>;
```

Default prop:

```tsx
filesByCommentId = {},
```

Render after the comment text:

```tsx
{filesByCommentId[comment.id]?.length ? (
  <div className="mt-3">
    <FileList files={filesByCommentId[comment.id]} />
  </div>
) : null}
```

- [ ] **Step 7: Run focused and existing tests**

Run:

```powershell
npm test -- src/pages/CreatePostPage.attachments.test.tsx src/pages/CreatePostPage.test.tsx
npm test
```

Expected: all tests pass.

- [ ] **Step 8: Commit**

```powershell
git add src/pages/CreatePostPage.tsx src/pages/PostDetailPage.tsx src/components/CommentList.tsx src/pages/CreatePostPage.attachments.test.tsx
git commit -m "feat: attach files to posts and comments"
```

---

## Task 5: Add the Shared Files Page

**Files:**
- Create: `src/pages/FilesPage.tsx`
- Create: `src/pages/FilesPage.test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/AppLayout.tsx`

- [ ] **Step 1: Write failing page test**

Create `src/pages/FilesPage.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { FilesPage } from './FilesPage';

vi.mock('../lib/fileApi', () => ({
  getSharedFiles: vi.fn().mockResolvedValue([
    {
      id: 'file-1',
      ownerId: 'user-1',
      ownerName: 'Student',
      storageProvider: 'mock',
      storageBucket: 'mock-files',
      storagePath: 'path',
      originalFilename: 'guide.pdf',
      displayFilename: 'guide.pdf',
      mimeType: 'application/pdf',
      extension: 'pdf',
      sizeBytes: 1024,
      description: 'Study guide',
      status: 'available',
      scanStatus: 'not_scanned',
      downloadCount: 0,
      reportCount: 0,
      createdAt: '2026-06-16T00:00:00.000Z',
      updatedAt: '2026-06-16T00:00:00.000Z',
      links: [
        {
          id: 'link-1',
          fileId: 'file-1',
          linkType: 'shared_file',
          postId: null,
          commentId: null,
          sharedStatus: 'approved',
          courseCode: 'CSC1010H',
          campusOrFaculty: 'Science',
          tags: ['study'],
          createdAt: '2026-06-16T00:00:00.000Z',
        },
      ],
    },
  ]),
}));

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({ user: null }),
}));

describe('FilesPage', () => {
  it('renders shared files and sort controls', async () => {
    render(
      <MemoryRouter>
        <FilesPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText('guide.pdf')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Newest' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Downloads' })).toBeInTheDocument();
  });

  it('updates search input', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <FilesPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText('Search shared files'), 'guide');
    expect(screen.getByDisplayValue('guide')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test and verify RED**

Run:

```powershell
npm test -- src/pages/FilesPage.test.tsx
```

Expected: FAIL because `FilesPage` does not exist.

- [ ] **Step 3: Implement `FilesPage`**

Create `src/pages/FilesPage.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { FileList } from '../components/FileList';
import { LoadingState } from '../components/LoadingState';
import { getSharedFiles } from '../lib/fileApi';
import type { FileSort, LinkedFile, SharedFileFilters } from '../types/files';

const sortOptions: Array<{ value: FileSort; label: string }> = [
  { value: 'newest', label: 'Newest' },
  { value: 'downloads', label: 'Downloads' },
  { value: 'reports', label: 'Reports' },
  { value: 'name', label: 'Name' },
];

export function FilesPage() {
  const [files, setFiles] = useState<LinkedFile[]>([]);
  const [filters, setFilters] = useState<SharedFileFilters>({
    query: '',
    courseCode: '',
    fileKind: 'all',
    campusOrFaculty: '',
    tag: '',
    sort: 'newest',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    void getSharedFiles(filters)
      .then((nextFiles) => {
        if (active) setFiles(nextFiles);
      })
      .catch((caughtError) => {
        if (active) {
          setError(caughtError instanceof Error ? caughtError.message : 'Could not load files.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [filters]);

  return (
    <div className="grid gap-5">
      <section className="flex flex-col gap-5 border-b border-line pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="section-title">Shared files</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
            Find approved notes, images, templates, and class resources from the UCT community.
          </p>
        </div>
      </section>

      <section className="panel grid gap-3 p-4">
        <label className="grid gap-2">
          <span className="field-label">Search shared files</span>
          <input
            aria-label="Search shared files"
            className="field-input"
            placeholder="Search by file name, course code, tag, or description"
            value={filters.query}
            onChange={(event) =>
              setFilters((current) => ({ ...current, query: event.target.value }))
            }
          />
        </label>

        <div className="flex flex-wrap gap-2">
          {sortOptions.map((option) => (
            <button
              className={
                filters.sort === option.value
                  ? 'primary-button'
                  : 'secondary-button'
              }
              key={option.value}
              onClick={() =>
                setFilters((current) => ({ ...current, sort: option.value }))
              }
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      {error ? <ErrorState message={error} /> : null}
      {loading ? <LoadingState label="Loading files..." /> : null}
      {!loading && !error && files.length === 0 ? (
        <EmptyState
          title="No shared files yet"
          message="Approved study resources will appear here."
        />
      ) : null}
      {!loading && !error && files.length > 0 ? <FileList files={files} /> : null}
    </div>
  );
}
```

- [ ] **Step 4: Add route and nav link**

Modify `src/App.tsx`:

```tsx
import { FilesPage } from './pages/FilesPage';
```

Add route under the app layout:

```tsx
<Route path="/files" element={<FilesPage />} />
```

Modify `src/components/AppLayout.tsx` by adding the nav link after `Forum`:

```tsx
<NavLink to="/files" className={navClass}>
  Files
</NavLink>
```

- [ ] **Step 5: Update navigation regression test**

Modify the first test in `src/App.test.tsx`:

```tsx
describe('MVP navigation', () => {
  it('shows approved public destinations for a signed-out visitor', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: 'Forum' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Files' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Login' })).toBeInTheDocument();
    expect(screen.queryByText('Tools')).not.toBeInTheDocument();
    expect(screen.queryByText('Shared Files')).not.toBeInTheDocument();
  });
```

- [ ] **Step 6: Run tests**

Run:

```powershell
npm test -- src/pages/FilesPage.test.tsx src/App.test.tsx
npm test
```

Expected: all tests pass, and the app navigation includes `Files` while still excluding deferred `Tools`.

- [ ] **Step 7: Commit**

```powershell
git add src/pages/FilesPage.tsx src/pages/FilesPage.test.tsx src/App.tsx src/components/AppLayout.tsx src/App.test.tsx
git commit -m "feat: add shared files page"
```

---

## Task 6: Add Profile Uploaded Files

**Files:**
- Modify: `src/pages/ProfilePage.tsx`
- Modify: `src/lib/fileApi.ts`
- Modify: `src/lib/mockFileStore.ts`

- [ ] **Step 1: Add API for current user files**

In `src/lib/mockFileStore.ts`, add:

```ts
async getUserFiles(userId: string): Promise<LinkedFile[]> {
  const files = readList<InUniFile>(filesKey).filter((file) => file.ownerId === userId);
  return getLinkedFiles(files, readList<FileLink>(linksKey)).sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
},
```

In `src/lib/fileApi.ts`, add:

```ts
export async function getUserFiles(userId: string): Promise<LinkedFile[]> {
  if (!isSupabaseConfigured) return mockFileStore.getUserFiles(userId);
  return [];
}
```

- [ ] **Step 2: Render My uploaded files on profile**

Modify `src/pages/ProfilePage.tsx`:

```tsx
import { FileList } from '../components/FileList';
import { getUserFiles } from '../lib/fileApi';
import type { LinkedFile } from '../types/files';
```

Add state:

```tsx
const [files, setFiles] = useState<LinkedFile[]>([]);
const [filesLoading, setFilesLoading] = useState(false);
const [filesError, setFilesError] = useState<string | null>(null);
```

Add a `useEffect` matching the posts loader:

```tsx
useEffect(() => {
  let isActive = true;

  async function loadUserFiles() {
    if (!user) return;
    setFilesLoading(true);
    setFilesError(null);
    try {
      const nextFiles = await getUserFiles(user.id);
      if (isActive) setFiles(nextFiles);
    } catch (caughtError) {
      if (isActive) {
        setFilesError(
          caughtError instanceof Error ? caughtError.message : 'Could not load your files.',
        );
      }
    } finally {
      if (isActive) setFilesLoading(false);
    }
  }

  void loadUserFiles();

  return () => {
    isActive = false;
  };
}, [user]);
```

Render above "Your posts":

```tsx
<section className="grid gap-4">
  <div>
    <h2 className="section-title">My uploaded files</h2>
    <p className="mt-1 text-sm text-slate-600">
      Files you uploaded that still exist on InUni.
    </p>
  </div>
  {filesError ? <ErrorState message={filesError} /> : null}
  {filesLoading ? <LoadingState label="Loading your files..." /> : null}
  {!filesLoading && !filesError ? (
    <FileList files={files} emptyMessage="No uploaded files yet." />
  ) : null}
</section>
```

- [ ] **Step 3: Run tests and build**

Run:

```powershell
npm test
npm run build
```

Expected: all tests and build pass.

- [ ] **Step 4: Commit**

```powershell
git add src/pages/ProfilePage.tsx src/lib/fileApi.ts src/lib/mockFileStore.ts
git commit -m "feat: show uploaded files on profile"
```

---

## Task 7: Add Admin File Review

**Files:**
- Create: `src/lib/adminFileApi.ts`
- Create: `src/pages/AdminFilesPage.tsx`
- Create: `src/pages/AdminFilesPage.test.tsx`
- Modify: `src/pages/AdminPage.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Write failing admin files page test**

Create `src/pages/AdminFilesPage.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AdminFilesPage } from './AdminFilesPage';

vi.mock('../lib/adminFileApi', () => ({
  getPendingSharedFiles: vi.fn().mockResolvedValue([
    {
      id: 'file-1',
      ownerId: 'user-1',
      ownerName: 'Ayanda M.',
      storageProvider: 'mock',
      storageBucket: 'mock-files',
      storagePath: 'path',
      originalFilename: 'guide.pdf',
      displayFilename: 'guide.pdf',
      mimeType: 'application/pdf',
      extension: 'pdf',
      sizeBytes: 1024,
      description: 'Study guide',
      status: 'available',
      scanStatus: 'not_scanned',
      downloadCount: 0,
      reportCount: 0,
      createdAt: '2026-06-16T00:00:00.000Z',
      updatedAt: '2026-06-16T00:00:00.000Z',
      links: [],
    },
  ]),
  getAutoHiddenFiles: vi.fn().mockResolvedValue([]),
  approveSharedFile: vi.fn().mockResolvedValue(undefined),
  rejectSharedFile: vi.fn().mockResolvedValue(undefined),
  restoreHiddenFile: vi.fn().mockResolvedValue(undefined),
  deleteHiddenFile: vi.fn().mockResolvedValue(undefined),
}));

describe('AdminFilesPage', () => {
  it('renders pending Shared Files review queue', async () => {
    render(
      <MemoryRouter>
        <AdminFilesPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText('guide.pdf')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Approve' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reject' })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test and verify RED**

Run:

```powershell
npm test -- src/pages/AdminFilesPage.test.tsx
```

Expected: FAIL because `AdminFilesPage` does not exist.

- [ ] **Step 3: Implement admin file API**

Create `src/lib/adminFileApi.ts`:

```ts
import type { LinkedFile } from '../types/files';
import { isSupabaseConfigured } from './supabase';
import { mockFileStore } from './mockFileStore';

export async function getPendingSharedFiles(): Promise<LinkedFile[]> {
  if (!isSupabaseConfigured) {
    return mockFileStore.getPendingSharedFiles();
  }
  return [];
}

export async function getAutoHiddenFiles(): Promise<LinkedFile[]> {
  if (!isSupabaseConfigured) {
    return mockFileStore.getHiddenFiles();
  }
  return [];
}

export async function approveSharedFile(fileId: string): Promise<void> {
  if (!isSupabaseConfigured) return mockFileStore.approveSharedFile(fileId);
}

export async function rejectSharedFile(fileId: string): Promise<void> {
  if (!isSupabaseConfigured) return mockFileStore.deleteFile(fileId);
}

export async function restoreHiddenFile(fileId: string): Promise<void> {
  if (!isSupabaseConfigured) return mockFileStore.restoreHiddenFile(fileId);
}

export async function deleteHiddenFile(fileId: string): Promise<void> {
  if (!isSupabaseConfigured) return mockFileStore.deleteFile(fileId);
}
```

Add these methods to `mockFileStore`:

```ts
async getPendingSharedFiles(): Promise<LinkedFile[]> {
  const files = readList<InUniFile>(filesKey);
  const links = readList<FileLink>(linksKey);
  const pendingIds = new Set(
    links
      .filter((link) => link.linkType === 'shared_file' && link.sharedStatus === 'pending')
      .map((link) => link.fileId),
  );
  return getLinkedFiles(files.filter((file) => pendingIds.has(file.id)), links);
},

async restoreHiddenFile(fileId: string): Promise<void> {
  const files = readList<InUniFile>(filesKey);
  writeList(
    filesKey,
    files.map((file) =>
      file.id === fileId
        ? { ...file, status: 'available', updatedAt: new Date().toISOString() }
        : file,
    ),
  );
},

async deleteFile(fileId: string): Promise<void> {
  writeList(
    filesKey,
    readList<InUniFile>(filesKey).filter((file) => file.id !== fileId),
  );
  writeList(
    linksKey,
    readList<FileLink>(linksKey).filter((link) => link.fileId !== fileId),
  );
  writeList(
    reportsKey,
    readList<StoredFileReport>(reportsKey).filter((report) => report.fileId !== fileId),
  );
},
```

- [ ] **Step 4: Implement `AdminFilesPage`**

Create `src/pages/AdminFilesPage.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import {
  approveSharedFile,
  deleteHiddenFile,
  getAutoHiddenFiles,
  getPendingSharedFiles,
  rejectSharedFile,
  restoreHiddenFile,
} from '../lib/adminFileApi';
import type { LinkedFile } from '../types/files';

type Tab = 'pending' | 'hidden';

export function AdminFilesPage() {
  const [tab, setTab] = useState<Tab>('pending');
  const [pendingFiles, setPendingFiles] = useState<LinkedFile[]>([]);
  const [hiddenFiles, setHiddenFiles] = useState<LinkedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<{
    file: LinkedFile;
    action: 'reject' | 'delete';
  } | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    void Promise.all([getPendingSharedFiles(), getAutoHiddenFiles()])
      .then(([nextPending, nextHidden]) => {
        if (!active) return;
        setPendingFiles(nextPending);
        setHiddenFiles(nextHidden);
      })
      .catch((caughtError) => {
        if (active) {
          setError(caughtError instanceof Error ? caughtError.message : 'Could not load file review.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const visibleFiles = tab === 'pending' ? pendingFiles : hiddenFiles;

  async function approve(file: LinkedFile) {
    await approveSharedFile(file.id);
    setPendingFiles((current) => current.filter((item) => item.id !== file.id));
  }

  async function restore(file: LinkedFile) {
    await restoreHiddenFile(file.id);
    setHiddenFiles((current) => current.filter((item) => item.id !== file.id));
  }

  async function confirmDelete() {
    if (!confirming) return;
    if (confirming.action === 'reject') {
      await rejectSharedFile(confirming.file.id);
      setPendingFiles((current) => current.filter((item) => item.id !== confirming.file.id));
    } else {
      await deleteHiddenFile(confirming.file.id);
      setHiddenFiles((current) => current.filter((item) => item.id !== confirming.file.id));
    }
    setConfirming(null);
  }

  return (
    <div className="grid gap-5">
      <section className="panel p-5">
        <p className="text-sm font-semibold text-brand-700">Administrator</p>
        <h1 className="section-title">File review</h1>
        <p className="mt-1 text-sm text-slate-600">
          Approve Shared Files submissions and review files hidden after reports.
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="panel p-5">
          <p className="text-3xl font-semibold text-ink">{pendingFiles.length}</p>
          <p className="mt-1 text-sm text-slate-600">Pending Shared Files</p>
        </div>
        <div className="panel p-5">
          <p className="text-3xl font-semibold text-ink">{hiddenFiles.length}</p>
          <p className="mt-1 text-sm text-slate-600">Hidden after reports</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          className={tab === 'pending' ? 'primary-button' : 'secondary-button'}
          onClick={() => setTab('pending')}
          type="button"
        >
          Pending Shared Files
        </button>
        <button
          className={tab === 'hidden' ? 'primary-button' : 'secondary-button'}
          onClick={() => setTab('hidden')}
          type="button"
        >
          Auto-hidden files
        </button>
      </div>

      {error ? <ErrorState message={error} /> : null}
      {loading ? <LoadingState label="Loading files..." /> : null}
      {!loading && !error && visibleFiles.length === 0 ? (
        <EmptyState title="No files here" message="This file review queue is clear." />
      ) : null}

      {!loading && !error && visibleFiles.length > 0 ? (
        <div className="panel overflow-hidden">
          {visibleFiles.map((file) => (
            <article
              className="grid gap-3 border-t border-slate-100 p-4 first:border-t-0 sm:grid-cols-[1fr_auto] sm:items-center"
              key={file.id}
            >
              <div>
                <h2 className="text-base font-bold text-ink">{file.displayFilename}</h2>
                <p className="mt-1 text-sm text-slate-600">{file.description || 'No description.'}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  Uploaded by {file.ownerName} · {file.scanStatus.replace('_', ' ')}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 sm:justify-end">
                {tab === 'pending' ? (
                  <>
                    <button className="primary-button" onClick={() => void approve(file)} type="button">
                      Approve
                    </button>
                    <button
                      className="danger-button"
                      onClick={() => setConfirming({ file, action: 'reject' })}
                      type="button"
                    >
                      Reject
                    </button>
                  </>
                ) : (
                  <>
                    <button className="secondary-button" onClick={() => void restore(file)} type="button">
                      Restore
                    </button>
                    <button
                      className="danger-button"
                      onClick={() => setConfirming({ file, action: 'delete' })}
                      type="button"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : null}

      <ConfirmDialog
        confirmLabel={confirming?.action === 'reject' ? 'Reject file' : 'Delete file'}
        destructive
        message="This permanently removes the file and its metadata."
        onCancel={() => setConfirming(null)}
        onConfirm={confirmDelete}
        open={Boolean(confirming)}
        title={confirming?.action === 'reject' ? 'Reject file?' : 'Delete file?'}
      />
    </div>
  );
}
```

- [ ] **Step 5: Add route and admin overview link**

Modify `src/App.tsx`:

```tsx
import { AdminFilesPage } from './pages/AdminFilesPage';
```

Add an admin route:

```tsx
<Route
  path="/admin/files"
  element={
    <AdminRoute>
      <AdminFilesPage />
    </AdminRoute>
  }
/>
```

Modify `src/pages/AdminPage.tsx` by adding a link in the top panel:

```tsx
<Link className="secondary-button" to="/admin/files">
  Review files
</Link>
```

Keep the existing `Manage users` link.

- [ ] **Step 6: Run tests**

Run:

```powershell
npm test -- src/pages/AdminFilesPage.test.tsx
npm test
npm run build
```

Expected: all tests and build pass.

- [ ] **Step 7: Commit**

```powershell
git add src/lib/adminFileApi.ts src/pages/AdminFilesPage.tsx src/pages/AdminFilesPage.test.tsx src/pages/AdminPage.tsx src/App.tsx src/lib/mockFileStore.ts
git commit -m "feat: add admin file review"
```

---

## Task 8: Add Supabase File Schema and Storage Provider

**Files:**
- Modify: `supabase/schema.sql`
- Modify: `supabase/tests/rls.sql`
- Create: `src/lib/supabaseStorageProvider.ts`
- Modify: `src/lib/fileApi.ts`
- Modify: `README.md`

- [ ] **Step 1: Extend Supabase schema**

Append to `supabase/schema.sql` after the existing report schema:

```sql
create type public.file_status as enum (
  'uploading',
  'available',
  'pending_review',
  'hidden_by_reports'
);

create type public.shared_file_status as enum ('pending', 'approved');

create type public.file_scan_status as enum (
  'not_scanned',
  'pending',
  'clean',
  'flagged',
  'failed'
);

create type public.file_link_type as enum ('post', 'comment', 'shared_file');

create type public.file_report_type as enum (
  'copyright',
  'malicious_file',
  'privacy',
  'harassment',
  'other'
);

create table public.files (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  storage_provider text not null default 'supabase',
  storage_bucket text not null,
  storage_path text not null unique,
  original_filename text not null,
  display_filename text not null,
  mime_type text not null,
  extension text not null,
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 104857600),
  description text not null default '' check (char_length(description) <= 200),
  status public.file_status not null default 'available',
  scan_status public.file_scan_status not null default 'not_scanned',
  download_count integer not null default 0,
  report_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.file_links (
  id uuid primary key default gen_random_uuid(),
  file_id uuid not null references public.files(id) on delete cascade,
  link_type public.file_link_type not null,
  post_id uuid references public.posts(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  shared_status public.shared_file_status,
  course_code text,
  campus_or_faculty text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  constraint file_links_context check (
    (link_type = 'post' and post_id is not null and comment_id is null and shared_status is null)
    or (link_type = 'comment' and comment_id is not null and post_id is null and shared_status is null)
    or (link_type = 'shared_file' and post_id is null and comment_id is null and shared_status is not null)
  )
);

create table public.file_reports (
  id uuid primary key default gen_random_uuid(),
  file_id uuid not null references public.files(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  report_type public.file_report_type not null,
  note text not null default '' check (char_length(note) <= 500),
  created_at timestamptz not null default now(),
  unique (file_id, reporter_id)
);

create index files_owner_created_idx on public.files (owner_id, created_at desc);
create index files_status_created_idx on public.files (status, created_at desc);
create index file_links_file_id_idx on public.file_links (file_id);
create index file_links_post_id_idx on public.file_links (post_id);
create index file_links_comment_id_idx on public.file_links (comment_id);
create index file_links_shared_idx on public.file_links (shared_status, created_at desc);
create index file_reports_file_id_idx on public.file_reports (file_id);
```

Add trigger:

```sql
create trigger files_set_updated_at
before update on public.files
for each row execute function public.set_updated_at();
```

- [ ] **Step 2: Add file RLS and helper functions**

Append:

```sql
create or replace function public.current_profile_daily_upload_bytes()
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum(size_bytes), 0)::bigint
  from public.files
  where owner_id = auth.uid()
    and created_at >= now() - interval '1 day';
$$;

create or replace function public.refresh_file_report_count(target_file uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  unique_reports integer;
begin
  select count(distinct reporter_id)
  into unique_reports
  from public.file_reports
  where file_id = target_file;

  update public.files
  set
    report_count = unique_reports,
    status = case
      when unique_reports >= 3 then 'hidden_by_reports'::public.file_status
      else status
    end
  where id = target_file;
end;
$$;

create or replace function public.after_file_report_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.refresh_file_report_count(new.file_id);
  return new;
end;
$$;

create trigger file_reports_refresh_count
after insert on public.file_reports
for each row execute function public.after_file_report_insert();
```

Enable RLS:

```sql
alter table public.files enable row level security;
alter table public.file_links enable row level security;
alter table public.file_reports enable row level security;
```

Add policies:

```sql
create policy "Users can read available own and public files"
on public.files for select
to authenticated
using (
  owner_id = auth.uid()
  or status = 'available'
  or public.current_profile_is_admin()
);

create policy "Active users can insert own files within quota"
on public.files for insert
to authenticated
with check (
  owner_id = auth.uid()
  and public.current_profile_can_participate()
  and size_bytes <= 104857600
  and public.current_profile_daily_upload_bytes() + size_bytes <= 1073741824
);

create policy "Owners and admins can update files"
on public.files for update
to authenticated
using (owner_id = auth.uid() or public.current_profile_is_admin())
with check (owner_id = auth.uid() or public.current_profile_is_admin());

create policy "Owners and admins can delete files"
on public.files for delete
to authenticated
using (owner_id = auth.uid() or public.current_profile_is_admin());

create policy "Authenticated users can read file links"
on public.file_links for select
to authenticated
using (true);

create policy "Active users can create file links"
on public.file_links for insert
to authenticated
with check (
  public.current_profile_can_participate()
  and exists (
    select 1 from public.files
    where files.id = file_id and files.owner_id = auth.uid()
  )
);

create policy "Admins can update file links"
on public.file_links for update
to authenticated
using (public.current_profile_is_admin())
with check (public.current_profile_is_admin());

create policy "Owners and admins can delete file links"
on public.file_links for delete
to authenticated
using (
  public.current_profile_is_admin()
  or exists (
    select 1 from public.files
    where files.id = file_id and files.owner_id = auth.uid()
  )
);

create policy "Users can read own file reports"
on public.file_reports for select
to authenticated
using (reporter_id = auth.uid() or public.current_profile_is_admin());

create policy "Active users can report files"
on public.file_reports for insert
to authenticated
with check (
  reporter_id = auth.uid()
  and public.current_profile_can_participate()
);

create policy "Admins can delete file reports"
on public.file_reports for delete
to authenticated
using (public.current_profile_is_admin());
```

Add grants:

```sql
grant select, insert, update, delete on table public.files to authenticated;
grant select, insert, update, delete on table public.file_links to authenticated;
grant select, insert, delete on table public.file_reports to authenticated;
grant execute on function public.current_profile_daily_upload_bytes() to authenticated;
grant execute on function public.refresh_file_report_count(uuid) to authenticated;
```

- [ ] **Step 3: Create Supabase Storage provider**

Create `src/lib/supabaseStorageProvider.ts`:

```ts
import type { SignedFileUrl } from '../types/files';
import { SIGNED_FILE_URL_TTL_SECONDS } from './fileValidation';
import { supabase } from './supabase';
import type { StorageProvider, StoredFileObject } from './storageProvider';

const bucket = 'inuni-files';

function requireSupabase() {
  if (!supabase) throw new Error('Supabase is not configured.');
  return supabase;
}

export const supabaseStorageProvider: StorageProvider = {
  async uploadFile(file: File, path: string): Promise<StoredFileObject> {
    const client = requireSupabase();
    const { error } = await client.storage.from(bucket).upload(path, file, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    });
    if (error) throw new Error(`Could not upload file: ${error.message}`);
    return { bucket, path, provider: 'supabase' };
  },

  async createSignedDownloadUrl(path: string): Promise<SignedFileUrl> {
    const client = requireSupabase();
    const { data, error } = await client.storage
      .from(bucket)
      .createSignedUrl(path, SIGNED_FILE_URL_TTL_SECONDS);
    if (error) throw new Error(`Could not create download link: ${error.message}`);
    return {
      url: data.signedUrl,
      expiresAt: new Date(Date.now() + SIGNED_FILE_URL_TTL_SECONDS * 1000).toISOString(),
    };
  },

  async createPreviewUrl(path: string): Promise<SignedFileUrl> {
    return this.createSignedDownloadUrl(path);
  },

  async deleteFile(path: string): Promise<void> {
    const client = requireSupabase();
    const { error } = await client.storage.from(bucket).remove([path]);
    if (error) throw new Error(`Could not delete file: ${error.message}`);
  },
};
```

- [ ] **Step 4: Wire Supabase branches in `fileApi.ts`**

Replace the Task 2 Supabase branches in `src/lib/fileApi.ts` with actual database and storage operations. The implementation must:

- Insert a `files` row before upload with `status: 'uploading'`.
- Upload to storage path `${user.id}/${fileId}/${safeFilename}`.
- Update the `files` row to `available`.
- Insert `file_links` rows for the post/comment context and optional Shared Files submission.
- For `getSharedFiles`, return only approved shared files and available files.
- For `reportFile`, insert into `file_reports` and map unique violations to `You have already reported this file.`
- For `createSignedDownloadUrl`, fetch the file, call provider, and increment `download_count`.

Use the mapper names:

```ts
function mapFileRow(row: FileRow, links: FileLink[]): LinkedFile;
function mapFileLinkRow(row: FileLinkRow): FileLink;
```

Expected error strings:

```ts
'Could not create file metadata.'
'Could not upload file.'
'Could not link file.'
'Could not load files.'
'You have already reported this file.'
'Could not create download link.'
```

- [ ] **Step 5: Add README setup notes**

Add this section to `README.md`:

```md
## File storage setup

The first files phase uses a private Supabase Storage bucket named
`inuni-files`.

Create the bucket in Supabase Storage:

- Name: `inuni-files`
- Public bucket: off
- File size limit: `100MB`

Downloads and previews use short-lived signed URLs generated after login.
Do not make the bucket public.

The app keeps file metadata in Postgres so storage can later move to a
self-hosted S3-compatible service or a server with ClamAV scanning.
```

- [ ] **Step 6: Extend RLS SQL scenarios**

Append to `supabase/tests/rls.sql`:

```sql
-- File policy scenarios:
-- 1. anon cannot select, insert, or report files.
-- 2. active authenticated user can insert own file metadata within 100MB and 1GB daily quota.
-- 3. banned user cannot insert file metadata or file reports.
-- 4. user cannot report the same file twice.
-- 5. three distinct reporters move the file to hidden_by_reports.
-- 6. admin can approve shared file links and delete files.
-- 7. normal users cannot update shared_status.

select 'files' as table_name, count(*) as policy_count
from pg_policies
where schemaname = 'public' and tablename = 'files'
union all
select 'file_links', count(*)
from pg_policies
where schemaname = 'public' and tablename = 'file_links'
union all
select 'file_reports', count(*)
from pg_policies
where schemaname = 'public' and tablename = 'file_reports';
```

- [ ] **Step 7: Run verification**

Run:

```powershell
npm test
npm run build
```

Expected: all tests and build pass.

Manual Supabase verification:

1. Run `supabase/schema.sql` in a disposable Supabase project.
2. Create private bucket `inuni-files` with 100MB limit.
3. Run `supabase/tests/rls.sql`.
4. Exercise the listed file policy scenarios with test users.

- [ ] **Step 8: Commit**

```powershell
git add supabase/schema.sql supabase/tests/rls.sql src/lib/supabaseStorageProvider.ts src/lib/fileApi.ts README.md
git commit -m "feat: add Supabase file storage schema"
```

---

## Task 9: Final UI Polish and Browser Verification

**Files:**
- Modify: `src/index.css` only if spacing utilities need small additions.
- Modify: file pages/components from previous tasks only for fit/overflow issues.

- [ ] **Step 1: Run full tests and production build**

Run:

```powershell
npm test
npm run build
git diff --check
```

Expected: all tests pass, build exits `0`, and no whitespace errors.

- [ ] **Step 2: Start local app**

Run:

```powershell
npm run dev -- --host 127.0.0.1 --port 5173
```

Expected: Vite serves the app at `http://127.0.0.1:5173`.

- [ ] **Step 3: Browser-check desktop and mobile widths**

Check these routes at desktop width and around 320px mobile width:

```text
/
/files
/create
/post/<mock-post-id>
/profile
/admin
/admin/files
```

Expected:

- `/files` shows only Shared Files browsing/search/download/report UI.
- `/files` does not show create-post attachment UI.
- `/files` does not show admin review UI.
- `/create` shows the attachment picker under the post form.
- `/post/:id` shows post attachments under the post and comment attachments under comments.
- `/profile` shows My uploaded files.
- `/admin` shows a file review link/counts without the full file queue.
- `/admin/files` shows file review queues.
- No horizontal overflow at 320px.
- Buttons do not wrap awkwardly or hide text.
- File rows remain readable with long filenames.

- [ ] **Step 4: Commit final polish**

If there are polish fixes:

```powershell
git add src
git commit -m "fix: polish files UI"
```

If there are no changes, do not create an empty commit.

---

## Final Acceptance Checklist

- [ ] Files navigation link exists.
- [ ] `/files` lists only approved Shared Files.
- [ ] `/files` keeps the same simple InUni website style.
- [ ] `/files` does not contain create-post attachment UI.
- [ ] `/files` does not contain admin review UI.
- [ ] Post attachments can be uploaded.
- [ ] Comment attachments can be uploaded.
- [ ] Attachment descriptions are capped at 200 characters.
- [ ] Attachments can be submitted to Shared Files for review.
- [ ] Shared Files require admin approval before public listing.
- [ ] Image and PDF preview actions are available.
- [ ] Office and archive files are download-only.
- [ ] Downloads require login.
- [ ] Download URLs expire after 5 minutes.
- [ ] File report dialog uses report type plus optional note.
- [ ] Duplicate file reports are blocked.
- [ ] Three unique reports hide a file.
- [ ] Uploader sees hidden status without report details.
- [ ] Profile shows My uploaded files.
- [ ] `/admin` links to file review.
- [ ] `/admin/files` approves pending Shared Files.
- [ ] `/admin/files` rejects and deletes pending Shared Files.
- [ ] `/admin/files` restores hidden files.
- [ ] `/admin/files` deletes hidden files.
- [ ] Banned users cannot upload, download, or report files.
- [ ] Supabase schema runs on an empty project.
- [ ] Supabase file RLS scenarios pass.
- [ ] Demo mode still works without Supabase env vars.
- [ ] `npm test` passes.
- [ ] `npm run build` passes.
- [ ] Mobile and desktop browser checks pass.
