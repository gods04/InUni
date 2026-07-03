import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { BanNotice } from '../components/BanNotice';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { FileList } from '../components/FileList';
import { LoadingState } from '../components/LoadingState';
import { LoginPrompt } from '../components/LoginPrompt';
import { Seo } from '../components/Seo';
import { UctVerifiedBadge } from '../components/UctVerifiedBadge';
import { UserAvatar } from '../components/UserAvatar';
import { useAuth } from '../hooks/useAuth';
import {
  createSignedDownloadUrl,
  deleteFile as deleteUploadedFile,
  getUserFiles,
} from '../lib/fileApi';
import { deletePost, getUserPosts, updatePost } from '../lib/forumApi';
import { getPreview } from '../lib/format';
import { getPostPath } from '../lib/postSlug';
import { canParticipate } from '../lib/permissions';
import { validatePost } from '../lib/validation';
import type { LinkedFile } from '../types/files';
import { categories, type Category, type Post, type UpdatePostInput } from '../types/forum';

export function ProfilePage() {
  const {
    user,
    isDemoMode,
    updateDisplayName,
    uploadProfilePhoto,
  } = useAuth();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<LinkedFile[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [filesError, setFilesError] = useState<string | null>(null);
  const [filesStatus, setFilesStatus] = useState<string | null>(null);
  const [fileToDelete, setFileToDelete] = useState<LinkedFile | null>(null);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [profileBusy, setProfileBusy] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileStatus, setProfileStatus] = useState<string | null>(null);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<UpdatePostInput>({
    title: '',
    content: '',
    category: 'General',
    isAnonymous: false,
  });
  const [savingPostId, setSavingPostId] = useState<string | null>(null);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);
  const [postActionError, setPostActionError] = useState<string | null>(null);
  const [postActionStatus, setPostActionStatus] = useState<string | null>(null);

  useEffect(() => {
    setDisplayName(user?.profile.displayName ?? '');
  }, [user?.profile.displayName]);

  useEffect(() => {
    let isActive = true;

    async function loadUserPosts() {
      if (!user) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const nextPosts = await getUserPosts(user.id);
        if (isActive) {
          setPosts(nextPosts);
        }
      } catch (caughtError) {
        if (isActive) {
          setError(caughtError instanceof Error ? caughtError.message : 'Could not load your posts.');
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    void loadUserPosts();

    return () => {
      isActive = false;
    };
  }, [user]);

  useEffect(() => {
    let isActive = true;

    async function loadUserFiles() {
      if (!user) {
        return;
      }

      setFilesLoading(true);
      setFilesError(null);

      try {
        const nextFiles = await getUserFiles(user.id);
        if (isActive) {
          setFiles(nextFiles);
        }
      } catch (caughtError) {
        if (isActive) {
          setFilesError(
            caughtError instanceof Error
              ? caughtError.message
              : 'Could not load your files.',
          );
        }
      } finally {
        if (isActive) {
          setFilesLoading(false);
        }
      }
    }

    void loadUserFiles();

    return () => {
      isActive = false;
    };
  }, [user]);

  async function openFile(file: LinkedFile, target: 'download' | 'preview') {
    setFilesStatus(null);

    if (!user) return;

    if (!canParticipate(user.profile)) {
      setFilesStatus('Your restricted account cannot download files.');
      return;
    }

    const signedUrl = await createSignedDownloadUrl(file.id, user);
    if (target === 'preview') {
      window.open(signedUrl.url, '_blank', 'noopener,noreferrer');
      return;
    }

    window.location.assign(signedUrl.url);
  }

  async function confirmDeleteFile() {
    if (!user || !fileToDelete) return;

    setDeletingFileId(fileToDelete.id);
    setFilesError(null);
    setFilesStatus(null);

    try {
      await deleteUploadedFile(fileToDelete.id, user);
      setFiles((current) =>
        current.filter((file) => file.id !== fileToDelete.id),
      );
      setFileToDelete(null);
      setFilesStatus('File deleted.');
    } catch (caughtError) {
      setFilesError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Could not delete this file.',
      );
    } finally {
      setDeletingFileId(null);
    }
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileBusy(true);
    setProfileError(null);
    setProfileStatus(null);

    try {
      const result = await updateDisplayName(displayName);
      if (result.error) {
        setProfileError(result.error);
        return;
      }
      setProfileStatus('Profile updated.');
    } finally {
      setProfileBusy(false);
    }
  }

  async function changeProfilePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setPhotoBusy(true);
    setProfileError(null);
    setProfileStatus(null);

    try {
      const result = await uploadProfilePhoto(file);
      if (result.error) {
        setProfileError(result.error);
        return;
      }
      setProfileStatus('Profile photo updated.');
    } finally {
      setPhotoBusy(false);
    }
  }

  function startEditingPost(post: Post) {
    setPostActionError(null);
    setPostActionStatus(null);
    setEditingPostId(post.id);
    setEditDraft({
      title: post.title,
      content: post.content,
      category: post.category,
      isAnonymous: post.isAnonymous,
    });
  }

  function cancelEditingPost() {
    setEditingPostId(null);
    setPostActionError(null);
  }

  async function savePost(event: FormEvent<HTMLFormElement>, post: Post) {
    event.preventDefault();
    setPostActionError(null);
    setPostActionStatus(null);

    if (!user) {
      setPostActionError('Log in before editing a post.');
      return;
    }

    if (post.authorId !== user.id) {
      setPostActionError('You can only edit posts you created.');
      return;
    }

    if (!canParticipate(user.profile)) {
      setPostActionError('Restricted accounts cannot edit posts.');
      return;
    }

    const validationError = validatePost(editDraft);
    if (validationError) {
      setPostActionError(validationError);
      return;
    }

    setSavingPostId(post.id);

    try {
      const updatedPost = await updatePost(
        post.id,
        {
          title: editDraft.title.trim(),
          content: editDraft.content.trim(),
          category: editDraft.category,
          isAnonymous: editDraft.isAnonymous,
        },
        user,
      );
      setPosts((current) =>
        current.map((item) => (item.id === post.id ? updatedPost : item)),
      );
      setEditingPostId(null);
      setPostActionStatus('Changes saved.');
    } catch (caughtError) {
      setPostActionError(
        caughtError instanceof Error ? caughtError.message : 'Could not update post.',
      );
    } finally {
      setSavingPostId(null);
    }
  }

  async function confirmDeletePost() {
    if (!user || !postToDelete) return;

    if (postToDelete.authorId !== user.id) {
      setPostActionError('You can only delete posts you created.');
      setPostToDelete(null);
      return;
    }

    setDeletingPostId(postToDelete.id);
    setPostActionError(null);
    setPostActionStatus(null);

    try {
      await deletePost(postToDelete.id, user);
      setPosts((current) =>
        current.filter((post) => post.id !== postToDelete.id),
      );
      setPostToDelete(null);
      setEditingPostId((current) =>
        current === postToDelete.id ? null : current,
      );
      setPostActionStatus('Post deleted.');
    } catch (caughtError) {
      setPostActionError(
        caughtError instanceof Error ? caughtError.message : 'Could not delete post.',
      );
    } finally {
      setDeletingPostId(null);
    }
  }

  if (!user) {
    return (
      <>
        <Seo
          canonicalPath="/profile"
          description="View an InUni account profile."
          noindex
          title="Profile | InUni"
        />
        <LoginPrompt message="Log in to view your profile and posts." />
      </>
    );
  }

  const profileEditingDisabled = user.profile.isBanned;
  const postEditingDisabled = !canParticipate(user.profile);
  const photoActionLabel = user.profile.avatarUrl
    ? 'Change photo'
    : 'Upload profile picture';

  return (
    <div className="grid gap-5">
      <Seo
        canonicalPath="/profile"
        description="View an InUni account profile."
        noindex
        title="Profile | InUni"
      />
      <section className="panel grid gap-4 overflow-hidden p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:p-7">
        <UserAvatar
          name={user.profile.displayName}
          size="lg"
          src={user.profile.avatarUrl}
        />
        <div>
          <p className="text-sm font-semibold text-brand-700">Current user</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-normal text-ink">
            {user.profile.displayName}
          </h1>
          <p className="mt-1 text-sm text-slate-600">{user.email}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {user.profile.isUctVerified ? (
              <UctVerifiedBadge />
            ) : (
              <span className="badge bg-slate-100 text-slate-600">
                Email not UCT verified
              </span>
            )}
            {user.profile.role === 'admin' ? (
              <span className="badge bg-slate-950 text-white">Administrator</span>
            ) : null}
          </div>
          {isDemoMode ? (
            <p className="mt-3 text-sm leading-6 text-amber-800">
              This profile is local demo data. Connect Supabase to use real accounts.
            </p>
          ) : null}
        </div>
        <Link className="primary-button" to="/create">
          Create post
        </Link>
      </section>

      <section className="panel grid gap-4 p-5 sm:p-6">
        <div>
          <h2 className="section-title">Profile details</h2>
          <p className="mt-1 text-sm text-slate-600">
            Choose how your name and photo appear around InUni.
          </p>
        </div>

        {profileEditingDisabled ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900">
            Restricted accounts cannot edit profile details.
          </p>
        ) : null}
        {profileError ? <ErrorState message={profileError} /> : null}
        {profileStatus ? (
          <p className="text-sm font-semibold text-brand-700">
            {profileStatus}
          </p>
        ) : null}

        <form className="grid gap-3 sm:max-w-md" onSubmit={saveProfile}>
          <label
            className="text-sm font-semibold text-slate-700"
            htmlFor="display-name"
          >
            Display name
          </label>
          <input
            className="field-input"
            disabled={profileEditingDisabled || profileBusy}
            id="display-name"
            maxLength={80}
            onChange={(event) => setDisplayName(event.target.value)}
            value={displayName}
          />
          <button
            className="primary-button w-fit"
            disabled={profileEditingDisabled || profileBusy}
            type="submit"
          >
            {profileBusy ? 'Saving...' : 'Save profile'}
          </button>
        </form>

        <div
          aria-label="Profile photo"
          className="grid gap-2 sm:max-w-md"
          role="group"
        >
          <span className="text-sm font-semibold text-slate-700">
            Profile photo
          </span>
          <div className="flex flex-wrap items-center gap-3">
            <input
              accept="image/png,image/jpeg,image/webp"
              aria-label={photoActionLabel}
              className="sr-only"
              disabled={profileEditingDisabled || photoBusy}
              onChange={changeProfilePhoto}
              ref={photoInputRef}
              type="file"
            />
            <button
              className="secondary-button"
              disabled={profileEditingDisabled || photoBusy}
              onClick={() => photoInputRef.current?.click()}
              type="button"
            >
              {photoBusy ? 'Updating...' : photoActionLabel}
            </button>
          </div>
        </div>
      </section>

      {user.profile.isBanned ? (
        <BanNotice reason={user.profile.banReason} />
      ) : null}

      <section className="grid gap-4">
        <div>
          <h2 className="section-title">Your posts</h2>
          <p className="mt-1 text-sm text-slate-600">Posts you created with this account.</p>
        </div>

        {error ? <ErrorState message={error} /> : null}
        {postActionError ? <ErrorState message={postActionError} /> : null}
        {postActionStatus ? (
          <p className="text-sm font-semibold text-brand-700">
            {postActionStatus}
          </p>
        ) : null}
        {loading ? <LoadingState label="Loading your posts..." /> : null}

        {!loading && !error && posts.length === 0 ? (
          <EmptyState
            title="No posts yet"
            message="Create your first InUni post when you are ready."
            action={
              <Link className="primary-button" to="/create">
                Create post
              </Link>
            }
          />
        ) : null}

        {!loading && !error && posts.length > 0 ? (
          <div className="grid gap-4">
            {posts.map((post) => {
              const isEditing = editingPostId === post.id;
              const isOwner = post.authorId === user.id;
              const isSaving = savingPostId === post.id;

              return (
                <article className="panel grid gap-4 p-4 sm:p-5" key={post.id}>
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                        <span className="badge bg-slate-100 text-slate-700">
                          {post.category}
                        </span>
                        {post.isAnonymous ? (
                          <span className="badge bg-slate-100 text-slate-700">
                            Anonymous
                          </span>
                        ) : null}
                        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                      </div>

                      <h3 className="mt-3 break-words text-xl font-semibold tracking-normal text-ink">
                        {post.title}
                      </h3>
                      <p className="mt-2 min-w-0 break-words text-sm leading-6 text-slate-600 [overflow-wrap:anywhere]">
                        {getPreview(post.content)}
                      </p>
                      <p className="mt-3 text-sm text-slate-500">
                        {post.commentCount} comments
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      <Link
                        aria-label={`View ${post.title}`}
                        className="secondary-button"
                        to={getPostPath(post)}
                      >
                        View
                      </Link>
                      {isOwner ? (
                        <>
                          <button
                            aria-label={`Edit ${post.title}`}
                            className="secondary-button"
                            disabled={postEditingDisabled || isSaving}
                            onClick={() => startEditingPost(post)}
                            type="button"
                          >
                            Edit
                          </button>
                          <button
                            aria-label={`Delete ${post.title}`}
                            className="danger-button"
                            disabled={deletingPostId === post.id}
                            onClick={() => setPostToDelete(post)}
                            type="button"
                          >
                            Delete
                          </button>
                        </>
                      ) : null}
                    </div>
                  </div>

                  {isEditing ? (
                    <form
                      className="grid gap-4 border-t border-line pt-4"
                      onSubmit={(event) => void savePost(event, post)}
                    >
                      <label className="grid gap-2">
                        <span className="field-label">Title</span>
                        <input
                          className="field-input"
                          disabled={isSaving}
                          maxLength={120}
                          onChange={(event) =>
                            setEditDraft((current) => ({
                              ...current,
                              title: event.target.value,
                            }))
                          }
                          value={editDraft.title}
                        />
                      </label>

                      <label className="grid gap-2">
                        <span className="field-label">Category</span>
                        <select
                          className="field-input"
                          disabled={isSaving}
                          onChange={(event) =>
                            setEditDraft((current) => ({
                              ...current,
                              category: event.target.value as Category,
                            }))
                          }
                          value={editDraft.category}
                        >
                          {categories.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="grid gap-2">
                        <span className="field-label">Content</span>
                        <textarea
                          className="field-input min-h-36 resize-y"
                          disabled={isSaving}
                          onChange={(event) =>
                            setEditDraft((current) => ({
                              ...current,
                              content: event.target.value,
                            }))
                          }
                          value={editDraft.content}
                        />
                      </label>

                      <label className="flex items-start gap-3 rounded-lg border border-line bg-slate-50 p-3">
                        <input
                          checked={editDraft.isAnonymous}
                          className="mt-1 h-4 w-4 accent-brand-700"
                          disabled={isSaving}
                          onChange={(event) =>
                            setEditDraft((current) => ({
                              ...current,
                              isAnonymous: event.target.checked,
                            }))
                          }
                          type="checkbox"
                        />
                        <span className="text-sm font-semibold text-slate-700">
                          Post anonymously
                        </span>
                      </label>

                      <div className="flex flex-wrap justify-end gap-2">
                        <button
                          className="secondary-button"
                          disabled={isSaving}
                          onClick={cancelEditingPost}
                          type="button"
                        >
                          Cancel
                        </button>
                        <button
                          className="primary-button"
                          disabled={isSaving}
                          type="submit"
                        >
                          {isSaving ? 'Saving...' : 'Save changes'}
                        </button>
                      </div>
                    </form>
                  ) : null}
                </article>
              );
            })}
          </div>
        ) : null}
      </section>

      <section className="grid gap-4">
        <div>
          <h2 className="section-title">My uploaded files</h2>
          <p className="mt-1 text-sm text-slate-600">
            Files you uploaded that still exist on InUni.
          </p>
        </div>

        {filesStatus ? (
          <p className="text-sm font-semibold text-slate-600">{filesStatus}</p>
        ) : null}
        {filesError ? <ErrorState message={filesError} /> : null}
        {filesLoading ? <LoadingState label="Loading your files..." /> : null}
        {!filesLoading && !filesError ? (
          <FileList
            emptyMessage="No uploaded files yet."
            files={files}
            onDelete={setFileToDelete}
            onDownload={(file) => openFile(file, 'download')}
            onPreview={(file) => openFile(file, 'preview')}
          />
        ) : null}
      </section>
      <ConfirmDialog
        busy={Boolean(postToDelete && deletingPostId === postToDelete.id)}
        confirmLabel="Delete post"
        destructive
        message={
          postToDelete
            ? `Delete "${postToDelete.title}"? This removes it from the public forum.`
            : ''
        }
        onCancel={() => setPostToDelete(null)}
        onConfirm={confirmDeletePost}
        open={Boolean(postToDelete)}
        title="Delete post?"
      />
      <ConfirmDialog
        busy={Boolean(fileToDelete && deletingFileId === fileToDelete.id)}
        confirmLabel="Delete file"
        destructive
        message={
          fileToDelete
            ? `Delete "${fileToDelete.displayFilename}"? This removes it from posts, comments, and Shared Files.`
            : ''
        }
        onCancel={() => setFileToDelete(null)}
        onConfirm={confirmDeleteFile}
        open={Boolean(fileToDelete)}
        title="Delete file?"
      />
    </div>
  );
}
