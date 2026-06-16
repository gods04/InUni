import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  approveSharedFile,
  deleteHiddenFile,
  getAutoHiddenFiles,
  getPendingSharedFiles,
  rejectSharedFile,
  restoreHiddenFile,
} from './adminFileApi';

const mocks = vi.hoisted(() => ({
  deleteFile: vi.fn(),
  from: vi.fn(),
}));

vi.mock('./supabase', () => ({
  isSupabaseConfigured: true,
  supabase: {
    from: (...args: unknown[]) => mocks.from(...args),
  },
}));

vi.mock('./supabaseStorageProvider', () => ({
  supabaseStorageProvider: {
    deleteFile: (...args: unknown[]) => mocks.deleteFile(...args),
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
    order: vi.fn(() => query),
    select: vi.fn(() => query),
    single: vi.fn(() => Promise.resolve(result)),
    then: (
      resolve: (value: QueryResult) => unknown,
      reject: (reason: unknown) => unknown,
    ) => Promise.resolve(result).then(resolve, reject),
    update: vi.fn(() => query),
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
  shared_status: 'pending',
  course_code: 'CSC1010H',
  campus_or_faculty: 'Science',
  tags: ['study'],
  created_at: '2026-06-16T10:00:00.000Z',
};

const postLinkRow = {
  id: 'link-2',
  file_id: 'file-1',
  link_type: 'post',
  post_id: 'post-1',
  comment_id: null,
  shared_status: null,
  course_code: null,
  campus_or_faculty: null,
  tags: [],
  created_at: '2026-06-16T09:00:00.000Z',
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

const hiddenFileRow = {
  ...fileRow,
  display_filename: 'unsafe.zip',
  extension: 'zip',
  id: 'file-hidden',
  mime_type: 'application/zip',
  report_count: 3,
  status: 'hidden_by_reports',
  storage_path: 'owner-1/file-hidden/unsafe.zip',
};

const profileRow = {
  id: 'owner-1',
  username: 'student',
  display_name: 'Student One',
};

describe('adminFileApi Supabase boundary', () => {
  beforeEach(() => {
    mocks.deleteFile.mockReset();
    mocks.from.mockReset();
    mocks.deleteFile.mockResolvedValue(undefined);
  });

  it('loads pending Shared Files submissions from Supabase', async () => {
    const linkQuery = createQuery({ data: [sharedLinkRow], error: null });
    const fileQuery = createQuery({ data: [fileRow], error: null });
    const profileQuery = createQuery({ data: [profileRow], error: null });
    queueQueries(linkQuery, fileQuery, profileQuery);

    const files = await getPendingSharedFiles();

    expect(files).toHaveLength(1);
    expect(files[0]).toMatchObject({
      displayFilename: 'guide.pdf',
      ownerName: 'Student One',
    });
    expect(files[0].links[0]).toMatchObject({
      courseCode: 'CSC1010H',
      sharedStatus: 'pending',
    });
    expect(linkQuery.eq).toHaveBeenCalledWith('shared_status', 'pending');
    expect(fileQuery.in).toHaveBeenCalledWith('id', ['file-1']);
  });

  it('loads auto-hidden files with their links', async () => {
    const fileQuery = createQuery({ data: [hiddenFileRow], error: null });
    const linkQuery = createQuery({
      data: [{ ...postLinkRow, file_id: 'file-hidden' }],
      error: null,
    });
    const profileQuery = createQuery({ data: [profileRow], error: null });
    queueQueries(fileQuery, linkQuery, profileQuery);

    const files = await getAutoHiddenFiles();

    expect(files).toHaveLength(1);
    expect(files[0]).toMatchObject({
      displayFilename: 'unsafe.zip',
      reportCount: 3,
      status: 'hidden_by_reports',
    });
    expect(fileQuery.eq).toHaveBeenCalledWith('status', 'hidden_by_reports');
  });

  it('approves pending Shared Files links', async () => {
    const updateQuery = createQuery();
    queueQueries(updateQuery);

    await approveSharedFile('file-1');

    expect(mocks.from).toHaveBeenCalledWith('file_links');
    expect(updateQuery.update).toHaveBeenCalledWith({
      shared_status: 'approved',
    });
    expect(updateQuery.eq).toHaveBeenCalledWith('file_id', 'file-1');
    expect(updateQuery.eq).toHaveBeenCalledWith('link_type', 'shared_file');
  });

  it('rejects or deletes files from storage and metadata', async () => {
    const lookupQuery = createQuery({
      data: { storage_path: 'owner-1/file-1/guide.pdf' },
      error: null,
    });
    const deleteQuery = createQuery();
    queueQueries(lookupQuery, deleteQuery);

    await rejectSharedFile('file-1');

    expect(mocks.deleteFile).toHaveBeenCalledWith('owner-1/file-1/guide.pdf');
    expect(deleteQuery.delete).toHaveBeenCalled();
    expect(deleteQuery.eq).toHaveBeenCalledWith('id', 'file-1');
  });

  it('restores hidden files and clears old reports', async () => {
    const updateQuery = createQuery();
    const reportsDeleteQuery = createQuery();
    queueQueries(updateQuery, reportsDeleteQuery);

    await restoreHiddenFile('file-hidden');

    expect(updateQuery.update).toHaveBeenCalledWith({
      report_count: 0,
      status: 'available',
    });
    expect(updateQuery.eq).toHaveBeenCalledWith('id', 'file-hidden');
    expect(reportsDeleteQuery.delete).toHaveBeenCalled();
    expect(reportsDeleteQuery.eq).toHaveBeenCalledWith(
      'file_id',
      'file-hidden',
    );
  });

  it('deletes hidden files through the same Supabase path', async () => {
    const lookupQuery = createQuery({
      data: { storage_path: 'owner-1/file-hidden/unsafe.zip' },
      error: null,
    });
    const deleteQuery = createQuery();
    queueQueries(lookupQuery, deleteQuery);

    await deleteHiddenFile('file-hidden');

    expect(mocks.deleteFile).toHaveBeenCalledWith(
      'owner-1/file-hidden/unsafe.zip',
    );
    expect(deleteQuery.eq).toHaveBeenCalledWith('id', 'file-hidden');
  });
});
