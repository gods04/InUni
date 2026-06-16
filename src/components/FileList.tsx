import { canPreviewFile, classifyFileType } from '../lib/fileValidation';
import { createSignedDownloadUrl } from '../lib/fileApi';
import type { LinkedFile } from '../types/files';

interface FileListProps {
  files: LinkedFile[];
  emptyMessage?: string;
  onDownload?: (file: LinkedFile) => Promise<void> | void;
  onPreview?: (file: LinkedFile) => Promise<void> | void;
  onReport?: (file: LinkedFile) => void;
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

async function openSignedUrl(file: LinkedFile, target: 'download' | 'preview') {
  const signedUrl = await createSignedDownloadUrl(file.id);
  if (target === 'preview') {
    window.open(signedUrl.url, '_blank', 'noopener,noreferrer');
    return;
  }

  window.location.assign(signedUrl.url);
}

export function FileList({
  files,
  emptyMessage = 'No files yet.',
  onDownload,
  onPreview,
  onReport,
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
            className="panel grid gap-4 p-4 sm:grid-cols-[1fr_auto] sm:items-center"
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
              <p className="mt-1 text-xs font-semibold text-slate-500">
                Uploaded by {file.ownerName} · scan {file.scanStatus.replace('_', ' ')}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 sm:justify-end">
              {previewable ? (
                <button
                  className="secondary-button"
                  onClick={() =>
                    void (onPreview ? onPreview(file) : openSignedUrl(file, 'preview'))
                  }
                  type="button"
                >
                  Preview
                </button>
              ) : null}
              <button
                className="primary-button"
                onClick={() =>
                  void (onDownload
                    ? onDownload(file)
                    : openSignedUrl(file, 'download'))
                }
                type="button"
              >
                Download
              </button>
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
