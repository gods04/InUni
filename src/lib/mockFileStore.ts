import type {
  FileLink,
  FileReportInput,
  FileUploadDraft,
  InUniFile,
  LinkedFile,
  SharedFileFilters,
  SharedFileLink,
  SignedFileUrl,
} from '../types/files';
import type { ForumUser } from '../types/forum';
import { getDisplayName } from './format';
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
const mockStorageBucket = 'mock-files';

type FileContext =
  | { type: 'post'; postId: string }
  | { type: 'comment'; commentId: string };

interface UploadLinkedFilesInput {
  context: FileContext;
  drafts: FileUploadDraft[];
  user: ForumUser;
}

interface ReportFileInput {
  input: FileReportInput;
  user: ForumUser;
}

interface StoredFileReport {
  id: string;
  fileId: string;
  reporterId: string;
  reportType: FileReportInput['reportType'];
  note: string;
  createdAt: string;
}

function createId(prefix: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function readList<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];

  const raw = window.localStorage.getItem(key);
  if (!raw) return [];

  try {
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

function writeList<T>(key: string, value: T[]): void {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(key, JSON.stringify(value));
  }
}

function getExtension(filename: string): string {
  const parts = filename.toLowerCase().split('.');
  return parts.length > 1 ? parts.at(-1) ?? '' : '';
}

function normalizeFilePart(value: string): string {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9.-]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'file'
  );
}

