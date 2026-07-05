import { useEffect, useState } from 'react';
import { Layers3, MessageCircle, Plus, Search, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BrandLogo } from '../components/BrandLogo';
import { CategoryTabs } from '../components/CategoryTabs';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { PostCard } from '../components/PostCard';
import { Seo } from '../components/Seo';
import { useAuth } from '../hooks/useAuth';
import { getFilesForPost } from '../lib/fileApi';
import { getPosts } from '../lib/forumApi';
import { categoryDescriptions, type Category, type CategoryFilter, type Post } from '../types/forum';

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function HomePage() {
  const { user } = useAuth();
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
  const totalReplies = posts.reduce((total, post) => total + post.commentCount, 0);
  const activeSections = new Set(posts.map((post) => post.category)).size;
  const trendingPosts = [...posts]
    .sort((first, second) => second.commentCount - first.commentCount)
    .slice(0, 4);

  function searchTrendingPost(post: Post) {
    setCategory('All');
    setSearchQuery(post.title);
  }

  function getCategorySummary() {
    if (normalizedSearchQuery) {
      return 'Search is scanning across the loaded campus conversations.';
    }

    if (category === 'All') {
      return 'A calm scan of the newest useful posts across campus.';
    }

    return categoryDescriptions[category];
  }

  useEffect(() => {
    let isActive = true;

    async function loadPosts() {
      setLoading(true);
      setError(null);

      try {
        const nextPosts = await getPosts(category === 'All' ? undefined : (category as Category));
        const postsWithAttachments = user
          ? await Promise.all(
              nextPosts.map(async (post) => {
                try {
                  return {
                    ...post,
                    attachments: await getFilesForPost(post.id),
                  };
                } catch {
                  return {
                    ...post,
                    attachments: [],
                  };
                }
              }),
            )
          : nextPosts;

        if (isActive) {
          setPosts(postsWithAttachments);
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
  }, [category, user?.id]);

  return (
    <div className="grid gap-6">
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
      <section className="panel overflow-hidden">
        <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-center">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <BrandLogo
                aria-hidden="true"
                className="h-11 w-11 shrink-0 rounded-lg object-contain"
                variant="mark"
              />
              <span className="rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                UCT student forum
              </span>
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-normal text-ink sm:text-4xl">
              UCT community forum
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
              Questions, campus updates, academic help, and honest student conversations.
            </p>
          </div>

          <div className="grid gap-3 rounded-lg border border-line bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-slate-700">
                Live pulse
              </span>
              <Users aria-hidden="true" className="h-5 w-5 text-brand-700" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-2xl font-semibold text-ink">
                  {posts.length}
                </p>
                <p className="text-xs font-semibold text-slate-500">
                  {pluralize(posts.length, 'post')}
                </p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-ink">
                  {activeSections}
                </p>
                <p className="text-xs font-semibold text-slate-500">
                  {pluralize(activeSections, 'section')}
                </p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-ink">
                  {totalReplies}
                </p>
                <p className="text-xs font-semibold text-slate-500">
                  {pluralize(totalReplies, 'reply', 'replies')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="grid min-w-0 gap-4">
          <div className="panel grid gap-3 p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <label className="relative min-w-0">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              />
              <span className="sr-only">Search posts</span>
              <input
                aria-label="Search posts"
                className="field-input pl-9"
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search campus topics"
                type="search"
                value={searchQuery}
              />
            </label>
            <Link className="primary-button gap-2" to="/create">
              <Plus aria-hidden="true" className="h-4 w-4" />
              Create post
            </Link>
          </div>

          <CategoryTabs value={category} onChange={setCategory} />

          <p className="panel px-4 py-3 text-sm leading-6 text-slate-600">
            {getCategorySummary()}
          </p>

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
            <div className="grid gap-3">
              {visiblePosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : null}
        </div>

        <aside className="panel grid h-fit gap-3 p-4">
          <div className="flex items-center gap-2">
            <Layers3 aria-hidden="true" className="h-4 w-4 text-brand-700" />
            <h2 className="text-base font-semibold text-ink">Trending now</h2>
          </div>
          <div className="grid gap-2">
            {trendingPosts.map((post) => (
              <button
                aria-label={post.title}
                className="flex min-h-12 items-center justify-between gap-3 rounded-lg border border-line bg-slate-50 px-3 py-2 text-left text-sm font-semibold text-slate-700 transition hover:border-brand-100 hover:bg-brand-50 hover:text-ink"
                key={post.id}
                onClick={() => searchTrendingPost(post)}
                title={post.title}
                type="button"
              >
                <span className="line-clamp-2 min-w-0">{post.title}</span>
                <span className="inline-flex shrink-0 items-center gap-1 text-xs text-slate-500">
                  <MessageCircle aria-hidden="true" className="h-4 w-4" />
                  {post.commentCount}
                </span>
              </button>
            ))}
          </div>
        </aside>
      </section>
    </div>
  );
}
