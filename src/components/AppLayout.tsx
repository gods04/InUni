import { useEffect, useId, useState } from 'react';
import {
  FileText,
  Home,
  LogOut,
  Menu,
  PlusCircle,
  Shield,
  UserCircle,
  Wrench,
  X,
} from 'lucide-react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getFileReviewCount } from '../lib/adminFileApi';
import { recordPageView } from '../lib/localAnalytics';
import { BrandLogo } from './BrandLogo';
import { FileReviewCountBadge } from './FileReviewCountBadge';
import { LegalAgreementGate } from './LegalAgreementGate';

function navClass({ isActive }: { isActive: boolean }) {
  return [
    'inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold transition duration-200',
    isActive
      ? 'bg-brand-700 text-white shadow-sm'
      : 'text-slate-600 hover:-translate-y-0.5 hover:bg-brand-50 hover:text-ink',
  ].join(' ');
}

function mobileNavClass({ isActive }: { isActive: boolean }) {
  return [
    'flex min-h-11 items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold transition duration-200',
    isActive
      ? 'bg-brand-700 text-white shadow-sm'
      : 'text-slate-700 hover:bg-slate-100 hover:text-ink',
  ].join(' ');
}

const navItems = [
  { label: 'Forum', to: '/', end: true, Icon: Home },
  { label: 'Files', to: '/files', end: false, Icon: FileText },
  { label: 'Create', to: '/create', end: false, Icon: PlusCircle },
  { label: 'Tools', to: '/tools', end: false, Icon: Wrench },
  { label: 'Profile', to: '/profile', end: false, Icon: UserCircle },
] as const;

export function AppLayout() {
  const mobileMenuId = useId();
  const location = useLocation();
  const { user, isDemoMode, signOut } = useAuth();
  const [fileReviewCount, setFileReviewCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    recordPageView(`${location.pathname}${location.search}`);
  }, [location.pathname, location.search]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    }

    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [mobileMenuOpen]);

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

  function renderNavLinks(className: typeof navClass | typeof mobileNavClass) {
    return (
      <>
        {navItems.map(({ Icon, end, label, to }) => (
          <NavLink className={className} end={end} key={to} to={to}>
            <span className="inline-flex items-center gap-1.5">
              <Icon aria-hidden="true" className="h-4 w-4" />
              <span>{label}</span>
            </span>
          </NavLink>
        ))}
        {user?.profile.role === 'admin' ? (
          <NavLink to="/admin" className={className}>
            <span className="inline-flex items-center gap-1.5">
              <Shield aria-hidden="true" className="h-4 w-4" />
              <span>Admin</span>
            </span>
            <FileReviewCountBadge count={fileReviewCount} />
          </NavLink>
        ) : null}
      </>
    );
  }

  async function logOut() {
    setMobileMenuOpen(false);
    await signOut();
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-line bg-white/90 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-none flex-col gap-2 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <NavLink
              aria-label="InUni home"
              className="shrink-0"
              to="/"
            >
              <span className="flex h-10 w-36 items-center overflow-hidden">
                <BrandLogo
                  alt="InUni"
                  className="h-10 w-auto object-contain"
                  variant="horizontal"
                />
              </span>
            </NavLink>

            <nav className="hidden min-w-0 items-center gap-1 md:flex">
              {renderNavLinks(navClass)}
              {user ? (
                <button
                  className="secondary-button shrink-0 gap-2"
                  onClick={() => void logOut()}
                  type="button"
                >
                  <LogOut aria-hidden="true" className="h-4 w-4" />
                  Log out
                </button>
              ) : (
                <NavLink to="/login" className={navClass}>
                  Login
                </NavLink>
              )}
            </nav>

            <button
              aria-controls={mobileMenuId}
              aria-expanded={mobileMenuOpen}
              aria-label={
                mobileMenuOpen ? 'Close navigation' : 'Open navigation'
              }
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white text-slate-700 shadow-sm transition hover:border-brand-100 hover:bg-brand-50 hover:text-ink focus:outline-none focus:ring-4 focus:ring-brand-100 md:hidden"
              onClick={() => setMobileMenuOpen((current) => !current)}
              type="button"
            >
              {mobileMenuOpen ? (
                <X aria-hidden="true" className="h-5 w-5" />
              ) : (
                <Menu aria-hidden="true" className="h-5 w-5" />
              )}
            </button>
          </div>

          {isDemoMode ? (
            <div className="rounded-lg border border-brand-100 bg-brand-50 px-3 py-2 text-xs font-medium text-brand-700">
              Demo mode: forum data is stored in this browser until Supabase is connected.
            </div>
          ) : null}

          {mobileMenuOpen ? (
            <>
              <button
                aria-label="Close navigation"
                className="fixed inset-0 z-40 cursor-default bg-transparent md:hidden"
                onClick={() => setMobileMenuOpen(false)}
                type="button"
              />
              <nav
                aria-label="Navigation"
                className="panel absolute left-4 right-4 top-full z-50 grid gap-1 p-2 md:hidden"
                id={mobileMenuId}
                role="dialog"
              >
                {renderNavLinks(mobileNavClass)}
                {user ? (
                  <button
                    className="secondary-button mt-1 w-full justify-center gap-2"
                    onClick={() => void logOut()}
                    type="button"
                  >
                    <LogOut aria-hidden="true" className="h-4 w-4" />
                    Log out
                  </button>
                ) : (
                  <NavLink to="/login" className={mobileNavClass}>
                    Login
                  </NavLink>
                )}
              </nav>
            </>
          ) : null}
        </div>
      </header>

      <main className="page-shell">
        <Outlet />
      </main>
      <footer className="mx-auto flex w-full max-w-5xl flex-wrap justify-center gap-x-5 gap-y-2 px-4 pb-6 text-sm sm:px-6 lg:px-8">
        <NavLink
          className="font-semibold text-brand-700 hover:text-brand-600"
          to="/privacy"
        >
          Privacy Policy
        </NavLink>
        <NavLink
          className="font-semibold text-brand-700 hover:text-brand-600"
          to="/terms"
        >
          Terms of Service
        </NavLink>
        <NavLink
          className="font-semibold text-brand-700 hover:text-brand-600"
          to="/community-rules"
        >
          Community Rules
        </NavLink>
        <NavLink
          className="font-semibold text-brand-700 hover:text-brand-600"
          to="/contact"
        >
          Contact
        </NavLink>
      </footer>
      <LegalAgreementGate />
    </div>
  );
}
