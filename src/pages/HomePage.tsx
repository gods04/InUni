import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdSlot } from '../components/AdSlot';
import { CategoryTabs } from '../components/CategoryTabs';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { PostCard } from '../components/PostCard';
import { getPosts } from '../lib/forumApi';
import type { Category, CategoryFilter, Post } from '../types/forum';

export function HomePage() {
  const [category, setCategory] = useState<CategoryFilter>('All');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadPosts() {
      setLoading(true);
      setError(null);

      try {
        const nextPosts = await getPosts(category === 'All' ? undefined : (category as Category));
        if (isActive) {
          setPosts(nextPosts);
        }
      } catch (caughtError) {
        if (isActive) {
          setError(caughtError instanceof Error ? caughtError.message : 'Could not load posts.');
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    void loadPosts();

    return () => {
      isActive = false;
    };
  }, [category]);

  return (
    <>
      <section className="panel grid overflow-hidden bg-white/82 sm:grid-cols-[1fr_260px]">
        <div className="p-5 sm:p-7">
          <img
            src="/brand/inuni-logo-horizontal-dark.png"
            alt="InUni"
            className="h-24 w-auto max-w-full object-contain sm:h-28"
          />
          <p className="text-sm font-bold text-emerald-700">Student conversations, sorted simply.</p>
          <h1 className="sr-only">InUni</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
            Ask questions, share campus updates, post lost items, or talk anonymously when you need a little
            room.
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold text-slate-600">
            <span className="rounded-full bg-emerald-50 px-3 py-2 text-emerald-800">Study help</span>
            <span className="rounded-full bg-sky-50 px-3 py-2 text-sky-800">Campus life</span>
            <span className="rounded-full bg-amber-50 px-3 py-2 text-amber-900">Lost & Found</span>
          </div>
        </div>
        <div className="flex flex-col justify-between gap-5 border-t border-slate-100 bg-slate-950 p-5 text-white sm:border-l sm:border-t-0 sm:p-6">
          <img
            src="/brand/inuni-logo-mark-dark.png"
            alt=""
            className="h-28 w-28 rounded-lg bg-[#f8fbf5] object-contain p-3"
          />
          <div>
            <p className="text-sm leading-6 text-slate-300">Start useful conversations without turning the forum into noise.</p>
            <Link className="primary-button mt-4 bg-emerald-500 text-slate-950 hover:bg-emerald-400" to="/create">
              Create post
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="section-title">Home feed</h2>
              <p className="mt-1 text-sm text-slate-600">Browse the latest posts from your university.</p>
            </div>
            <CategoryTabs value={category} onChange={setCategory} />
          </div>

          {error ? <ErrorState message={error} /> : null}
          {loading ? <LoadingState label="Loading posts..." /> : null}
          {!loading && !error && posts.length === 0 ? (
            <EmptyState
              title="No posts here yet"
              message="Start the first conversation in this category."
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
        </div>

        <div className="space-y-4 lg:sticky lg:top-28">
          <AdSlot />
          <AdSlot label="Sponsored" size="300 x 100" />
        </div>
      </section>
    </>
  );
}
