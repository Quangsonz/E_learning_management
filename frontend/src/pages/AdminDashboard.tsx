import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../services/analytics.api';
import { userApi } from '../services/user.api';
import CourseManagementTab from './CourseManagementTab';
import CategoryManagementTab from './CategoryManagementTab';
import { PlatformPulse } from '../components/admin/PlatformPulse';

/* ── Icons ────────────────────────────────────────────────────────── */
const Icons = {
  Pulse: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
  Users: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Content: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
  Analytics: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>,
  Finance: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  Engagement: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  Config: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  Monitor: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
};

const navigation = [
  { id: 'pulse', label: 'Platform Pulse', icon: Icons.Pulse },
  { id: 'users', label: 'User Management', icon: Icons.Users },
  { id: 'content', label: 'Learning Content', icon: Icons.Content },
  { id: 'categories', label: 'Category Taxonomy', icon: Icons.Content },
  { id: 'analytics', label: 'Analytics & Reports', icon: Icons.Analytics },
  { id: 'finance', label: 'Financial Center', icon: Icons.Finance },
  { id: 'engagement', label: 'Engagement Center', icon: Icons.Engagement },
  { id: 'config', label: 'System Configuration', icon: Icons.Config },
  { id: 'monitoring', label: 'System Monitoring', icon: Icons.Monitor },
];


/* ── Hooks ────────────────────────────────────────────────────────── */
const useCountUp = (target: number, duration = 1500) => {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let start: number | null = null;
    let frame = 0;

    const step = (timestamp: number) => {
      if (start === null) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setValue(Math.round(target * easeOutQuart));
      if (progress < 1) frame = window.requestAnimationFrame(step);
    };

    frame = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(frame);
  }, [duration, target]);

  return value;
};

/* ── Components ───────────────────────────────────────────────────── */



/* ── USER MANAGEMENT COMPONENT ── */
const UserIntelligence = () => {
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => userApi.getAllUsers(),
  });

  const realUsers: any[] = (usersData as any)?.data?.users || [];

  const mappedUsers = realUsers.map((u: any) => ({
    id: u._id,
    name: u.name || 'Unknown',
    email: u.email || '',
    role: u.role ? u.role.charAt(0).toUpperCase() + u.role.slice(1) : 'Student',
    status: u.isActive !== false ? 'Active' : 'Suspended',
    lastActive: u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never',
    avatar: u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'U')}&background=random`
  }));

  const filteredUsers = mappedUsers.filter((u: any) => {
    const matchesFilter = filter === 'All' || u.role === filter;
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-20 mt-4">
      
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold uppercase tracking-[0.25em] text-white/40 pl-1">Directory</span>
          <h1 className="text-4xl font-light tracking-tight text-white">User Intelligence</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative group">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input 
              type="text" 
              placeholder="Search users..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm bg-white/5 border border-white/10 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors w-64 text-white placeholder:text-white/30"
            />
          </div>
          <button className="px-4 py-2 bg-white text-black text-sm font-bold rounded-lg hover:bg-white/90 transition-colors">
            Invite User
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-white/10 pb-2">
        {['All', 'Student', 'Instructor', 'Admin'].map(tab => (
          <button 
            key={tab}
            onClick={() => setFilter(tab)}
            className={`text-sm font-semibold tracking-wide pb-2 relative transition-colors ${filter === tab ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
          >
            {tab}
            {filter === tab && (
              <motion.div layoutId="user-tab" className="absolute -bottom-[3px] left-0 right-0 h-0.5 bg-white" />
            )}
          </button>
        ))}
      </div>

      {/* Data Table directly on canvas */}
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              <th className="pb-4 text-xs font-bold uppercase tracking-widest text-white/30 border-b border-white/10 w-12"></th>
              <th className="pb-4 text-xs font-bold uppercase tracking-widest text-white/30 border-b border-white/10">User</th>
              <th className="pb-4 text-xs font-bold uppercase tracking-widest text-white/30 border-b border-white/10">Role</th>
              <th className="pb-4 text-xs font-bold uppercase tracking-widest text-white/30 border-b border-white/10">Status</th>
              <th className="pb-4 text-xs font-bold uppercase tracking-widest text-white/30 border-b border-white/10">Last Active</th>
              <th className="pb-4 text-xs font-bold uppercase tracking-widest text-white/30 border-b border-white/10 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {filteredUsers.map((user, idx) => (
                <motion.tr 
                  key={user.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group hover:bg-white/[0.02] transition-colors"
                >
                  <td className="py-4 border-b border-white/5">
                    <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full border border-white/10 object-cover" />
                  </td>
                  <td className="py-4 border-b border-white/5">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-white/90">{user.name}</span>
                      <span className="text-xs text-white/40">{user.email}</span>
                    </div>
                  </td>
                  <td className="py-4 border-b border-white/5">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-md ${
                      user.role === 'Admin' ? 'bg-indigo-500/10 text-indigo-400' :
                      user.role === 'Instructor' ? 'bg-cyan-500/10 text-cyan-400' :
                      'bg-white/5 text-white/60'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="py-4 border-b border-white/5">
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'Active' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      <span className="text-sm text-white/70">{user.status}</span>
                    </div>
                  </td>
                  <td className="py-4 border-b border-white/5">
                    <span className="text-sm text-white/50">{user.lastActive}</span>
                  </td>
                  <td className="py-4 border-b border-white/5 text-right">
                    <button className="text-xs font-semibold text-white/40 hover:text-white transition-colors">
                      Edit
                    </button>
                    <span className="text-white/20 mx-2">•</span>
                    <button className="text-xs font-semibold text-red-400/50 hover:text-red-400 transition-colors">
                      Suspend
                    </button>
                  </td>
                </motion.tr>
              ))}
              {usersLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-white/40 text-sm">
                    Loading users from secure channel...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-white/40 text-sm">
                    No users found matching your criteria.
                  </td>
                </tr>
              ) : null}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
};

