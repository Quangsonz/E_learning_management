import React, { useMemo, useState } from 'react';
import { motion, MotionProps } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  CanvasHero,
  EmptyState,
  MetricsSurface,
  PageShell,
  SectionLead,
  SkeletonGrid,
  GlassPanel,
  Button
} from '../components/ui';
import { progressApi } from '../services/progress.api';
import { certificateApi, Certificate } from '../services/certificate.api';
import { useLocalizedValue } from '../utils/localized';
import { 
  Play, 
  BookOpen, 
  Trophy, 
  Award, 
  Flame, 
  Clock, 
  Sparkles, 
  ExternalLink,
  GraduationCap
} from 'lucide-react';

const MotionDiv = motion.div as unknown as React.FC<React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement> & MotionProps>>;

const MyLearning: React.FC = () => {
  const { t } = useTranslation();
  const lv = useLocalizedValue();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'all' | 'ongoing' | 'completed'>('all');

  // Fetch learning statistics & enrolled courses
  const { data: statsData, isLoading: isStatsLoading } = useQuery({
    queryKey: ['learning-statistics'],
    queryFn: () => progressApi.getLearningStatistics()
  });

  // Fetch student certificates
  const { data: certificatesData, isLoading: isCertLoading } = useQuery({
    queryKey: ['my-certificates'],
    queryFn: () => certificateApi.getMyCertificates()
  });

  const stats = statsData?.data?.statistics;
  const enrolledProgressList = stats?.details || [];
  const certificates: Certificate[] = Array.isArray(certificatesData) ? certificatesData : [];

  const catalogMetrics = [
    { label: t('myLearning.metrics.total'), value: `${stats?.totalEnrolled || 0} ${t('myLearning.metrics.coursesUnit')}` },
    { label: t('myLearning.metrics.ongoing'), value: `${stats?.ongoingCourses || 0} ${t('myLearning.metrics.ongoingUnit')}` },
    { label: t('myLearning.metrics.completed'), value: `${stats?.completedCourses || 0} ${t('myLearning.metrics.completedUnit')}` },
  ];

  // Most recently accessed/ongoing course for the Hero Continue Card
  const heroCourseProgress = useMemo(() => {
    if (enrolledProgressList.length === 0) return null;
    const ongoing = enrolledProgressList.filter((p: any) => p.progressPercentage < 100);
    if (ongoing.length > 0) return ongoing[0];
    return enrolledProgressList[0];
  }, [enrolledProgressList]);

  const heroCourse: any = typeof heroCourseProgress?.course === 'object' ? heroCourseProgress.course : null;

  // Filtered course progress list based on active tab
  const filteredProgressList = useMemo(() => {
    if (activeTab === 'ongoing') {
      return enrolledProgressList.filter((p: any) => p.progressPercentage < 100);
    }
    if (activeTab === 'completed') {
      return enrolledProgressList.filter((p: any) => p.progressPercentage >= 100);
    }
    return enrolledProgressList;
  }, [enrolledProgressList, activeTab]);

  return (
    <PageShell wide>
      <div className="flex flex-col gap-10 pb-16">
        {/* Top Hero Banner */}
        <CanvasHero
          badge={
            <div className="badge inline-flex items-center gap-1.5">
              <GraduationCap size={14} /> {t('myLearning.title')}
            </div>
          }
          eyebrow={t('myLearning.eyebrow')}
          title={t('myLearning.heroTitle')}
          description={t('myLearning.heroDesc')}
          glow="cool"
        />

        {/* Quick Metrics Surface */}
        <MetricsSurface metrics={catalogMetrics} />

        {/* Bento 2-Column Main Layout: 70% Main + 30% Sidebar */}
        <div className="grid gap-10 lg:grid-cols-[1fr_340px] items-start">
          {/* ================= MAIN AREA (70%) ================= */}
          <div className="space-y-10 min-w-0">
            
            {/* 1. HERO CONTINUE CARD ("Học tiếp ngay") */}
            {heroCourseProgress && heroCourse && (
              <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/20 p-6 sm:p-8 text-white shadow-2xl">
                <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 blur-[90px] rounded-full pointer-events-none" />

                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400 mb-4">
                  <Sparkles size={14} /> {t('myLearning.recentCard')}
                </div>

                <div className="grid md:grid-cols-[220px_1fr] gap-6 items-center">
                  {/* Thumbnail */}
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-800 shadow-md group shrink-0">
                    <img 
                      src={heroCourse.thumbnailUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(lv(heroCourse.title))}&background=random`} 
                      alt={lv(heroCourse.title)}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center">
                      <button 
                        onClick={() => navigate(`/courses/${heroCourse._id}/learn`)}
                        className="w-12 h-12 rounded-full bg-white/90 hover:bg-white text-indigo-950 flex items-center justify-center shadow-lg transition-transform active:scale-95"
                      >
                        <Play size={20} className="ml-0.5" fill="currentColor" />
                      </button>
                    </div>
                  </div>

                  {/* Course Details */}
                  <div className="space-y-3 min-w-0">
                    <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300">
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30">
                        {heroCourseProgress.progressPercentage >= 100 ? t('myLearning.statusCompleted') : t('myLearning.statusInProgress')}
                      </span>
                      <span>• {t('myLearning.progressPercent', { percent: heroCourseProgress.progressPercentage })}</span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white line-clamp-2">
                      {lv(heroCourse.title)}
                    </h2>

                    <p className="text-xs text-slate-300 flex items-center gap-2">
                      <Clock size={13} className="text-indigo-400" />
                      <span>{t('myLearning.nextLesson')} <strong className="text-white">{t('myLearning.nextLessonDefault')}</strong></span>
                    </p>

                    {/* Progress Bar */}
                    <div className="space-y-1.5 pt-1">
                      <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                        <div 
                          className="h-full bg-gradient-to-r from-indigo-400 to-purple-400 transition-all duration-700" 
                          style={{ width: `${heroCourseProgress.progressPercentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-2">
                      <Button 
                        variant="pill" 
                        onClick={() => navigate(`/courses/${heroCourse._id}/learn`)}
                        className="bg-white text-indigo-950 hover:bg-slate-100 font-bold text-xs px-6 py-2.5 shadow-lg flex items-center gap-2"
                      >
                        <Play size={14} fill="currentColor" /> {t('myLearning.continueNow')}
                      </Button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* 2. COURSE CATALOG SECTION WITH FILTER TABS */}
            <section className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <SectionLead label={t('myLearning.enrolled')} title={t('myLearning.courseList')} size="md" />

                {/* Filter Tabs */}
                <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-white/5 p-1 rounded-xl text-xs font-bold">
                  {(['all', 'ongoing', 'completed'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-3.5 py-1.5 rounded-lg transition-all capitalize ${
                        activeTab === tab
                          ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-black'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {tab === 'all' ? t('myLearning.tabAll') : tab === 'ongoing' ? t('myLearning.tabOngoing') : t('myLearning.tabCompleted')}
                    </button>
                  ))}
                </div>
              </div>

              {isStatsLoading ? (
                <SkeletonGrid count={3} />
              ) : filteredProgressList.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2">
                  {filteredProgressList.map((progress: any) => {
                    const course: any = typeof progress.course === 'object' ? progress.course : null;
                    if (!course) return null;
                    const isDone = progress.progressPercentage >= 100;

                    return (
                      <MotionDiv
                        key={progress._id}
                        className="group relative flex flex-col justify-between bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-30px' }}
                      >
                        {/* Thumbnail */}
                        <div className="relative aspect-video overflow-hidden bg-slate-800 shrink-0">
                          <Link to={`/courses/${course._id}/learn`}>
                            <img
                              src={course.thumbnailUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(lv(course.title))}&background=random`}
                              alt={lv(course.title)}
                              loading="lazy"
                              decoding="async"
                              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                            />
                          </Link>
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent pointer-events-none" />

                          {/* Status Badge */}
                          <div className="absolute left-3 top-3">
                            <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full text-white shadow-md ${
                              isDone ? 'bg-emerald-500' : 'bg-indigo-600'
                            }`}>
                              {isDone ? t('myLearning.statusCompleted') : t('myLearning.statusInProgress')}
                            </span>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-5 flex flex-col justify-between flex-1 gap-4">
                          <div className="space-y-2">
                            <Link to={`/courses/${course._id}/learn`} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                              <h3 className="line-clamp-2 text-base font-bold text-slate-900 dark:text-white leading-snug">{lv(course.title)}</h3>
                            </Link>

                            <p className="text-xs text-slate-500 flex items-center gap-1.5">
                              <BookOpen size={13} />
                              <span>{isDone ? t('myLearning.completed100') : t('myLearning.nextLessonReady')}</span>
                            </p>
                          </div>

                          {/* Progress Bar & Button */}
                          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-white/5">
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs font-semibold text-slate-500">
                                <span>{t('myLearning.progress')}</span>
                                <span className="text-slate-900 dark:text-white font-bold">{progress.progressPercentage}%</span>
                              </div>
                              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                <div
                                  className={`h-full ${isDone ? 'bg-emerald-500' : 'bg-indigo-600'} transition-all duration-500`}
                                  style={{ width: `${progress.progressPercentage}%` }}
                                />
                              </div>
                            </div>

                            <button
                              onClick={() => navigate(`/courses/${course._id}/learn`)}
                              className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 ${
                                isDone 
                                  ? 'bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-white hover:bg-slate-200' 
                                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20'
                              }`}
                            >
                              {isDone ? <BookOpen size={14} /> : <Play size={14} fill="currentColor" />}
                              {isDone ? t('myLearning.reviewCourse') : t('myLearning.continueCourse')}
                            </button>
                          </div>
                        </div>
                      </MotionDiv>
                    );
                  })}
                </div>
              ) : (
                <EmptyState
                  title={t('myLearning.noCourseMatching')}
                  message={t('myLearning.noCourseMatchingDesc')}
                />
              )}
            </section>
          </div>

          {/* ================= SIDEBAR AREA (30%) ================= */}
          <aside className="space-y-8">
            
            {/* 1. LEARNING GOALS & STREAK WIDGET */}
            <GlassPanel padding="lg" className="border border-slate-200 dark:border-white/10 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-500 font-black text-sm">
                  <Flame size={20} fill="currentColor" />
                  <span>{t('myLearning.streakDays', { days: 4 })}</span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-1 rounded-md">{t('myLearning.goalBadge')}</span>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-base">{t('myLearning.weeklyGoalTitle')}</h4>
                <p className="text-xs text-slate-500">{t('myLearning.weeklyGoalDesc')}</p>
              </div>

              <div className="space-y-2 pt-1">
                <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span>{t('myLearning.goalProgress')}</span>
                  <span className="text-indigo-600 dark:text-indigo-400">{t('myLearning.lessonsProgress', { current: 2, target: 3 })}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className="h-full bg-gradient-to-r from-amber-500 to-indigo-600 rounded-full" style={{ width: '66%' }} />
                </div>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-2">
                <Sparkles size={16} className="shrink-0" />
                <span>{t('myLearning.goalEncourage')}</span>
              </div>
            </GlassPanel>

            {/* 2. MY CERTIFICATES WIDGET */}
            <GlassPanel padding="lg" className="border border-slate-200 dark:border-white/10 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 dark:text-white text-lg flex items-center gap-2">
                  <Award className="text-indigo-500" size={20} /> {t('myLearning.certificatesEarned')}
                </h3>
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{t('myLearning.certificatesIssued', { count: certificates.length })}</span>
              </div>

              {isCertLoading ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-14 bg-slate-100 dark:bg-white/5 rounded-xl" />
                  <div className="h-14 bg-slate-100 dark:bg-white/5 rounded-xl" />
                </div>
              ) : certificates.length > 0 ? (
                <div className="space-y-3">
                  {certificates.map((cert) => (
                    <div 
                      key={cert._id}
                      className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200/60 dark:border-white/5 flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                          <Trophy size={18} />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                            {typeof cert.course === 'object' ? lv(cert.course.title) : t('myLearning.statusCompleted')}
                          </h4>
                          <p className="text-[10px] text-slate-400">
                            {t('myLearning.issuedDate')} {new Date(cert.issueDate || cert.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => navigate(`/certificates/verify/${cert.certificateId}`)}
                        className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 shrink-0 transition-colors"
                        title={t('myLearning.verifyCert')}
                      >
                        <ExternalLink size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 border border-dashed border-slate-200 dark:border-white/10 rounded-xl space-y-2">
                  <Trophy className="mx-auto text-slate-300 dark:text-slate-600" size={32} />
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">{t('myLearning.noCertificates')}</p>
                  <p className="text-[11px] text-slate-400 px-4">{t('myLearning.noCertificatesDesc')}</p>
                </div>
              )}
            </GlassPanel>

          </aside>
        </div>
      </div>
    </PageShell>
  );
};

export default MyLearning;
