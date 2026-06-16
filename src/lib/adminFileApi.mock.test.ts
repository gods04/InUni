import { beforeEach, describe, expect, it } from 'vitest';
import {
  approveSharedFile,
  deleteHiddenFile,
  getAutoHiddenFiles,
  getPendingSharedFiles,
  rejectSharedFile,
  restoreHiddenFile,
} from './adminFileApi';
import { createDemoUserForFiles, mockFileStore } from './mockFileStore';

const uploader = createDemoUserForFiles('uploader@uct.ac.za');
const reporterA = createDemoUserForFiles('reporter-a@uct.ac.za');
const reporterB = createDemoUserForFiles('reporter-b@uct.ac.za');
const reporterC = createDemoUserForFiles('reporter-c@uct.ac.za');

function makeFile(name: string, type: string, size = 1024): File {
  return new File(['x'.repeat(size)], name, { type });
}

async function uploadSharedFile() {
  const [file] = await mockFileStore.uploadLinkedFiles({
    context: { type: 'post', postId: 'post-1' },
    drafts: [
      {
        file: makeFile('guide.pdf', 'application/pdf'),
        description: 'Study guide',
        submitToSharedFiles: true,
        courseCode: 'CSC1010H',
        campusOrFaculty: 'Science',
        tags: 'study',
      },
    ],
    user: uploader,
  });

  return file;
}

async function uploadHiddenFile() {
  const [file] = await mockFileStore.uploadLinkedFiles({
    context: { type: 'post', postId: 'post-1' },
    drafts: [
      {
        file: makeFile('unsafe.zip', 'application/zip'),
        description: '',
        submitToSharedFiles: false,
        courseCode: '',
        campusOrFaculty: '',
        tags: '',
      },
    ],
    user: uploader,
  });

  await mockFileStore.reportFile({
    input: { fileId: file.id, reportType: 'malicious_file', note: '' },
    user: reporterA,
  });
  await mockFileStore.reportFile({
    input: { fileId: file.id, reportType: 'privacy', note: '' },
    user: reporterB,
  });
  await mockFileStore.reportFile({
    input: { fileId: file.id, reportType: 'copyright', note: '' },
    user: reporterC,
  });

  return file;
}

describe('adminFileApi mock boundary', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('approves pending Shared Files submissions', async () => {
    const file = await uploadSharedFile();

    expect((await getPendingSharedFiles()).map((item) => item.id)).toEqual([
      file.id,
    ]);

    await approveSharedFile(file.id);

    expect(await getPendingSharedFiles()).toEqual([]);
    expect((await mockFileStore.getSharedFiles({ sort: 'newest' }))).toHaveLength(1);
  });

  it('rejects pending Shared Files by deleting file metadata', async () => {
    const file = await uploadSharedFile();

    await rejectSharedFile(file.id);

    expect(await getPendingSharedFiles()).toEqual([]);
    expect(await mockFileStore.getUserFiles(uploader.id)).toEqual([]);
  });

  it('restores and deletes auto-hidden files', async () => {
    const file = await uploadHiddenFile();

    expect((await getAutoHiddenFiles()).map((item) => item.id)).toEqual([
      file.id,
    ]);

    await restoreHiddenFile(file.id);

    expect(await getAutoHiddenFiles()).toEqual([]);
    expect((await mockFileStore.getFilesForPost('post-1')).map((item) => item.id)).toEqual([
      file.id,
    ]);

    const secondFile = await uploadHiddenFile();
    await deleteHiddenFile(secondFile.id);

    expect((await mockFileStore.getUserFiles(uploader.id)).map((item) => item.id)).not.toContain(
      secondFile.id,
    );
  });
});
