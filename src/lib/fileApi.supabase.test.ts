import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createSignedDownloadUrl,
  createSignedPreviewUrl,
  getSharedFiles,
  uploadLinkedFiles,
} from './fileApi';

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  getPublicUrl: vi.fn((path: string) => ({
    data: { publicUrl: `https://cdn.inuni.test/${path}` },
  })),
  createStorageSignedDownloadUrl: vi.fn(),
  createStoragePreviewUrl: vi.fn(),
  storageFrom: vi.fn(),
  uploadFile: vi.fn(),
}));

vi.mock('./supabase', () => ({
  isSupabaseConfigured: true,
  supabase: {
    from: (...args: unknown[]) => mocks.from(...args),
    storage: {
      from: (...args: unknown[]) => mocks.storageFrom(...args),
    },
  },
}));

vi.mock('./supabaseStorageProvider', () => ({
  supabaseStorageProvider: {
    createSignedDownloadUrl: (...args: unknown[]) =>
      mocks.createStorageSignedDownloadUrl(...args),
    createPreviewUrl: (...args: unknown[]) =>
      mocks.createStoragePreviewUrl(...args),
    uploadFile: (...args: unknown[]) => mocks.uploadFile(...args),
  },
}));

interface QueryResult {
  data: unknown;
  error: { message?: string } | null;
}

function createQuery(result: QueryResult = { data: null, error: null }) {
  const query = {
    delete: vi.fn(() => query),
    eq: vi.fn(() => query),
    in: vi.fn(() => query),
    insert: vi.fn(() => query),
    order: vi.fn(() => query),
    select: vi.fn(() => query),
    single: vi.fn(() => Promise.resolve(result)),
    update: vi.fn(() => query),
    then: (
      resolve: (value: QueryResult) => unknown,
      reject: (reason: unknown) => unknown,
    ) => Promise.resolve(result).then(resolve, reject),
  };

  return query;
}

function queueQueries(...queries: ReturnType<typeof createQuery>[]) {
  mocks.from.mockImplementation(() => {
    const nextQuery = queries.shift();
    if (!nextQuery) throw new Error('Unexpected Supabase query');
    return nextQuery;
  });
}

const sharedLinkRow = {
  id: 'link-1',
  file_id: 'file-1',
  link_type: 'shared_file',
  post_id: null,
  comment_id: null,
  shared_status: 'approved',
  course_code: 'CSC1010H',
  campus_or_faculty: 'Science',
  tags: ['study'],
  created_at: '2026-06-16T10:00:00.000Z',
};

const fileRow = {
  id: 'file-1',
  owner_id: 'owner-1',
  storage_provider: 'supabase',
  storage_bucket: 'inuni-files',
  storage_path: 'owner-1/file-1/guide.pdf',
  original_filename: 'guide.pdf',
  display_filename: 'guide.pdf',
  mime_type: 'application/pdf',
  extension: 'pdf',
  size_bytes: 2048,
  description: 'Study guide',
  status: 'available',
  scan_status: 'not_scanned',
  download_count: 2,
  report_count: 0,
  created_at: '2026-06-16T10:00:00.000Z',
  updated_at: '2026-06-16T10:00:00.000Z',
};

const profileRow = {
  id: 'owner-1',
  username: 'student',
  display_name: 'Student One',
  avatar_path: 'owner-1/avatar.png',
};

const uploader = {
  id: 'owner-1',
  email: 'student@uct.ac.za',
  emailConfirmed: true,
  profile: {
    id: 'owner-1',
    username: 'student',
    displayName: 'Student One',
    role: 'student' as const,
    isBanned: false,
    banReason: null,
    isUctVerified: true,
    createdAt: '2026-06-16T00:00:00.000Z',
  },
};

function makeDraft(file: File) {
  return {
    file,
    description: '',
    submitToSharedFiles: false,
    courseCode: '',
    campusOrFaculty: '',
    tags: '',
  };
}

