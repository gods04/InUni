import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Clock3,
  MessageCircle,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Users,
} from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';
import { categoryDescriptions, type Category, type CategoryFilter } from '../types/forum';

interface DemoPost {
  id: string;
  title: string;
  category: Category;
  authorName: string;
  excerpt: string;
  comments: number;
  timeLabel: string;
  tags: string[];
  isAnonymous?: boolean;
  isVerified?: boolean;
}

const demoPosts: DemoPost[] = [
  {
    id: 'writing-centre',
    title: 'Writing Centre before essay deadlines: worth it?',
    category: 'Academics',
    authorName: 'Maya',
    excerpt:
      'I booked a slot for argument structure instead of proofreading. The feedback was much more useful when I brought the rubric and a messy draft.',
    comments: 18,
    timeLabel: '12 min ago',
    tags: ['Essays', 'Feedback'],
    isVerified: true,
  },
  {
    id: 'tutorial-crush',
    title: 'I like someone from my tutorial and it is getting obvious',
    category: 'Confessions',
    authorName: 'Anonymous',
    excerpt:
      'I need advice from people who have survived a semester-long tutorial crush without making group work impossible.',
    comments: 34,
    timeLabel: '28 min ago',
    tags: ['Social life', 'Tutorials'],
    isAnonymous: true,
    isVerified: true,
  },
  {
    id: 'shuttle-after-seven',
    title: 'Has the shuttle app been reliable after 7pm?',
    category: 'Questions',
    authorName: 'Noah',
    excerpt:
      'The ETA looked frozen twice this week. Are people still trusting it for late campus routes, or should I plan around the printed timetable?',
    comments: 11,
    timeLabel: '43 min ago',
    tags: ['Transport', 'Safety'],
    isVerified: true,
  },
  {
    id: 'society-open-practice',
    title: 'Beginner-friendly society events this week',
    category: 'Campus Life',
    authorName: 'Priya',
    excerpt:
      'Looking for events where arriving alone does not feel awkward. Bonus points for anything with a clear activity instead of only mingling.',
    comments: 9,
    timeLabel: '1 hr ago',
    tags: ['Societies', 'Events'],
  },
];

const featuredTopics = [
  'Exam study spaces',
  'Shuttle updates',
  'Course rules',
  'Confessions',
];

const categories: CategoryFilter[] = [
  'All',
  'Academics',
  'Campus Life',
  'Questions',
  'Confessions',
];

const categoryStyles: Record<Category, string> = {
  Academics: 'bg-emerald-50 text-emerald-800',
  'Campus Life': 'bg-brand-50 text-brand-700',
  Questions: 'bg-indigo-50 text-indigo-700',
  'Lost & Found': 'bg-amber-50 text-amber-800',
  Confessions: 'bg-rose-50 text-rose-700',
  General: 'bg-slate-100 text-slate-700',
};

function matchesSearch(post: DemoPost, searchQuery: string) {
  const normalized = searchQuery.trim().toLowerCase();
  if (!normalized) return true;

  return [
    post.title,
    post.excerpt,
    post.category,
    post.authorName,
    ...post.tags,
  ].some((value) => value.toLowerCase().includes(normalized));
}

function getCategoryDescription(category: CategoryFilter) {
  if (category === 'All') {
    return 'A calm scan of the newest useful posts across campus.';
  }

  return categoryDescriptions[category];
}

