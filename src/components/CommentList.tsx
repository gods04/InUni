import { formatRelativeTime } from '../lib/format';
import type { ForumComment } from '../types/forum';

export function CommentList({ comments }: { comments: ForumComment[] }) {
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
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-bold text-slate-900">{comment.authorName}</span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-500">{formatRelativeTime(comment.createdAt)}</span>
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{comment.content}</p>
        </article>
      ))}
    </div>
  );
}
