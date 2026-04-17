import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import BrandLogo from '../ui/BrandLogo';
import { useAuth } from '../../hooks/useAuth';

const navClass =
  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-white/80 hover:text-slate-900';
const navActiveClass = 'bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-100';

function NavRow({ to, active, onClick, children }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`${navClass} ${active ? navActiveClass : ''} no-underline`}
    >
      {children}
    </Link>
  );
}

function IconDashboard() {
  return (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  );
}

function IconBriefcase() {
  return (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M12 12h.01M12 12h.01M12 12h.01M12 12h.01" />
    </svg>
  );
}

function IconColumns() {
  return (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function IconBell() {
  return (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
}

function IconChart() {
  return (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function IconDownload() {
  return (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  );
}

function IconCog() {
  return (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function userInitials(name, email) {
  const n = (name || '').trim();
  if (n) {
    const parts = n.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase().slice(0, 2);
    return n.slice(0, 2).toUpperCase();
  }
  const e = (email || '').trim();
  if (e) return e.slice(0, 2).toUpperCase();
  return 'HB';
}

export default function AppSidebar({ mobileOpen, onCloseMobile }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const q = new URLSearchParams(location.search);
  const view = q.get('view');
  const hash = location.hash || '';
  const onDash = location.pathname === '/dashboard';
  const dashHomeActive = onDash && view == null && hash === '';
  const listActive = onDash && view === 'list';
  const boardActive = onDash && view === 'kanban';
  const analyticsActive = onDash && hash === '#analytics';
  const remindersActive = onDash && hash === '#reminders';
  const exportActive = onDash && view === 'list' && q.get('export') === '1';

  useEffect(() => {
    if (!mobileOpen) return undefined;
    document.body.classList.add('hb-scroll-lock');
    return () => document.body.classList.remove('hb-scroll-lock');
  }, [mobileOpen]);

  const linkAfterNav = () => {
    onCloseMobile?.();
  };

  const sidebarInner = (
    <>
      <Link
        to="/dashboard"z
        className="mb-6 flex min-w-0 items-center gap-2.5 rounded-xl px-1 py-1 no-underline hover:opacity-90"
        onClick={linkAfterNav}
        aria-label="HireBoard home"
      >
        <BrandLogo className="h-8 w-auto max-w-[96px] shrink-0 sm:h-9 sm:max-w-[104px]" alt="" />
        <span className="truncate text-lg font-bold tracking-tight text-slate-900">HireBoard</span>
      </Link>

      <nav className="flex flex-1 flex-col gap-0.5" aria-label="Main">
        <NavRow to="/dashboard" active={dashHomeActive} onClick={linkAfterNav}>
          <IconDashboard />
          Dashboard
        </NavRow>
        <NavRow to="/dashboard?view=list" active={listActive} onClick={linkAfterNav}>
          <IconBriefcase />
          Applications
        </NavRow>
        <NavRow to="/dashboard?view=kanban" active={boardActive} onClick={linkAfterNav}>
          <IconColumns />
          Board
        </NavRow>
        <NavRow to="/dashboard#reminders" active={remindersActive} onClick={linkAfterNav}>
          <IconBell />
          Reminders
        </NavRow>
        <NavRow to="/dashboard#analytics" active={analyticsActive} onClick={linkAfterNav}>
          <IconChart />
          Analytics
        </NavRow>
        <NavRow to="/dashboard?view=list&export=1" active={exportActive} onClick={linkAfterNav}>
          <IconDownload />
          Export
        </NavRow>
      </nav>

      <div className="mt-auto border-t border-slate-200/80 pt-4">
        <div className="mb-3 flex items-center gap-3 rounded-xl bg-white/60 px-3 py-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-bold text-white shadow-sm">
            {userInitials(user?.name, user?.email)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">{user?.name || 'User'}</p>
            <p className="truncate text-xs text-slate-500">{user?.email}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            linkAfterNav();
            logout();
          }}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50/50 hover:text-slate-900"
        >
          Log out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hb-sidebar hidden w-[var(--hb-sidebar-width)] shrink-0 flex-col border-r border-slate-200/90 bg-slate-50/95 px-4 py-6 lg:flex">
        <div className="flex h-full min-h-0 flex-col">{sidebarInner}</div>
      </aside>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 z-[55] bg-slate-900/40 backdrop-blur-sm transition-opacity lg:hidden ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'pointer-events-none opacity-0'
        }`}
        aria-hidden={!mobileOpen}
        onClick={() => onCloseMobile?.()}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-[60] flex w-[min(100%,280px)] max-w-[85vw] flex-col border-r border-slate-200 bg-slate-50 px-4 py-6 shadow-2xl transition-transform duration-200 ease-out lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-hidden={!mobileOpen}
      >
        <div className="mb-4 flex min-w-0 items-center justify-between gap-2 lg:hidden">
          <div className="flex min-w-0 items-center gap-2">
            <BrandLogo className="h-7 w-auto max-w-[88px] shrink-0 sm:h-8 sm:max-w-[96px]" alt="" />
            <span className="truncate text-base font-bold tracking-tight text-slate-900">HireBoard</span>
          </div>
          <button
            type="button"
            className="rounded-lg p-2 text-slate-500 hover:bg-white hover:text-slate-800"
            aria-label="Close menu"
            onClick={() => onCloseMobile?.()}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">{sidebarInner}</div>
      </aside>
    </>
  );
}

export function MobileMenuButton({ onClick }) {
  return (
    <button
      type="button"
      className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm lg:hidden"
      aria-label="Open menu"
      onClick={onClick}
    >
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
  );
}
