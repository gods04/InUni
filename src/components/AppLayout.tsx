import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getFileReviewCount } from '../lib/adminFileApi';
import { FileReviewCountBadge } from './FileReviewCountBadge';

function navClass({ isActive }: { isActive: boolean }) {
  return [
    'inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold transition',
    isActive
      ? 'bg-brand-50 text-brand-700'
      : 'text-slate-600 hover:bg-slate-100 hover:text-ink',
  ].join(' ');
}

export function AppLayout() {
  const { user, isDemoMode, signOut } = useAuth();
  const [fileReviewCount, setFileReviewCount] = useState(0);

  useEffect(() => {
    let active = true;

    if (user?.profile.role !== 'admin') {
      setFileReviewCount(0);
      return () => {
        active = false;
      };
    }

    void getFileReviewCount()
      .then((count) => {
        if (active) setFileReviewCount(count);
      })
      .catch(() => {
        if (active) setFileReviewCount(0);
      });

    return () => {
      active = false;
    };
  }, [user?.profile.role]);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <NavLink
              aria-label="InUni home"
              className="shrink-0"
              to="/"
            >
              <span className="flex h-10 w-[124px] items-center overflow-hidden">
                <img
                  alt="InUni"
                  className="h-10 w-auto object-contain"
                  src="/brand/inuni-logo-horizontal-dark.png"
                />
              </span>
            </NavLink>

            <nav className="flex min-w-0 items-center gap-1 overflow-x-auto">
              <NavLink to="/" className={navClass} end>
                Forum
              </NavLink>
              <NavLink to="/files" className={navClass}>
                Files
              </NavLink>
              <NavLink to="/create" className={navClass}>
                Create
              </NavLink>
              <NavLink to="/profile" className={navClass}>
                Profile
              </NavLink>
              {user?.profile.role === 'admin' ? (
                <NavLink to="/admin" className={navClass}>
                  <span>Admin</span>
                  <FileReviewCountBadge count={fileReviewCount} />
                </NavLink>
              ) : null}
              {user ? (
                <button
                  className="secondary-button shrink-0"
                  onClick={() => void signOut()}
                  type="button"
                >
                  Log out
                </button>
              ) : (
                <NavLink to="/login" className={navClass}>
                  Login
                </NavLink>
              )}
            </nav>
          </div>

          {isDemoMode ? (
            <div className="rounded-lg border border-brand-100 bg-brand-50 px-3 py-2 text-xs font-medium text-brand-700">
              Demo mode: forum data is stored in this browser until Supabase is connected.
            </div>
          ) : null}
        </div>
      </header>

      <main className="page-shell">
        <Outlet />
      </main>
    </div>
  );
}
