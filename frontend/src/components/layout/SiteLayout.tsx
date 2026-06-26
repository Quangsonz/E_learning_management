import React, { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

/* ── Navigation items ───────────────────────────────────── */
const sidebarItems = [
  { label: 'Home', to: '/home' },
  { label: 'Courses', to: '/courses' },
  { label: 'Learning', to: '/learning' },
  { label: 'Quiz', to: '/quiz' }
];

/* ── Desktop Nav Item ────────────────────────────────────── */
const DesktopNavItem: React.FC<{ item: typeof sidebarItems[0]; onClick: () => void }> = ({ item, onClick }) => (
  <NavLink
    to={item.to}
    end={item.to === '/'}
    onClick={onClick}
    className={({ isActive }) =>
      `relative px-6 py-2.5 text-base font-semibold transition-colors duration-300 rounded-full ${
        isActive
          ? 'text-slate-900 dark:text-white'
          : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
      }`
    }
  >
    {({ isActive }) => (
      <>
        <span className="relative z-10">{item.label}</span>
        {isActive && (
          <motion.div
            layoutId="desktop-nav-active"
            className="absolute inset-0 bg-slate-100 dark:bg-white/10 rounded-full"
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
          />
        )}
      </>
    )}
  </NavLink>
);

/* ── Mobile Nav Item ─────────────────────────────────────── */
const MobileNavItem: React.FC<{ item: typeof sidebarItems[0]; onClick: () => void; index: number }> = ({ item, onClick, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 20 }}
    transition={{ delay: index * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
  >
    <NavLink
      to={item.to}
      end={item.to === '/'}
      onClick={onClick}
      className={({ isActive }) =>
        `block text-4xl font-bold tracking-tighter transition-colors duration-300 ${
          isActive
            ? 'text-indigo-500 dark:text-indigo-400'
            : 'text-slate-400 dark:text-slate-600 hover:text-slate-900 dark:hover:text-white'
        }`
      }
    >
      {item.label}
    </NavLink>
  </motion.div>
);

/* ── Main Layout ─────────────────────────────────────────── */
const SiteLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

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

  // Lock scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
  }, [mobileOpen]);

  return (
    <div className="flex flex-col min-h-[100dvh] bg-[#FBFBFA] dark:bg-[#080808] transition-colors duration-300 relative selection:bg-indigo-500/30 w-full max-w-[100vw]">
      
      {/* ── Fluid Island Desktop Nav ─────────────────────── */}
      <header className="fixed top-6 left-1/2 -translate-x-1/2 z-50 hidden md:flex items-center gap-3 p-2 rounded-full bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-black/5 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        <div className="pl-4 pr-3 border-r border-slate-200 dark:border-white/10 flex items-center">
          <Link to="/home" className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 text-white font-bold tracking-tighter text-base">
            E
          </Link>
        </div>
        
        <nav className="flex items-center px-3 gap-2">
          {sidebarItems.map((item) => (
            <DesktopNavItem key={item.to} item={item} onClick={() => {}} />
          ))}
        </nav>

        <div className="pl-3 pr-2 border-l border-slate-200 dark:border-white/10 flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="w-10 h-10 flex items-center justify-center rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            )}
          </button>

          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="w-10 h-10 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center text-sm font-bold transition-transform hover:scale-105 uppercase"
            >
              {user?.name ? user.name.substring(0, 2) : 'US'}
            </button>
            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  className="absolute top-12 right-0 w-48 overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-2xl origin-top-right"
                  initial={{ opacity: 0, scale: 0.9, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -10 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="p-2 border-b border-slate-100 dark:border-white/5">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white px-2 pt-1">{user?.name || 'User'}</p>
                    <p className="text-xs text-slate-500 px-2 pb-1 truncate">{user?.email || 'No email'}</p>
                  </div>
                  <div className="p-1">
                    {user?.role === 'admin' && (
                      <Link to="/admin-dashboard" className="block w-full text-left px-3 py-2 text-sm rounded-xl transition-colors text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5">
                        Admin Dashboard
                      </Link>
                    )}
                    {(user?.role === 'teacher' || user?.role === 'admin') && (
                      <Link to="/teacher-dashboard" className="block w-full text-left px-3 py-2 text-sm rounded-xl transition-colors text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5">
                        Teacher Dashboard
                      </Link>
                    )}
                    <Link to="/profile" className="block w-full text-left px-3 py-2 text-sm rounded-xl transition-colors text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5">
                      Profile
                    </Link>
                    <Link to="/settings" className="block w-full text-left px-3 py-2 text-sm rounded-xl transition-colors text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5">
                      Settings
                    </Link>
                    <button 
                      onClick={() => {
                        logout();
                        setProfileOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm rounded-xl transition-colors text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                    >
                      Sign out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* ── Mobile Top Bar ─────────────────────────────── */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between px-4 border-b border-black/5 dark:border-white/5 bg-white/80 dark:bg-[#080808]/80 backdrop-blur-xl md:hidden">
        <Link to="/home" className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 text-white font-bold tracking-tighter text-sm">
          E
        </Link>
        <div className="flex items-center gap-3">
          <button onClick={toggleTheme} className="w-10 h-10 flex items-center justify-center text-slate-600 dark:text-slate-300">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button
            className="w-10 h-10 flex flex-col items-center justify-center gap-1.5 z-50 relative"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <motion.span animate={{ rotate: mobileOpen ? 45 : 0, y: mobileOpen ? 8 : 0 }} className="w-5 h-[2px] bg-slate-900 dark:bg-white block origin-center transition-all" />
            <motion.span animate={{ opacity: mobileOpen ? 0 : 1 }} className="w-5 h-[2px] bg-slate-900 dark:bg-white block transition-opacity" />
            <motion.span animate={{ rotate: mobileOpen ? -45 : 0, y: mobileOpen ? -8 : 0 }} className="w-5 h-[2px] bg-slate-900 dark:bg-white block origin-center transition-all" />
          </button>
        </div>
      </header>

      {/* ── Mobile Fullscreen Menu ─────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-30 bg-white/95 dark:bg-[#080808]/95 backdrop-blur-3xl pt-24 px-8 pb-12 flex flex-col justify-between overflow-y-auto"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <nav className="flex flex-col gap-6">
              {sidebarItems.map((item, i) => (
                <MobileNavItem key={item.to} item={item} onClick={() => setMobileOpen(false)} index={i} />
              ))}
            </nav>
            <motion.div 
              className="pt-8 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-bold uppercase">
                  {user?.name ? user.name.substring(0, 2) : 'US'}
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white truncate max-w-[150px]">{user?.name || 'User'}</p>
                  <p className="text-sm text-slate-500 truncate max-w-[150px]">{user?.email || 'No email'}</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  logout();
                  setMobileOpen(false);
                }}
                className="p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full transition-colors"
                aria-label="Sign out"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Content ──────────────────────────────────── */}
      <main className="flex-1 w-full min-w-0 md:pt-24 relative z-0">
        {children}
      </main>

      {/* ── High-End Footer ────────────────────────────────────────── */}
      <footer className="mt-24 border-t border-slate-200/50 dark:border-white/10 relative z-0 bg-white/40 dark:bg-black/20 backdrop-blur-xl">
        {/* Subtle mesh background for the footer */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-30 dark:opacity-20 overflow-hidden mix-blend-multiply dark:mix-blend-screen">
          <div className="absolute -bottom-[50%] -left-[10%] w-[50%] h-[100%] rounded-full bg-indigo-500/20 blur-[120px]" />
          <div className="absolute bottom-[0%] -right-[10%] w-[40%] h-[80%] rounded-full bg-cyan-400/20 blur-[140px]" />
        </div>

        <div className="mx-auto max-w-[1400px] px-6 lg:px-12 py-16 lg:py-24 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-8 mb-16">
            
            {/* Brand Section */}
            <div className="md:col-span-5 lg:col-span-4 pr-8">
              <Link to="/home" className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 text-white font-bold tracking-tighter text-base shadow-lg shadow-indigo-500/20">
                  E
                </div>
                <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">E-Learning.</span>
              </Link>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed max-w-[30ch] font-medium">
                Elevating the educational experience through intentional design, advanced component composition, and emotional interaction.
              </p>
              
              {/* Social Links */}
              <div className="flex items-center gap-4 mt-8">
                {['Twitter', 'GitHub', 'Dribbble'].map((social) => (
                  <button key={social} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors border border-transparent hover:border-indigo-100 dark:hover:border-indigo-500/30">
                    <span className="text-xs font-bold">{social[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Links Section */}
            <div className="md:col-span-7 lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-8">
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white mb-6">Platform</h4>
                <ul className="space-y-4 text-sm font-semibold text-slate-500 dark:text-slate-400">
                  <li><Link to="/courses" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Courses</Link></li>
                  <li><Link to="/learning" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Learning Path</Link></li>
                  <li><Link to="/quiz" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Assessments</Link></li>
                  <li><a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Certifications</a></li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white mb-6">Management</h4>
                <ul className="space-y-4 text-sm font-semibold text-slate-500 dark:text-slate-400">
                  <li><a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-2">Analytics <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 text-[9px] font-bold uppercase tracking-widest">New</span></a></li>
                </ul>
              </div>

              <div className="col-span-2 sm:col-span-1">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white mb-6">Stay Updated</h4>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-4">Join our newsletter for weekly educational design patterns.</p>
                <div className="relative group">
                  <input type="email" placeholder="Email address" className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full py-3 pl-5 pr-12 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors placeholder:text-slate-400 shadow-sm" />
                  <button className="absolute right-1.5 top-1.5 bottom-1.5 w-9 rounded-full bg-slate-950 dark:bg-white flex items-center justify-center text-white dark:text-slate-950 group-hover:bg-indigo-600 dark:group-hover:bg-indigo-400 transition-colors shadow-md">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-slate-200/50 dark:border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-sm font-bold text-slate-400 dark:text-slate-500">
              © 2026 E-Learning. Crafted with purpose.
            </div>
            <div className="flex flex-wrap items-center gap-6 text-sm font-bold text-slate-400 dark:text-slate-500">
              <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Terms of Service</a>
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-white/10">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-slate-700 dark:text-slate-300">All Systems Operational</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SiteLayout;