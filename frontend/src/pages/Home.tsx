import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageShell } from '../components/ui';

// --- Types & Mock Data ---

type JourneyNode = {
  id: string;
  title: string;
  module: string;
  status: 'completed' | 'active' | 'locked';
};

const journeyPath: JourneyNode[] = [
  { id: '1', title: 'Typography & Grids', module: 'UI Foundations', status: 'completed' },
  { id: '2', title: 'Color Systems', module: 'UI Foundations', status: 'completed' },
  { id: '3', title: 'Component Composition', module: 'React Deep Dive', status: 'active' },
  { id: '4', title: 'Advanced Hooks', module: 'React Deep Dive', status: 'locked' },
  { id: '5', title: 'Performance Optimization', module: 'React Deep Dive', status: 'locked' },
];

const focusBlocks = [
  { id: 'f1', title: 'Review Component Composition', type: 'Lesson', time: '45 mins' },
  { id: 'f2', title: 'React Hooks Quiz', type: 'Assessment', time: '15 mins' },
  { id: 'f3', title: 'Read: Advanced Patterns', type: 'Reading', time: '20 mins' },
];

const knowledgeStream = [
  { id: 'k1', title: 'Completed Color Systems', time: 'Yesterday, 4:30 PM' },
  { id: 'k2', title: 'Earned 7-Day Streak Badge', time: 'Yesterday, 4:25 PM' },
  { id: 'k3', title: 'Scored 92% on UI Quiz', time: 'Tuesday, 2:00 PM' },
];

const liveActivity = [
  "🔥 Sarah just completed 'Advanced Hooks'",
  "⭐ Mark earned a 14-day streak",
  "📚 120 students are studying 'React Deep Dive' right now",
  "🏆 Elena scored 98% on UI Foundations",
  "🚀 New course 'Framer Motion' just dropped!"
];

const adBackgrounds = [
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2560&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2560&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1501504905252-473c47e087f8?q=80&w=2560&auto=format&fit=crop'
];

// --- Subcomponents ---

const ConcentricRings = () => {
  const size = 320;
  const stroke = 20;
  const center = size / 2;
  
  const rings = [
    { radius: 120, value: 70, color: 'url(#emeraldGrad)' },
    { radius: 90, value: 85, color: 'url(#amberGrad)' },
    { radius: 60, value: 92, color: 'url(#indigoGrad)' }
  ];

  return (
    <div className="relative flex items-center justify-center h-[360px] w-[360px]">
      <motion.div 
        className="absolute inset-0 bg-emerald-400/20 blur-[80px] rounded-full"
        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
      
      <svg width={size} height={size} className="-rotate-90 filter drop-shadow-2xl relative z-10" aria-label="Activity Rings">
        <defs>
          <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
          <linearGradient id="amberGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#fbbf24" />
          </linearGradient>
          <linearGradient id="indigoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#818cf8" />
          </linearGradient>
        </defs>

        {rings.map((ring, i) => {
          const circumference = 2 * Math.PI * ring.radius;
          const dashOffset = circumference - (ring.value / 100) * circumference;
          
          return (
            <React.Fragment key={i}>
              <circle
                cx={center}
                cy={center}
                r={ring.radius}
                fill="none"
                stroke="currentColor"
                className="text-white/20 dark:text-slate-800/40"
                strokeWidth={stroke}
              />
              <motion.circle
                cx={center}
                cy={center}
                r={ring.radius}
                fill="none"
                stroke={ring.color}
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: dashOffset }}
                transition={{ duration: 1.5, delay: i * 0.2, ease: [0.32, 0.72, 0, 1] }}
              />
            </React.Fragment>
          );
        })}
      </svg>
      
      {/* Floating Labels */}
      <motion.div 
        className="absolute top-2 left-8 z-20 px-4 py-2 rounded-full bg-white/40 dark:bg-slate-900/60 backdrop-blur-xl shadow-xl border border-white/40 dark:border-white/10 text-sm font-bold text-emerald-700 dark:text-emerald-400"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        7d Streak
      </motion.div>
      <motion.div 
        className="absolute bottom-6 -right-4 z-20 px-4 py-2 rounded-full bg-white/40 dark:bg-slate-900/60 backdrop-blur-xl shadow-xl border border-white/40 dark:border-white/10 text-sm font-bold text-amber-700 dark:text-amber-400"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
      >
        14h Focus
      </motion.div>
      <motion.div 
        className="absolute -bottom-4 left-12 z-20 px-4 py-2 rounded-full bg-white/40 dark:bg-slate-900/60 backdrop-blur-xl shadow-xl border border-white/40 dark:border-white/10 text-sm font-bold text-indigo-700 dark:text-indigo-400"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
      >
        92% Avg
      </motion.div>
    </div>
  );
};

const FlameIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-orange-500 relative z-10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z" />
  </svg>
);

const Home: React.FC = () => {
  const [currentBgIndex, setCurrentBgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBgIndex((prev) => (prev + 1) % adBackgrounds.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <PageShell wide className="bg-[#FBFBFA] dark:bg-[#080808] selection:bg-indigo-500/30 overflow-hidden">
      
      {/* CLEARER Ad Background Carousel */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <AnimatePresence>
          <motion.img
            key={currentBgIndex}
            src={adBackgrounds[currentBgIndex]}
            alt="Ad Background"
            className="absolute inset-0 w-full h-full object-cover opacity-50 dark:opacity-40"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 0.5, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
          />
        </AnimatePresence>
        
        {/* Soft Gradient Overlay for text readability (instead of heavy mesh) */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#FBFBFA]/70 via-[#FBFBFA]/60 to-[#FBFBFA] dark:from-[#080808]/80 dark:via-[#080808]/70 dark:to-[#080808] backdrop-blur-[4px]" />
      </div>

      <div className="max-w-[1400px] mx-auto pt-12 pb-8 px-4 sm:px-6 lg:px-12 space-y-20 relative z-10">
        
        {/* ================= HEADER ================= */}
        <section className="flex flex-col lg:flex-row items-center justify-between gap-16 min-h-[55vh]">
          <motion.div 
            className="flex-1 max-w-3xl space-y-8"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/40 dark:bg-white/10 backdrop-blur-md border border-white/50 dark:border-white/20 shadow-lg">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-bold uppercase tracking-widest text-slate-800 dark:text-slate-200">Daily Objective</span>
            </div>
            <h1 className="text-6xl md:text-[5.5rem] font-black tracking-tighter text-slate-950 dark:text-white leading-[1.05]">
              Master component <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-500">composition.</span>
            </h1>
            <p className="text-xl lg:text-2xl text-slate-700 dark:text-slate-300 max-w-[40ch] leading-relaxed font-medium">
              Your focus rings are almost closed. Complete today's React Deep Dive module to hit your weekly targets.
            </p>
            <div className="pt-4">
              <button className="group relative px-8 py-4 bg-slate-950 dark:bg-white text-white dark:text-slate-950 rounded-[2rem] font-bold text-lg overflow-hidden transition-transform active:scale-95 flex items-center gap-3 shadow-2xl shadow-slate-900/20">
                <span className="relative z-10">Resume Journey</span>
                <span className="relative z-10 w-8 h-8 rounded-full bg-white/20 dark:bg-black/10 flex items-center justify-center transition-transform group-hover:translate-x-1">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </span>
              </button>
            </div>
          </motion.div>

          <motion.div 
            className="flex-shrink-0"
            initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          >
            <ConcentricRings />
          </motion.div>
        </section>

        {/* ================= LIVE ACTIVITY MARQUEE (Fills empty space) ================= */}
        <motion.div 
          className="relative w-full overflow-hidden rounded-[2rem] bg-white/30 dark:bg-white/5 backdrop-blur-2xl border border-white/40 dark:border-white/10 shadow-lg py-4 flex items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#FBFBFA] dark:from-[#080808] to-transparent z-10 pointer-events-none mix-blend-overlay" />
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#FBFBFA] dark:from-[#080808] to-transparent z-10 pointer-events-none mix-blend-overlay" />
          
          <div className="flex animate-marquee whitespace-nowrap gap-12 px-8">
            {liveActivity.map((act, i) => (
              <span key={i} className="text-sm font-bold text-slate-800 dark:text-slate-300 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 opacity-50" />
                {act}
              </span>
            ))}
            {/* Duplicate for infinite seamless scrolling */}
            {liveActivity.map((act, i) => (
              <span key={'dup'+i} className="text-sm font-bold text-slate-800 dark:text-slate-300 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 opacity-50" />
                {act}
              </span>
            ))}
          </div>
        </motion.div>

        {/* ================= EDITORIAL SPLIT (Glass Pills instead of Boxes) ================= */}
        <section className="flex flex-col md:flex-row gap-12 md:gap-24 items-start relative pt-12">
          <motion.div 
            className="w-full md:w-1/3 md:sticky md:top-32"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-5xl lg:text-6xl font-black tracking-tighter text-slate-950 dark:text-white leading-[1.1]">
              The Path to <br/>Mastery.
            </h2>
            <p className="mt-6 text-xl text-slate-600 dark:text-slate-400 max-w-[24ch] font-medium leading-relaxed">
              Slide through your recent and upcoming modules.
            </p>
          </motion.div>

          <div className="w-full md:w-2/3 overflow-hidden">
            <div className="flex gap-6 overflow-x-auto pb-12 pt-4 px-4 -mx-4 snap-x snap-mandatory hide-scrollbar">
              {journeyPath.map((node, i) => (
                <motion.div 
                  key={node.id} 
                  className={`snap-center shrink-0 w-[300px] h-[360px] rounded-[3rem] backdrop-blur-2xl shadow-xl flex flex-col justify-between p-8 border transition-transform hover:-translate-y-2
                    ${node.status === 'completed' ? 'bg-white/40 dark:bg-white/5 border-white/50 dark:border-white/10' : 
                      node.status === 'active' ? 'bg-indigo-50/70 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30 shadow-indigo-500/10' : 
                      'bg-slate-100/30 dark:bg-slate-900/30 border-white/20 dark:border-white/5 opacity-80'}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                >
                  <div>
                    <div className="flex items-center justify-between mb-8">
                      <div className={`w-14 h-14 rounded-[1.5rem] flex items-center justify-center border-2 shadow-sm
                        ${node.status === 'completed' ? 'bg-emerald-500 border-emerald-400 text-white' : 
                          node.status === 'active' ? 'bg-white dark:bg-slate-800 border-indigo-500 text-indigo-500' : 
                          'bg-slate-200/50 dark:bg-slate-800/50 border-slate-300 dark:border-slate-700 text-slate-500'}`}
                      >
                        {node.status === 'completed' && <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                        {node.status === 'active' && <FlameIcon />}
                        {node.status === 'locked' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>}
                      </div>
                      <span className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 bg-white/30 dark:bg-black/20 px-3 py-1.5 rounded-full">Step 0{i + 1}</span>
                    </div>
                    
                    <p className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-3">{node.module}</p>
                    <h3 className={`text-3xl font-bold leading-tight ${node.status === 'locked' ? 'text-slate-500 dark:text-slate-500' : 'text-slate-900 dark:text-white'}`}>
                      {node.title}
                    </h3>
                  </div>

                  {node.status === 'active' && (
                    <button className="mt-8 flex items-center justify-between w-full px-5 py-4 bg-white/50 dark:bg-white/10 rounded-[1.5rem] text-sm font-bold text-indigo-700 dark:text-indigo-300 hover:bg-white dark:hover:bg-white/20 transition-colors group">
                      Enter Module 
                      <span className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">→</span>
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ================= ORGANIC BENTO GRID (No harsh boxes) ================= */}
        <section className="pt-12">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 auto-rows-min">
            
            {/* Bento Cell 1: Today's Agenda (col-span-8) */}
            <motion.div 
              className="md:col-span-8 rounded-[3rem] bg-white/30 dark:bg-white/5 backdrop-blur-3xl border border-white/50 dark:border-white/10 shadow-xl p-10 flex flex-col justify-between"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center justify-between mb-8 pb-8 border-b border-slate-200/50 dark:border-white/10">
                <h3 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white">Today's Agenda</h3>
                <span className="px-4 py-2 bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs font-black uppercase tracking-widest rounded-full">
                  3 Tasks
                </span>
              </div>
              
              <div className="space-y-4">
                {focusBlocks.map((block) => (
                  <div key={block.id} className="group flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-[2rem] bg-white/20 dark:bg-white/5 hover:bg-white/50 dark:hover:bg-white/10 transition-all cursor-pointer border border-white/20 dark:border-transparent">
                    <div className="flex items-start sm:items-center gap-5">
                      <div className="mt-1 sm:mt-0 w-8 h-8 rounded-xl bg-white/50 dark:bg-black/20 border-2 border-slate-300 dark:border-slate-600 group-hover:border-indigo-500 transition-colors shrink-0" />
                      <div>
                        <h4 className="text-xl font-bold text-slate-900 dark:text-slate-100">{block.title}</h4>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">{block.type}</span>
                          <span className="text-xs font-bold text-slate-500">{block.time}</span>
                        </div>
                      </div>
                    </div>
                    <div className="hidden sm:flex w-10 h-10 rounded-full bg-white dark:bg-white/10 items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-indigo-500">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M5 12h14M12 5l7 7-7 7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Bento Cell 2: Weekly Challenge (col-span-4) */}
            <motion.div 
              className="md:col-span-4 rounded-[3rem] bg-gradient-to-br from-amber-200/60 to-orange-300/40 dark:from-amber-500/20 dark:to-orange-600/10 backdrop-blur-3xl border border-amber-300/50 dark:border-amber-500/20 shadow-xl p-10 flex flex-col justify-between"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <div>
                <div className="w-16 h-16 rounded-[2rem] bg-white/60 dark:bg-amber-500/20 flex items-center justify-center shrink-0 mb-8 shadow-sm">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-amber-600 dark:text-amber-400" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </div>
                <h3 className="text-3xl font-bold text-slate-950 dark:text-white mb-4">Weekly Challenge</h3>
                <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed mb-8">
                  Score 90%+ on the comprehensive hooks assessment to unlock the advanced performance module.
                </p>
              </div>
              <button className="w-full rounded-[2rem] py-5 bg-slate-950 dark:bg-white text-white dark:text-slate-950 font-black text-lg hover:scale-[0.98] transition-transform shadow-2xl">
                Accept Challenge
              </button>
            </motion.div>

            {/* Bento Cell 3: Knowledge Stream (col-span-12) */}
            <motion.div 
              className="md:col-span-12 rounded-[3rem] bg-white/30 dark:bg-white/5 backdrop-blur-3xl border border-white/50 dark:border-white/10 shadow-xl p-8 md:p-10 flex flex-col md:flex-row md:items-center gap-8 md:gap-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="shrink-0">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Recent Milestones</h3>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2">Your latest accomplishments</p>
              </div>
              
              <div className="flex-1 flex flex-col md:flex-row gap-8 overflow-hidden">
                {knowledgeStream.map((item) => (
                  <div key={item.id} className="relative flex-1 md:border-l md:border-slate-300/50 md:dark:border-slate-700 md:pl-8 pb-6 md:pb-0 border-b border-slate-200/50 dark:border-white/5 md:border-b-0 last:border-b-0">
                    <div className="hidden md:block absolute -left-[7px] top-1.5 w-3 h-3 rounded-full bg-slate-400 dark:bg-slate-500 border-[3px] border-white/50 dark:border-slate-900" />
                    <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-tight">{item.title}</h4>
                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-500 mt-3">{item.time}</p>
                  </div>
                ))}
              </div>
            </motion.div>

          </div>
        </section>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}} />
    </PageShell>
  );
};

export default Home;
