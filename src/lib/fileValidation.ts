import type { FileKind } from '../types/files';

export const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024;
export const MAX_ATTACHMENTS_PER_CONTEXT = 5;
export const MAX_DAILY_UPLOAD_BYTES = 1024 * 1024 * 1024;
export const MAX_FILE_DESCRIPTION_LENGTH = 200;
export const FILE_REPORT_HIDE_THRESHOLD = 3;
export const SIGNED_FILE_URL_TTL_SECONDS = 5 * 60;

const officeDocumentMimeTypes = new Set([
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const presentationMimeTypes = new Set([
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
]);

const spreadsheetMimeTypes = new Set([
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

const archiveMimeTypes = new Set([
  'application/zip',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
]);

const archiveExtensions = new Set(['zip', 'rar', '7z']);

function getExtension(filename: string): string {
  const parts = filename.toLowerCase().split('.');
  return parts.length > 1 ? parts.at(-1) ?? '' : '';
}

function normalizeMimeType(mimeType: string): string {
  return mimeType.split(';')[0].trim().toLowerCase();
}

export function validateFileSize(sizeBytes: number): string | null {
  return sizeBytes <= MAX_FILE_SIZE_BYTES
    ? null
    : 'Files must be 100MB or smaller.';
}

export function validateAttachmentCount(count: number): string | null {
  return count <= MAX_ATTACHMENTS_PER_CONTEXT
    ? null
    : 'You can attach up to 5 files.';
}

export function validateDailyUpload(
  alreadyUploadedBytes: number,
  nextUploadBytes: number,
): string | null {
  return alreadyUploadedBytes + nextUploadBytes <= MAX_DAILY_UPLOAD_BYTES
    ? null
    : 'You have reached the 1GB daily upload limit.';
}

export function validateFileDescription(description: string): string | null {
  return description.length <= MAX_FILE_DESCRIPTION_LENGTH
    ? null
    : 'File descriptions must be 200 characters or fewer.';
}

export function canPreviewFile(mimeType: string): boolean {
  const normalizedMimeType = normalizeMimeType(mimeType);

  return (
    normalizedMimeType.startsWith('image/') ||
    normalizedMimeType === 'application/pdf'
  );
}

export function classifyFileType(filename: string, mimeType: string): FileKind {
  const extension = getExtension(filename);
  const normalizedMimeType = normalizeMimeType(mimeType);

  if (normalizedMimeType.startsWith('image/')) return 'image';
  if (normalizedMimeType === 'application/pdf' || extension === 'pdf') {
    return 'pdf';
  }
  if (
    officeDocumentMimeTypes.has(normalizedMimeType) ||
    ['doc', 'docx'].includes(extension)
  ) {
    return 'document';
  }
  if (
    presentationMimeTypes.has(normalizedMimeType) ||
    ['ppt', 'pptx'].includes(extension)
  ) {
    return 'presentation';
  }
  if (
    spreadsheetMimeTypes.has(normalizedMimeType) ||
    ['xls', 'xlsx'].includes(extension)
  ) {
    return 'spreadsheet';
  }
  if (normalizedMimeType.startsWith('text/') || extension === 'txt') {
    return 'text';
  }
  if (
    archiveMimeTypes.has(normalizedMimeType) ||
    archiveExtensions.has(extension)
  ) {
    return 'archive';
  }
  return 'other';
}

export function shouldAutoHideFile(uniqueReportCount: number): boolean {
  return uniqueReportCount >= FILE_REPORT_HIDE_THRESHOLD;
}
