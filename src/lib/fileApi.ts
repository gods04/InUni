import type {
  FileKind,
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
import {
  classifyFileType,
  getUploadErrorMessage,
  validateAttachmentCount,
  validateFileDescription,
  validateFileSize,
  validateUploadFileType,
} from './fileValidation';
import { mockFileStore } from './mockFileStore';
import { canParticipate } from './permissions';
import { isSupabaseConfigured, supabase } from './supabase';
import { isMissingAvatarPathError } from './supabaseCompat';
import { supabaseStorageProvider } from './supabaseStorageProvider';

export type FileContext =
  | { type: 'post'; postId: string }
  | { type: 'comment'; commentId: string };

interface FileRow {
  id: string;
  owner_id: string;
  storage_provider: 'supabase' | 'mock';
  storage_bucket: string;
  storage_path: string;
  original_filename: string;
  display_filename: string;
  mime_type: string;
  extension: string;
  size_bytes: number;
  description: string;
  status: InUniFile['status'];
  scan_status: InUniFile['scanStatus'];
  download_count: number;
  report_count: number;
  created_at: string;
  updated_at: string;
}

interface FileLinkRow {
  id: string;
  file_id: string;
  link_type: FileLink['linkType'];
  post_id: string | null;
  comment_id: string | null;
  shared_status: SharedFileLink['sharedStatus'] | null;
  course_code: string | null;
  campus_or_faculty: string | null;
  tags: string[] | null;
  created_at: string;
}

interface InsertFileLinkRow {
  file_id: string;
  link_type: FileLink['linkType'];
  post_id: string | null;
  comment_id: string | null;
  shared_status: SharedFileLink['sharedStatus'] | null;
  course_code: string | null;
  campus_or_faculty: string | null;
  tags: string[];
}

interface PublicProfileRow {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_path: string | null;
}

interface OwnerProfile {
  name: string;
  avatarUrl: string | null;
}

const fileSelect =
  'id, owner_id, storage_provider, storage_bucket, storage_path, original_filename, display_filename, mime_type, extension, size_bytes, description, status, scan_status, download_count, report_count, created_at, updated_at';

const fileLinkSelect =
  'id, file_id, link_type, post_id, comment_id, shared_status, course_code, campus_or_faculty, tags, created_at';
const ownerProfileSelectWithAvatar = 'id, username, display_name, avatar_path';
const ownerProfileSelectWithoutAvatar = 'id, username, display_name';

function requireSupabase() {
  if (!supabase) throw new Error('Supabase is not configured.');
  return supabase;
}

function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getExtension(filename: string): string {
  const parts = filename.toLowerCase().split('.');
  return parts.length > 1 ? parts.at(-1) ?? '' : '';
}

function getOwnerName(user: ForumUser): string {
  return user.profile.displayName || user.profile.username || user.email;
}

function getOwnerAvatarUrl(user: ForumUser): string | null {
  return user.profile.avatarUrl ?? null;
}

function getAvatarUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('data:') || path.startsWith('http')) return path;
  const client = requireSupabase();
  return client.storage.from('inuni-avatars').getPublicUrl(path).data.publicUrl;
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

