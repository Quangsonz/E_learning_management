import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { userApi } from '../services/user.api';
import { PageShell, LoadingScreen, EmptyState } from '../components/ui';

const Leaderboard: React.FC = () => {
  const { t } = useTranslation();
  const { data: leaderboardData, isLoading, isError } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => userApi.getLeaderboard(20)
  });

  const users = leaderboardData?.data?.leaderboard || [];

  if (isLoading) {
    return (
      <PageShell>
        <LoadingScreen title={t('leaderboard.loading')} message={t('leaderboard.fetching')} />
      </PageShell>
    );
  }

  if (isError) {
    return (
      <PageShell>
        <EmptyState title={t('leaderboard.error')} message={t('leaderboard.errorMsg')} />
      </PageShell>
    );
  }

  // Lấy top 3 và danh sách còn lại
  const top3 = users.slice(0, 3);
  const others = users.slice(3);

  // Đổi thứ tự Top 3 để render bục vinh quang: Hạng 2 - Hạng 1 - Hạng 3
  const podiumUsers = [];
  if (top3[1]) podiumUsers.push({ ...top3[1], rank: 2 });
  if (top3[0]) podiumUsers.push({ ...top3[0], rank: 1 });
  if (top3[2]) podiumUsers.push({ ...top3[2], rank: 3 });

  return (
    <PageShell className="pb-20 relative overflow-hidden">
      {/* Atmospheric Background Effects */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Glow Orbs */}
        <motion.div 
          animate={{ x: [0, 30, 0], y: [0, -50, 0] }} transition={{ repeat: Infinity, duration: 15, ease: "easeInOut" }}
          className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-primary-500/10 dark:bg-primary-600/10 rounded-full blur-[120px]" 
        />
        <motion.div 
          animate={{ x: [0, -40, 0], y: [0, 40, 0] }} transition={{ repeat: Infinity, duration: 18, ease: "easeInOut" }}
          className="absolute top-60 -right-20 w-[600px] h-[600px] bg-amber-500/10 dark:bg-amber-600/10 rounded-full blur-[150px]" 
        />
        <motion.div 
          animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 20, ease: "easeInOut" }}
          className="absolute bottom-0 left-1/4 w-[700px] h-[700px] bg-orange-500/5 dark:bg-orange-600/5 rounded-full blur-[150px]" 
        />
        
        {/* Mesh Grid Overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMTQ4LCAxNjMsIDE4NCwgMC4xNSkiLz48L3N2Zz4=')] [mask-image:radial-gradient(ellipse_at_center,transparent_40%,black)] dark:opacity-30" />

        {/* Floating Glass Shapes (Left Side) */}
        <motion.div 
          animate={{ y: [0, -20, 0], rotate: [10, -5, 10] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="hidden xl:flex absolute top-40 left-[8%] w-32 h-32 bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-3xl shadow-2xl items-center justify-center z-0"
        >
          <span className="text-5xl drop-shadow-md">🏆</span>
        </motion.div>
        
        <motion.div 
          animate={{ y: [0, 30, 0], rotate: [15, 30, 15] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="hidden xl:block absolute top-96 left-[12%] w-20 h-20 bg-gradient-to-br from-amber-400/30 to-orange-500/30 backdrop-blur-md border border-amber-400/40 rounded-full shadow-xl z-0"
        />

        {/* Floating Glass Shapes (Right Side) */}
        <motion.div 
          animate={{ y: [0, 25, 0], rotate: [-15, 5, -15] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          className="hidden xl:flex absolute top-60 right-[10%] w-40 h-40 bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-[2.5rem] shadow-2xl items-center justify-center z-0"
        >
          <span className="text-6xl drop-shadow-md">🔥</span>
        </motion.div>

        <motion.div 
          animate={{ y: [0, -15, 0], rotate: [12, -12, 12] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
          className="hidden xl:flex absolute top-20 right-[15%] w-16 h-16 bg-primary-500/20 backdrop-blur-lg border border-primary-500/30 rounded-xl items-center justify-center z-0"
        >
          <span className="text-2xl drop-shadow-md">⭐️</span>
        </motion.div>
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white">{t('leaderboard.globalTitle')}</h1>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
            {t('leaderboard.globalDesc')}
          </p>
        </div>

        {users.length === 0 ? (
          <EmptyState title={t('leaderboard.noActivity')} message={t('leaderboard.beFirst')} />
        ) : (
          <>
            {/* Top 3 Podium */}
            <div className="flex justify-center items-end gap-3 sm:gap-8 mb-24 h-72 mt-20 relative">
              {/* Glow Orbs behind podium */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-amber-500/10 blur-[100px] rounded-full pointer-events-none" />
              
              {podiumUsers.map((u) => {
                const isFirst = u.rank === 1;
                const heightClass = isFirst ? 'h-56' : u.rank === 2 ? 'h-40' : 'h-32';
                
                const glassClass = isFirst 
                  ? 'bg-gradient-to-b from-amber-500/10 to-amber-500/5 dark:from-amber-500/20 dark:to-amber-900/20 backdrop-blur-xl border border-amber-400/40 shadow-[0_0_50px_rgba(245,158,11,0.25)]' 
                  : u.rank === 2 
                  ? 'bg-gradient-to-b from-slate-400/10 to-slate-400/5 dark:from-slate-400/20 dark:to-slate-800/30 backdrop-blur-xl border border-slate-300/40 shadow-[0_0_40px_rgba(148,163,184,0.15)]'
                  : 'bg-gradient-to-b from-orange-500/10 to-orange-500/5 dark:from-orange-500/20 dark:to-orange-900/30 backdrop-blur-xl border border-orange-400/40 shadow-[0_0_40px_rgba(249,115,22,0.15)]';
                
                const medalColor = isFirst ? 'text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]' : u.rank === 2 ? 'text-slate-400 drop-shadow-[0_0_8px_rgba(148,163,184,0.5)]' : 'text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]';

                return (
                  <motion.div 
                    key={u._id}
                    initial={{ opacity: 0, y: 80 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: u.rank * 0.15, type: 'spring', stiffness: 80, damping: 12 }}
                    className="flex flex-col items-center w-28 sm:w-40 relative group cursor-default"
                  >
                    {isFirst && (
                      <motion.div 
                        initial={{ scale: 0, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        transition={{ delay: 0.6, type: 'spring', stiffness: 200 }}
                        className="absolute -top-14 text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.8)] z-20"
                      >
                        <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z"/>
                        </svg>
                      </motion.div>
                    )}
                    <div className="relative mb-4 z-10 transition-transform duration-500 group-hover:-translate-y-2">
                      <div className={`w-16 h-16 sm:w-24 sm:h-24 rounded-full p-1.5 backdrop-blur-md border-2 ${isFirst ? 'border-amber-400/80 bg-amber-500/10' : u.rank === 2 ? 'border-slate-300/80 bg-slate-400/10' : 'border-orange-400/80 bg-orange-500/10'} shadow-xl`}>
                        {u.avatar ? (
                          <img src={u.avatar} alt={u.name} className="w-full h-full rounded-full object-cover border border-white/10" />
                        ) : (
                          <div className="w-full h-full rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-lg text-slate-500 dark:text-slate-400 border border-white/10">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className={`absolute -bottom-4 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full flex items-center justify-center font-black text-lg text-white shadow-[0_8px_16px_rgba(0,0,0,0.2)] border-2 border-white dark:border-slate-900 ${isFirst ? 'bg-gradient-to-br from-amber-400 to-amber-600' : u.rank === 2 ? 'bg-gradient-to-br from-slate-400 to-slate-600' : 'bg-gradient-to-br from-orange-400 to-orange-600'}`}>
                        {u.rank}
                      </div>
                    </div>
                    
                    <div className="text-center truncate w-full px-2 mt-3 mb-2 z-10 transition-transform duration-500 group-hover:-translate-y-1">
                      <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white block truncate tracking-tight">{u.name}</span>
                      <span className={`text-sm font-black tracking-wide ${medalColor}`}>{u.xp.toLocaleString()} XP</span>
                    </div>
                    
                    <div className={`w-full ${heightClass} ${glassClass} border-t border-x rounded-t-[2rem] relative flex items-end justify-center pb-6 overflow-hidden transition-all duration-500 group-hover:h-[calc(100%+8px)]`}>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent pointer-events-none" />
                      <div className="relative z-10 flex flex-col items-center">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 dark:bg-black/20 backdrop-blur-sm mb-2 shadow-inner">
                          <span className="text-lg">🔥</span>
                        </div>
                        <div className="text-sm font-bold text-slate-700 dark:text-slate-300 text-center leading-tight">
                          {u.studyStreakDays} <br/><span className="text-[10px] uppercase tracking-wider opacity-70">{t('leaderboard.days')}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* List from 4th place */}
            <div className="space-y-4 max-w-2xl mx-auto pb-10">
              {others.map((u, idx) => {
                const rank = idx + 4;
                return (
                  <motion.div 
                    key={u._id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ delay: idx * 0.05, duration: 0.4 }}
                    className="relative overflow-hidden flex items-center gap-5 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 rounded-[1.5rem] p-4 sm:p-5 shadow-sm hover:shadow-md dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)] transition-all duration-300 group"
                  >
                    {/* Big background number */}
                    <div className="absolute -right-4 -bottom-6 text-8xl font-black text-slate-200/50 dark:text-slate-800/40 select-none z-0 group-hover:scale-110 group-hover:text-slate-300/50 dark:group-hover:text-slate-700/40 transition-all duration-500">
                      {rank}
                    </div>

                    <div className="w-8 flex justify-center font-bold text-slate-400 text-lg z-10">
                      {rank}
                    </div>
                    
                    <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 z-10 border-2 border-white dark:border-slate-800 shadow-sm">
                      {u.avatar ? (
                        <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center font-bold text-slate-500 dark:text-slate-300">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 font-semibold text-slate-900 dark:text-white truncate z-10 text-lg">
                      {u.name}
                    </div>
                    
                    <div className="text-right z-10 pr-2">
                      <div className="font-black text-lg text-primary-600 dark:text-primary-400 tracking-wide">{u.xp.toLocaleString()} XP</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1.5 justify-end mt-1 uppercase tracking-wider">
                        <span className="text-orange-500 text-sm">🔥</span>
                        {u.studyStreakDays} {t('leaderboard.streak')}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </PageShell>
  );
};

export default Leaderboard;
