import { useState } from 'react';
import { reportPost } from '../lib/forumApi';
import { useAuth } from '../hooks/useAuth';

export function ReportButton({ postId }: { postId: string }) {
  const { user } = useAuth();
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleReport() {
    setStatus(null);

    if (!user) {
      setStatus('Log in to report posts.');
      return;
    }

    setIsSubmitting(true);

    try {
      await reportPost({ postId, reason: 'Community report' }, user);
      setStatus('Reported. Thanks for helping keep InUni safe.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not submit report.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
      <button className="danger-button" type="button" onClick={handleReport} disabled={isSubmitting}>
        {isSubmitting ? 'Reporting...' : 'Report'}
      </button>
      {status ? <span className="text-xs font-semibold text-slate-500">{status}</span> : null}
    </div>
  );
}