const SystemMonitoring = () => {
  const metrics = [
    { label: 'API Latency', value: '24ms', status: 'optimal', color: 'emerald' },
    { label: 'Database Load', value: '12%', status: 'optimal', color: 'emerald' },
    { label: 'Storage Usage', value: '82%', status: 'warning', color: 'amber' },
    { label: 'Edge Cache', value: '98.5%', status: 'optimal', color: 'emerald' },
  ];

  return (
    <div className="flex flex-col gap-16 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-20 mt-4">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold uppercase tracking-[0.25em] text-white/40 pl-1">Infrastructure</span>
          <h1 className="text-4xl lg:text-5xl font-light tracking-tight text-white">System Monitor</h1>
        </div>
        <div className="flex items-center gap-3 mb-2 px-4 py-2 border border-emerald-500/20 rounded-full text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-bold tracking-widest uppercase">All Systems Optimal</span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
        {metrics.map(metric => (
          <div key={metric.label} className="flex flex-col gap-2 border-l-2 border-white/10 pl-5 hover:border-white/30 transition-colors">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">{metric.label}</span>
            <div className={`text-4xl font-light tracking-tight text-${metric.color}-400`}>
              {metric.value}
            </div>
          </div>
        ))}
      </div>

      <div className="w-full h-[1px] bg-gradient-to-r from-white/10 via-white/5 to-transparent" />

      <div className="flex flex-col gap-6">
        <h2 className="text-2xl font-light tracking-tight text-white/90">Live Traffic Logs</h2>
        <div className="w-full h-[350px] font-mono text-sm text-white/50 overflow-y-auto flex flex-col gap-3">
          <div className="text-emerald-500 font-bold mb-2">root@elearning-prod:~# tail -f /var/log/nginx/access.log</div>
          <div>[22:41:02] GET /api/v1/courses/ 200 OK - 12ms</div>
          <div>[22:41:05] GET /api/v1/users/me 200 OK - 8ms</div>
          <div>[22:41:08] POST /api/v1/tracking/event 201 Created - 4ms</div>
          <div className="text-amber-400">[22:41:15] WARN: High DB connection count detected (80%)</div>
          <div>[22:41:16] GET /api/v1/analytics/pulse 200 OK - 45ms</div>
          <div>[22:41:19] POST /api/v1/payments/webhook 200 OK - 110ms</div>
        </div>
      </div>
    </div>
  );
}

const EmptySection = ({ title, description }: { title: string, description: string }) => (
  <div className="flex flex-col justify-center h-full min-h-[400px] gap-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 mt-12">
    <span className="text-sm font-semibold uppercase tracking-[0.25em] text-white/30 pl-1">Workspace</span>
    <h2 className="text-4xl lg:text-5xl font-light text-white tracking-tight">{title}</h2>
    <p className="text-lg text-white/40 max-w-xl leading-relaxed font-light">{description}</p>
    <button className="mt-4 px-6 py-3 bg-white text-black text-xs font-bold uppercase tracking-widest rounded-lg self-start hover:bg-white/90 transition-colors">
      Configure Area
    </button>
  </div>
);

