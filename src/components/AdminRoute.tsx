import type { ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { canModerate } from '../lib/permissions';
import { EmptyState } from './EmptyState';
import { LoadingState } from './LoadingState';

export function AdminRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingState label="Checking administrator access..." />;
  }
  if (!canModerate(user?.profile ?? null)) {
    return (
      <EmptyState
        title="Administrator access required"
        message="This page is available only to InUni moderators."
      />
    );
  }

  return children;
}