describe('fileApi Supabase boundary', () => {
  beforeEach(() => {
    mocks.from.mockReset();
    mocks.createStoragePreviewUrl.mockReset();
    mocks.createStorageSignedDownloadUrl.mockReset();
    mocks.getPublicUrl.mockClear();
    mocks.storageFrom.mockReset();
    mocks.uploadFile.mockReset();
    mocks.createStorageSignedDownloadUrl.mockResolvedValue({
      url: 'https://files.inuni.test/signed/guide.pdf',
      expiresAt: '2026-06-16T10:05:00.000Z',
    });
    mocks.createStoragePreviewUrl.mockResolvedValue({
      url: 'https://files.inuni.test/preview/guide.pdf',
      expiresAt: '2026-06-16T10:05:00.000Z',
    });
    mocks.uploadFile.mockResolvedValue({
      bucket: 'inuni-files',
      path: 'owner-1/file-1/guide.pdf',
      provider: 'supabase',
    });
    mocks.storageFrom.mockReturnValue({
      getPublicUrl: mocks.getPublicUrl,
    });
  });

  it('hydrates shared file owner avatars from public profiles', async () => {
    const linkQuery = createQuery({ data: [sharedLinkRow], error: null });
    const fileQuery = createQuery({ data: [fileRow], error: null });
    const profileQuery = createQuery({ data: [profileRow], error: null });
    queueQueries(linkQuery, fileQuery, profileQuery);

    const files = await getSharedFiles({ sort: 'newest' });

    expect(files).toHaveLength(1);
    expect(files[0]).toMatchObject({
      displayFilename: 'guide.pdf',
      ownerName: 'Student One',
      ownerAvatarUrl: 'https://cdn.inuni.test/owner-1/avatar.png',
    });
    expect(profileQuery.select).toHaveBeenCalledWith(
      'id, username, display_name, avatar_path',
    );
    expect(mocks.storageFrom).toHaveBeenCalledWith('inuni-avatars');
    expect(mocks.getPublicUrl).toHaveBeenCalledWith('owner-1/avatar.png');
  });

  it('loads shared files when public profiles do not expose avatar paths yet', async () => {
    const linkQuery = createQuery({ data: [sharedLinkRow], error: null });
    const fileQuery = createQuery({ data: [fileRow], error: null });
    const profileQuery = createQuery({
      data: null,
      error: { message: 'column public_profiles.avatar_path does not exist' },
    });
    const fallbackProfileQuery = createQuery({
      data: [
        {
          id: 'owner-1',
          username: 'student',
          display_name: 'Student One',
        },
      ],
      error: null,
    });
    queueQueries(linkQuery, fileQuery, profileQuery, fallbackProfileQuery);

    const files = await getSharedFiles({ sort: 'newest' });

    expect(files).toHaveLength(1);
    expect(files[0]).toMatchObject({
      displayFilename: 'guide.pdf',
      ownerName: 'Student One',
      ownerAvatarUrl: null,
    });
    expect(profileQuery.select).toHaveBeenCalledWith(
      'id, username, display_name, avatar_path',
    );
    expect(fallbackProfileQuery.select).toHaveBeenCalledWith(
      'id, username, display_name',
    );
    expect(mocks.storageFrom).not.toHaveBeenCalled();
  });

  it('rejects unsupported upload types before creating Supabase metadata', async () => {
    await expect(
      uploadLinkedFiles(
        { type: 'post', postId: 'post-1' },
        [makeDraft(new File(['unsafe'], 'unsafe.exe', { type: 'application/x-msdownload' }))],
        uploader,
      ),
    ).rejects.toThrow(
      'This file type cannot be uploaded yet. Try PDF, images, Office documents, spreadsheets, presentations, text files, or ZIP archives.',
    );

    expect(mocks.from).not.toHaveBeenCalled();
    expect(mocks.uploadFile).not.toHaveBeenCalled();
  });

  it('requires an active user before creating signed Supabase download URLs', async () => {
    await expect(createSignedDownloadUrl('file-1', null)).rejects.toThrow(
      'Log in to download files.',
    );

    expect(mocks.from).not.toHaveBeenCalled();
    expect(mocks.createStorageSignedDownloadUrl).not.toHaveBeenCalled();
  });

  it('blocks restricted users before creating signed Supabase download URLs', async () => {
    const restrictedUser = {
      ...uploader,
      profile: {
        ...uploader.profile,
        isBanned: true,
        banReason: 'Repeated unsafe uploads',
      },
    };

    await expect(
      createSignedDownloadUrl('file-1', restrictedUser),
    ).rejects.toThrow(
      'Your restricted account cannot download files.',
    );

    expect(mocks.from).not.toHaveBeenCalled();
    expect(mocks.createStorageSignedDownloadUrl).not.toHaveBeenCalled();
  });

  it('creates signed Supabase download URLs for active users and increments the count', async () => {
    const fileQuery = createQuery({ data: fileRow, error: null });
    const updateQuery = createQuery();
    queueQueries(fileQuery, updateQuery);

    const signedUrl = await createSignedDownloadUrl('file-1', uploader);

    expect(signedUrl).toMatchObject({
      url: 'https://files.inuni.test/signed/guide.pdf',
    });
    expect(fileQuery.select).toHaveBeenCalledWith(
      'id, storage_path, download_count',
    );
    expect(mocks.createStorageSignedDownloadUrl).toHaveBeenCalledWith(
      'owner-1/file-1/guide.pdf',
    );
    expect(updateQuery.update).toHaveBeenCalledWith({ download_count: 3 });
    expect(updateQuery.eq).toHaveBeenCalledWith('id', 'file-1');
  });

  it('creates signed Supabase preview URLs for active users without incrementing the count', async () => {
    const fileQuery = createQuery({ data: fileRow, error: null });
    queueQueries(fileQuery);

    const signedUrl = await createSignedPreviewUrl('file-1', uploader);

    expect(signedUrl).toMatchObject({
      url: 'https://files.inuni.test/preview/guide.pdf',
    });
    expect(fileQuery.select).toHaveBeenCalledWith('id, storage_path');
    expect(mocks.createStoragePreviewUrl).toHaveBeenCalledWith(
      'owner-1/file-1/guide.pdf',
    );
    expect(mocks.from).toHaveBeenCalledTimes(1);
  });

  it('maps blocked storage uploads to a clear user-facing error and removes metadata', async () => {
    const insertQuery = createQuery({
      data: { ...fileRow, status: 'uploading' },
      error: null,
    });
    const deleteQuery = createQuery();
    queueQueries(insertQuery, deleteQuery);
    mocks.uploadFile.mockRejectedValue(
      new Error('Could not upload file: blocked by security policy'),
    );

    await expect(
      uploadLinkedFiles(
        { type: 'post', postId: 'post-1' },
        [makeDraft(new File(['unsafe'], 'unsafe.zip', { type: 'application/zip' }))],
        uploader,
      ),
    ).rejects.toThrow(
      'This upload was blocked because it may be unsafe. Try another file or ask an admin if this looks wrong.',
    );

    expect(deleteQuery.delete).toHaveBeenCalled();
    expect(deleteQuery.eq).toHaveBeenCalledWith('id', expect.any(String));
  });
});
