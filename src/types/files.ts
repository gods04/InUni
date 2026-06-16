export type FileStatus =
  | 'uploading'
  | 'available'
  | 'pending_review'
  | 'hidden_by_reports';

export type SharedFileStatus = 'pending' | 'approved';

export type FileScanStatus =
  | 'not_scanned'
  | 'pending'
  | 'clean'
  | 'flagged'
  | 'failed';

export type FileLinkType = 'post' | 'comment' | 'shared_file';

export type FileReportType =
  | 'copyright'
  | 'malicious_file'
  | 'privacy'
  | 'harassment'
  | 'other';

export type FileSort = 'newest' | 'downloads' | 'reports' | 'name';

export type FileKind =
  | 'image'
  | 'pdf'
  | 'document'
  | 'presentation'
  | 'spreadsheet'
  | 'text'
  | 'archive'
  | 'other';

export interface InUniFile {
  id: string;
  ownerId: string;
  ownerName: string;
  storageProvider: 'supabase' | 'mock';
  storageBucket: string;
  storagePath: string;
  originalFilename: string;
  displayFilename: string;
  mimeType: string;
  extension: string;
  sizeBytes: number;
  description: string;
  status: FileStatus;
  scanStatus: FileScanStatus;
  downloadCount: number;
  reportCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface FileLink {
  id: string;
  fileId: string;
  linkType: FileLinkType;
  postId: string | null;
  commentId: string | null;
  sharedStatus: SharedFileStatus | null;
  courseCode: string | null;
  campusOrFaculty: string | null;
  tags: string[];
  createdAt: string;
}

export interface LinkedFile extends InUniFile {
  links: FileLink[];
}

export interface FileUploadDraft {
  file: File;
  description: string;
  submitToSharedFiles: boolean;
  courseCode: string;
  campusOrFaculty: string;
  tags: string;
}

export interface FileReportInput {
  fileId: string;
  reportType: FileReportType;
  note: string;
}

export interface SharedFileFilters {
  query: string;
  courseCode: string;
  fileKind: FileKind | 'all';
  campusOrFaculty: string;
  tag: string;
  sort: FileSort;
}

export interface SignedFileUrl {
  url: string;
  expiresAt: string;
}
