import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { PageHeader } from '../components/PageHeader';
import { Seo } from '../components/Seo';
import { useAuth } from '../hooks/useAuth';
import { searchUsers, setUserBan } from '../lib/adminApi';
import type { Profile } from '../types/forum';

interface PendingAction {
  profile: Profile;
  banned: boolean;
}

export function AdminUsersPage() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [banReason, setBanReason] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function runSearch(nextQuery: string) {
    setLoading(true);
    setError(null);
    try {
      setProfiles(await searchUsers(nextQuery));
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Could not search users.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void runSearch('');
  }, []);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void runSearch(query);
  }

  function beginBan(profile: Profile) {
    setPending({ profile, banned: true });
    setBanReason('');
    setConfirmOpen(false);
    setError(null);
  }

  function beginUnban(profile: Profile) {
    setPending({ profile, banned: false });
    setBanReason('');
    setConfirmOpen(true);
    setError(null);
  }

  function continueBan() {
    if (!banReason.trim()) {
      setError('A reason is required before banning a user.');
      return;
    }
    setConfirmOpen(true);
  }

  async function confirmAction() {
    if (!pending) return;
    setBusy(true);
    setError(null);

    try {
      await setUserBan(
        pending.profile.id,
        pending.banned,
        pending.banned ? banReason.trim() : null,
      );
      setProfiles((current) =>
        current.map((profile) =>
          profile.id === pending.profile.id
            ? {
                ...profile,
                isBanned: pending.banned,
                banReason: pending.banned ? banReason.trim() : null,
              }
            : profile,
        ),
      );
      setPending(null);
      setConfirmOpen(false);
      setBanReason('');
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Could not update this user.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-5">
      <Seo
        canonicalPath="/admin/users"
        description="InUni administrator user moderation."
        noindex
        title="User moderation | InUni"
      />
      <PageHeader
        action={(
          <Link className="secondary-button" to="/admin">
            Back to moderation
          </Link>
        )}
        description="Search profiles and manage participation restrictions."
        eyebrow="Administrator"
        icon={Users}
        title="User moderation"
      />

      <section className="panel p-5 sm:p-6">
        <form
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={handleSearch}
        >
          <label className="grid flex-1 gap-2">
            <span className="field-label">Search users</span>
            <input
              className="field-input"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Display name or username"
              value={query}
            />
          </label>
          <button className="primary-button sm:self-end" type="submit">
            Search
          </button>
        </form>
      </section>

      {error ? <ErrorState message={error} /> : null}
      {loading ? <LoadingState label="Loading users..." /> : null}

      {!loading && profiles.length === 0 ? (
        <EmptyState
          message="Try another display name or username."
          title="No users found"
        />
      ) : null}

      {!loading && profiles.length > 0 ? (
        <div className="grid gap-3">
          {profiles.map((profile) => (
            <article
              className="panel flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"
              key={profile.id}
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold text-ink">
                    {profile.displayName}
                  </h2>
                  <span className="badge bg-slate-100 text-slate-700">
                    {profile.role}
                  </span>
                  {profile.isBanned ? (
                    <span className="badge bg-red-50 text-red-700">
                      Banned
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  @{profile.username}
                </p>
                {profile.banReason ? (
                  <p className="mt-2 text-sm text-red-700">
                    {profile.banReason}
                  </p>
                ) : null}
              </div>

              {profile.id === user?.id ? (
                <span className="text-sm font-semibold text-slate-500">
                  Current administrator
                </span>
              ) : profile.isBanned ? (
                <button
                  className="secondary-button"
                  onClick={() => beginUnban(profile)}
                  type="button"
                >
                  Unban
                </button>
              ) : (
                <button
                  className="danger-button"
                  onClick={() => beginBan(profile)}
                  type="button"
                >
                  Ban
                </button>
              )}
            </article>
          ))}
        </div>
      ) : null}

      {pending?.banned && !confirmOpen ? (
        <section className="panel grid gap-4 p-5">
          <div>
            <h2 className="text-lg font-semibold text-ink">
              Ban {pending.profile.displayName}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              They will still be able to read the forum.
            </p>
          </div>
          <label className="grid gap-2">
            <span className="field-label">Ban reason</span>
            <textarea
              className="field-input min-h-24 resize-y"
              onChange={(event) => setBanReason(event.target.value)}
              value={banReason}
            />
          </label>
          <div className="flex justify-end gap-2">
            <button
              className="secondary-button"
              onClick={() => setPending(null)}
              type="button"
            >
              Cancel
            </button>
            <button
              className="danger-button"
              onClick={continueBan}
              type="button"
            >
              Continue
            </button>
          </div>
        </section>
      ) : null}

      <ConfirmDialog
        busy={busy}
        confirmLabel={pending?.banned ? 'Ban user' : 'Unban user'}
        destructive={Boolean(pending?.banned)}
        message={
          pending?.banned
            ? `This prevents ${pending.profile.displayName} from posting, commenting, or reporting.`
            : `This restores participation for ${pending?.profile.displayName ?? 'this user'}.`
        }
        onCancel={() => setConfirmOpen(false)}
        onConfirm={confirmAction}
        open={confirmOpen}
        title={pending?.banned ? 'Ban this user?' : 'Unban this user?'}
      />
    </div>
  );
}
