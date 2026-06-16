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
