import { beforeEach, describe, expect, it } from 'vitest';
import { getUserFiles } from './fileApi';
import { createDemoUserForFiles, mockFileStore } from './mockFileStore';

const student = createDemoUserForFiles('student@uct.ac.za');
const otherStudent = createDemoUserForFiles('other-student@uct.ac.za');
const reporterA = createDemoUserForFiles('reporter-a@uct.ac.za');
const reporterB = createDemoUserForFiles('reporter-b@uct.ac.za');
const reporterC = createDemoUserForFiles('reporter-c@uct.ac.za');

function makeFile(name: string, type: string, size = 1024): File {
  return new File(['x'.repeat(size)], name, { type });
}

describe('mockFileStore', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('uploads a post attachment and returns it by post id', async () => {
    const uploaded = await mockFileStore.uploadLinkedFiles({
      context: { type: 'post', postId: 'post-1' },
      drafts: [
        {
          file: makeFile('notes.pdf', 'application/pdf'),
          description: 'Week notes',
          submitToSharedFiles: false,
          courseCode: '',
          campusOrFaculty: '',
          tags: '',
        },
      ],
      user: student,
    });

    expect(uploaded).toHaveLength(1);
    expect(uploaded[0].displayFilename).toBe('notes.pdf');

    const attachments = await mockFileStore.getFilesForPost('post-1');
    expect(attachments.map((file) => file.displayFilename)).toEqual([
      'notes.pdf',
    ]);
  });

  it('keeps shared files pending until approved', async () => {
    const [file] = await mockFileStore.uploadLinkedFiles({
      context: { type: 'post', postId: 'post-1' },
      drafts: [
        {
          file: makeFile('guide.pdf', 'application/pdf'),
          description: 'Study guide',
          submitToSharedFiles: true,
          courseCode: 'CSC1010H',
          campusOrFaculty: 'Science',
          tags: 'study, week 5',
        },
      ],
      user: student,
    });

    expect(await mockFileStore.getSharedFiles({ sort: 'newest' })).toEqual([]);

    await mockFileStore.approveSharedFile(file.id);

    const sharedFiles = await mockFileStore.getSharedFiles({ sort: 'newest' });
    expect(sharedFiles).toHaveLength(1);
    expect(sharedFiles[0].links[0].courseCode).toBe('CSC1010H');
  });

  it('auto-hides after three unique reports', async () => {
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
      user: student,
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

    const [hiddenFile] = await mockFileStore.getHiddenFiles();
    expect(hiddenFile.id).toBe(file.id);
    expect(hiddenFile.status).toBe('hidden_by_reports');
  });

  it('prevents duplicate reports from the same user', async () => {
    const [file] = await mockFileStore.uploadLinkedFiles({
      context: { type: 'post', postId: 'post-1' },
      drafts: [
        {
          file: makeFile('notes.pdf', 'application/pdf'),
          description: '',
          submitToSharedFiles: false,
          courseCode: '',
          campusOrFaculty: '',
          tags: '',
        },
      ],
      user: student,
    });

    await mockFileStore.reportFile({
      input: { fileId: file.id, reportType: 'other', note: '' },
      user: reporterA,
    });

    await expect(
      mockFileStore.reportFile({
        input: { fileId: file.id, reportType: 'other', note: '' },
        user: reporterA,
      }),
    ).rejects.toThrow('You have already reported this file.');
  });

  it('returns files uploaded by one owner', async () => {
    await mockFileStore.uploadLinkedFiles({
      context: { type: 'post', postId: 'post-1' },
      drafts: [
        {
          file: makeFile('mine.pdf', 'application/pdf'),
          description: '',
          submitToSharedFiles: false,
          courseCode: '',
          campusOrFaculty: '',
          tags: '',
        },
      ],
      user: student,
    });
    await mockFileStore.uploadLinkedFiles({
      context: { type: 'post', postId: 'post-2' },
      drafts: [
        {
          file: makeFile('theirs.pdf', 'application/pdf'),
          description: '',
          submitToSharedFiles: false,
          courseCode: '',
          campusOrFaculty: '',
          tags: '',
        },
      ],
      user: otherStudent,
    });

    const files = await getUserFiles(student.id);

    expect(files.map((file) => file.displayFilename)).toEqual(['mine.pdf']);
  });
});
