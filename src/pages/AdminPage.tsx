import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import {
  deleteReportedComment,
  deleteReportedPost,
  getOpenReports,
  resolveReport,
} from '../lib/adminApi';
import type { ModerationReport } from '../lib/adminApi';
import { formatRelativeTime } from '../lib/format';

export function AdminPage() {
  const [reports, setReports] = useState<ModerationReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] =
    useState<ModerationReport | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;

    void getOpenReports()
      .then((nextReports) => {
        if (active) setReports(nextReports);
      })
      .catch((caughtError) => {
        if (active) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : 'Could not load reports.',
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

  async function dismissReport(report: ModerationReport) {
    setError(null);
    try {
      await resolveReport(
        report.id,
        'dismissed',
        'Dismissed by a moderator.',
      );
      setReports((current) =>
        current.filter((item) => item.id !== report.id),
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Could not dismiss report.',
      );
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setBusy(true);
    setError(null);

    try {
      await resolveReport(
        pendingDelete.id,
        'resolved',
        'Reported content deleted by a moderator.',
      );
      if (pendingDelete.target.type === 'post') {
        await deleteReportedPost(pendingDelete.target.postId);
      } else {
        await deleteReportedComment(pendingDelete.target.commentId);
      }
      setReports((current) =>
        current.filter((item) => item.id !== pendingDelete.id),
      );
      setPendingDelete(null);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Could not delete reported content.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-5">
      <section className="panel flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <p className="text-sm font-semibold text-brand-700">
            Administrator
          </p>
          <h1 className="section-title">Moderation</h1>
          <p className="mt-1 text-sm text-slate-600">
            {reports.length} open {reports.length === 1 ? 'report' : 'reports'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className="secondary-button" to="/admin/files">
            Review files
          </Link>
          <Link className="secondary-button" to="/admin/users">
            Manage users
          </Link>
        </div>
      </section>

      {error ? <ErrorState message={error} /> : null}
      {loading ? <LoadingState label="Loading reports..." /> : null}

      {!loading && !error && reports.length === 0 ? (
        <EmptyState
          message="There are no open reports to review."
          title="Moderation queue is clear"
        />
      ) : null}

      {!loading && reports.length > 0 ? (
        <div className="grid gap-4">
          {reports.map((report) => (
            <article className="panel p-5" key={report.id}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="badge bg-red-50 text-red-700">
                  {report.target.type === 'post' ? 'Post' : 'Comment'}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  {formatRelativeTime(report.createdAt)}
                </span>
              </div>
              <h2 className="mt-3 text-lg font-semibold text-ink">
                {report.contentTitle}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {report.contentPreview}
              </p>
              <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-4">
                <p className="text-xs font-bold uppercase text-red-700">
                  Report reason
                </p>
                <p className="mt-1 text-sm leading-6 text-red-900">
                  {report.reason}
                </p>
              </div>
              <div className="mt-5 flex flex-wrap justify-end gap-2">
                <button
                  className="secondary-button"
                  onClick={() => void dismissReport(report)}
                  type="button"
                >
                  Dismiss report
                </button>
                <button
                  className="danger-button"
                  onClick={() => setPendingDelete(report)}
                  type="button"
                >
                  Delete {report.target.type}
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      <ConfirmDialog
        busy={busy}
        confirmLabel={
          pendingDelete?.target.type === 'comment'
            ? 'Delete comment'
            : 'Delete post'
        }
        destructive
        message="This permanently removes the reported content. This action cannot be undone."
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        open={Boolean(pendingDelete)}
        title={`Delete reported ${pendingDelete?.target.type ?? 'content'}?`}
      />
    </div>
  );
}
