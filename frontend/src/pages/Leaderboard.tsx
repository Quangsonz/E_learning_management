import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { userApi } from '../services/user.api';
import { PageShell, LoadingScreen, EmptyState } from '../components/ui';

const Leaderboard: React.FC = () => {
  const { data: leaderboardData, isLoading, isError } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => userApi.getLeaderboard(20)
  });

  const users = leaderboardData?.data?.leaderboard || [];

  if (isLoading) {
    return (
      <PageShell>
        <LoadingScreen title="Loading Leaderboard" message="Fetching top learners..." />
      </PageShell>
    );
  }

  if (isError) {
    return (
      <PageShell>
        <EmptyState title="Error" message="Could not load leaderboard data." />
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
    <PageShell className="pb-20">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white">Global Leaderboard</h1>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
            Compete with learners worldwide. Earn XP by completing lessons and scoring high on quizzes!
          </p>
        </div>

        {users.length === 0 ? (
          <EmptyState title="No activity yet" message="Be the first to earn XP on the platform!" />
        ) : (
          <>
            {/* Top 3 Podium */}
            <div className="flex justify-center items-end gap-2 sm:gap-6 mb-16 h-64 mt-12">
              {podiumUsers.map((u) => {
                const isFirst = u.rank === 1;
                const heightClass = isFirst ? 'h-48' : u.rank === 2 ? 'h-36' : 'h-28';
                const colorClass = isFirst 
                  ? 'bg-gradient-to-t from-amber-200 to-amber-50 dark:from-amber-900/40 dark:to-amber-500/10 border-amber-300 dark:border-amber-500/30' 
                  : u.rank === 2 
                  ? 'bg-gradient-to-t from-slate-200 to-slate-50 dark:from-slate-800 dark:to-slate-700/30 border-slate-300 dark:border-slate-600'
                  : 'bg-gradient-to-t from-orange-200 to-orange-50 dark:from-orange-900/40 dark:to-orange-700/20 border-orange-300 dark:border-orange-700/50';
                
                const medalColor = isFirst ? 'text-amber-500' : u.rank === 2 ? 'text-slate-400' : 'text-orange-500';

                return (
                  <motion.div 
                    key={u._id}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: u.rank * 0.1, type: 'spring', stiffness: 100 }}
                    className="flex flex-col items-center w-28 sm:w-36 relative"
                  >
                    {isFirst && (
                      <div className="absolute -top-10 text-amber-500">
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                      </div>
                    )}
                    <div className="relative mb-3">
                      <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full p-1 border-2 ${isFirst ? 'border-amber-500' : u.rank === 2 ? 'border-slate-400' : 'border-orange-500'}`}>
                        {u.avatar ? (
                          <img src={u.avatar} alt={u.name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <div className="w-full h-full rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-500 dark:text-slate-400">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full flex items-center justify-center font-bold text-white shadow-md ${isFirst ? 'bg-amber-500' : u.rank === 2 ? 'bg-slate-400' : 'bg-orange-500'}`}>
                        {u.rank}
                      </div>
                    </div>
                    <div className="text-center truncate w-full px-2 mt-2 mb-1">
                      <span className="font-bold text-sm text-slate-900 dark:text-white block truncate">{u.name}</span>
                      <span className={`text-xs font-bold ${medalColor}`}>{u.xp} XP</span>
                    </div>
                    <div className={`w-full ${heightClass} ${colorClass} border-t-2 rounded-t-xl shadow-lg relative overflow-hidden flex items-end justify-center pb-4`}>
                      <div className="text-sm font-medium text-slate-500 dark:text-slate-400 opacity-60">
                        {u.studyStreakDays} <span className="text-xs">days</span> 🔥
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* List from 4th place */}
            <div className="space-y-3">
              {others.map((u, idx) => {
                const rank = idx + 4;
                return (
                  <motion.div 
                    key={u._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + idx * 0.05 }}
                    className="flex items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="w-8 flex justify-center font-bold text-slate-400">
                      {rank}
                    </div>
                    <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
                      {u.avatar ? (
                        <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-500">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 font-semibold text-slate-900 dark:text-white truncate">
                      {u.name}
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-primary-600 dark:text-primary-400">{u.xp} XP</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1 justify-end mt-0.5">
                        <svg className="w-3 h-3 text-orange-500" fill="currentColor" viewBox="0 0 24 24"><path d="M17.5 11.4c-1.4 0-2.4-.6-3-1.6-.3-.6-.5-1.4-.5-2.4V2C9.5 2.5 6 6.3 6 11c0 3.9 3.1 7 7 7s7-3.1 7-7c0-1.2-.3-2.3-.8-3.4-.6 2.3-1.4 3.8-1.7 3.8z"/></svg>
                        {u.studyStreakDays} streak
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
