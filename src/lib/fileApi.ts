import type {
  FileReportInput,
  FileUploadDraft,
  LinkedFile,
  SharedFileFilters,
  SignedFileUrl,
} from '../types/files';
import type { ForumUser } from '../types/forum';
import { mockFileStore } from './mockFileStore';
import { isSupabaseConfigured } from './supabase';

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

  throw new Error(
    'Supabase file uploads require the Supabase storage implementation task.',
  );
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
  throw new Error(
    'Supabase file reports require the Supabase storage implementation task.',
  );
}

export async function createSignedDownloadUrl(
  fileId: string,
): Promise<SignedFileUrl> {
  if (!isSupabaseConfigured) {
    return mockFileStore.createSignedDownloadUrl(fileId);
  }

  throw new Error(
    'Supabase file downloads require the Supabase storage implementation task.',
  );
}
