import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { PageShell, Button } from '../components/ui';

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_USER = {
  name: 'Lan Nguyen',
  username: '@lannguyen',
  email: 'lan@elearning.app',
  role: 'Frontend Engineer',
  joinDate: 'Aug 2026',
  level: 18,
  streak: 14,
  xp: 8450,
  xpNext: 10000,
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256&h=256'
};

const COURSES = [
  {
    id: 'c1',
    title: 'Advanced React Architecture',
    progress: 78,
    status: 'Active',
    lastLesson: 'State Machines with XState',
    cover: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&q=80&w=800',
    primary: true
  },
  {
    id: 'c2',
    title: 'Motion Design in CSS',
    progress: 32,
    status: 'Paused',
    lastLesson: 'Spring physics basics',
    cover: 'https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&q=80&w=800',
    primary: false
  }
];

const JOURNEY = [
  { id: 1, title: 'Mastered React Hooks', date: 'Jul 15', status: 'completed' },
  { id: 2, title: 'Built E-Commerce Dashboard', date: 'Jul 28', status: 'completed' },
  { id: 3, title: 'Advanced State Management', date: 'Current', status: 'active' },
  { id: 4, title: 'Web Performance Auditing', date: 'Upcoming', status: 'locked' }
];

const CERTIFICATES = [
  { id: 'cert1', name: 'Frontend Architecture', issuer: 'Meta', date: 'Jul 2026', hue: 'indigo' },
  { id: 'cert2', name: 'UI/UX Foundations', issuer: 'Google', date: 'May 2026', hue: 'emerald' },
  { id: 'cert3', name: 'Advanced Animation', issuer: 'Framer', date: 'Mar 2026', hue: 'fuchsia' }
];

const FEED = [
  { id: 1, action: 'Completed Quiz', target: 'Hooks Deep Dive', result: '95% Score', time: '2 hours ago', type: 'success' },
  { id: 2, action: 'Earned Certificate', target: 'UI/UX Foundations', result: 'Verified', time: '2 days ago', type: 'award' },
  { id: 3, action: 'Started Course', target: 'Advanced UX Patterns', result: 'Module 1', time: '1 week ago', type: 'learning' },
];

// ============================================================================
// COMPONENTS
// ============================================================================

const ProfileHero: React.FC = () => {
  const xpPercent = (MOCK_USER.xp / MOCK_USER.xpNext) * 100;
  
  return (
    <section className="relative w-full pt-16 pb-20 px-6 lg:px-12 rounded-[3rem] overflow-hidden group">
      {/* Background Glows */}
      <div className="absolute inset-0 bg-slate-900 dark:bg-black/40 z-0">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-indigo-600/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none transform group-hover:scale-105 transition-transform duration-1000" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-600/10 blur-[100px] rounded-full mix-blend-screen pointer-events-none" />
        {/* Subtle Noise */}
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] z-0 mix-blend-overlay" />
      </div>

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-12 max-w-[1200px] mx-auto">
        
        {/* Left: Avatar & Identity */}
        <div className="flex items-center gap-8">
          <div className="relative">
            {/* XP Ring */}
            <svg className="absolute -inset-4 w-[calc(100%+32px)] h-[calc(100%+32px)] -rotate-90 pointer-events-none" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/10" />
              <motion.circle 
                cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-indigo-500" strokeLinecap="round" 
                initial={{ strokeDasharray: "0 301" }}
                animate={{ strokeDasharray: `${xpPercent * 3.01} 301` }}
                transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
              />
            </svg>
            <div className="relative w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden border border-white/10 shadow-2xl bg-slate-800">
              <img src={MOCK_USER.avatar} alt="Profile" className="w-full h-full object-cover" />
            </div>
            {/* Online Status */}
            <div className="absolute top-2 right-2 w-4 h-4 bg-emerald-500 border-2 border-slate-900 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.6)]" />
            {/* Level Badge */}
            <motion.div 
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="absolute -bottom-2 -right-2 bg-gradient-to-br from-slate-800 to-slate-950 border border-white/20 text-white text-xs font-black px-3 py-1.5 rounded-full shadow-xl flex items-center gap-1.5"
            >
              <span className="text-indigo-400">LVL</span>
              <span>{MOCK_USER.level}</span>
            </motion.div>
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white">{MOCK_USER.name}</h1>
            <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-slate-400">
              <span className="text-indigo-400">{MOCK_USER.username}</span>
              <span className="w-1 h-1 rounded-full bg-slate-600 hidden sm:block" />
              <span>{MOCK_USER.role}</span>
              <span className="w-1 h-1 rounded-full bg-slate-600 hidden sm:block" />
              <span>Joined {MOCK_USER.joinDate}</span>
            </div>
            <div className="flex items-center gap-2 mt-4 text-sm font-semibold text-amber-500 bg-amber-500/10 w-fit px-3 py-1 rounded-full border border-amber-500/20">
              🔥 {MOCK_USER.streak} Day Streak
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="shrink-0 flex flex-col items-end gap-6 w-full md:w-auto">
          <Link to="/settings" className="w-full md:w-auto">
            <Button variant="outline" className="w-full md:w-auto rounded-full bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20 shadow-lg backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5">
              Manage Account
            </Button>
          </Link>
          <div className="text-right hidden md:block">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Total XP</p>
            <p className="text-2xl font-black tabular-nums text-white tracking-tight">{MOCK_USER.xp.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </section>
  );
};

