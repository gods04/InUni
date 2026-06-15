import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BanNotice } from '../components/BanNotice';
import { CommentList } from '../components/CommentList';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { ReportDialog } from '../components/ReportDialog';
import { UctVerifiedBadge } from '../components/UctVerifiedBadge';
import { useAuth } from '../hooks/useAuth';
import {
  createComment,
  createReport,
  getComments,
  getPost,
} from '../lib/forumApi';
import { formatRelativeTime } from '../lib/format';
import { canParticipate } from '../lib/permissions';
import { validateComment } from '../lib/validation';
import type { ForumComment, Post, ReportTarget } from '../types/forum';

export function PostDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<ForumComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null);
  const [reportStatus, setReportStatus] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadPost() {
      if (!id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const [nextPost, nextComments] = await Promise.all([getPost(id), getComments(id)]);
        if (isActive) {
          setPost(nextPost);
          setComments(nextComments);
        }
      } catch (caughtError) {
        if (isActive) {
          setError(caughtError instanceof Error ? caughtError.message : 'Could not load this post.');
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    void loadPost();

    return () => {
      isActive = false;
    };
  }, [id]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCommentError(null);

    if (!user) {
      setCommentError('Log in to add a comment.');
      return;
    }

    if (!post) {
      setCommentError('This post is no longer available.');
      return;
    }

    const validationError = validateComment(commentText);
    if (validationError) {
      setCommentError(validationError);
      return;
    }

    setSubmitting(true);

    try {
      const comment = await createComment({ postId: post.id, content: commentText.trim() }, user);
      setComments((current) => [...current, comment]);
      setPost((current) =>
        current ? { ...current, commentCount: current.commentCount + 1 } : current,
      );
      setCommentText('');
    } catch (caughtError) {
      setCommentError(caughtError instanceof Error ? caughtError.message : 'Could not add comment.');
    } finally {
      setSubmitting(false);
    }
  }

  function openReport(target: ReportTarget) {
    setReportStatus(null);
    if (user && !canParticipate(user.profile)) {
      setReportStatus('Your restricted account cannot submit reports.');
      return;
    }
    setReportTarget(target);
  }

  async function submitReport(target: ReportTarget, reason: string) {
    if (!user) return;
    await createReport(target, reason, user);
    setReportStatus('Report submitted. Thank you.');
  }

  if (loading) {
    return <LoadingState label="Loading post..." />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  if (!post) {
    return (
      <EmptyState
        title="Post not found"
        message="That conversation may have been removed or the link may be incorrect."
        action={
          <Link className="primary-button" to="/">
            Back to feed
          </Link>
        }
      />
    );
  }

  return (
    <div className="grid gap-5">
      <Link className="w-fit text-sm font-semibold text-brand-700 hover:text-brand-600" to="/">
        Back to feed
      </Link>

      <article className="panel p-5 sm:p-7">
        <div className="flex flex-wrap items-center gap-2">
          <span className="badge bg-brand-50 text-brand-700">{post.category}</span>
          {post.isAnonymous ? <span className="badge bg-slate-100 text-slate-700">Anonymous</span> : null}
          <span className="text-xs font-semibold text-slate-500">{formatRelativeTime(post.createdAt)}</span>
        </div>

        <h1 className="mt-4 text-3xl font-semibold tracking-normal text-ink">{post.title}</h1>
        <div className="mt-3 text-sm text-slate-500">
          By <span className="font-bold text-slate-800">{post.authorName}</span>{' '}
          {!post.isAnonymous && post.authorIsUctVerified ? (
            <UctVerifiedBadge />
          ) : null}{' '}
          ·{' '}
          <span>{post.commentCount} comments</span>
        </div>

        <div className="mt-6 space-y-4 whitespace-pre-wrap text-base leading-8 text-slate-700">
          {post.content}
        </div>

        <div className="mt-6 border-t border-slate-100 pt-5">
          <div className="flex flex-wrap items-center gap-3">
            {user ? (
              <button
                className="danger-button"
                onClick={() =>
                  openReport({ type: 'post', postId: post.id })
                }
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
              <span className="text-sm font-semibold text-slate-600">
                {reportStatus}
              </span>
            ) : null}
          </div>
        </div>
      </article>

      <section className="grid gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-normal text-ink">Comments</h2>
          <p className="mt-1 text-sm text-slate-600">Add context, answer questions, or help a classmate out.</p>
        </div>

        <CommentList
          comments={comments}
          onReport={user ? openReport : undefined}
          reportDisabled={Boolean(user && !canParticipate(user.profile))}
        />

        {user && !canParticipate(user.profile) ? (
          <BanNotice reason={user.profile.banReason} />
        ) : (
        <form className="panel grid gap-4 p-4 sm:p-5" onSubmit={handleSubmit}>
          <label className="grid gap-2">
            <span className="field-label">Add a comment</span>
            <textarea
              className="field-input min-h-28 resize-y"
              placeholder={user ? 'Write a helpful reply...' : 'Log in to comment'}
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              disabled={!user || submitting}
            />
          </label>

          {commentError ? <ErrorState message={commentError} /> : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              {user
                ? `Posting as ${user.profile.displayName}`
                : 'Only logged-in users can comment.'}
            </p>
            <button className="primary-button" type="submit" disabled={!user || submitting}>
              {submitting ? 'Posting...' : 'Post comment'}
            </button>
          </div>
        </form>
        )}
      </section>

      {reportTarget ? (
        <ReportDialog
          onClose={() => setReportTarget(null)}
          onSubmit={submitReport}
          open
          target={reportTarget}
        />
      ) : null}
    </div>
  );
}