/* ── Main Layout ───────────────────────────────────────────────────── */
const AdminDashboard: React.FC = () => {
  const [activeSection, setActiveSection] = useState('pulse');

  return (
    <div className="dark flex h-[100dvh] w-full bg-[#050505] overflow-hidden text-white/90 font-sans selection:bg-indigo-500/30 relative">
      
      {/* ── ATMOSPHERIC BACKGROUND SYSTEM ── */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden mix-blend-screen opacity-50">
        <div className="absolute top-0 -left-[10%] w-[60%] h-[60%] rounded-full bg-indigo-500/10 blur-[150px]" />
        <div className="absolute bottom-0 right-[10%] w-[50%] h-[60%] rounded-full bg-cyan-600/5 blur-[150px]" />
      </div>

      {/* ── FLOATING NAVIGATION RAIL ── */}
      <aside className="w-[280px] h-full bg-black/40 border-r border-white/5 backdrop-blur-3xl flex flex-col z-20 shrink-0 shadow-[20px_0_50px_rgba(0,0,0,0.5)]">
        <div className="h-28 flex items-center px-8">
          <Link to="/home" className="flex items-center gap-4 group">
            <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center font-bold tracking-tighter text-sm transition-transform group-hover:scale-110">
              E
            </div>
            <span className="font-bold tracking-widest uppercase text-[10px] text-white/70">Command Center</span>
          </Link>
        </div>

        <nav className="flex-1 py-4 px-6 flex flex-col gap-2 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors relative group ${
                  isActive ? 'text-white' : 'text-white/30 hover:text-white/70'
                }`}
              >
                {isActive && (
                  <motion.div 
                    layoutId="rail-indicator"
                    className="absolute inset-0 bg-white/10 rounded-lg"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <div className={`relative z-10 transition-colors ${isActive ? 'text-indigo-400' : ''}`}>
                  <item.icon />
                </div>
                <span className="relative z-10 pt-0.5">{item.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="p-8">
          <div className="flex items-center gap-4 group cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-sm font-bold text-white group-hover:bg-white/10 transition-colors">
              AD
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[11px] font-bold text-white uppercase tracking-widest">Super Admin</span>
              <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Sys Level 5</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ── CONTINUOUS CANVAS WORKSPACE ── */}
      <main className="flex-1 h-full flex flex-col z-10 relative overflow-hidden">
        
        {/* Transparent Header */}
        <header className="h-28 flex items-center justify-end px-12 shrink-0 relative z-20">
          <div className="flex items-center gap-8">
             <div className="relative group">
                <svg className="absolute left-0 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-white transition-colors" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                <input 
                  type="text" 
                  placeholder="Search index... (⌘K)" 
                  className="pl-7 py-2 text-xs font-bold tracking-widest uppercase bg-transparent border-b border-white/10 focus:border-white focus:outline-none transition-all w-48 focus:w-64 text-white placeholder:text-white/20"
                />
             </div>
             <button className="text-white/30 hover:text-white transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
             </button>
          </div>
        </header>

        {/* Scrolling Canvas */}
        <div className="flex-1 overflow-y-auto px-12 lg:px-20 pb-24">
          <div className="max-w-[1400px] mx-auto">
            {activeSection === 'pulse' && <PlatformPulse />}
            {activeSection === 'users' && <UserIntelligence />}
            {activeSection === 'content' && <CourseManagementTab />}
            {activeSection === 'categories' && <CategoryManagementTab />}
            {activeSection === 'monitoring' && <SystemMonitoring />}
            
            {activeSection === 'analytics' && <EmptySection title="Business Intelligence" description="Deep dive into conversion rates, cohort analysis, and revenue streams." />}
            {activeSection === 'finance' && <EmptySection title="Financial Center" description="Gateway configurations, invoice routing, and subscription engines." />}
            {activeSection === 'engagement' && <EmptySection title="Engagement Center" description="Global communications, push systems, and community moderation." />}
            {activeSection === 'config' && <EmptySection title="System Config" description="Root-level environment variables, brand kits, and API integrations." />}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
