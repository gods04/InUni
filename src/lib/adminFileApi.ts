import type {
  FileLink,
  InUniFile,
  LinkedFile,
  SharedFileLink,
} from '../types/files';
import { mockFileStore } from './mockFileStore';
import { isSupabaseConfigured, supabase } from './supabase';
import { isMissingAvatarPathError } from './supabaseCompat';
import { supabaseStorageProvider } from './supabaseStorageProvider';

interface FileRow {
  id: string;
  owner_id: string;
  storage_provider: InUniFile['storageProvider'];
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

function getAvatarUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('data:') || path.startsWith('http')) return path;
  const client = requireSupabase();
  return client.storage.from('inuni-avatars').getPublicUrl(path).data.publicUrl;
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
      throw new Error('Could not load file queues.');
    }

    const fallback = await client
      .from('public_profiles')
      .select(ownerProfileSelectWithoutAvatar)
      .in('id', uniqueOwnerIds);

    if (fallback.error) throw new Error('Could not load file queues.');

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

async function getFileRows(fileIds: string[]): Promise<FileRow[]> {
  const client = requireSupabase();
  const uniqueFileIds = Array.from(new Set(fileIds));
  if (uniqueFileIds.length === 0) return [];

  const { data, error } = await client
    .from('files')
    .select(fileSelect)
    .in('id', uniqueFileIds)
    .order('created_at', { ascending: false });

  if (error) throw new Error('Could not load file queues.');
  return (data ?? []) as FileRow[];
}

async function getLinkRowsForFileIds(fileIds: string[]): Promise<FileLinkRow[]> {
  const client = requireSupabase();
  const uniqueFileIds = Array.from(new Set(fileIds));
  if (uniqueFileIds.length === 0) return [];

  const { data, error } = await client
    .from('file_links')
    .select(fileLinkSelect)
    .in('file_id', uniqueFileIds);

  if (error) throw new Error('Could not load file queues.');
  return (data ?? []) as FileLinkRow[];
}

async function getStoragePath(fileId: string): Promise<string> {
  const client = requireSupabase();
  const { data, error } = await client
    .from('files')
    .select('storage_path')
    .eq('id', fileId)
    .single();

  if (error || !data) throw new Error('Could not delete this file.');
  return (data as { storage_path: string }).storage_path;
}

async function deleteFileRecord(fileId: string): Promise<void> {
  const client = requireSupabase();
  const storagePath = await getStoragePath(fileId);
  await supabaseStorageProvider.deleteFile(storagePath);

  const { error } = await client.from('files').delete().eq('id', fileId);
  if (error) throw new Error('Could not delete this file.');
}

export async function getPendingSharedFiles(): Promise<LinkedFile[]> {
  if (!isSupabaseConfigured) {
    return mockFileStore.getPendingSharedFiles();
  }

  const client = requireSupabase();
  const { data, error } = await client
    .from('file_links')
    .select(fileLinkSelect)
    .eq('link_type', 'shared_file')
    .eq('shared_status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw new Error('Could not load file queues.');
  const linkRows = (data ?? []) as FileLinkRow[];
  const rows = await getFileRows(linkRows.map((link) => link.file_id));
  return hydrateFiles(rows, linkRows);
}

export async function getFileReviewCount(): Promise<number> {
  if (!isSupabaseConfigured) {
    const [pendingFiles, hiddenFiles] = await Promise.all([
      mockFileStore.getPendingSharedFiles(),
      mockFileStore.getHiddenFiles(),
    ]);
    return pendingFiles.length + hiddenFiles.length;
  }

  const client = requireSupabase();
  const [pendingResult, hiddenResult] = await Promise.all([
    client
      .from('file_links')
      .select('id', { count: 'exact', head: true })
      .eq('link_type', 'shared_file')
      .eq('shared_status', 'pending'),
    client
      .from('files')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'hidden_by_reports'),
  ]);

  if (pendingResult.error || hiddenResult.error) {
    throw new Error('Could not load file review count.');
  }

  return (pendingResult.count ?? 0) + (hiddenResult.count ?? 0);
}

export async function getAutoHiddenFiles(): Promise<LinkedFile[]> {
  if (!isSupabaseConfigured) {
    return mockFileStore.getHiddenFiles();
  }

  const client = requireSupabase();
  const { data, error } = await client
    .from('files')
    .select(fileSelect)
    .eq('status', 'hidden_by_reports')
    .order('updated_at', { ascending: false });

  if (error) throw new Error('Could not load file queues.');
  const rows = (data ?? []) as FileRow[];
  const linkRows = await getLinkRowsForFileIds(rows.map((row) => row.id));
  return hydrateFiles(rows, linkRows);
}

export async function approveSharedFile(fileId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    return mockFileStore.approveSharedFile(fileId);
  }

  const client = requireSupabase();
  const { error } = await client
    .from('file_links')
    .update({ shared_status: 'approved' })
    .eq('file_id', fileId)
    .eq('link_type', 'shared_file');

  if (error) throw new Error('Could not approve this file.');
}

export async function rejectSharedFile(fileId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    return mockFileStore.deleteFile(fileId);
  }

  await deleteFileRecord(fileId);
}

export async function restoreHiddenFile(fileId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    return mockFileStore.restoreHiddenFile(fileId);
  }

  const client = requireSupabase();
  const { error: updateError } = await client
    .from('files')
    .update({ report_count: 0, status: 'available' })
    .eq('id', fileId);

  if (updateError) throw new Error('Could not restore this file.');

  const { error: reportsError } = await client
    .from('file_reports')
    .delete()
    .eq('file_id', fileId);

  if (reportsError) throw new Error('Could not restore this file.');
}

export async function deleteHiddenFile(fileId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    return mockFileStore.deleteFile(fileId);
  }

  await deleteFileRecord(fileId);
}
