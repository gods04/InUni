import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BrandLogo } from '../components/BrandLogo';
import { CategoryTabs } from '../components/CategoryTabs';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { PostCard } from '../components/PostCard';
import { Seo } from '../components/Seo';
import { getPosts } from '../lib/forumApi';
import type { Category, CategoryFilter, Post } from '../types/forum';

export function HomePage() {
  const [category, setCategory] = useState<CategoryFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const visiblePosts = normalizedSearchQuery
    ? posts.filter((post) =>
        [
          post.title,
          post.content,
          post.category,
          post.authorName,
        ].some((value) => value.toLowerCase().includes(normalizedSearchQuery)),
      )
    : posts;

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
      <Seo
        canonicalPath="/"
        description="InUni is a UCT student forum for campus questions, study help, handbooks, shared files, and student conversations."
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          description:
            'A UCT student forum for campus questions, study help, handbooks, shared files, and student conversations.',
          name: 'InUni',
          url: 'https://inuni.co.za/',
        }}
        title="InUni | UCT Student Forum"
      />
      <section className="flex flex-col gap-5 border-b border-line pb-7 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <BrandLogo
            aria-hidden="true"
            className="h-14 w-14 shrink-0 rounded-lg object-contain"
            variant="mark"
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
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(16rem,22rem)] sm:items-end">
            <div>
              <h2 className="section-title">Latest conversations</h2>
              <p className="mt-1 text-sm text-slate-600">
                Browse the newest posts from the UCT community.
              </p>
            </div>
            <label className="grid gap-2">
              <span className="field-label">Search posts</span>
              <input
                aria-label="Search posts"
                className="field-input"
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Title, topic, category, or author"
                type="search"
                value={searchQuery}
              />
            </label>
          </div>
          <CategoryTabs value={category} onChange={setCategory} />
        </div>

        {error ? <ErrorState message={error} /> : null}
        {loading ? <LoadingState label="Loading posts..." /> : null}
        {!loading && !error && visiblePosts.length === 0 ? (
          <EmptyState
            title={normalizedSearchQuery ? 'No posts found' : 'No posts here yet'}
            message={
              normalizedSearchQuery
                ? 'Try another search or category.'
                : 'Start the first conversation in this category.'
            }
            action={
              normalizedSearchQuery ? undefined : (
                <Link className="primary-button" to="/create">
                  Create post
                </Link>
              )
            }
          />
        ) : null}

        {!loading && !error && visiblePosts.length > 0 ? (
          <div className="grid gap-4">
            {visiblePosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
