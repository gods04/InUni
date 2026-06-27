import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminReportsQueue } from '../components/AdminReportsQueue';
import { Seo } from '../components/Seo';

export function AdminReportsPage() {
  const [reportCount, setReportCount] = useState(0);
  const updateReportCount = useCallback((count: number) => {
    setReportCount(count);
  }, []);

  return (
    <div className="grid gap-5">
      <Seo
        canonicalPath="/admin/reports"
        description="InUni administrator reports queue."
        noindex
        title="Reports queue | InUni"
      />
      <section className="panel flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <p className="text-sm font-semibold text-brand-700">
            Administrator
          </p>
          <h1 className="section-title">Reports queue</h1>
          <p className="mt-1 text-sm text-slate-600">
            {reportCount} open {reportCount === 1 ? 'report' : 'reports'}
          </p>
        </div>
        <Link className="secondary-button" to="/admin">
          Admin dashboard
        </Link>
      </section>

      <AdminReportsQueue onReportCountChange={updateReportCount} />
    </div>
  );
}
