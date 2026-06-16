import { describe, expect, it } from 'vitest';
import {
  FILE_REPORT_HIDE_THRESHOLD,
  MAX_ATTACHMENTS_PER_CONTEXT,
  MAX_DAILY_UPLOAD_BYTES,
  MAX_FILE_SIZE_BYTES,
  classifyFileType,
  canPreviewFile,
  shouldAutoHideFile,
  validateAttachmentCount,
  validateDailyUpload,
  validateFileDescription,
  validateFileSize,
} from './fileValidation';

describe('file limits', () => {
  it('uses the approved upload limits', () => {
    expect(MAX_FILE_SIZE_BYTES).toBe(100 * 1024 * 1024);
    expect(MAX_ATTACHMENTS_PER_CONTEXT).toBe(5);
    expect(MAX_DAILY_UPLOAD_BYTES).toBe(1024 * 1024 * 1024);
  });

  it('rejects files over 100MB', () => {
    expect(validateFileSize(100 * 1024 * 1024 + 1)).toBe(
      'Files must be 100MB or smaller.',
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
});

describe('file metadata', () => {
  it('limits descriptions to 200 characters', () => {
    expect(validateFileDescription('a'.repeat(201))).toBe(
      'File descriptions must be 200 characters or fewer.',
    );
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

  it('previews only images and PDFs', () => {
    expect(canPreviewFile('image/png')).toBe(true);
    expect(canPreviewFile('application/pdf')).toBe(true);
    expect(canPreviewFile('application/zip')).toBe(false);
  });
});

describe('file reports', () => {
  it('auto-hides after three unique reports', () => {
    expect(FILE_REPORT_HIDE_THRESHOLD).toBe(3);
    expect(shouldAutoHideFile(2)).toBe(false);
    expect(shouldAutoHideFile(3)).toBe(true);
  });
});