const LearningStory: React.FC = () => {
  return (
    <section className="py-12 border-b border-slate-200 dark:border-white/5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-12 md:gap-8">
        <div>
          <p className="text-6xl font-black tracking-tighter text-slate-900 dark:text-white">142</p>
          <p className="text-sm font-bold uppercase tracking-widest text-slate-500 mt-2">Hours Learned</p>
        </div>
        <div>
          <p className="text-6xl font-black tracking-tighter text-slate-900 dark:text-white">8</p>
          <p className="text-sm font-bold uppercase tracking-widest text-slate-500 mt-2">Courses Done</p>
        </div>
        <div>
          <p className="text-6xl font-black tracking-tighter text-slate-900 dark:text-white">92<span className="text-3xl text-indigo-500">%</span></p>
          <p className="text-sm font-bold uppercase tracking-widest text-slate-500 mt-2">Avg Score</p>
        </div>
        <div>
          <p className="text-6xl font-black tracking-tighter text-slate-900 dark:text-white">5</p>
          <p className="text-sm font-bold uppercase tracking-widest text-slate-500 mt-2">Certificates</p>
        </div>
      </div>
    </section>
  );
};

const ActiveLearning: React.FC = () => {
  const primary = COURSES.find(c => c.primary)!;
  const secondary = COURSES.filter(c => !c.primary);

  return (
    <section className="space-y-8">
      <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Active Workspace</h2>

      <div className="grid lg:grid-cols-12 gap-8 items-stretch">
        {/* Dominant Primary Course */}
        <div className="lg:col-span-8 group relative rounded-[2rem] overflow-hidden bg-slate-900 transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/20 min-h-[360px]">
          <img src={primary.cover} alt="Cover" className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-30 transition-opacity duration-500 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          
          <div className="relative h-full flex flex-col justify-end p-8 md:p-10">
            <div className="mb-auto flex justify-between items-start">
              <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-widest border border-indigo-500/30 backdrop-blur-md">
                {primary.status}
              </span>
              <button className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center shadow-xl transition-transform duration-300 hover:scale-110 active:scale-95">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              </button>
            </div>
            
            <div className="mt-12">
              <h3 className="text-3xl font-black tracking-tight text-white mb-2">{primary.title}</h3>
              <p className="text-slate-300 font-medium text-sm md:text-base">Up next: {primary.lastLesson}</p>
              
              <div className="mt-8 flex items-center gap-6">
                <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-indigo-400 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${primary.progress}%` }}
                    transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                  />
                </div>
                <span className="text-sm font-bold text-white tabular-nums">{primary.progress}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Courses */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {secondary.map(course => (
            <div key={course.id} className="group relative flex-1 rounded-[2rem] overflow-hidden bg-slate-100 dark:bg-slate-800/40 p-6 md:p-8 transition-all duration-300 hover:-translate-y-1 border border-slate-200 dark:border-white/5">
              <div className="flex flex-col h-full justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{course.status}</span>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white mt-1.5 leading-snug">{course.title}</h4>
                </div>
                <div className="mt-8">
                  <div className="flex justify-between text-xs font-semibold text-slate-500 mb-2">
                    <span>Progress</span>
                    <span>{course.progress}%</span>
                  </div>
                  <div className="h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-slate-400 dark:bg-slate-400"
                      initial={{ width: 0 }}
                      animate={{ width: `${course.progress}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const LearningJourney: React.FC = () => {
  return (
    <section className="space-y-8">
      <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">The Journey</h2>
      
      <div className="relative pl-2">
        {/* Main Track Line */}
        <div className="absolute left-[27px] top-0 bottom-0 w-[2px] bg-slate-200 dark:bg-white/10" />
        
        <div className="flex flex-col gap-10">
          {JOURNEY.map((node) => {
            const isActive = node.status === 'active';
            const isCompleted = node.status === 'completed';
            
            return (
              <div key={node.id} className="relative flex items-center pl-16 group">
                {/* Center Node */}
                <div className="absolute left-0 w-14 h-14 rounded-full bg-[#FBFBFA] dark:bg-[#080808] flex items-center justify-center border-4 border-[#FBFBFA] dark:border-[#080808] z-10 transition-transform duration-300 group-hover:scale-110">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-500 ${isActive ? 'bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.5)]' : isCompleted ? 'bg-slate-800 dark:bg-white text-white dark:text-slate-900' : 'bg-slate-200 dark:bg-slate-800'}`}>
                    {isCompleted ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg> : null}
                    {isActive ? <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" /> : null}
                  </div>
                </div>

                {/* Content Panel */}
                <div className="w-full">
                  <div className={`p-5 rounded-2xl transition-all duration-300 ${isActive ? 'bg-indigo-500/5 border border-indigo-500/20' : 'bg-transparent border border-transparent hover:bg-slate-50 dark:hover:bg-white/5 hover:border-slate-200 dark:hover:border-white/10'}`}>
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${isActive ? 'text-indigo-500' : 'text-slate-400'}`}>{node.date}</span>
                    <h4 className={`text-lg font-bold mt-1 ${isCompleted || isActive ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>{node.title}</h4>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

const Certificates: React.FC = () => {
  return (
    <section className="space-y-8">
      <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Verified Skills</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {CERTIFICATES.map(cert => (
          <div key={cert.id} className="group relative aspect-[4/3] rounded-[2rem] overflow-hidden bg-slate-900 p-8 flex flex-col justify-between transition-transform duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-black/20 border border-white/5">
            {/* Glass Overlay & Gradient */}
            <div className={`absolute inset-0 opacity-30 group-hover:opacity-50 transition-opacity duration-500 bg-gradient-to-br ${
              cert.hue === 'indigo' ? 'from-indigo-500 to-blue-600' : 
              cert.hue === 'emerald' ? 'from-emerald-500 to-teal-600' : 'from-fuchsia-500 to-pink-600'
            }`} />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.2] mix-blend-overlay" />
            
            <div className="relative z-10 flex justify-between items-start">
              <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
              </div>
              <span className="text-white/70 text-[10px] font-bold uppercase tracking-widest bg-black/20 px-2 py-1 rounded-full backdrop-blur-sm">{cert.date}</span>
            </div>
            
            <div className="relative z-10">
              <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-1.5">{cert.issuer}</p>
              <h4 className="text-xl font-bold text-white leading-tight">{cert.name}</h4>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

const ActivityFeed: React.FC = () => {
  return (
    <section className="space-y-8">
      <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Activity Log</h2>
      
      <div className="flex flex-col border-t border-slate-200 dark:border-white/10">
        {FEED.map(item => (
          <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-5 border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors px-4 -mx-4 rounded-xl">
            <div className="flex items-center gap-4">
              <div className={`w-2 h-2 rounded-full shrink-0 ${
                item.type === 'success' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 
                item.type === 'award' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]'
              }`} />
              <div>
                <span className="text-sm font-semibold text-slate-900 dark:text-white">{item.action} </span>
                <span className="text-sm text-slate-500">{item.target}</span>
              </div>
            </div>
            <div className="flex items-center gap-4 sm:justify-end text-sm">
              <span className="font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-white/5 px-2.5 py-1 rounded-md">{item.result}</span>
              <span className="text-slate-400 tabular-nums text-xs">{item.time}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

const Profile: React.FC = () => {
  return (
    <PageShell wide>
      <div className="max-w-[1200px] mx-auto w-full pt-8 pb-16 px-4 sm:px-6 lg:px-0 flex flex-col gap-12 lg:gap-16">
        
        {/* Core Identity */}
        <div className="flex flex-col gap-8">
          <ProfileHero />
          <LearningStory />
        </div>
        
        {/* Workspace */}
        <ActiveLearning />
        
        {/* History & Progression */}
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16">
          <div className="lg:col-span-5">
            <LearningJourney />
          </div>
          <div className="lg:col-span-7 flex flex-col gap-12 lg:gap-16">
            <Certificates />
            <ActivityFeed />
          </div>
        </div>

      </div>
    </PageShell>
  );
};

export default Profile;
