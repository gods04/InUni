import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AttachmentPicker } from '../components/AttachmentPicker';
import { BanNotice } from '../components/BanNotice';
import { CommentList } from '../components/CommentList';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { FileList } from '../components/FileList';
import { LinkedText } from '../components/LinkedText';
import { LoadingState } from '../components/LoadingState';
import { ReportDialog } from '../components/ReportDialog';
import { Seo } from '../components/Seo';
import { UctVerifiedBadge } from '../components/UctVerifiedBadge';
import { useAuth } from '../hooks/useAuth';
import {
  createSignedDownloadUrl,
  getFilesForComment,
  getFilesForPost,
  uploadLinkedFiles,
} from '../lib/fileApi';
import {
  createComment,
  createReport,
  getComments,
  getPost,
} from '../lib/forumApi';
import { isCuratedSeedPostId } from '../lib/curatedSeedForum';
import { formatRelativeTime } from '../lib/format';
import { isPostEdited } from '../lib/postDisplay';
import { canParticipate } from '../lib/permissions';
import { validateComment } from '../lib/validation';
import type { FileUploadDraft, LinkedFile } from '../types/files';
import type { ForumComment, Post, ReportTarget } from '../types/forum';

export function PostDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<ForumComment[]>([]);
  const [postFiles, setPostFiles] = useState<LinkedFile[]>([]);
  const [commentFiles, setCommentFiles] = useState<Record<string, LinkedFile[]>>({});
  const [commentText, setCommentText] = useState('');
  const [commentAttachments, setCommentAttachments] = useState<FileUploadDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [fileStatus, setFileStatus] = useState<string | null>(null);
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
        const shouldLoadFiles = Boolean(user);
        const [nextPostFiles, nextCommentFileEntries] = nextPost && shouldLoadFiles
          ? await Promise.all([
              getFilesForPost(id),
              Promise.all(
                nextComments.map(async (comment) => [
                  comment.id,
                  await getFilesForComment(comment.id),
                ] as const),
              ),
            ])
          : [[], []];

        if (isActive) {
          setPost(nextPost);
          setComments(nextComments);
          setPostFiles(nextPostFiles);
          setCommentFiles(Object.fromEntries(nextCommentFileEntries));
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
  }, [id, user?.id]);

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
      const uploadedFiles =
        commentAttachments.length > 0
          ? await uploadLinkedFiles(
              { type: 'comment', commentId: comment.id },
              commentAttachments,
              user,
            )
          : [];
      setComments((current) => [...current, comment]);
      setCommentFiles((current) =>
        uploadedFiles.length > 0
          ? { ...current, [comment.id]: uploadedFiles }
          : current,
      );
      setPost((current) =>
        current ? { ...current, commentCount: current.commentCount + 1 } : current,
      );
      setCommentText('');
      setCommentAttachments([]);
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

  async function openFile(file: LinkedFile, target: 'download' | 'preview') {
    setFileStatus(null);

    if (!user) {
      setFileStatus('Log in to preview or download files.');
      return;
    }

    if (!canParticipate(user.profile)) {
      setFileStatus('Your restricted account cannot download files.');
      return;
    }

    try {
      const signedUrl = await createSignedDownloadUrl(file.id, user);
      if (target === 'preview') {
        window.open(signedUrl.url, '_blank', 'noopener,noreferrer');
        return;
      }

      window.location.assign(signedUrl.url);
    } catch (caughtError) {
      setFileStatus(
        caughtError instanceof Error
          ? caughtError.message
          : 'Could not create download link.',
      );
    }
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

  const isStarterPost = isCuratedSeedPostId(post.id);

  return (
    <div className="grid min-w-0 gap-5">
      <Seo
        canonicalPath={`/post/${post.id}`}
        description={`${post.title} - a UCT student forum discussion on InUni.`}
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'DiscussionForumPosting',
          articleBody: post.content,
          author: {
            '@type': 'Person',
            name: post.authorName,
          },
          datePublished: post.createdAt,
          dateModified: post.updatedAt ?? post.createdAt,
          headline: post.title,
          url: `https://inuni.co.za/post/${post.id}`,
        }}
        title={`${post.title} | InUni`}
        type="article"
      />
      <Link className="w-fit text-sm font-semibold text-brand-700 hover:text-brand-600" to="/">
        Back to feed
      </Link>

      <article className="panel min-w-0 p-5 sm:p-7">
        <div className="flex flex-wrap items-center gap-2">
          <span className="badge bg-brand-50 text-brand-700">{post.category}</span>
          {post.isAnonymous ? <span className="badge bg-slate-100 text-slate-700">Anonymous</span> : null}
          <span className="text-xs font-semibold text-slate-500">{formatRelativeTime(post.createdAt)}</span>
          {isPostEdited(post) ? (
            <span className="badge bg-slate-100 text-slate-600">Edited</span>
          ) : null}
        </div>

        <h1 className="mt-4 break-words text-3xl font-semibold tracking-normal text-ink">{post.title}</h1>
        <div className="mt-3 text-sm text-slate-500">
          By <span className="font-bold text-slate-800">{post.authorName}</span>{' '}
          {!post.isAnonymous && post.authorIsUctVerified ? (
            <UctVerifiedBadge />
          ) : null}{' '}
          ·{' '}
          <span>{post.commentCount} comments</span>
        </div>

        <div className="mt-6 min-w-0 space-y-4 whitespace-pre-wrap break-words text-base leading-8 text-slate-700 [overflow-wrap:anywhere]">
          <LinkedText text={post.content} />
        </div>

        {postFiles.length > 0 ? (
          <div className="mt-6">
            <h2 className="text-base font-semibold text-ink">Attachments</h2>
            <div className="mt-3">
              <FileList
                files={postFiles}
                onDownload={(file) => openFile(file, 'download')}
                onPreview={(file) => openFile(file, 'preview')}
                variant="embedded"
              />
            </div>
          </div>
        ) : null}

        <div className="mt-6 border-t border-slate-100 pt-5">
          <div className="flex flex-wrap items-center gap-3">
            {isStarterPost ? null : user ? (
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

      {fileStatus ? (
        <p className="text-sm font-semibold text-slate-600">{fileStatus}</p>
      ) : null}

      <section className="grid gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-normal text-ink">Comments</h2>
          <p className="mt-1 text-sm text-slate-600">Add context, answer questions, or help a classmate out.</p>
        </div>

        <CommentList
          comments={comments}
          filesByCommentId={commentFiles}
          onFileDownload={(file) => openFile(file, 'download')}
          onFilePreview={(file) => openFile(file, 'preview')}
          onReport={user && !isStarterPost ? openReport : undefined}
          reportDisabled={Boolean(user && !canParticipate(user.profile))}
          showReportActions={!isStarterPost}
        />

        {user && !canParticipate(user.profile) ? (
          <BanNotice reason={user.profile.banReason} />
        ) : isStarterPost ? (
          <div className="panel grid gap-3 p-4 sm:p-5">
            <h3 className="text-base font-semibold text-ink">Add a comment</h3>
            <p className="text-sm leading-6 text-slate-600">
              Starter posts are read-only. Create a new post if you want to
              continue this conversation.
            </p>
            <Link className="primary-button w-fit" to="/create">
              Create a new post
            </Link>
          </div>
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

            <AttachmentPicker
              disabled={!user || submitting}
              maxFiles={5}
              onChange={setCommentAttachments}
              value={commentAttachments}
            />

            {commentError ? <ErrorState message={commentError} /> : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                {user
                  ? `Posting as ${user.profile.displayName}`
                  : 'Only logged-in users can comment.'}
              </p>
              {user ? (
                <button className="primary-button" type="submit" disabled={submitting}>
                  {submitting ? 'Posting...' : 'Post comment'}
                </button>
              ) : (
                <Link className="primary-button" to="/login">
                  Log in to comment
                </Link>
              )}
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
