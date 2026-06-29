import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../../services/analytics.api';
import { useCountUp } from '../../hooks/useCountUp';

export const PlatformPulse = () => {
  const { data: analyticsData } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: analyticsApi.getAdminDashboard,
  });

  const overview = analyticsData?.data?.overview || {};
  const usersTarget = overview.totalUsers || 0;
  const enrollmentsTarget = overview.totalEnrollments || 0;
  const revenueTarget = overview.totalRevenue || 0;

  const users = useCountUp(usersTarget);
  const activeToday = useCountUp(enrollmentsTarget); // Using enrollments as active metric fallback
  const revenue = useCountUp(revenueTarget);

  return (
    <div className="flex flex-col gap-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-20">
      
      {/* ── HERO METRICS ── */}
      <div className="grid grid-cols-12 gap-12 items-end mt-4">
        
        {/* Primary KPI */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-3">
          <span className="text-sm font-semibold uppercase tracking-[0.25em] text-white/40 pl-1">Revenue Today</span>
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-4 sm:gap-6">
            <h1 className="text-[4rem] sm:text-[5rem] lg:text-[6rem] leading-[0.9] font-light tracking-tighter text-white">
              <span className="text-white/40 mr-1">$</span>
              {(revenue / 1000).toFixed(1)}
              <span className="text-white/40 ml-1">k</span>
            </h1>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 self-start sm:self-auto sm:mb-4">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
              <span className="text-xs font-bold tracking-widest">+18.2%</span>
            </div>
          </div>
        </div>

        {/* Orbiting KPIs */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6 lg:pb-4">
           <div className="flex items-center justify-between border-l-2 border-white/10 pl-5">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">Total Users</span>
              <span className="text-2xl font-light tracking-tight text-white/90">{users.toLocaleString()}</span>
           </div>
           <div className="flex items-center justify-between border-l-2 border-white/10 pl-5">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">Total Enrollments</span>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-light tracking-tight text-white/90">{activeToday.toLocaleString()}</span>
                <span className="text-xs font-bold text-emerald-500 tracking-wider">+4.2%</span>
              </div>
           </div>
           <div className="flex items-center justify-between border-l-2 border-emerald-500/30 pl-5">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-500/60">System Status</span>
              <div className="flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                 <span className="text-lg font-medium text-emerald-400">Optimal</span>
              </div>
           </div>
        </div>
      </div>

      {/* Subtle Divider */}
      <div className="w-full h-[1px] bg-gradient-to-r from-white/10 via-white/5 to-transparent" />

      {/* ── FLOWING CHART & LIVE OPERATIONS ── */}
      <div className="grid grid-cols-12 gap-12">
        
        {/* Business Intelligence directly embedded */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
               <h2 className="text-2xl font-light tracking-tight text-white/90">Business Intelligence</h2>
               <span className="text-xs font-medium text-white/40">Revenue vs Active Learners (30 Days)</span>
            </div>
            <div className="flex gap-3">
               {['7D', '30D', '1Y'].map(filter => (
                 <button key={filter} className={`text-xs font-bold uppercase tracking-widest transition-colors ${filter === '30D' ? 'text-indigo-400' : 'text-white/30 hover:text-white/70'}`}>
                   {filter}
                 </button>
               ))}
            </div>
          </div>

          <div className="h-[320px] w-full relative flex items-end">
             {/* Atmospheric Chart Base */}
             <div className="absolute bottom-0 left-0 right-0 h-[240px] opacity-30 pointer-events-none" style={{ backgroundImage: 'linear-gradient(to top, rgba(99, 102, 241, 0.4), transparent)' }}></div>
             
             {/* Barely visible Grid lines */}
             <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
               {[1,2,3,4,5].map(i => <div key={i} className="w-full h-[1px] bg-white/[0.03]" />)}
             </div>

             <svg viewBox="0 0 1000 320" className="absolute inset-0 w-full h-full preserve-3d overflow-visible" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgb(99, 102, 241)" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="rgb(99, 102, 241)" stopOpacity="0" />
                  </linearGradient>
                  <filter id="glowHeavy" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="8" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>
                <motion.path 
                  d="M0,280 C100,270 200,300 300,220 C400,140 500,200 600,170 C700,150 800,200 900,80 L1000,40 L1000,320 L0,320 Z" 
                  fill="url(#chartGlow)" 
                />
                <motion.path 
                  d="M0,280 C100,270 200,300 300,220 C400,140 500,200 600,170 C700,150 800,200 900,80 L1000,40" 
                  fill="none" 
                  stroke="rgb(129, 140, 248)" 
                  strokeWidth="3"
                  filter="url(#glowHeavy)"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 2.5, ease: [0.16, 1, 0.3, 1] }}
                />
             </svg>

             {/* Typographic Annotation directly on canvas */}
             <motion.div 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 2 }}
               className="absolute top-[60px] right-[12%] flex flex-col gap-1 items-end"
             >
               <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400">Launch Peak</span>
               <span className="text-xl font-light text-white">$142k Day</span>
               <div className="w-[1px] h-16 bg-gradient-to-b from-indigo-400 to-transparent mt-2 mr-4" />
             </motion.div>
          </div>
        </div>

        {/* Live Operations Feed directly embedded */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-8">
           <div className="flex items-center justify-between">
             <h2 className="text-2xl font-light tracking-tight text-white/90">Live Operations</h2>
             <span className="text-xs font-bold text-white/30 uppercase tracking-widest">Realtime</span>
           </div>
           
           <div className="flex flex-col gap-6 relative">
              <div className="flex flex-col items-center justify-center py-8 text-white/30">
                <span className="text-sm">No recent operations detected.</span>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};
