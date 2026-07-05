import { useCallback, useState } from 'react';
import { Flag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AdminReportsQueue } from '../components/AdminReportsQueue';
import { PageHeader } from '../components/PageHeader';
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
      <PageHeader
        action={(
          <Link className="secondary-button" to="/admin">
            Admin dashboard
          </Link>
        )}
        description={`${reportCount} open ${reportCount === 1 ? 'report' : 'reports'}`}
        eyebrow="Administrator"
        icon={Flag}
        title="Reports queue"
      />

      <AdminReportsQueue onReportCountChange={updateReportCount} />
    </div>
  );
}