function parseTags(tags: string): string[] {
  return Array.from(
    new Set(
      tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  );
}

function normalizeOptionalText(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function getOwnerName(user: ForumUser): string {
  return user.profile.displayName || getDisplayName(user.email);
}

function getFiles(): InUniFile[] {
  return readList<InUniFile>(filesKey);
}

function getLinks(): FileLink[] {
  return readList<FileLink>(linksKey);
}

function getReports(): StoredFileReport[] {
  return readList<StoredFileReport>(reportsKey);
}

function createContextLink(context: FileContext, fileId: string, createdAt: string): FileLink {
  if (context.type === 'post') {
    return {
      id: createId('file-link'),
      fileId,
      linkType: 'post',
      postId: context.postId,
      commentId: null,
      sharedStatus: null,
      courseCode: null,
      campusOrFaculty: null,
      tags: [],
      createdAt,
    };
  }

  return {
    id: createId('file-link'),
    fileId,
    linkType: 'comment',
    postId: null,
    commentId: context.commentId,
    sharedStatus: null,
    courseCode: null,
    campusOrFaculty: null,
    tags: [],
    createdAt,
  };
}

function createSharedLink(
  draft: FileUploadDraft,
  fileId: string,
  createdAt: string,
): SharedFileLink {
  return {
    id: createId('file-link'),
    fileId,
    linkType: 'shared_file',
    postId: null,
    commentId: null,
    sharedStatus: 'pending',
    courseCode: normalizeOptionalText(draft.courseCode),
    campusOrFaculty: normalizeOptionalText(draft.campusOrFaculty),
    tags: parseTags(draft.tags),
    createdAt,
  };
}

function linkFiles(files: InUniFile[], links: FileLink[]): LinkedFile[] {
  return files.map((file) => ({
    ...file,
    links: links.filter((link) => link.fileId === file.id),
  }));
}

function getRecentUploadBytes(files: InUniFile[], userId: string): number {
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

  return files
    .filter(
      (file) =>
        file.ownerId === userId && new Date(file.createdAt).getTime() >= oneDayAgo,
    )
    .reduce((total, file) => total + file.sizeBytes, 0);
}

function getContextAttachmentCount(context: FileContext, links: FileLink[]): number {
  return links.filter((link) =>
    context.type === 'post'
      ? link.linkType === 'post' && link.postId === context.postId
      : link.linkType === 'comment' && link.commentId === context.commentId,
  ).length;
}

function validateDrafts(
  context: FileContext,
  drafts: FileUploadDraft[],
  files: InUniFile[],
  links: FileLink[],
  user: ForumUser,
): void {
  const countError = validateAttachmentCount(
    getContextAttachmentCount(context, links) + drafts.length,
  );
  if (countError) throw new Error(countError);

  const totalDraftBytes = drafts.reduce((total, draft) => total + draft.file.size, 0);
  const dailyError = validateDailyUpload(
    getRecentUploadBytes(files, user.id),
    totalDraftBytes,
  );
  if (dailyError) throw new Error(dailyError);

  for (const draft of drafts) {
    const sizeError = validateFileSize(draft.file.size);
    if (sizeError) throw new Error(sizeError);

    const descriptionError = validateFileDescription(draft.description);
    if (descriptionError) throw new Error(descriptionError);
  }
}

function sortLinkedFiles(files: LinkedFile[], sort: SharedFileFilters['sort']): LinkedFile[] {
  return [...files].sort((left, right) => {
    if (sort === 'downloads') {
      return right.downloadCount - left.downloadCount;
    }

    if (sort === 'reports') {
      return right.reportCount - left.reportCount;
    }

    if (sort === 'name') {
      return left.displayFilename.localeCompare(right.displayFilename);
    }

    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
  });
}

function matchesSharedFilters(file: LinkedFile, filters: Partial<SharedFileFilters>): boolean {
  const sharedLink = file.links.find(
    (link): link is SharedFileLink => link.linkType === 'shared_file',
  );
  if (!sharedLink) return false;

  const query = filters.query?.trim().toLowerCase();
  if (query) {
    const queryFields = [
      file.displayFilename,
      file.description,
      file.ownerName,
      sharedLink.courseCode ?? '',
      sharedLink.campusOrFaculty ?? '',
      sharedLink.tags.join(' '),
    ].map((value) => value.toLowerCase());

    if (!queryFields.some((value) => value.includes(query))) {
      return false;
    }
  }

  if (filters.courseCode && sharedLink.courseCode !== filters.courseCode) {
    return false;
  }

  if (
    filters.campusOrFaculty &&
    sharedLink.campusOrFaculty !== filters.campusOrFaculty
  ) {
    return false;
  }

  if (filters.tag && !sharedLink.tags.includes(filters.tag)) {
    return false;
  }

  if (
    filters.fileKind &&
    filters.fileKind !== 'all' &&
    classifyFileType(file.displayFilename, file.mimeType) !== filters.fileKind
  ) {
    return false;
  }

  return true;
}

function updateFile(fileId: string, update: (file: InUniFile) => InUniFile): InUniFile {
  const files = getFiles();
  let updatedFile: InUniFile | null = null;

  const nextFiles = files.map((file) => {
    if (file.id !== fileId) return file;
    updatedFile = update(file);
    return updatedFile;
  });

  if (!updatedFile) {
    throw new Error('File not found.');
  }

  writeList(filesKey, nextFiles);
  return updatedFile;
}

export function createDemoUserForFiles(email: string): ForumUser {
  const username = email.split('@')[0] || 'student';
  const profileId = `demo-${email}`;

  return {
    id: profileId,
    email,
    emailConfirmed: true,
    profile: {
      id: profileId,
      username,
      displayName: getDisplayName(email),
      role: 'student',
      isBanned: false,
      banReason: null,
      createdAt: '2026-06-16T00:00:00.000Z',
    },
  };
}

export const mockFileStore = {
  async uploadLinkedFiles({
    context,
    drafts,
    user,
  }: UploadLinkedFilesInput): Promise<LinkedFile[]> {
    const files = getFiles();
    const links = getLinks();
    validateDrafts(context, drafts, files, links, user);

    const uploadedFiles: InUniFile[] = [];
    const newLinks: FileLink[] = [];

    for (const draft of drafts) {
      const now = new Date().toISOString();
      const fileId = createId('file');
      const displayFilename = draft.file.name.trim() || 'untitled';
      const storagePath = `${user.id}/${fileId}/${normalizeFilePart(displayFilename)}`;
      const file: InUniFile = {
        id: fileId,
        ownerId: user.id,
        ownerName: getOwnerName(user),
        storageProvider: 'mock',
        storageBucket: mockStorageBucket,
        storagePath,
        originalFilename: draft.file.name,
        displayFilename,
        mimeType: draft.file.type || 'application/octet-stream',
        extension: getExtension(displayFilename),
        sizeBytes: draft.file.size,
        description: draft.description.trim(),
        status: 'available',
        scanStatus: 'not_scanned',
        downloadCount: 0,
        reportCount: 0,
        createdAt: now,
        updatedAt: now,
      };

      uploadedFiles.push(file);
      newLinks.push(createContextLink(context, fileId, now));

      if (draft.submitToSharedFiles) {
        newLinks.push(createSharedLink(draft, fileId, now));
      }
    }

    writeList(filesKey, [...uploadedFiles, ...files]);
    writeList(linksKey, [...newLinks, ...links]);

    return linkFiles(uploadedFiles, newLinks);
  },

  async getFilesForPost(postId: string): Promise<LinkedFile[]> {
    const links = getLinks().filter(
      (link) => link.linkType === 'post' && link.postId === postId,
    );
    const fileIds = new Set(links.map((link) => link.fileId));
    const files = getFiles().filter(
      (file) => file.status !== 'hidden_by_reports' && fileIds.has(file.id),
    );

    return linkFiles(files, links);
  },

  async getFilesForComment(commentId: string): Promise<LinkedFile[]> {
    const links = getLinks().filter(
      (link) => link.linkType === 'comment' && link.commentId === commentId,
    );
    const fileIds = new Set(links.map((link) => link.fileId));
    const files = getFiles().filter(
      (file) => file.status !== 'hidden_by_reports' && fileIds.has(file.id),
    );

    return linkFiles(files, links);
  },

  async getSharedFiles(filters: Partial<SharedFileFilters>): Promise<LinkedFile[]> {
    const approvedSharedLinks = getLinks().filter(
      (link): link is SharedFileLink =>
        link.linkType === 'shared_file' && link.sharedStatus === 'approved',
    );
    const fileIds = new Set(approvedSharedLinks.map((link) => link.fileId));
    const sharedFiles = linkFiles(
      getFiles().filter(
        (file) => file.status === 'available' && fileIds.has(file.id),
      ),
      approvedSharedLinks,
    ).filter((file) => matchesSharedFilters(file, filters));

    return sortLinkedFiles(sharedFiles, filters.sort ?? 'newest');
  },

  async getUserFiles(userId: string): Promise<LinkedFile[]> {
    const links = getLinks();
    const files = getFiles()
      .filter((file) => file.ownerId === userId)
      .sort(
        (left, right) =>
          new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
      );

    return linkFiles(files, links);
  },

  async approveSharedFile(fileId: string): Promise<void> {
    const links = getLinks();
    const nextLinks = links.map((link) =>
      link.linkType === 'shared_file' && link.fileId === fileId
        ? { ...link, sharedStatus: 'approved' as const }
        : link,
    );

    writeList(linksKey, nextLinks);
    updateFile(fileId, (file) => ({
      ...file,
      updatedAt: new Date().toISOString(),
    }));
  },

  async reportFile({ input, user }: ReportFileInput): Promise<void> {
    const reports = getReports();
    const duplicate = reports.some(
      (report) => report.fileId === input.fileId && report.reporterId === user.id,
    );

    if (duplicate) {
      throw new Error('You have already reported this file.');
    }

    const report: StoredFileReport = {
      id: createId('file-report'),
      fileId: input.fileId,
      reporterId: user.id,
      reportType: input.reportType,
      note: input.note.trim(),
      createdAt: new Date().toISOString(),
    };
    const nextReports = [...reports, report];
    const uniqueReportCount = new Set(
      nextReports
        .filter((item) => item.fileId === input.fileId)
        .map((item) => item.reporterId),
    ).size;

    updateFile(input.fileId, (file) => ({
      ...file,
      reportCount: uniqueReportCount,
      status: shouldAutoHideFile(uniqueReportCount)
        ? 'hidden_by_reports'
        : file.status,
      updatedAt: new Date().toISOString(),
    }));
    writeList(reportsKey, nextReports);
  },

  async getHiddenFiles(): Promise<LinkedFile[]> {
    const links = getLinks();
    const files = getFiles()
      .filter((file) => file.status === 'hidden_by_reports')
      .sort(
        (left, right) =>
          new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
      );

    return linkFiles(files, links);
  },

  async createSignedDownloadUrl(fileId: string): Promise<SignedFileUrl> {
    updateFile(fileId, (file) => ({
      ...file,
      downloadCount: file.downloadCount + 1,
      updatedAt: new Date().toISOString(),
    }));

    return {
      url: `mock://download/${fileId}`,
      expiresAt: new Date(
        Date.now() + SIGNED_FILE_URL_TTL_SECONDS * 1000,
      ).toISOString(),
    };
  },
};
