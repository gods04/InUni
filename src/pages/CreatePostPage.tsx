import { useState } from 'react';
import type { FormEvent } from 'react';
import { MessageSquarePlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AttachmentPicker } from '../components/AttachmentPicker';
import { BanNotice } from '../components/BanNotice';
import { ErrorState } from '../components/ErrorState';
import { LoginPrompt } from '../components/LoginPrompt';
import { PageHeader } from '../components/PageHeader';
import { Seo } from '../components/Seo';
import { useAuth } from '../hooks/useAuth';
import { uploadLinkedFiles } from '../lib/fileApi';
import { createPost } from '../lib/forumApi';
import { getPostPath } from '../lib/postSlug';
import { canParticipate } from '../lib/permissions';
import { validatePost } from '../lib/validation';
import type { FileUploadDraft } from '../types/files';
import { categories, categoryDescriptions, type Category } from '../types/forum';

export function CreatePostPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<Category>('General');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [attachments, setAttachments] = useState<FileUploadDraft[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!user) {
      setError('Log in before creating a post.');
      return;
    }

    const validationError = validatePost({ title, content });
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);

    try {
      const post = await createPost(
        {
          title: title.trim(),
          content: content.trim(),
          category,
          isAnonymous,
        },
        user,
      );

      if (attachments.length > 0) {
        await uploadLinkedFiles({ type: 'post', postId: post.id }, attachments, user);
      }

      navigate(getPostPath(post));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Could not create post.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!user) {
    return (
      <>
        <Seo
          canonicalPath="/create"
          description="Create an InUni post."
          noindex
          title="Create post | InUni"
        />
        <LoginPrompt message="Log in or create an account before posting to InUni." />
      </>
    );
  }

  if (!canParticipate(user.profile)) {
    return <BanNotice reason={user.profile.banReason} />;
  }

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-5">
      <Seo
        canonicalPath="/create"
        description="Create an InUni post."
        noindex
        title="Create post | InUni"
      />
      <PageHeader
        description="Share something useful, ask a question, or post with front-end anonymity while keeping account-level accountability."
        eyebrow="Start a conversation"
        icon={MessageSquarePlus}
        title="Create post"
      />

      <form className="panel grid gap-5 p-5 sm:p-7" onSubmit={handleSubmit}>
        <label className="grid gap-2">
          <span className="field-label">Title</span>
          <input
            className="field-input"
            maxLength={120}
            placeholder="What do you want to discuss?"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>

        <div className="grid gap-2">
          <label className="field-label" htmlFor="post-category">
            Category
          </label>
          <p className="text-sm leading-6 text-slate-600">
            Pick the right section before you post.
          </p>
          <select
            aria-describedby="post-category-description"
            className="field-input"
            id="post-category"
            value={category}
            onChange={(event) => setCategory(event.target.value as Category)}
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <span
            className="text-sm leading-6 text-slate-600"
            id="post-category-description"
          >
            {categoryDescriptions[category]}
          </span>
        </div>

        <label className="grid gap-2">
          <span className="field-label">Content</span>
          <textarea
            className="field-input min-h-44 resize-y"
            placeholder="Write the full post..."
            value={content}
            onChange={(event) => setContent(event.target.value)}
          />
        </label>

        <label className="flex items-start gap-3 rounded-lg border border-brand-100 bg-brand-50 p-4">
          <input
            className="mt-1 h-4 w-4 accent-brand-700"
            type="checkbox"
            checked={isAnonymous}
            onChange={(event) => setIsAnonymous(event.target.checked)}
          />
          <span>
            <span className="block text-sm font-bold text-slate-900">Post anonymously</span>
            <span className="mt-1 block text-sm leading-6 text-slate-600">
              Your account still owns the post in the database, but other students see "Anonymous".
            </span>
          </span>
        </label>

        <AttachmentPicker
          disabled={submitting}
          onChange={setAttachments}
          value={attachments}
        />

        {error ? <ErrorState message={error} /> : null}

        <div className="flex justify-end">
          <button className="primary-button" type="submit" disabled={submitting}>
            {submitting ? 'Publishing...' : 'Publish post'}
          </button>
        </div>
      </form>
    </div>
  );
}
