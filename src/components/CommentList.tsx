import { Link } from 'react-router-dom';
import { formatRelativeTime } from '../lib/format';
import type { LinkedFile } from '../types/files';
import type { ForumComment, ReportTarget } from '../types/forum';
import { FileList } from './FileList';
import { LinkedText } from './LinkedText';
import { UctVerifiedBadge } from './UctVerifiedBadge';
import { UserAvatar } from './UserAvatar';

interface CommentListProps {
  comments: ForumComment[];
  filesByCommentId?: Record<string, LinkedFile[]>;
  onFileDownload?: (file: LinkedFile) => Promise<void> | void;
  onFilePreview?: (file: LinkedFile) => Promise<void> | void;
  onReport?: (target: ReportTarget) => void;
  postAuthorId?: string;
  reportDisabled?: boolean;
  showReportActions?: boolean;
}

export function CommentList({
  comments,
  filesByCommentId = {},
  onFileDownload,
  onFilePreview,
  onReport,
  postAuthorId,
  reportDisabled = false,
  showReportActions = true,
}: CommentListProps) {
  if (comments.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-line bg-white px-4 py-6 text-sm text-slate-600">
        No comments yet. Be the first to add something useful.
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-3">
      {comments.map((comment) => (
        <article className="min-w-0 rounded-lg border border-line bg-white p-4 shadow-sm" key={comment.id}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <UserAvatar
                name={comment.authorName}
                size="sm"
                src={comment.authorAvatarUrl}
              />
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-bold text-slate-900">
                  {comment.authorName}
                </span>
                {comment.authorId === postAuthorId ? (
                  <span className="inline-flex items-center rounded-full bg-brand-50 px-2 py-0.5 text-[0.65rem] font-bold uppercase leading-none text-brand-700">
                    Author
                  </span>
                ) : null}
                {comment.authorIsUctVerified ? <UctVerifiedBadge /> : null}
                <span className="text-slate-400">·</span>
                <span className="text-slate-500">
                  {formatRelativeTime(comment.createdAt)}
                </span>
              </div>
            </div>
            {!showReportActions ? null : onReport ? (
              <button
                className="inline-flex items-center justify-center rounded-full border border-red-200 bg-panel px-2.5 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-50 focus:outline-none focus:ring-4 focus:ring-red-100 disabled:cursor-not-allowed disabled:opacity-60"
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
          <p className="mt-2 min-w-0 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700 [overflow-wrap:anywhere]">
            <LinkedText text={comment.content} />
          </p>
          {filesByCommentId[comment.id]?.length ? (
            <div className="mt-3">
              <FileList
                files={filesByCommentId[comment.id]}
                onDownload={onFileDownload}
                onPreview={onFilePreview}
                variant="embedded"
              />
            </div>
          ) : null}
        </article>
      ))}
    </div>
  );
}
