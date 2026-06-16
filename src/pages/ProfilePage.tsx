import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BanNotice } from '../components/BanNotice';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { FileList } from '../components/FileList';
import { LoadingState } from '../components/LoadingState';
import { LoginPrompt } from '../components/LoginPrompt';
import { PostCard } from '../components/PostCard';
import { UctVerifiedBadge } from '../components/UctVerifiedBadge';
import { useAuth } from '../hooks/useAuth';
import { createSignedDownloadUrl, getUserFiles } from '../lib/fileApi';
import { getUserPosts } from '../lib/forumApi';
import { canParticipate, isUctVerifiedEmail } from '../lib/permissions';
import type { LinkedFile } from '../types/files';
import type { Post } from '../types/forum';

export function ProfilePage() {
  const { user, isDemoMode } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<LinkedFile[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [filesError, setFilesError] = useState<string | null>(null);
  const [filesStatus, setFilesStatus] = useState<string | null>(null);

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

    const signedUrl = await createSignedDownloadUrl(file.id);
    if (target === 'preview') {
      window.open(signedUrl.url, '_blank', 'noopener,noreferrer');
      return;
    }

    window.location.assign(signedUrl.url);
  }

  if (!user) {
    return <LoginPrompt message="Log in to view your profile and posts." />;
  }

  return (
    <div className="grid gap-5">
      <section className="panel grid gap-4 overflow-hidden p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:p-7">
        <img src="/brand/inuni-logo-mark-dark.png" alt="" className="h-20 w-20 rounded-lg bg-brand-50 object-contain p-2" />
        <div>
          <p className="text-sm font-semibold text-brand-700">Current user</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-normal text-ink">
            {user.profile.displayName}
          </h1>
          <p className="mt-1 text-sm text-slate-600">{user.email}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {isUctVerifiedEmail(user.email, user.emailConfirmed) ? (
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

      {user.profile.isBanned ? (
        <BanNotice reason={user.profile.banReason} />
      ) : null}

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
            onDownload={(file) => openFile(file, 'download')}
            onPreview={(file) => openFile(file, 'preview')}
          />
        ) : null}
      </section>

      <section className="grid gap-4">
        <div>
          <h2 className="section-title">Your posts</h2>
          <p className="mt-1 text-sm text-slate-600">Posts you created with this account.</p>
        </div>

        {error ? <ErrorState message={error} /> : null}
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
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
