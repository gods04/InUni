import { canPreviewFile, classifyFileType } from '../lib/fileValidation';
import type { LinkedFile } from '../types/files';
import { UserAvatar } from './UserAvatar';

interface FileListProps {
  files: LinkedFile[];
  emptyMessage?: string;
  onDownload?: (file: LinkedFile) => Promise<void> | void;
  onPreview?: (file: LinkedFile) => Promise<void> | void;
  onReport?: (file: LinkedFile) => void;
  variant?: 'panel' | 'embedded';
}

function formatFileSize(sizeBytes: number): string {
  if (sizeBytes >= 1024 * 1024) {
    return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(sizeBytes / 1024))} KB`;
}

function getKindLabel(file: LinkedFile): string {
  return classifyFileType(file.displayFilename, file.mimeType).replace('_', ' ');
}

export function FileList({
  files,
  emptyMessage = 'No files yet.',
  onDownload,
  onPreview,
  onReport,
  variant = 'panel',
}: FileListProps) {
  if (files.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-line bg-white p-5 text-sm text-slate-600">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {files.map((file) => {
        const previewable = canPreviewFile(file.mimeType);
        return (
          <article
            aria-label={`File ${file.displayFilename}`}
            className={
              variant === 'panel'
                ? 'panel grid gap-4 p-4 sm:grid-cols-[1fr_auto] sm:items-center'
                : 'grid gap-4 rounded-lg border border-line bg-slate-50 p-3 sm:grid-cols-[1fr_auto] sm:items-center'
            }
            key={file.id}
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="badge bg-brand-50 text-brand-700">
                  {getKindLabel(file)}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  {formatFileSize(file.sizeBytes)}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  {file.downloadCount} downloads
                </span>
              </div>
              <h3 className="mt-2 break-words text-base font-bold text-ink">
                {file.displayFilename}
              </h3>
              {file.description ? (
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {file.description}
                </p>
              ) : null}
              <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-slate-500">
                <UserAvatar
                  name={file.ownerName}
                  size="sm"
                  src={file.ownerAvatarUrl}
                />
                <p>
                  Uploaded by {file.ownerName} · scan {file.scanStatus.replace('_', ' ')}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 sm:justify-end">
              {previewable && onPreview ? (
                <button
                  className="secondary-button"
                  onClick={() => void onPreview(file)}
                  type="button"
                >
                  Preview
                </button>
              ) : null}
              {onDownload ? (
                <button
                  className="primary-button"
                  onClick={() => void onDownload(file)}
                  type="button"
                >
                  Download
                </button>
              ) : null}
              {onReport ? (
                <button
                  aria-label={`Report ${file.displayFilename}`}
                  className="danger-button"
                  onClick={() => onReport(file)}
                  type="button"
                >
                  Report
                </button>
              ) : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}
