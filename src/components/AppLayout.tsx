import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function navClass({ isActive }: { isActive: boolean }) {
  return [
    'rounded-lg px-3 py-2 text-sm font-bold transition',
    isActive
      ? 'bg-slate-950 text-white shadow-sm'
      : 'text-slate-600 hover:bg-emerald-50 hover:text-slate-950',
  ].join(' ');
}

export function AppLayout() {
  const { user, isDemoMode, signOut } = useAuth();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-white/80 bg-[#f8fbf5]/90 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <NavLink to="/" className="flex items-center gap-3">
              <span className="flex h-12 w-[148px] items-center justify-start overflow-hidden">
                <img
                  src="/brand/inuni-logo-horizontal-dark.png"
                  alt="InUni"
                  className="h-12 w-auto object-contain"
                />
              </span>
              <span className="hidden sm:block">
                <span className="block text-xs font-bold uppercase text-emerald-700">Campus forum</span>
                <span className="block text-sm font-medium text-slate-600">Student conversations</span>
              </span>
            </NavLink>

            <nav className="flex flex-wrap items-center gap-1.5 rounded-lg border border-white/90 bg-white/75 p-1 shadow-sm">
              <NavLink to="/" className={navClass} end>
                Feed
              </NavLink>
              <NavLink to="/create" className={navClass}>
                Create
              </NavLink>
              <NavLink to="/profile" className={navClass}>
                Profile
              </NavLink>
              {user ? (
                <button className="secondary-button" type="button" onClick={() => void signOut()}>
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
            <div className="rounded-lg border border-amber-200 bg-amber-50/90 px-3 py-2 text-sm font-semibold text-amber-900">
              Demo mode is active because Supabase env vars are empty. Posts and comments use local browser
              storage until you connect Supabase.
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
