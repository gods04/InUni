import { describe, expect, it } from 'vitest';
import {
  FILE_REPORT_HIDE_THRESHOLD,
  MAX_ATTACHMENTS_PER_CONTEXT,
  MAX_DAILY_UPLOAD_BYTES,
  MAX_FILE_DESCRIPTION_LENGTH,
  MAX_FILE_SIZE_BYTES,
  classifyFileType,
  canPreviewFile,
  shouldAutoHideFile,
  validateAttachmentCount,
  validateDailyUpload,
  validateFileDescription,
  validateFileSize,
  validateUploadFileType,
  getUploadErrorMessage,
} from './fileValidation';

describe('file limits', () => {
  it('uses the approved upload limits', () => {
    expect(MAX_FILE_SIZE_BYTES).toBe(5 * 1024 * 1024);
    expect(MAX_ATTACHMENTS_PER_CONTEXT).toBe(5);
    expect(MAX_DAILY_UPLOAD_BYTES).toBe(1024 * 1024 * 1024);
  });

  it('rejects files over 5MB', () => {
    expect(validateFileSize(5 * 1024 * 1024 + 1)).toBe(
      'This file is too large. Upload files up to 5MB each.',
    );
  });

  it('rejects more than five attachments in one context', () => {
    expect(validateAttachmentCount(6)).toBe('You can attach up to 5 files.');
  });

  it('rejects daily uploads above 1GB', () => {
    expect(validateDailyUpload(1024 * 1024 * 1024, 1)).toBe(
      'You have reached the 1GB daily upload limit.',
    );
  });

  it('accepts exact upload limits', () => {
    expect(validateFileSize(MAX_FILE_SIZE_BYTES)).toBeNull();
    expect(validateAttachmentCount(MAX_ATTACHMENTS_PER_CONTEXT)).toBeNull();
    expect(validateDailyUpload(MAX_DAILY_UPLOAD_BYTES - 1, 1)).toBeNull();
  });

  it('accepts only the supported student resource file types', () => {
    expect(validateUploadFileType('notes.pdf', 'application/pdf')).toBeNull();
    expect(validateUploadFileType('diagram.png', 'image/png')).toBeNull();
    expect(validateUploadFileType('essay.docx', '')).toBeNull();
    expect(validateUploadFileType('slides.pptx', '')).toBeNull();
    expect(validateUploadFileType('marks.xlsx', '')).toBeNull();
    expect(validateUploadFileType('README.md', 'text/markdown')).toBeNull();
    expect(validateUploadFileType('data.csv', 'text/csv')).toBeNull();
    expect(validateUploadFileType('resources.zip', 'application/zip')).toBeNull();

    expect(validateUploadFileType('app.exe', 'application/x-msdownload')).toBe(
      'This file type cannot be uploaded yet. Try PDF, images, Office documents, spreadsheets, presentations, text files, or ZIP archives.',
    );
    expect(validateUploadFileType('script.js', 'text/javascript')).toBe(
      'This file type cannot be uploaded yet. Try PDF, images, Office documents, spreadsheets, presentations, text files, or ZIP archives.',
    );
    expect(validateUploadFileType('vector.svg', 'image/svg+xml')).toBe(
      'This file type cannot be uploaded yet. Try PDF, images, Office documents, spreadsheets, presentations, text files, or ZIP archives.',
    );
    expect(validateUploadFileType('bundle.rar', 'application/x-rar-compressed')).toBe(
      'This file type cannot be uploaded yet. Try PDF, images, Office documents, spreadsheets, presentations, text files, or ZIP archives.',
    );
  });
});

describe('upload error copy', () => {
  it('maps backend size failures to the upload size limit', () => {
    expect(getUploadErrorMessage(new Error('Payload too large'))).toBe(
      'This file is too large. Upload files up to 5MB each.',
    );
  });

  it('explains backend file type blocks without raw provider details', () => {
    expect(
      getUploadErrorMessage(
        new Error('mime type application/x-msdownload is not supported'),
      ),
    ).toBe(
      'This file type cannot be uploaded yet. Try PDF, images, Office documents, spreadsheets, presentations, text files, or ZIP archives.',
    );
  });

  it('explains security blocks without leaking scanner details', () => {
    expect(
      getUploadErrorMessage(
        new Error('blocked by security policy: malware signature match'),
      ),
    ).toBe(
      'This upload was blocked because it may be unsafe. Try another file or ask an admin if this looks wrong.',
    );
  });

  it('falls back to a short retry message for unknown upload failures', () => {
    expect(getUploadErrorMessage(new Error('storage bucket unavailable'))).toBe(
      'Could not upload this file. Please try again.',
    );
  });
});

describe('file metadata', () => {
  it('limits descriptions to 200 characters', () => {
    expect(validateFileDescription('a'.repeat(201))).toBe(
      'File descriptions must be 200 characters or fewer.',
    );
  });

  it('accepts descriptions at the character limit', () => {
    expect(
      validateFileDescription('a'.repeat(MAX_FILE_DESCRIPTION_LENGTH)),
    ).toBeNull();
  });

  it('classifies common file types', () => {
    expect(classifyFileType('notes.pdf', 'application/pdf')).toBe('pdf');
    expect(classifyFileType('photo.png', 'image/png')).toBe('image');
    expect(
      classifyFileType(
        'slides.pptx',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      ),
    ).toBe('presentation');
    expect(classifyFileType('archive.zip', 'application/zip')).toBe('archive');
  });

  it('classifies archives from MIME type without an extension', () => {
    expect(classifyFileType('upload', 'application/zip')).toBe('archive');
  });

  it('previews only images and PDFs', () => {
    expect(canPreviewFile('image/png')).toBe(true);
    expect(canPreviewFile('application/pdf')).toBe(true);
    expect(canPreviewFile('application/zip')).toBe(false);
  });

  it('normalizes MIME types before checking preview support', () => {
    expect(canPreviewFile('Application/PDF; charset=binary')).toBe(true);
  });
});

describe('file reports', () => {
  it('auto-hides after three unique reports', () => {
    expect(FILE_REPORT_HIDE_THRESHOLD).toBe(3);
    expect(shouldAutoHideFile(2)).toBe(false);
    expect(shouldAutoHideFile(3)).toBe(true);
  });
});
