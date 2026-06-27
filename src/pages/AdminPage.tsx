import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ErrorState } from '../components/ErrorState';
import { FileReviewCountBadge } from '../components/FileReviewCountBadge';
import { LoadingState } from '../components/LoadingState';
import { Seo } from '../components/Seo';
import {
  getAdminDashboardMetrics,
  type AdminDashboardActivityItem,
  type AdminDashboardMetrics,
} from '../lib/adminDashboardApi';

interface MetricCardProps {
  detail: string;
  label: string;
  value: number;
}

function MetricCard({ detail, label, value }: MetricCardProps) {
  return (
    <article className="panel p-4">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-normal text-ink">
        {value.toLocaleString()}
      </p>
      <p className="mt-2 text-xs font-medium text-slate-500">{detail}</p>
    </article>
  );
}

function formatActivityTime(createdAt: string): string {
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
  }).format(new Date(createdAt));
}

function ActivityRow({ item }: { item: AdminDashboardActivityItem }) {
  return (
    <li>
      <Link
        className="grid gap-2 border-t border-line py-3 first:border-t-0 sm:grid-cols-[auto_1fr_auto] sm:items-center"
        to={item.href}
      >
        <span className="w-fit rounded-full bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700">
          {item.kind}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-bold text-ink">
            {item.title}
          </span>
          <span className="mt-0.5 block text-sm text-slate-600">
            {item.detail}
          </span>
        </span>
        <span className="text-xs font-semibold text-slate-500">
          {formatActivityTime(item.createdAt)}
        </span>
      </Link>
    </li>
  );
}

export function AdminPage() {
  const [metrics, setMetrics] = useState<AdminDashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void getAdminDashboardMetrics()
      .then((nextMetrics) => {
        if (active) {
          setMetrics(nextMetrics);
        }
      })
      .catch((caughtError) => {
        if (active) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : 'Could not load the admin dashboard.',
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="grid gap-5">
      <Seo
        canonicalPath="/admin"
        description="InUni administrator dashboard."
        noindex
        title="Admin dashboard | InUni"
      />
      <section className="panel flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <p className="text-sm font-semibold text-brand-700">
            Administrator
          </p>
          <h1 className="section-title">Admin dashboard</h1>
          <p className="mt-1 text-sm text-slate-600">
            Monitor traffic, community activity, and moderation health.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className="secondary-button gap-2" to="/admin/reports">
            <span>View reports</span>
            <FileReviewCountBadge
              count={metrics?.openReports ?? 0}
              label="reports need review"
            />
          </Link>
          <Link className="secondary-button gap-2" to="/admin/files">
            <span>View files</span>
            <FileReviewCountBadge count={metrics?.filesNeedReview ?? 0} />
          </Link>
          <Link className="secondary-button" to="/admin/users">
            Manage users
          </Link>
        </div>
      </section>

      {error ? <ErrorState message={error} /> : null}
      {loading ? <LoadingState label="Loading admin dashboard..." /> : null}

      {metrics ? (
        <>
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetricCard
              detail={metrics.trafficSourceLabel}
              label="Visitors today"
              value={metrics.visitorsToday}
            />
            <MetricCard
              detail="App page loads and route changes"
              label="Page views today"
              value={metrics.pageViewsToday}
            />
            <MetricCard
              detail={`${metrics.newUsersToday.toLocaleString()} new today`}
              label="Total users"
              value={metrics.totalUsers}
            />
            <MetricCard
              detail={`${metrics.totalPosts.toLocaleString()} total posts`}
              label="Posts today"
              value={metrics.postsToday}
            />
          </section>

          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetricCard
              detail={`${metrics.totalComments.toLocaleString()} total comments`}
              label="Comments today"
              value={metrics.commentsToday}
            />
            <MetricCard
              detail="Posts and comments awaiting review"
              label="Open reports"
              value={metrics.openReports}
            />
            <MetricCard
              detail={`${metrics.totalFiles.toLocaleString()} uploaded files`}
              label="Files needing review"
              value={metrics.filesNeedReview}
            />
            <MetricCard
              detail="All uploaded file records"
              label="Total files"
              value={metrics.totalFiles}
            />
          </section>

          <section className="panel p-5 sm:p-6">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-brand-700">
                  Monitoring
                </p>
                <h2 className="text-xl font-bold text-ink">Recent activity</h2>
              </div>
              <p className="text-sm text-slate-600">
                Latest posts, reports, files, comments, and signups.
              </p>
            </div>

            {metrics.recentActivity.length > 0 ? (
              <ul className="mt-4">
                {metrics.recentActivity.map((item) => (
                  <ActivityRow item={item} key={item.id} />
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-slate-600">
                No recent activity yet.
              </p>
            )}
          </section>

        </>
      ) : null}
    </div>
  );
}
