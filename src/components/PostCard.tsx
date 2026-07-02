import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { createSignedPreviewUrl } from '../lib/fileApi';
import { classifyFileType } from '../lib/fileValidation';
import { formatRelativeTime, getPreview } from '../lib/format';
import { createReport } from '../lib/forumApi';
import { getPostPath } from '../lib/postSlug';
import { isPostEdited } from '../lib/postDisplay';
import { canParticipate } from '../lib/permissions';
import type { LinkedFile } from '../types/files';
import type { Category, Post, ReportTarget } from '../types/forum';
import { getTextWithReadableLinks } from './LinkedText';
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

function formatFileSize(sizeBytes: number): string {
  if (sizeBytes >= 1024 * 1024) {
    return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(sizeBytes / 1024))} KB`;
}

function getKindLabel(file: LinkedFile): string {
  const kind = classifyFileType(file.displayFilename, file.mimeType);
  if (kind === 'pdf') return 'PDF';
  return kind.charAt(0).toUpperCase() + kind.slice(1);
}

function isImageFile(file: LinkedFile): boolean {
  return classifyFileType(file.displayFilename, file.mimeType) === 'image';
}

function AttachmentPill({ file }: { file: LinkedFile }) {
  return (
    <span
      className="inline-flex max-w-full items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-xs font-semibold text-slate-600"
      title={file.displayFilename}
    >
      <span className="shrink-0 rounded-full bg-brand-50 px-2 py-1 text-brand-700">
        {getKindLabel(file)}
      </span>
      <span className="min-w-0 truncate text-slate-700">
        {file.displayFilename}
      </span>
      <span className="shrink-0 text-slate-400">
        {formatFileSize(file.sizeBytes)}
      </span>
    </span>
  );
}

export function PostCard({ post }: { post: Post }) {
  const { user } = useAuth();
  const attachments = post.attachments ?? [];
  const attachmentKey = attachments
    .map((file) => `${file.id}:${file.updatedAt}`)
    .join('|');
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [reportOpen, setReportOpen] = useState(false);
  const [reportStatus, setReportStatus] = useState<string | null>(null);
  const target: ReportTarget = { type: 'post', postId: post.id };
  const postPath = getPostPath(post);
  const previewedImages = attachments.filter(
    (file) => isImageFile(file) && previewUrls[file.id],
  );
  const listedAttachments = attachments.filter((file) => !previewUrls[file.id]);

  useEffect(() => {
    let isActive = true;
    const imageAttachments = attachments.filter(isImageFile);

    if (!user || imageAttachments.length === 0) {
      setPreviewUrls({});
      return () => {
        isActive = false;
      };
    }

    async function loadPreviewUrls() {
      const nextPreviewUrls: Record<string, string> = {};

      for (const file of imageAttachments) {
        try {
          const signedUrl = await createSignedPreviewUrl(file.id, user);
          nextPreviewUrls[file.id] = signedUrl.url;
        } catch {
          nextPreviewUrls[file.id] = '';
        }
      }

      if (isActive) {
        setPreviewUrls(nextPreviewUrls);
      }
    }

    void loadPreviewUrls();

    return () => {
      isActive = false;
    };
  }, [attachmentKey, user]);

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
    <article className="panel relative overflow-hidden transition hover:-translate-y-0.5 hover:border-brand-100 hover:shadow-soft">
      <div className="flex flex-col gap-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
          <span className={`badge ${categoryStyles[post.category]}`}>
            {post.category}
          </span>
          {post.isAnonymous ? (
            <span className="badge bg-slate-100 text-slate-700">Anonymous</span>
          ) : null}
          <span aria-hidden="true" className="text-slate-400">·</span>
          <span>{formatRelativeTime(post.createdAt)}</span>
          {isPostEdited(post) ? (
            <span className="badge bg-slate-100 text-slate-600">Edited</span>
          ) : null}
        </div>

        <Link to={postPath} className="group block min-w-0">
          <h2 className="break-words text-2xl font-bold leading-tight tracking-normal text-ink group-hover:text-brand-700">
            {post.title}
          </h2>
          <p className="mt-3 min-w-0 break-words text-base leading-7 text-slate-600 [overflow-wrap:anywhere]">
            {getPreview(getTextWithReadableLinks(post.content))}
          </p>
        </Link>

        {attachments.length > 0 ? (
          <div className="grid gap-3 rounded-lg border border-line bg-slate-50 p-3">
            <span className="text-xs font-semibold uppercase text-slate-500">
              Attachments
            </span>
            {previewedImages.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {previewedImages.map((file) => (
                  <figure className="grid gap-2" key={file.id}>
                    <img
                      alt={`${file.displayFilename} preview`}
                      className="h-40 w-full rounded-lg border border-line bg-white object-cover"
                      loading="lazy"
                      src={previewUrls[file.id]}
                    />
                    <figcaption className="flex min-w-0 flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                      <span className="min-w-0 truncate text-slate-700">
                        {file.displayFilename}
                      </span>
                      <span className="shrink-0">
                        {formatFileSize(file.sizeBytes)}
                      </span>
                    </figcaption>
                  </figure>
                ))}
              </div>
            ) : null}
            {listedAttachments.length > 0 ? (
              <div className="flex min-w-0 flex-wrap gap-2">
                {listedAttachments.map((file) => (
                  <AttachmentPill file={file} key={file.id} />
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div
            aria-label="Post metadata"
            className="flex min-w-0 flex-wrap items-center gap-2 text-sm text-slate-500"
          >
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
          <div
            aria-label="Post actions"
            className="flex flex-wrap items-center gap-2"
          >
            <Link
              className="rounded-full border border-brand-100 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 transition hover:border-brand-200 hover:bg-brand-100 hover:text-ink focus:outline-none focus:ring-4 focus:ring-brand-100"
              to={`${postPath}#comments`}
            >
              Comment
            </Link>
            {user ? (
              <button
                className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50 hover:text-red-800 focus:outline-none focus:ring-4 focus:ring-red-100"
                onClick={openReport}
                type="button"
              >
                Report
              </button>
            ) : (
              <Link
                className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-brand-100 hover:bg-brand-50 hover:text-ink focus:outline-none focus:ring-4 focus:ring-brand-100"
                to="/login"
              >
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
