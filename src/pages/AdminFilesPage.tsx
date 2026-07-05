import { useEffect, useState } from 'react';
import { FileCheck2 } from 'lucide-react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { PageHeader } from '../components/PageHeader';
import { Seo } from '../components/Seo';
import { UserAvatar } from '../components/UserAvatar';
import { useAuth } from '../hooks/useAuth';
import { createSignedDownloadUrl } from '../lib/fileApi';
import { canPreviewFile, classifyFileType } from '../lib/fileValidation';
import {
  approveSharedFile,
  deleteHiddenFile,
  getAutoHiddenFiles,
  getPendingSharedFiles,
  rejectSharedFile,
  restoreHiddenFile,
} from '../lib/adminFileApi';
import type { LinkedFile } from '../types/files';
import type { SharedFileLink } from '../types/files';

type Tab = 'pending' | 'hidden';

function getSharedFileLink(file: LinkedFile): SharedFileLink | undefined {
  return file.links.find(
    (link): link is SharedFileLink => link.linkType === 'shared_file',
  );
}

function formatReportCount(count: number): string {
  return `${count} ${count === 1 ? 'report' : 'reports'}`;
}

function formatFileType(file: LinkedFile): string {
  const extension = file.extension.trim();
  if (extension) return extension.toUpperCase();

  const kind = classifyFileType(file.displayFilename, file.mimeType);
  return kind === 'pdf' ? 'PDF' : kind.replace('_', ' ');
}

function getReviewReason(file: LinkedFile, tab: Tab): string {
  if (tab === 'hidden') {
    return `Auto-hidden after ${formatReportCount(file.reportCount)}`;
  }

  return 'Pending Shared Files approval';
}

function ReviewDetail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-[0.68rem] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </dt>
      <dd className="mt-0.5 truncate text-xs font-semibold text-slate-700">
        {value}
      </dd>
    </div>
  );
}

