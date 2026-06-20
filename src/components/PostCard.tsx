import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { formatRelativeTime, getPreview } from '../lib/format';
import { createReport } from '../lib/forumApi';
import { canParticipate } from '../lib/permissions';
import type { Category, Post, ReportTarget } from '../types/forum';
import { ReportDialog } from './ReportDialog';
import { UctVerifiedBadge } from './UctVerifiedBadge';
import { UserAvatar } from './UserAvatar';

const categoryStyles: Record<Category, string> = {
  Study: 'bg-emerald-50 text-emerald-800',
  'Campus Life': 'bg-brand-50 text-brand-700',
  Questions: 'bg-indigo-50 text-indigo-700',
  'Lost & Found': 'bg-amber-50 text-amber-800',
  Confessions: 'bg-rose-50 text-rose-700',
  General: 'bg-slate-100 text-slate-700',
};

export function PostCard({ post }: { post: Post }) {
  const { user } = useAuth();
  const [reportOpen, setReportOpen] = useState(false);
  const [reportStatus, setReportStatus] = useState<string | null>(null);
  const target: ReportTarget = { type: 'post', postId: post.id };

  function openReport() {
    setReportStatus(null);
    if (user && !canParticipate(user.profile)) {
      setReportStatus('Your restricted account cannot submit reports.');
      return;
    }
    setReportOpen(true);
  }

  async function submitReport(nextTarget: ReportTarget, reason: string) {
    if (!user) return;
    await createReport(nextTarget, reason, user);
    setReportStatus('Report submitted. Thank you.');
  }

  return (
    <article className="panel relative overflow-hidden p-4 transition hover:border-brand-100 sm:p-5">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`badge ${categoryStyles[post.category]}`}>{post.category}</span>
          {post.isAnonymous ? <span className="badge bg-slate-100 text-slate-700">Anonymous</span> : null}
          <span className="text-xs font-semibold text-slate-500">{formatRelativeTime(post.createdAt)}</span>
        </div>

        <Link to={`/post/${post.id}`} className="group">
          <h2 className="text-xl font-semibold tracking-normal text-ink group-hover:text-brand-700">
            {post.title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{getPreview(post.content)}</p>
        </Link>

        <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
            {!post.isAnonymous ? (
              <UserAvatar
                name={post.authorName}
                size="sm"
                src={post.authorAvatarUrl}
              />
            ) : null}
            <span>
              By{' '}
              <span className="font-bold text-slate-700">
                {post.authorName}
              </span>
            </span>
            {!post.isAnonymous && post.authorIsUctVerified ? (
              <UctVerifiedBadge />
            ) : null}
            <span>·</span>
            <span>{post.commentCount} comments</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {user ? (
              <button
                className="danger-button"
                onClick={openReport}
                type="button"
              >
                Report
              </button>
            ) : (
              <Link className="secondary-button" to="/login">
                Log in to report
              </Link>
            )}
            {reportStatus ? (
              <span className="text-xs font-semibold text-slate-500">
                {reportStatus}
              </span>
            ) : null}
          </div>
        </div>
      </div>
      <ReportDialog
        onClose={() => setReportOpen(false)}
        onSubmit={submitReport}
        open={reportOpen}
        target={target}
      />
    </article>
  );
}
