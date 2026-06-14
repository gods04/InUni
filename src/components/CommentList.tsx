import { Link } from 'react-router-dom';
import { formatRelativeTime } from '../lib/format';
import type { ForumComment, ReportTarget } from '../types/forum';
import { UctVerifiedBadge } from './UctVerifiedBadge';

interface CommentListProps {
  comments: ForumComment[];
  onReport?: (target: ReportTarget) => void;
  reportDisabled?: boolean;
}

export function CommentList({
  comments,
  onReport,
  reportDisabled = false,
}: CommentListProps) {
  if (comments.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-emerald-200 bg-white/70 px-4 py-6 text-sm text-slate-600">
        No comments yet. Be the first to add something useful.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {comments.map((comment) => (
        <article className="rounded-lg border border-white/80 bg-white/90 p-4 shadow-sm" key={comment.id}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-bold text-slate-900">{comment.authorName}</span>
              {comment.authorIsUctVerified ? <UctVerifiedBadge /> : null}
              <span className="text-slate-400">·</span>
              <span className="text-slate-500">{formatRelativeTime(comment.createdAt)}</span>
            </div>
            {onReport ? (
              <button
                className="text-xs font-semibold text-slate-500 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={reportDisabled}
                onClick={() =>
                  onReport({ type: 'comment', commentId: comment.id })
                }
                title={
                  reportDisabled
                    ? 'Restricted accounts cannot submit reports'
                    : 'Report this comment'
                }
                type="button"
              >
                Report
              </button>
            ) : (
              <Link
                className="text-xs font-semibold text-slate-500 hover:text-slate-900"
                to="/login"
              >
                Log in to report
              </Link>
            )}
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{comment.content}</p>
        </article>
      ))}
    </div>
  );
}
