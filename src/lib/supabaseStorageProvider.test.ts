import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SIGNED_FILE_URL_TTL_SECONDS } from './fileValidation';
import { supabaseStorageProvider } from './supabaseStorageProvider';

const mocks = vi.hoisted(() => ({
  createSignedUrl: vi.fn(),
  from: vi.fn(),
  remove: vi.fn(),
  upload: vi.fn(),
}));

vi.mock('./supabase', () => ({
  isSupabaseConfigured: true,
  supabase: {
    storage: {
      from: (...args: unknown[]) => mocks.from(...args),
    },
  },
}));

describe('supabaseStorageProvider', () => {
  beforeEach(() => {
    mocks.createSignedUrl.mockReset();
    mocks.from.mockReset();
    mocks.remove.mockReset();
    mocks.upload.mockReset();
    mocks.from.mockReturnValue({
      createSignedUrl: mocks.createSignedUrl,
      remove: mocks.remove,
      upload: mocks.upload,
    });
    mocks.createSignedUrl.mockResolvedValue({
      data: { signedUrl: 'https://signed.example/file' },
      error: null,
    });
    mocks.remove.mockResolvedValue({ error: null });
    mocks.upload.mockResolvedValue({ error: null });
  });

  it('uploads files into the private InUni bucket', async () => {
    const file = new File(['notes'], 'notes.pdf', { type: 'application/pdf' });

    await expect(
      supabaseStorageProvider.uploadFile(file, 'user-1/file-1/notes.pdf'),
    ).resolves.toEqual({
      bucket: 'inuni-files',
      path: 'user-1/file-1/notes.pdf',
      provider: 'supabase',
    });

    expect(mocks.from).toHaveBeenCalledWith('inuni-files');
    expect(mocks.upload).toHaveBeenCalledWith(
      'user-1/file-1/notes.pdf',
      file,
      expect.objectContaining({ contentType: 'application/pdf', upsert: false }),
    );
  });

  it('creates five-minute signed download URLs', async () => {
    await supabaseStorageProvider.createSignedDownloadUrl(
      'user-1/file-1/notes.pdf',
    );

    expect(mocks.createSignedUrl).toHaveBeenCalledWith(
      'user-1/file-1/notes.pdf',
      SIGNED_FILE_URL_TTL_SECONDS,
    );
  });

  it('deletes files from the private bucket', async () => {
    await supabaseStorageProvider.deleteFile('user-1/file-1/notes.pdf');

    expect(mocks.remove).toHaveBeenCalledWith(['user-1/file-1/notes.pdf']);
  });
});
