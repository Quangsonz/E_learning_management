import React from 'react';
import { Link, NavLink } from 'react-router-dom';

const navItems = [
  { label: 'Dashboard', to: '/' },
  { label: 'Learning', to: '/learning' },
  { label: 'Quiz', to: '/quiz' },
  { label: 'Teacher', to: '/teacher-dashboard' },
  { label: 'Courses Admin', to: '/course-management' },
  { label: 'Admin', to: '/admin-dashboard' },
  { label: 'Courses', to: '/courses' },
  { label: 'Login', to: '/login' }
];

const SiteLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text-default)]">
      <header className="sticky top-0 z-50 border-b border-white/70 bg-white/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3 font-semibold tracking-tight text-slate-950">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-indigo-500 to-fuchsia-500 text-white shadow-lg shadow-sky-500/20">
              E
            </span>
            <span className="text-lg">E-Learning</span>
          </Link>

          <nav className="hidden items-center gap-2 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 text-sm font-medium transition ${
                    isActive ? 'bg-slate-950 text-white shadow-lg shadow-slate-950/20' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              to="/register"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-50"
            >
              Sign up
            </Link>
            <Link
              to="/courses"
              className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
            >
              Browse courses
            </Link>
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="mt-12 border-t border-white/70 bg-white/75 backdrop-blur-xl">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.4fr_0.6fr_0.6fr] lg:px-8">
          <div>
            <div className="flex items-center gap-3 font-semibold text-slate-950">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-indigo-500 to-fuchsia-500 text-white">
                E
              </span>
              <span>E-Learning Platform</span>
            </div>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600">
              A modern learning experience with premium UI, smooth motion, and clear learning paths for students and teams.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Explore</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li><Link to="/courses" className="transition hover:text-slate-950">Courses</Link></li>
              <li><Link to="/learning" className="transition hover:text-slate-950">Learning</Link></li>
              <li><Link to="/quiz" className="transition hover:text-slate-950">Quiz</Link></li>
              <li><Link to="/teacher-dashboard" className="transition hover:text-slate-950">Teacher Dashboard</Link></li>
              <li><Link to="/course-management" className="transition hover:text-slate-950">Courses Admin</Link></li>
              <li><Link to="/admin-dashboard" className="transition hover:text-slate-950">Admin Dashboard</Link></li>
              <li><Link to="/dashboard" className="transition hover:text-slate-950">Dashboard</Link></li>
              <li><Link to="/login" className="transition hover:text-slate-950">Login</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Support</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li><