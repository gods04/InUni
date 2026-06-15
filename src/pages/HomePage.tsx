import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
    <div className="grid gap-7">
      <section className="flex flex-col gap-5 border-b border-line pb-7 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <img
            src="/brand/inuni-logo-mark-dark.png"
            alt=""
            className="h-14 w-14 shrink-0 object-contain"
          />
          <div>
            <h1 className="text-2xl font-semibold text-ink">
              UCT community forum
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
              Questions, campus updates, study help, and honest student conversations.
            </p>
          </div>
        </div>
        <Link className="primary-button shrink-0" to="/create">
          Create post
        </Link>
      </section>

      <section className="space-y-4">
        <div className="grid gap-4">
          <div>
            <h2 className="section-title">Latest conversations</h2>
            <p className="mt-1 text-sm text-slate-600">
              Browse the newest posts from the UCT community.
            </p>
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
      </section>
    </div>
  );
}
