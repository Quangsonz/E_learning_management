import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../store/slices/authSlice';
import { userApi } from '../services/user.api';
import { 
  PageShell, 
  LoadingScreen, 
  EmptyState, 
  GlassPanel,
  Button,
  HeroBackgroundSlideshow
} from '../components/ui';
import { 
  Trophy, 
  Crown, 
  Flame, 
  Zap, 
  Award, 
  Sparkles, 
  BookOpen, 
  CheckCircle2, 
  User as UserIcon,
  ShieldCheck,
  TrendingUp,
  Star
} from 'lucide-react';

type PeriodFilter = 'week' | 'month' | 'all';

// Standardized progression: 1000 XP per level with dynamic prestige tiers
const getLevelAndTitle = (xp: number = 0, t: any) => {
  const level = Math.max(1, Math.floor(xp / 1000) + 1);
  let titleKey = 'learner';
  if (level >= 40) titleKey = 'grandmaster';
  else if (level >= 30) titleKey = 'apex';
  else if (level >= 20) titleKey = 'master';
  else if (level >= 10) titleKey = 'veteran';
  else if (level >= 5) titleKey = 'specialist';

  return {
    level,
    title: t(`leaderboard.levelTitle.${titleKey}`, { level })
  };
};

const Leaderboard: React.FC = () => {
  const { t } = useTranslation();
  const currentUser = useSelector(selectCurrentUser);
  const [period, setPeriod] = useState<PeriodFilter>('all');

  const { data: leaderboardData, isLoading, isError } = useQuery({
    queryKey: ['leaderboard', period],
    queryFn: () => userApi.getLeaderboard(30, period)
  });

  const users = leaderboardData?.data?.leaderboard || [];

  // Find current user's position in the leaderboard list
  const currentUserIndex = users.findIndex(
    (u: any) => u._id === currentUser?._id || u._id === currentUser?.id
  );

  const currentUserRank = currentUserIndex !== -1 ? currentUserIndex + 1 : 14;
  const currentUserXP = currentUser?.xp || (users[currentUserIndex]?.xp) || 2450;

  if (isLoading) {
    return (
      <PageShell wide>
        <LoadingScreen title={t('leaderboard.loading')} message={t('leaderboard.fetching')} />
      </PageShell>
    );
  }

  if (isError) {
    return (
      <PageShell wide>
        <EmptyState title={t('leaderboard.error')} message={t('leaderboard.errorMsg')} />
      </PageShell>
    );
  }

  // Strictly Top 10: Top 3 Podium + Rank 4 to 10 in List
  const top10 = users.slice(0, 10);
  const top3 = top10.slice(0, 3);
  const others = top10.slice(3, 10);

  // Order for podium render: Rank 2 - Rank 1 - Rank 3
  const podiumUsers = [];
  if (top3[1]) podiumUsers.push({ ...top3[1], rank: 2 });
  if (top3[0]) podiumUsers.push({ ...top3[0], rank: 1 });
  if (top3[2]) podiumUsers.push({ ...top3[2], rank: 3 });

  return (
    <PageShell wide animate={false} className="pb-12 relative">
      {/* Background Glows & Ambient Slideshow with gentle fade */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <HeroBackgroundSlideshow maskVariant="fade-bottom" />
        <div className="absolute -top-40 left-1/4 w-[600px] h-[600px] bg-amber-500/10 dark:bg-amber-500/10 rounded-full blur-[140px]" />
        <div className="absolute top-96 right-10 w-[500px] h-[500px] bg-indigo-500/10 dark:bg-indigo-600/10 rounded-full blur-[140px]" />
      </div>

      <div className="relative z-10 space-y-10">
        
        {/* Header & Time Period Filter */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-4 border-b border-slate-200 dark:border-white/10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 dark:text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Trophy size={14} /> {t('leaderboard.globalHallOfFame')}
            </div>
            <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
              {t('leaderboard.globalTitle')}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {t('leaderboard.globalSubtitle')}
            </p>
          </div>

          {/* Time Period Filter Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-white/5 p-1 rounded-2xl text-xs font-bold shrink-0">
            {(['week', 'month', 'all'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-xl transition-all capitalize ${
                  period === p
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-md font-black'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {p === 'week' ? t('leaderboard.timeframe.week') : p === 'month' ? t('leaderboard.timeframe.month') : t('leaderboard.timeframe.all')}
              </button>
            ))}
          </div>
        </div>

        {/* Bento 2-Column Layout: 70% Main Ranking + 30% Sidebar */}
        <div className="grid gap-8 lg:grid-cols-[1fr_340px] items-start">
          
          {/* ================= MAIN AREA (70%) ================= */}
          <div className="space-y-10 min-w-0">
            {users.length === 0 ? (
              <EmptyState title={t('leaderboard.noActivity')} message={t('leaderboard.beFirst')} />
            ) : (
              <>
                {/* 1. PODIUM TOP 3 REDESIGN */}
                <section className="relative pt-12 pb-6">
                  <div className="flex justify-center items-end gap-3 sm:gap-6 h-80 relative z-10">
                    {podiumUsers.map((u) => {
                      const isFirst = u.rank === 1;
                      const heightClass = isFirst ? 'h-60' : u.rank === 2 ? 'h-44' : 'h-36';
                      
                      const glassClass = isFirst 
                        ? 'bg-gradient-to-b from-amber-500/20 via-amber-500/10 to-amber-900/30 backdrop-blur-xl border border-amber-400/50 shadow-[0_0_60px_rgba(245,158,11,0.25)]' 
                        : u.rank === 2 
                        ? 'bg-gradient-to-b from-slate-400/20 via-slate-400/10 to-slate-800/30 backdrop-blur-xl border border-slate-300/40 shadow-[0_0_40px_rgba(148,163,184,0.15)]'
                        : 'bg-gradient-to-b from-orange-500/20 via-orange-500/10 to-orange-900/30 backdrop-blur-xl border border-orange-400/40 shadow-[0_0_40px_rgba(249,115,22,0.15)]';
                      
                      const medalColor = isFirst 
                        ? 'text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.6)]' 
                        : u.rank === 2 
                        ? 'text-slate-300 drop-shadow-[0_0_8px_rgba(148,163,184,0.6)]' 
                        : 'text-orange-400 drop-shadow-[0_0_8px_rgba(249,115,22,0.6)]';

                      const { level, title: levelTitle } = getLevelAndTitle(u.xp, t);

                      return (
                        <motion.div 
                          key={u._id || u.rank}
                          initial={{ opacity: 0, y: 60 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: u.rank * 0.15, type: 'spring', stiffness: 90, damping: 14 }}
                          className="flex flex-col items-center w-28 sm:w-44 relative group cursor-default"
                        >
                          {/* Crown for Rank 1 */}
                          {isFirst && (
                            <motion.div 
                              initial={{ scale: 0, y: 20 }}
                              animate={{ scale: 1, y: 0 }}
                              transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
                              className="absolute -top-12 text-amber-400 drop-shadow-[0_0_20px_rgba(251,191,36,0.9)] z-20"
                            >
                              <Crown size={36} fill="currentColor" />
                            </motion.div>
                          )}

                          {/* Avatar Circle */}
                          <div className="relative mb-3 z-10 transition-transform duration-500 group-hover:-translate-y-2">
                            <div className={`w-16 h-16 sm:w-24 sm:h-24 rounded-full p-1.5 backdrop-blur-md border-2 ${
                              isFirst ? 'border-amber-400 bg-amber-500/20 shadow-amber-500/40' : u.rank === 2 ? 'border-slate-300 bg-slate-400/20' : 'border-orange-400 bg-orange-500/20'
                            } shadow-xl`}>
                              {u.avatar ? (
                                <img src={u.avatar} alt={u.name} loading="lazy" decoding="async" className="w-full h-full rounded-full object-cover border border-white/20" />
                              ) : (
                                <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center font-bold text-lg text-white border border-white/20">
                                  {u.name?.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            
                            {/* Rank Badge Number */}
                            <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full flex items-center justify-center font-black text-sm text-white shadow-lg border-2 border-white dark:border-slate-900 ${
                              isFirst ? 'bg-gradient-to-br from-amber-400 to-amber-600' : u.rank === 2 ? 'bg-gradient-to-br from-slate-400 to-slate-600' : 'bg-gradient-to-br from-orange-400 to-orange-600'
                            }`}>
                              {u.rank}
                            </div>
                          </div>
                          
                          {/* Name & Level Badge */}
                          <div className="text-center truncate w-full px-1 mt-3 mb-1 z-10">
                            <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white block truncate">{u.name}</span>
                            <span className="text-[10px] font-black uppercase text-amber-500 dark:text-amber-400 block tracking-wider mt-0.5">
                              {levelTitle}
                            </span>
                            <span className={`text-sm font-black tracking-wide block mt-0.5 ${medalColor}`}>
                              {u.xp?.toLocaleString('vi-VN')} XP
                            </span>
                          </div>
                          
                          {/* Podium Stand */}
                          <div className={`w-full ${heightClass} ${glassClass} border-t border-x rounded-t-3xl relative flex items-end justify-center pb-5 overflow-hidden transition-all duration-500`}>
                            {/* Ambient Pedestal Upward Glow */}
                            <div className={`absolute inset-x-2 bottom-0 h-3/4 bg-gradient-to-t ${
                              isFirst ? 'from-amber-400/25 via-amber-500/10' : u.rank === 2 ? 'from-slate-300/20 via-slate-400/10' : 'from-orange-400/25 via-orange-500/10'
                            } to-transparent rounded-t-full blur-md pointer-events-none`} />

                            {/* Watermark Rank Numeral inside Pillar */}
                            <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none font-black text-6xl sm:text-7xl text-white/[0.08] dark:text-white/[0.06] font-mono tracking-tighter">
                              {u.rank}
                            </div>

                            <div className="relative z-10 flex flex-col items-center gap-1">
                              <div className={`flex items-center gap-1 text-xs font-bold ${
                                (u.studyStreakDays || 0) > 0 ? 'text-amber-400' : 'text-slate-400 dark:text-slate-500'
                              }`}>
                                <Flame size={14} className={(u.studyStreakDays || 0) > 0 ? 'fill-amber-400 text-amber-400' : 'text-slate-500 opacity-40'} />
                                <span>{(u.studyStreakDays || 0) > 0 ? `${u.studyStreakDays} ${t('leaderboard.days')}` : t('leaderboard.noStreak')}</span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </section>

                {/* 2. RANK CARDS LIST (TOP 4+) WITH LOGGED-IN USER HIGHLIGHT */}
                <section className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 px-2 pb-2">
                    <span>{t('leaderboard.headers.rankTop4')}</span>
                    <span>{t('leaderboard.headers.xpAndStreak')}</span>
                  </div>

                  {others.map((u, idx) => {
                    const rank = idx + 4;
                    const isMe = u._id === currentUser?._id || u._id === currentUser?.id;
                    const { title } = getLevelAndTitle(u.xp, t);

                    return (
                      <motion.div 
                        key={u._id || rank}
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-30px" }}
                        className={`relative overflow-hidden flex items-center justify-between gap-4 rounded-2xl p-4 transition-all duration-300 border ${
                          isMe 
                            ? 'bg-indigo-500/10 dark:bg-indigo-500/20 border-indigo-500/80 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/30' 
                            : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          {/* Rank Number */}
                          <div className="w-8 font-black text-center text-sm text-slate-400 shrink-0">
                            #{rank}
                          </div>
                          
                          {/* Avatar */}
                          <div className="w-11 h-11 rounded-full overflow-hidden shrink-0 border border-slate-200 dark:border-white/10">
                            {u.avatar ? (
                              <img src={u.avatar} alt={u.name} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-slate-800 flex items-center justify-center font-bold text-white text-xs">
                                {u.name?.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          
                          {/* Name & Role Tag */}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                                {u.name}
                              </h4>
                              {isMe && (
                                <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-black uppercase tracking-wider">
                                  {t('leaderboard.you')}
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-400 block">{title}</span>
                          </div>
                        </div>

                        {/* XP & Streak */}
                        <div className="text-right shrink-0">
                          <div className="font-black text-sm text-indigo-600 dark:text-indigo-400">
                            {u.xp?.toLocaleString('vi-VN')} XP
                          </div>
                          <div className={`text-[11px] font-bold flex items-center justify-end gap-1 mt-0.5 ${
                            (u.studyStreakDays || 0) > 0 ? 'text-amber-500 dark:text-amber-400' : 'text-slate-400 dark:text-slate-500'
                          }`}>
                            <Flame size={12} className={(u.studyStreakDays || 0) > 0 ? 'fill-current text-amber-500' : 'text-slate-500 opacity-30'} />
                            <span>{(u.studyStreakDays || 0) > 0 ? `${u.studyStreakDays} ${t('leaderboard.days')}` : t('leaderboard.noStreak')}</span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </section>
              </>
            )}
          </div>

          {/* ================= SIDEBAR AREA (30%) ================= */}
          <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
            
            {/* 1. MY RANK STICKY CARD */}
            <GlassPanel padding="lg" className="border border-indigo-500/30 bg-gradient-to-b from-indigo-950/40 via-slate-900/60 to-slate-900/80 text-white space-y-5 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400">
                  <UserIcon size={14} /> {t('leaderboard.personal.title')}
                </div>
                <span className="px-2.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-black text-xs">
                  #{currentUserRank}
                </span>
              </div>

              {/* User Avatar & Info */}
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-indigo-400 shadow-md shrink-0">
                  <img 
                    src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256&h=256'} 
                    alt={currentUser?.name || 'User'} 
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-base text-white truncate">{currentUser?.name || t('leaderboard.personal.defaultName')}</h3>
                  <p className="text-xs text-indigo-300 font-semibold">{t('leaderboard.personal.accumulatedXP', { count: currentUserXP.toLocaleString('vi-VN') })}</p>
                </div>
              </div>

              {/* Motivation Progress to Next Rank */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                {currentUserRank <= 10 ? (
                  <div className="flex justify-between items-center text-xs font-bold text-slate-300">
                    <span className="text-emerald-400 font-extrabold flex items-center gap-1.5">
                      <Sparkles size={14} /> {t('leaderboard.personal.inTop10')}
                    </span>
                    <span className="text-emerald-400 font-black">#{currentUserRank}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-xs font-bold text-slate-300">
                      <span>{t('leaderboard.personal.targetTop10')}</span>
                      <span className="text-amber-400 font-extrabold">
                        {t('leaderboard.personal.remainingXP', { 
                          count: Math.max(0, (users[9]?.xp || 40000) - currentUserXP).toLocaleString('vi-VN') 
                        })}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                      <div 
                        className="h-full bg-gradient-to-r from-amber-400 to-indigo-500 rounded-full transition-all duration-500" 
                        style={{ 
                          width: `${Math.min(95, Math.max(8, Math.round((currentUserXP / (users[9]?.xp || 40000)) * 100)))}%` 
                        }} 
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 italic">{t('leaderboard.personal.motivationTip')}</p>
                  </>
                )}
              </div>
            </GlassPanel>

            {/* 2. XP RULES GUIDE CARD */}
            <GlassPanel padding="lg" className="border border-slate-200 dark:border-white/10 space-y-4">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-base">
                <ShieldCheck className="text-amber-500" size={20} /> {t('leaderboard.rules.title')}
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                {t('leaderboard.rules.desc')}
              </p>

              <div className="space-y-2.5 pt-1 text-xs font-semibold">
                <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200/60 dark:border-white/5">
                  <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <BookOpen size={14} className="text-indigo-500" /> {t('leaderboard.rules.completeLesson')}
                  </span>
                  <span className="font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md">+20 XP</span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200/60 dark:border-white/5">
                  <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Sparkles size={14} className="text-amber-500" /> {t('leaderboard.rules.passQuiz')}
                  </span>
                  <span className="font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md">+50 XP</span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200/60 dark:border-white/5">
                  <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Award size={14} className="text-purple-500" /> {t('leaderboard.rules.earnCertificate')}
                  </span>
                  <span className="font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md">+200 XP</span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200/60 dark:border-white/5">
                  <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Flame size={14} className="text-orange-500" /> {t('leaderboard.rules.maintainStreak')}
                  </span>
                  <span className="font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md">+10 XP</span>
                </div>
              </div>
            </GlassPanel>

          </aside>
        </div>
      </div>
    </PageShell>
  );
};

export default Leaderboard;