export function AdminFilesPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('pending');
  const [pendingFiles, setPendingFiles] = useState<LinkedFile[]>([]);
  const [hiddenFiles, setHiddenFiles] = useState<LinkedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<{
    file: LinkedFile;
    action: 'reject' | 'delete';
  } | null>(null);
  const [busy, setBusy] = useState(false);

  const visibleFiles = tab === 'pending' ? pendingFiles : hiddenFiles;

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    void Promise.all([getPendingSharedFiles(), getAutoHiddenFiles()])
      .then(([nextPendingFiles, nextHiddenFiles]) => {
        if (!active) return;
        setPendingFiles(nextPendingFiles);
        setHiddenFiles(nextHiddenFiles);
      })
      .catch((caughtError) => {
        if (active) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : 'Could not load file queues.',
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function approve(file: LinkedFile) {
    setError(null);
    try {
      await approveSharedFile(file.id);
      setPendingFiles((current) =>
        current.filter((item) => item.id !== file.id),
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Could not approve this file.',
      );
    }
  }

  async function restore(file: LinkedFile) {
    setError(null);
    try {
      await restoreHiddenFile(file.id);
      setHiddenFiles((current) =>
        current.filter((item) => item.id !== file.id),
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Could not restore this file.',
      );
    }
  }

  async function openReviewFile(file: LinkedFile, target: 'preview' | 'download') {
    setError(null);

    try {
      const signedUrl = await createSignedDownloadUrl(file.id, user);
      if (target === 'preview') {
        window.open(signedUrl.url, '_blank', 'noopener,noreferrer');
        return;
      }

      window.location.assign(signedUrl.url);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Could not create a file link.',
      );
    }
  }

  async function confirmDelete() {
    if (!confirming) return;

    setBusy(true);
    setError(null);

    try {
      if (confirming.action === 'reject') {
        await rejectSharedFile(confirming.file.id);
        setPendingFiles((current) =>
          current.filter((item) => item.id !== confirming.file.id),
        );
      } else {
        await deleteHiddenFile(confirming.file.id);
        setHiddenFiles((current) =>
          current.filter((item) => item.id !== confirming.file.id),
        );
      }
      setConfirming(null);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Could not delete this file.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-5">
      <Seo
        canonicalPath="/admin/files"
        description="InUni administrator file review."
        noindex
        title="File review | InUni"
      />
      <PageHeader
        description="Approve Shared Files submissions and review files hidden after reports."
        eyebrow="Administrator"
        icon={FileCheck2}
        title="File review"
      />

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="panel p-5">
          <p className="text-3xl font-semibold text-ink">
            {pendingFiles.length}
          </p>
          <p className="mt-1 text-sm text-slate-600">Pending Shared Files</p>
        </div>
        <div className="panel p-5">
          <p className="text-3xl font-semibold text-ink">{hiddenFiles.length}</p>
          <p className="mt-1 text-sm text-slate-600">Hidden after reports</p>
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        <button
          className={tab === 'pending' ? 'primary-button' : 'secondary-button'}
          onClick={() => setTab('pending')}
          type="button"
        >
          Pending Shared Files
        </button>
        <button
          className={tab === 'hidden' ? 'primary-button' : 'secondary-button'}
          onClick={() => setTab('hidden')}
          type="button"
        >
          Auto-hidden files
        </button>
      </div>

      {error ? <ErrorState message={error} /> : null}
      {loading ? <LoadingState label="Loading files..." /> : null}
      {!loading && !error && visibleFiles.length === 0 ? (
        <EmptyState
          message="This file review queue is clear."
          title="No files here"
        />
      ) : null}

      {!loading && !error && visibleFiles.length > 0 ? (
        <div className="panel overflow-hidden">
          {visibleFiles.map((file) => {
            const sharedLink = getSharedFileLink(file);

            return (
              <article
                className="grid gap-3 border-t border-slate-100 p-4 first:border-t-0 sm:grid-cols-[1fr_auto] sm:items-start"
                key={file.id}
              >
                <div className="min-w-0">
                  <h2 className="break-words text-base font-bold text-ink">
                    {file.displayFilename}
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {file.description || 'No description.'}
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <UserAvatar
                      name={file.ownerName}
                      size="sm"
                      src={file.ownerAvatarUrl}
                    />
                    <p>
                      Uploaded by {file.ownerName} · scan{' '}
                      {file.scanStatus.replace('_', ' ')}
                    </p>
                  </div>
                  <dl className="mt-3 grid gap-x-5 gap-y-2 sm:grid-cols-2 lg:grid-cols-6">
                    <ReviewDetail label="Uploader" value={file.ownerName} />
                    <ReviewDetail
                      label="Course"
                      value={sharedLink?.courseCode ?? 'No course'}
                    />
                    <ReviewDetail
                      label="Faculty"
                      value={sharedLink?.campusOrFaculty ?? 'No faculty'}
                    />
                    <ReviewDetail label="File type" value={formatFileType(file)} />
                    <ReviewDetail
                      label="Reports"
                      value={formatReportCount(file.reportCount)}
                    />
                    <ReviewDetail
                      label="Review reason"
                      value={getReviewReason(file, tab)}
                    />
                  </dl>
                </div>
                <div className="flex flex-wrap gap-2 sm:justify-end">
                  {canPreviewFile(file.mimeType) ? (
                    <button
                      aria-label={`Preview ${file.displayFilename}`}
                      className="secondary-button"
                      onClick={() => void openReviewFile(file, 'preview')}
                      type="button"
                    >
                      Preview
                    </button>
                  ) : null}
                  <button
                    aria-label={`Download ${file.displayFilename}`}
                    className="secondary-button"
                    onClick={() => void openReviewFile(file, 'download')}
                    type="button"
                  >
                    Download
                  </button>
                  {tab === 'pending' ? (
                    <>
                      <button
                        className="primary-button"
                        onClick={() => void approve(file)}
                        type="button"
                      >
                        Approve
                      </button>
                      <button
                        className="danger-button"
                        onClick={() => setConfirming({ file, action: 'reject' })}
                        type="button"
                      >
                        Reject
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="secondary-button"
                        onClick={() => void restore(file)}
                        type="button"
                      >
                        Restore
                      </button>
                      <button
                        className="danger-button"
                        onClick={() => setConfirming({ file, action: 'delete' })}
                        type="button"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : null}

      <ConfirmDialog
        busy={busy}
        confirmLabel={
          confirming?.action === 'reject' ? 'Reject file' : 'Delete file'
        }
        destructive
        message="This permanently removes the file and its metadata."
        onCancel={() => setConfirming(null)}
        onConfirm={confirmDelete}
        open={Boolean(confirming)}
        title={confirming?.action === 'reject' ? 'Reject file?' : 'Delete file?'}
      />
    </div>
  );
}
