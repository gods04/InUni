import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BanNotice } from '../components/BanNotice';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { LoginPrompt } from '../components/LoginPrompt';
import { PostCard } from '../components/PostCard';
import { UctVerifiedBadge } from '../components/UctVerifiedBadge';
import { useAuth } from '../hooks/useAuth';
import { getUserPosts } from '../lib/forumApi';
import { isUctVerifiedEmail } from '../lib/permissions';
import type { Post } from '../types/forum';

export function ProfilePage() {
  const { user, isDemoMode } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  if (!user) {
    return <LoginPrompt message="Log in to view your profile and posts." />;
  }

  return (
    <div className="grid gap-5">
      <section className="panel grid gap-4 overflow-hidden p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:p-7">
        <img src="/brand/inuni-logo-mark-dark.png" alt="" className="h-20 w-20 rounded-lg bg-emerald-50 object-contain p-2" />
        <div>
          <p className="text-sm font-bold text-emerald-700">Current user</p>
          <h1 className="mt-1 text-2xl font-black tracking-normal text-slate-950">
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