function DemoPostCard({ post, index }: { post: DemoPost; index: number }) {
  return (
    <article
      aria-labelledby={`${post.id}-title`}
      className="forum-demo-card group min-w-0 rounded-lg border border-line bg-panel p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-brand-100 hover:shadow-soft sm:p-5"
      style={{ '--card-index': index } as React.CSSProperties}
    >
      <div className="flex min-w-0 items-start gap-3">
        <div className="mt-1 hidden h-10 w-1 shrink-0 rounded-full bg-brand-100 group-hover:bg-brand-600 sm:block" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
            <span className={`badge ${categoryStyles[post.category]}`}>
              {post.category}
            </span>
            {post.isAnonymous ? (
              <span className="badge bg-slate-100 text-slate-700">
                Anonymous
              </span>
            ) : null}
            {post.isVerified ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
                <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" />
                UCT Verified
              </span>
            ) : null}
          </div>

          <Link className="mt-3 block min-w-0" to="/">
            <h2
              className="break-words text-xl font-semibold leading-snug text-ink transition group-hover:text-brand-700 sm:text-2xl"
              id={`${post.id}-title`}
            >
              {post.title}
            </h2>
            <p className="mt-2 min-w-0 break-words text-sm leading-7 text-slate-600 [overflow-wrap:anywhere] sm:text-base">
              {post.excerpt}
            </p>
          </Link>

          <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm text-slate-500">
              <span className="font-semibold text-slate-700">
                {post.authorName}
              </span>
              <span aria-hidden="true">·</span>
              <Clock3 aria-hidden="true" className="h-4 w-4" />
              <span>{post.timeLabel}</span>
              <span aria-hidden="true">·</span>
              <MessageCircle aria-hidden="true" className="h-4 w-4" />
              <span>{post.comments} comments</span>
            </div>
            <div className="flex min-w-0 flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  className="rounded-full border border-line px-2.5 py-1 text-xs font-semibold text-slate-500"
                  key={tag}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export function ForumDemoPage() {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const filteredPosts = useMemo(() => {
    const hasSearch = searchQuery.trim().length > 0;

    return demoPosts.filter((post) => {
      if (hasSearch) return matchesSearch(post, searchQuery);
      if (activeCategory === 'All') return true;
      return post.category === activeCategory;
    });
  }, [activeCategory, searchQuery]);

  return (
    <div className="forum-demo-shell grid gap-6">
      <section className="forum-demo-surface overflow-hidden rounded-lg border border-line bg-panel shadow-soft">
        <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-center">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <BrandLogo
                aria-hidden="true"
                className="h-11 w-11 rounded-lg object-contain"
                variant="mark"
              />
              <span className="rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                Forum UI demo
              </span>
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-normal text-ink sm:text-4xl">
              UCT community forum
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
              A calmer feed for campus questions, academic help, confessions, and useful student conversations.
            </p>
          </div>

          <div className="grid gap-3 rounded-lg border border-line bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-slate-700">
                Live pulse
              </span>
              <Users aria-hidden="true" className="h-5 w-5 text-brand-700" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <p className="text-2xl font-semibold text-ink">24</p>
                <p className="text-xs font-semibold text-slate-500">
                  active
                </p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-ink">8</p>
                <p className="text-xs font-semibold text-slate-500">
                  threads
                </p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-ink">3</p>
                <p className="text-xs font-semibold text-slate-500">
                  urgent
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="grid min-w-0 gap-4">
          <div className="forum-demo-toolbar grid gap-3 rounded-lg border border-line bg-panel p-3 shadow-sm sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <label className="relative min-w-0">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              />
              <span className="sr-only">Search demo posts</span>
              <input
                aria-label="Search demo posts"
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

          <div className="relative max-w-full overflow-hidden">
            <div
              aria-label="Filter demo posts by category"
              className="forum-demo-tabs flex min-w-0 w-full gap-1 overflow-x-auto rounded-lg border border-line bg-panel p-1 pr-10"
              role="group"
            >
              {categories.map((category) => {
                const isActive = activeCategory === category;

                return (
                  <button
                    className={[
                      'shrink-0 rounded-full px-3.5 py-2 text-sm font-semibold transition duration-200',
                      isActive
                        ? 'bg-brand-700 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-ink',
                    ].join(' ')}
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    type="button"
                  >
                    {category}
                  </button>
                );
              })}
            </div>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-1 right-1 w-10 rounded-r-lg bg-gradient-to-l from-panel via-panel/95 to-panel/0 sm:hidden"
            />
          </div>

          <p className="rounded-lg border border-line bg-panel px-4 py-3 text-sm leading-6 text-slate-600">
            {searchQuery.trim()
              ? 'Search is scanning across all demo categories.'
              : getCategoryDescription(activeCategory)}
          </p>

          <div
            aria-label="Forum demo posts"
            className="grid gap-3"
            role="feed"
          >
            {filteredPosts.map((post, index) => (
              <DemoPostCard index={index} key={post.id} post={post} />
            ))}
          </div>
        </div>

        <aside className="grid h-fit gap-3 rounded-lg border border-line bg-panel p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <SlidersHorizontal
              aria-hidden="true"
              className="h-4 w-4 text-brand-700"
            />
            <h2 className="text-sm font-semibold text-ink">Trending now</h2>
          </div>
          <div className="grid gap-2">
            {featuredTopics.map((topic) => (
              <button
                className="flex min-h-10 items-center justify-between gap-3 rounded-lg border border-line bg-slate-50 px-3 py-2 text-left text-sm font-semibold text-slate-700 transition hover:border-brand-100 hover:bg-brand-50 hover:text-ink"
                key={topic}
                onClick={() => setSearchQuery(topic)}
                type="button"
              >
                <span>{topic}</span>
                <BookOpen aria-hidden="true" className="h-4 w-4 shrink-0" />
              </button>
            ))}
          </div>
        </aside>
      </section>
    </div>
  );
}