function normalizeOptionalText(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
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

function validateDrafts(drafts: FileUploadDraft[]) {
  const countError = validateAttachmentCount(drafts.length);
  if (countError) throw new Error(countError);

  for (const draft of drafts) {
    const sizeError = validateFileSize(draft.file.size);
    if (sizeError) throw new Error(sizeError);

    const typeError = validateUploadFileType(draft.file.name, draft.file.type);
    if (typeError) throw new Error(typeError);

    const descriptionError = validateFileDescription(draft.description);
    if (descriptionError) throw new Error(descriptionError);
  }
}

function assertCanCreateSignedDownloadUrl(
  user: ForumUser | null | undefined,
): asserts user is ForumUser {
  if (!user) {
    throw new Error('Log in to download files.');
  }

  if (!canParticipate(user.profile)) {
    throw new Error('Your restricted account cannot download files.');
  }
}

function mapFileLinkRow(row: FileLinkRow): FileLink {
  const base = {
    id: row.id,
    fileId: row.file_id,
    createdAt: row.created_at,
  };

  if (row.link_type === 'post') {
    return {
      ...base,
      linkType: 'post',
      postId: row.post_id as string,
      commentId: null,
      sharedStatus: null,
      courseCode: null,
      campusOrFaculty: null,
      tags: row.tags ?? [],
    };
  }

  if (row.link_type === 'comment') {
    return {
      ...base,
      linkType: 'comment',
      postId: null,
      commentId: row.comment_id as string,
      sharedStatus: null,
      courseCode: null,
      campusOrFaculty: null,
      tags: row.tags ?? [],
    };
  }

  return {
    ...base,
    linkType: 'shared_file',
    postId: null,
    commentId: null,
    sharedStatus: row.shared_status ?? 'pending',
    courseCode: row.course_code,
    campusOrFaculty: row.campus_or_faculty,
    tags: row.tags ?? [],
  };
}

function mapFileRow(
  row: FileRow,
  links: FileLink[],
  ownerName = 'Student',
  ownerAvatarUrl: string | null = null,
): LinkedFile {
  return {
    id: row.id,
    ownerId: row.owner_id,
    ownerName,
    ownerAvatarUrl,
    storageProvider: row.storage_provider,
    storageBucket: row.storage_bucket,
    storagePath: row.storage_path,
    originalFilename: row.original_filename,
    displayFilename: row.display_filename,
    mimeType: row.mime_type,
    extension: row.extension,
    sizeBytes: row.size_bytes,
    description: row.description,
    status: row.status,
    scanStatus: row.scan_status,
    downloadCount: row.download_count,
    reportCount: row.report_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    links,
  };
}

function createContextLinkRow(
  context: FileContext,
  fileId: string,
): InsertFileLinkRow {
  if (context.type === 'post') {
    return {
      file_id: fileId,
      link_type: 'post',
      post_id: context.postId,
      comment_id: null,
      shared_status: null,
      course_code: null,
      campus_or_faculty: null,
      tags: [],
    };
  }

  return {
    file_id: fileId,
    link_type: 'comment',
    post_id: null,
    comment_id: context.commentId,
    shared_status: null,
    course_code: null,
    campus_or_faculty: null,
    tags: [],
  };
}

function createSharedLinkRow(
  draft: FileUploadDraft,
  fileId: string,
): InsertFileLinkRow {
  return {
    file_id: fileId,
    link_type: 'shared_file',
    post_id: null,
    comment_id: null,
    shared_status: 'pending',
    course_code: normalizeOptionalText(draft.courseCode),
    campus_or_faculty: normalizeOptionalText(draft.campusOrFaculty),
    tags: parseTags(draft.tags),
  };
}

async function getOwnerProfiles(
  ownerIds: string[],
): Promise<Map<string, OwnerProfile>> {
  const client = requireSupabase();
  const uniqueOwnerIds = Array.from(new Set(ownerIds.filter(Boolean)));
  if (uniqueOwnerIds.length === 0) return new Map();

  const { data, error } = await client
    .from('public_profiles')
    .select(ownerProfileSelectWithAvatar)
    .in('id', uniqueOwnerIds);

  let profiles = (data ?? []) as PublicProfileRow[];

  if (error) {
    if (!isMissingAvatarPathError(error)) {
      throw new Error('Could not load files.');
    }

    const fallback = await client
      .from('public_profiles')
      .select(ownerProfileSelectWithoutAvatar)
      .in('id', uniqueOwnerIds);

    if (fallback.error) throw new Error('Could not load files.');

    profiles = ((fallback.data ?? []) as Omit<
      PublicProfileRow,
      'avatar_path'
    >[]).map((profile) => ({
      ...profile,
      avatar_path: null,
    }));
  }

  return new Map(
    profiles.map((profile) => [
      profile.id,
      {
        name: profile.display_name || profile.username || 'Student',
        avatarUrl: getAvatarUrl(profile.avatar_path),
      },
    ]),
  );
}

async function getFileRows(fileIds: string[], includeHidden = false) {
  const client = requireSupabase();
  const uniqueFileIds = Array.from(new Set(fileIds));
  if (uniqueFileIds.length === 0) return [];

  let request = client.from('files').select(fileSelect).in('id', uniqueFileIds);
  if (!includeHidden) {
    request = request.eq('status', 'available');
  }

  const { data, error } = await request.order('created_at', { ascending: false });
  if (error) throw new Error('Could not load files.');
  return (data ?? []) as FileRow[];
}

async function getLinkRowsForFileIds(fileIds: string[]) {
  const client = requireSupabase();
  const uniqueFileIds = Array.from(new Set(fileIds));
  if (uniqueFileIds.length === 0) return [];

  const { data, error } = await client
    .from('file_links')
    .select(fileLinkSelect)
    .in('file_id', uniqueFileIds);

  if (error) throw new Error('Could not load files.');
  return (data ?? []) as FileLinkRow[];
}

async function hydrateFiles(
  rows: FileRow[],
  linkRows: FileLinkRow[],
): Promise<LinkedFile[]> {
  const ownerProfiles = await getOwnerProfiles(rows.map((row) => row.owner_id));
  const links = linkRows.map(mapFileLinkRow);

  return rows.map((row) =>
    mapFileRow(
      row,
      links.filter((link) => link.fileId === row.id),
      ownerProfiles.get(row.owner_id)?.name,
      ownerProfiles.get(row.owner_id)?.avatarUrl,
    ),
  );
}

function matchesSharedFilters(
  file: LinkedFile,
  filters: Partial<SharedFileFilters>,
): boolean {
  const sharedLink = file.links.find(
    (link): link is SharedFileLink => link.linkType === 'shared_file',
  );
  if (!sharedLink) return false;

  const query = filters.query?.trim().toLowerCase();
  if (query) {
    const fields = [
      file.displayFilename,
      file.description,
      file.ownerName,
      sharedLink.courseCode ?? '',
      sharedLink.campusOrFaculty ?? '',
      sharedLink.tags.join(' '),
    ].map((value) => value.toLowerCase());

    if (!fields.some((field) => field.includes(query))) return false;
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

  if (filters.tag && !sharedLink.tags.includes(filters.tag)) return false;

  if (
    filters.fileKind &&
    filters.fileKind !== 'all' &&
    classifyFileType(file.displayFilename, file.mimeType) !==
      (filters.fileKind as FileKind)
  ) {
    return false;
  }

  return true;
}

function sortLinkedFiles(files: LinkedFile[], sort: SharedFileFilters['sort']) {
  return [...files].sort((left, right) => {
    if (sort === 'downloads') return right.downloadCount - left.downloadCount;
    if (sort === 'reports') return right.reportCount - left.reportCount;
    if (sort === 'name') {
      return left.displayFilename.localeCompare(right.displayFilename);
    }
    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
  });
}

export async function uploadLinkedFiles(
  context: FileContext,
  drafts: FileUploadDraft[],
  user: ForumUser,
): Promise<LinkedFile[]> {
  if (!isSupabaseConfigured) {
    return mockFileStore.uploadLinkedFiles({ context, drafts, user });
  }

  validateDrafts(drafts);
  const client = requireSupabase();
  const uploadedFiles: LinkedFile[] = [];

  for (const draft of drafts) {
    const fileId = createId();
    const displayFilename = draft.file.name.trim() || 'untitled';
    const storagePath = `${user.id}/${fileId}/${normalizeFilePart(displayFilename)}`;

    const { data: insertedFile, error: insertError } = await client
      .from('files')
      .insert({
        id: fileId,
        owner_id: user.id,
        storage_provider: 'supabase',
        storage_bucket: 'inuni-files',
        storage_path: storagePath,
        original_filename: draft.file.name,
        display_filename: displayFilename,
        mime_type: draft.file.type || 'application/octet-stream',
        extension: getExtension(displayFilename),
        size_bytes: draft.file.size,
        description: draft.description.trim(),
        status: 'uploading',
        scan_status: 'not_scanned',
      })
      .select(fileSelect)
      .single();

    if (insertError || !insertedFile) {
      throw new Error('Could not create file metadata.');
    }

    try {
      await supabaseStorageProvider.uploadFile(draft.file, storagePath);
    } catch (uploadError) {
      await client.from('files').delete().eq('id', fileId);
      throw new Error(getUploadErrorMessage(uploadError));
    }

    const { data: availableFile, error: updateError } = await client
      .from('files')
      .update({ status: 'available' })
      .eq('id', fileId)
      .select(fileSelect)
      .single();

    if (updateError || !availableFile) {
      throw new Error('Could not upload file.');
    }

    const linkRows: InsertFileLinkRow[] = [
      createContextLinkRow(context, fileId),
    ];
    if (draft.submitToSharedFiles) {
      linkRows.push(createSharedLinkRow(draft, fileId));
    }

    const { data: insertedLinks, error: linkError } = await client
      .from('file_links')
      .insert(linkRows)
      .select(fileLinkSelect);

    if (linkError) throw new Error('Could not link file.');

    uploadedFiles.push(
      mapFileRow(
        availableFile as FileRow,
        ((insertedLinks ?? []) as FileLinkRow[]).map(mapFileLinkRow),
        getOwnerName(user),
        getOwnerAvatarUrl(user),
      ),
    );
  }

  return uploadedFiles;
}

export async function getFilesForPost(postId: string): Promise<LinkedFile[]> {
  if (!isSupabaseConfigured) return mockFileStore.getFilesForPost(postId);

  const client = requireSupabase();
  const { data, error } = await client
    .from('file_links')
    .select(fileLinkSelect)
    .eq('link_type', 'post')
    .eq('post_id', postId);

  if (error) throw new Error('Could not load files.');
  const linkRows = (data ?? []) as FileLinkRow[];
  const rows = await getFileRows(linkRows.map((link) => link.file_id));
  return hydrateFiles(rows, linkRows);
}

export async function getFilesForComment(commentId: string): Promise<LinkedFile[]> {
  if (!isSupabaseConfigured) return mockFileStore.getFilesForComment(commentId);

  const client = requireSupabase();
  const { data, error } = await client
    .from('file_links')
    .select(fileLinkSelect)
    .eq('link_type', 'comment')
    .eq('comment_id', commentId);

  if (error) throw new Error('Could not load files.');
  const linkRows = (data ?? []) as FileLinkRow[];
  const rows = await getFileRows(linkRows.map((link) => link.file_id));
  return hydrateFiles(rows, linkRows);
}

export async function getSharedFiles(
  filters: Partial<SharedFileFilters>,
): Promise<LinkedFile[]> {
  if (!isSupabaseConfigured) return mockFileStore.getSharedFiles(filters);

  const client = requireSupabase();
  const { data, error } = await client
    .from('file_links')
    .select(fileLinkSelect)
    .eq('link_type', 'shared_file')
    .eq('shared_status', 'approved');

  if (error) throw new Error('Could not load files.');
  const linkRows = (data ?? []) as FileLinkRow[];
  const rows = await getFileRows(linkRows.map((link) => link.file_id));
  const linkedFiles = await hydrateFiles(rows, linkRows);

  return sortLinkedFiles(
    linkedFiles.filter((file) => matchesSharedFilters(file, filters)),
    filters.sort ?? 'newest',
  );
}

export async function getUserFiles(userId: string): Promise<LinkedFile[]> {
  if (!isSupabaseConfigured) return mockFileStore.getUserFiles(userId);

  const client = requireSupabase();
  const { data, error } = await client
    .from('files')
    .select(fileSelect)
    .eq('owner_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error('Could not load files.');
  const rows = (data ?? []) as FileRow[];
  const linkRows = await getLinkRowsForFileIds(rows.map((row) => row.id));
  return hydrateFiles(rows, linkRows);
}

export async function reportFile(
  input: FileReportInput,
  user: ForumUser,
): Promise<void> {
  if (!isSupabaseConfigured) return mockFileStore.reportFile({ input, user });

  const client = requireSupabase();
  const { error } = await client.from('file_reports').insert({
    file_id: input.fileId,
    reporter_id: user.id,
    report_type: input.reportType,
    note: input.note.trim(),
  });

  if (error) {
    if (error.code === '23505') {
      throw new Error('You have already reported this file.');
    }
    throw new Error('Could not submit this report.');
  }
}

export async function createSignedDownloadUrl(
  fileId: string,
  user: ForumUser | null | undefined,
): Promise<SignedFileUrl> {
  assertCanCreateSignedDownloadUrl(user);

  if (!isSupabaseConfigured) {
    return mockFileStore.createSignedDownloadUrl(fileId, user);
  }

  const client = requireSupabase();
  const { data, error } = await client
    .from('files')
    .select('id, storage_path, download_count')
    .eq('id', fileId)
    .single();

  if (error || !data) throw new Error('Could not create download link.');

  try {
    const signedUrl = await supabaseStorageProvider.createSignedDownloadUrl(
      (data as { storage_path: string }).storage_path,
    );
    const downloadCount = (data as { download_count: number }).download_count;
    await client
      .from('files')
      .update({ download_count: downloadCount + 1 })
      .eq('id', fileId);
    return signedUrl;
  } catch {
    throw new Error('Could not create download link.');
  }
}
