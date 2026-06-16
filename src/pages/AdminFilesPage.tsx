import { useEffect, useState } from 'react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import {
  approveSharedFile,
  deleteHiddenFile,
  getAutoHiddenFiles,
  getPendingSharedFiles,
  rejectSharedFile,
  restoreHiddenFile,
} from '../lib/adminFileApi';
import type { LinkedFile } from '../types/files';

type Tab = 'pending' | 'hidden';

export function AdminFilesPage() {
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
      <section className="panel p-5 sm:p-6">
        <p className="text-sm font-semibold text-brand-700">Administrator</p>
        <h1 className="section-title">File review</h1>
        <p className="mt-1 text-sm text-slate-600">
          Approve Shared Files submissions and review files hidden after reports.
        </p>
      </section>

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
          {visibleFiles.map((file) => (
            <article
              className="grid gap-3 border-t border-slate-100 p-4 first:border-t-0 sm:grid-cols-[1fr_auto] sm:items-center"
              key={file.id}
            >
              <div>
                <h2 className="break-words text-base font-bold text-ink">
                  {file.displayFilename}
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {file.description || 'No description.'}
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  Uploaded by {file.ownerName} · scan{' '}
                  {file.scanStatus.replace('_', ' ')} · {file.reportCount} reports
                </p>
              </div>
              <div className="flex flex-wrap gap-2 sm:justify-end">
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
          ))}
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
