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
      expiresAt: new Date(
        Date.now() + SIGNED_FILE_URL_TTL_SECONDS * 1000,
      ).toISOString(),
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
