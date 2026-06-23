import React, { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';

/* ── Navigation items ───────────────────────────────────── */
const sidebarItems = [
  {
    label: 'Home',
    to: '/home',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 22V12h6v10" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  },
  {
    label: 'Admin',
    to: '/admin-dashboard',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  },
  {
    label: 'Teacher',
    to: '/teacher-dashboard',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  },
  {
    label: 'Courses',
    to: '/courses',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  },
  {
    label: 'Manage',
    to: '/course-management',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  },
  {
    label: 'Learning',
    to: '/learning',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <polygon points="5 3 19 12 5 21 5 3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  },
  {
    label: 'Quiz',
    to: '/quiz',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="9" y="3" width="6" height="4" rx="2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
];

/* ── Sidebar Item ────────────────────────────────────────── */
const NavItem: React.FC<{ item: typeof sidebarItems[0]; collapsed: boolean; onClick: () => void }> = ({
  item,
  collapsed,
  onClick
}) => (
  <NavLink
    to={item.to}
    end={item.to === '/'}
    onClick={onClick}
    title={collapsed ? item.label : undefined}
    className={({ isActive }) =>
      `group relative flex items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
        isActive
          ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25 dark:bg-sky-500/20 dark:text-sky-300 dark:shadow-none'
          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
      }`
    }
  >
    {({ isActive }) => (
      <>
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
            isActive
              ? 'bg-white/20 text-white dark:bg-sky-500/20'
              : 'bg-slate-100 dark:bg-white/5 text-slate-500 group-hover:bg-slate-200 dark:group-hover:bg-white/10 group-hover:text-slate-700 dark:group-hover:text-white'
          }`}
        >
          {item.icon}
        </span>

        <span
          className={`whitespace-nowrap font-medium transition-all duration-300 ${
            collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
          }`}
        >
          {item.label}
        </span>

        {/* Active indicator */}
        {isActive && !collapsed ? (
          <motion.span
            layoutId="nav-active-dot"
            className="ml-auto h-2 w-2 rounded-full bg-white/60"
          />
        ) : null}
      </>
    )}
  </NavLink>
);

/* ── Main Layout ─────────────────────────────────────────── */
const SiteLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const activeLabel = useMemo(() => {
    const match = sidebarItems.find(
      (item) => location.pathname === item.to || location.pathname.startsWith(`${item.to}/`)
    );
    return match?.label ?? 'Home';
  }, [location.pathname]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  // Keyboard handler
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setProfileOpen(false);
        setMobileOpen(false);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* ── Mobile backdrop ──────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
        ) : null}
      </AnimatePresence>

      {/* ── Sidebar ──────────────────────────────────────── */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex flex-col
          border-r border-slate-200 dark:border-white/5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl
          transition-all duration-300 ease-out
          md:sticky md:top-0 md:h-screen
          ${collapsed ? 'w-[72px]' : 'w-[260px]'}
          ${mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Logo area */}
        <div className="flex h-16 items-center justify-between px-3 border-b border-slate-200 dark:border-white/5">
          <Link
            to="/home"
            className="flex items-center gap-3 overflow-hidden rounded-xl p-1 transition hover:bg-slate-50 dark:hover:bg-white/5"
            aria-label="E-Learning Home"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-indigo-500 text-sm font-bold text-white shadow-md shadow-sky-500/25">
              E
            </span>
            <span
              className={`whitespace-nowrap text-base font-bold tracking-tight text-slate-900 dark:text-white transition-all duration-300 ${
                collapsed ? 'max-w-0 opacity-0' : 'max-w-[160px] opacity-100'
              }`}
            >
              E-Learning
            </span>
          </Link>

          {/* Collapse toggle (desktop) */}
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className={`hidden md:flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-400 transition hover:bg-slate-50 dark:hover:bg-white/10 hover:text-slate-700 dark:hover:text-slate-200 ${collapsed ? 'mx-auto' : ''}`}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <motion.span
              animate={{ rotate: collapsed ? 180 : 0 }}
              transition={{ duration: 0.25 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.span>
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-0.5" aria-label="Main navigation">
          {sidebarItems.map((item) => (
            <NavItem
              key={item.to}
              item={item}
              collapsed={collapsed}
              onClick={() => setMobileOpen(false)}
            />
          ))}
        </nav>

        {/* Notification card (only when expanded) */}
        <AnimatePresence>
          {!collapsed ? (
            <motion.div
              className="mx-2.5 mb-3 rounded-xl border border-sky-100 dark:border-sky-500/10 bg-sky-50/50 dark:bg-sky-500/5 p-3"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-sky-300">New enrollments</p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-sky-200/70">2 new students today</p>
                </div>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-500 text-[10px] font-bold text-white shadow-sm shadow-sky-500/30">
                  2
                </span>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Profile area */}
        <div className="border-t border-slate-200 dark:border-white/5 p-2.5">
          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((c) => !c)}
              className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-slate-100 dark:hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
              aria-expanded={profileOpen}
              aria-haspopup="menu"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-800 to-slate-600 dark:from-white/10 dark:to-white/5 text-xs font-bold text-white">
                AD
              </span>
              <div
                className={`min-w-0 flex-1 transition-all duration-300 ${
                  collapsed ? 'max-w-0 opacity-0' : 'max-w-[160px] opacity-100'
                }`}
              >
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">Admin User</p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">admin@elearning.app</p>
              </div>
              {!collapsed ? (
                <motion.span
                  animate={{ rotate: profileOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-slate-400"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </motion.span>
              ) : null}
            </button>

            {/* Profile dropdown */}
            <AnimatePresence>
              {profileOpen ? (
                <motion.div
                  className="absolute bottom-14 left-0 right-0 z-50 overflow-hidden rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.97 }}
                  transition={{ duration: 0.18 }}
                  role="menu"
                >
                  {[
                    { label: 'Profile', icon: '👤' },
                    { label: 'Settings', icon: '⚙️' },
                    { label: 'Billing', icon: '💳' },
                    { label: 'Sign out', icon: '🚪' }
                  ].map((item, i) => (
                    <button
                      key={item.label}
                      type="button"
                      role="menuitem"
                      className={`flex w-full items-center gap-3 px-3.5 py-2.5 text-sm text-slate-600 dark:text-slate-300 transition hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white ${
                        i === 3 ? 'border-t border-slate-100 dark:border-white/10 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400' : ''
                      }`}
                    >
                      <span className="text-base">{item.icon}</span>
                      {item.label}
                    </button>
                  ))}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </aside>

      {/* ── Main Content ──────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-slate-200 dark:border-white/5 bg-white/90 dark:bg-slate-900/90 px-4 backdrop-blur-xl md:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 transition hover:bg-slate-50 dark:hover:bg-white/10"
            aria-label="Open navigation"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

          {/* Page title */}
          <span className="text-sm font-semibold text-slate-900 dark:text-white">{activeLabel}</span>

          <div className="flex items-center gap-3">
            {/* Theme Toggle Mobile */}
            <button
              onClick={toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 transition hover:bg-slate-200 dark:hover:bg-white/10"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            {/* Profile button */}
            <button
              type="button"
              onClick={() => setProfileOpen((c) => !c)}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-indigo-500 text-xs font-bold text-white shadow-sm"
            >
              AD
            </button>
          </div>
        </header>

        {/* Desktop breadcrumb bar */}
        <div className="hidden items-center justify-between border-b border-slate-200/60 dark:border-white/5 bg-white/60 dark:bg-slate-900/60 px-8 py-3 text-sm text-slate-400 backdrop-blur-sm md:flex">
          <div className="flex items-center gap-2">
            <span className="text-slate-300 dark:text-slate-600">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9 22V12h6v10" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="text-slate-300 dark:text-slate-600">/</span>
            <span className="font-medium text-slate-600 dark:text-slate-300">{activeLabel}</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Theme Toggle Desktop */}
            <button
              onClick={toggleTheme}
              className="group flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 transition hover:bg-slate-200 dark:hover:bg-white/10"
              aria-label="Toggle theme"
            >
              <motion.span
                initial={false}
                animate={{ rotate: theme === 'dark' ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                {theme === 'dark' ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" />
                    <line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                )}
              </motion.span>
            </button>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 min-w-0">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 dark:border-white/5 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm">
          <div className="mx-auto max-w-7xl px-4 py-3.5 text-center text-xs text-slate-400 dark:text-slate-500 sm:px-6 lg:px-8">
            © 2026 E-Learning — Built for modern student experiences.
          </div>
        </footer>
      </div>
    </div>
  );
};

export default SiteLayout;