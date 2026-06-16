import type { LinkedFile } from '../types/files';
import { mockFileStore } from './mockFileStore';
import { isSupabaseConfigured } from './supabase';

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
  if (!isSupabaseConfigured) {
    return mockFileStore.approveSharedFile(fileId);
  }
}

export async function rejectSharedFile(fileId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    return mockFileStore.deleteFile(fileId);
  }
}

export async function restoreHiddenFile(fileId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    return mockFileStore.restoreHiddenFile(fileId);
  }
}

export async function deleteHiddenFile(fileId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    return mockFileStore.deleteFile(fileId);
  }
}
