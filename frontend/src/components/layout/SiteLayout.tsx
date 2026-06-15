import React, { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

const sidebarItems = [
  { label: 'Dashboard', to: '/', icon: '⌂' },
  { label: 'Admin', to: '/admin-dashboard', icon: '◌' },
  { label: 'Teacher', to: '/teacher-dashboard', icon: '◈' },
  { label: 'Courses', to: '/courses', icon: '▣' },
  { label: 'Course Manager', to: '/course-management', icon: '✦' },
  { label: 'Learning', to: '/learning', icon: '▶' },
  { label: 'Quiz', to: '/quiz', icon: '⚑' }
];

const SiteLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const activeLabel = useMemo(() => {
    const current = sidebarItems.find((item) => location.pathname === item.to || location.pathname.startsWith(`${item.to}/`));
    return current?.label ?? 'Dashboard';
  }, [location.pathname]);

  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setProfileOpen(false);
        setMobileOpen(false);
      }
    };

    document.addEventListener('keydown', onEscape);
    return () => document.removeEventListener('keydown', onEscape);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text-default)]">
      <div className="flex min-h-screen">
        <AnimatePresence>
          {mobileOpen ? (
            <motion.button
              type="button"
              aria-label="Close sidebar"
              className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[2px] md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
          ) : null}
        </AnimatePresence>

        <aside
          className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-white/70 bg-white/80 backdrop-blur-2xl transition-all duration-300 md:sticky md:top-0 ${
            collapsed ? 'w-20' : 'w-[290px]'
          } ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
        >
          <div className="flex items-center justify-between gap-3 border-b border-slate-200/70 px-4 py-4">
            <Link to="/" className="flex items-center gap-3 overflow-hidden font-semibold tracking-tight text-slate-950">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-indigo-500 to-fuchsia-500 text-white shadow-lg shadow-sky-500/20">
                E
              </span>
              <span className={`whitespace-nowrap text-lg transition-all duration-300 ${collapsed ? 'max-w-0 opacity-0' : 'max-w-[180px] opacity-100'}`}>
                E-Learning
              </span>
            </Link>

            <button
              type="button"
              onClick={() => setCollapsed((current) => !current)}
              className="hidden rounded-full border border-slate-200 bg-white p-2 text-slate-600 transition hover:-translate-y-0.5 hover:bg-slate-50 md:inline-flex"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <motion.span animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0.25 }} className="block text-sm">
                ⇤
              </motion.span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-4">
            <div className="space-y-2">
              {sidebarItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `group relative flex items-center gap-3 overflow-hidden rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-300 hover:bg-white hover:shadow-[0_14px_40px_rgba(15,23,42,0.08)] ${
                      isActive ? 'bg-slate-950 text-white shadow-lg shadow-slate-950/20' : 'text-slate-600 hover:text-slate-950'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <motion.span
                        animate={{ rotate: isActive ? [0, 12, 0] : 0 }}
                        transition={{ duration: 0.25 }}
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-base ${
                          isActive ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-700 group-hover:bg-slate-200'
                        }`}
                      >
                        {item.icon}
                      </motion.span>
                      <span className={`whitespace-nowrap transition-all duration-300 ${collapsed ? 'max-w-0 opacity-0' : 'max-w-[180px] opacity-100'}`}>
                        {item.label}
                      </span>
                      {isActive ? <span className="ml-auto h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_16px_rgba(34,211,238,0.85)]" /> : null}
                    </>
                  )}
                </NavLink>
              ))}
            </div>

            <div className={`mt-6 rounded-[28px] border border-slate-200 bg-slate-50 p-4 transition-all duration-300 ${collapsed ? 'opacity-0' : 'opacity-100'}`}>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Notification Badge</p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-950">2 alerts</p>
                  <p className="mt-1 text-xs text-slate-500">New enrollments</p>
                </div>
                <span className="rounded-full bg-rose-500 px-3 py-1 text-xs font-semibold text-white">2</span>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200/70 p-3">
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen((current) => !current)}
                className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-3 text-left transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-[0_14px_40px_rgba(15,23,42,0.08)]"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-950 to-slate-700 text-sm font-semibold text-white">
                  AD
                </span>
                <div className={`min-w-0 flex-1 transition-all duration-300 ${collapsed ? 'max-w-0 opacity-0' : 'max-w-[160px] opacity-100'}`}>
                  <p className="truncate text-sm font-semibold text-slate-950">Admin User</p>
                  <p className="truncate text-xs text-slate-500">admin@elearning.app</p>
                </div>
                <motion.span animate={{ rotate: profileOpen ? 180 : 0 }} transition={{ duration: 0.25 }} className={`text-slate-400 ${collapsed ? 'hidden' : 'block'}`}>
                  ▾
                </motion.span>
              </button>

              <AnimatePresence>
                {profileOpen ? (
                  <motion.div
                    className="absolute bottom-16 left-0 right-0 z-50 rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_20px_60px_rgba(15,23,42,0.12)]"
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.98 }}
                    transition={{ duration: 0.22 }}
                  >
                    {['Profile', 'Settings', 'Billing', 'Sign out'].map((item) => (
                      <button key={item} type="button" className="w-full rounded-xl px-4 py-3 text-left text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-950">
                        {item}
                      </button>
                    ))}
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col md:ml-0">
          <header className="sticky top-0 z-30 border-b border-white/70 bg-white/75 backdrop-blur-xl md:hidden">
            <div className="flex items-center justify-between gap-3 px-4 py-4">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
              >
                Menu
              </button>
              <div className="text-sm font-semibold text-slate-950">{activeLabel}</div>
              <button
                type="button"
                onClick={() => setProfileOpen((current) => !current)}
                className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
              >
                Profile
              </button>
            </div>
          </header>

          <main className="flex-1">{children}</main>

          <footer className="mt-12 border-t border-white/70 bg-white/75 backdrop-blur-xl">
            <div className="mx-auto max-w-7xl px-4 py-4 text-center text-sm text-slate-500 sm:px-6 lg:px-8">
              © 2026 E-Learning. Built for modern student experiences.
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default SiteLayout;