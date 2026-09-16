import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  DollarSign,
  Users,
  GraduationCap,
  BookOpen,
  Activity,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Server,
  Database,
  Cpu,
  Clock,
  Layers,
  Award
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

import { analyticsApi } from '../../services/analytics.api';
import { adminApi } from '../../services/admin.api';
import { CountUpValue } from '../../hooks/useCountUp';
import { useLocalizedValue } from '../../utils/localized';

// Short month abbreviations
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface RevenueMonth {
  month: number;
  revenue: number;
  enrollments: number;
}

interface RecentEnrollment {
  student: { name: string; email: string; avatar?: string };
  course: { title: any };
  createdAt: string;
  paymentStatus: string;
}

// Custom Tooltip for Recharts with dark/light mode token support
const CustomTooltip = ({ active, payload, label, t }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 shadow-2xl backdrop-blur-md">
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{label}</p>
        {payload.map((entry: any) => (
          <div key={entry.name} className="flex items-center justify-between gap-4 py-0.5 min-w-[140px]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: entry.color }} />
              <span className="text-xs text-slate-600 dark:text-slate-300">
                {entry.name === 'Revenue' ? t('admin.analytics.legendRevenue') : t('admin.analytics.legendEnrollments')}:
              </span>
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              {entry.name === 'Revenue' ? `${Number(entry.value).toLocaleString('vi-VN')}đ` : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const PlatformPulse: React.FC = () => {
  const { t, i18n } = useTranslation();
  const lv = useLocalizedValue();
  const navigate = useNavigate();
  const locale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';

  // ── Primary Analytics Query ─────────────────────────────────────────
  const { data: analyticsData, isLoading, dataUpdatedAt } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: analyticsApi.getAdminDashboard,
    staleTime: 60000,
  });

  // ── Action Center Pending Counts Query (Single fast endpoint) ─────
  const { data: pendingCountsData } = useQuery({
    queryKey: ['admin-pending-counts'],
    queryFn: adminApi.getPendingCounts,
    staleTime: 60000,
  });

  // ── System Health Query ─────────────────────────────────────────────
  const { data: healthData } = useQuery({
    queryKey: ['system-health'],
    queryFn: analyticsApi.getSystemHealth,
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
    staleTime: 15000,
  });

  const overview = analyticsData?.data?.overview || {};
  const revenueByMonth: RevenueMonth[] = analyticsData?.data?.revenueByMonth || [];
  const recentEnrollments: RecentEnrollment[] = analyticsData?.data?.recentEnrollments || [];
  const topCourses: any[] = analyticsData?.data?.topCourses || [];
  const health = healthData?.data || {};

  // KPI count-up targets
  const usersTarget = overview.totalUsers || 0;
  const enrollmentsTarget = overview.totalEnrollments || 0;
  const revenueTarget = overview.totalRevenue || 0;
  const coursesTarget = overview.totalCourses || 0;

  // Pending action items from lightweight pending-counts API
  const pendingCounts = pendingCountsData?.data || {};
  const pendingCoursesCount = pendingCounts.pendingCourses || 0;
  const pendingAppsCount = pendingCounts.pendingApplications || 0;
  const pendingPayoutsCount = pendingCounts.pendingPayouts || 0;
  const totalPendingActions = pendingCounts.totalPending ?? (pendingCoursesCount + pendingAppsCount + pendingPayoutsCount);

  // Build full 12-month chart data
  const chartData = Array.from({ length: 12 }, (_, i) => {
    const monthData = revenueByMonth.find(m => m.month === i + 1);
    return {
      month: MONTHS[i],
      Revenue: monthData?.revenue || 0,
      Enrollments: monthData?.enrollments || 0,
    };
  });

  const hasChartData = chartData.some(d => d.Revenue > 0 || d.Enrollments > 0);
  const refreshedTime = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
    : new Date().toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-2 duration-200 pb-20 mt-2">

      {/* ── 1. COMMAND CENTER HERO HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200/80 dark:border-white/10 pb-6">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
            </span>
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-indigo-600 dark:text-indigo-400">
              {t('admin.hero.eyebrow')}
            </span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {t('admin.hero.title')}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
            {t('admin.hero.subtitle')}
          </p>
        </div>

        {/* Live System Status & Refreshed Badge */}
        <div className="flex flex-col sm:items-end gap-1.5 shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-md shadow-sm">
            <span
              className={`w-2 h-2 rounded-full ${
                health.dbConnection?.status === 'error' ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'
              }`}
            />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {health.dbConnection?.status === 'error'
                ? t('admin.hero.degradedPerformance')
                : t('admin.hero.allSystemsOperational')}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            {t('admin.hero.refreshedAt', { time: refreshedTime })}
          </span>
        </div>
      </div>

      {/* ── 2. ACTION CENTER: REAL PENDING COUNTS ── */}
      {totalPendingActions > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10 p-5 shadow-sm backdrop-blur-sm"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    {t('admin.actions.needsAttention')}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-700 dark:text-amber-300">
                    {totalPendingActions}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  {t('admin.actions.actionRequired')}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendingCoursesCount > 0 && (
              <button
                onClick={() => navigate('/admin-dashboard/moderation')}
                className="flex items-center justify-between p-3.5 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 hover:border-amber-500/40 hover:shadow-md transition-all text-left group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {t('admin.actions.pendingCourses', { count: pendingCoursesCount })}
                  </span>
                </div>
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 shrink-0 ml-2 group-hover:translate-x-0.5 transition-transform">
                  {t('admin.actions.reviewNow')}
                </span>
              </button>
            )}

            {pendingAppsCount > 0 && (
              <button
                onClick={() => navigate('/admin-dashboard/moderation')}
                className="flex items-center justify-between p-3.5 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 hover:border-amber-500/40 hover:shadow-md transition-all text-left group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {t('admin.actions.teacherApplications', { count: pendingAppsCount })}
                  </span>
                </div>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 shrink-0 ml-2 group-hover:translate-x-0.5 transition-transform">
                  {t('admin.actions.reviewNow')}
                </span>
              </button>
            )}

            {pendingPayoutsCount > 0 && (
              <button
                onClick={() => navigate('/admin-dashboard/finance')}
                className="flex items-center justify-between p-3.5 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 hover:border-amber-500/40 hover:shadow-md transition-all text-left group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {t('admin.actions.pendingPayouts', { count: pendingPayoutsCount })}
                  </span>
                </div>
                <span className="text-xs font-bold text-violet-600 dark:text-violet-400 flex items-center gap-1 shrink-0 ml-2 group-hover:translate-x-0.5 transition-transform">
                  {t('admin.actions.reviewNow')}
                </span>
              </button>
            )}
          </div>
        </motion.div>
      ) : (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{t('admin.actions.noPendingActions')}</span>
        </div>
      )}

      {/* ── 3. DIFFERENTIATED KPI RAIL ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Revenue (HERO METRIC) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="relative overflow-hidden rounded-2xl border border-indigo-500/20 dark:border-indigo-500/30 bg-gradient-to-br from-indigo-500/5 via-white to-white dark:from-indigo-950/40 dark:via-slate-900 dark:to-slate-900 p-6 shadow-sm dark:shadow-xl hover:shadow-indigo-500/10 transition-all group"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none -mr-8 -mt-8" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
              {t('admin.metrics.totalRevenue')}
            </span>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-1.5">
            {isLoading ? <span className="opacity-30">---</span> : <CountUpValue target={revenueTarget} suffix="đ" />}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            <span>{t('admin.metrics.allTime')}</span>
          </div>
        </motion.div>

        {/* KPI 2: Total Users */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/70 p-6 shadow-sm dark:shadow-xl hover:border-cyan-500/30 transition-all group"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t('admin.metrics.totalUsers')}
            </span>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-1.5">
            {isLoading ? <span className="opacity-30">---</span> : <CountUpValue target={usersTarget} />}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
            <span>{t('admin.metrics.registeredUsers')}</span>
          </div>
        </motion.div>

        {/* KPI 3: Total Enrollments */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/70 p-6 shadow-sm dark:shadow-xl hover:border-emerald-500/30 transition-all group"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t('admin.metrics.totalEnrollments')}
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-1.5">
            {isLoading ? <span className="opacity-30">---</span> : <CountUpValue target={enrollmentsTarget} />}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>{t('admin.metrics.activeLearners')}</span>
          </div>
        </motion.div>

        {/* KPI 4: Courses */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/70 p-6 shadow-sm dark:shadow-xl hover:border-violet-500/30 transition-all group"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t('admin.metrics.totalCourses')}
            </span>
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-1.5">
            {isLoading ? <span className="opacity-30">---</span> : <CountUpValue target={coursesTarget} />}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
            <span>{t('admin.metrics.publishedCourses')}</span>
          </div>
        </motion.div>
      </div>

      {/* ── 4. BENTO ROW: AREA CHART & RECENT ACTIVITY LEDGER ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left 8 Cols: Revenue & Enrollments Chart */}
        <div className="lg:col-span-8 flex flex-col gap-6 bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-sm dark:shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                {t('admin.analytics.revenueAndEnrollments')}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {t('admin.analytics.monthlyBreakdown')}
              </p>
            </div>

            {/* Legend indicators */}
            <div className="flex items-center gap-5">
              <div className="flex items-center gap-2">
                <span className="w-3 h-1 bg-indigo-500 rounded-full" />
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {t('admin.analytics.legendRevenue')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-1 bg-cyan-500 rounded-full" />
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {t('admin.analytics.legendEnrollments')}
                </span>
              </div>
            </div>
          </div>

          {/* AreaChart container */}
          <div className="h-[300px] w-full">
            {isLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="w-7 h-7 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
              </div>
            ) : !hasChartData ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 text-sm gap-2">
                <Activity className="w-8 h-8 opacity-30" />
                <span>{t('admin.analytics.noDataPeriod')}</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="enrGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(150, 150, 150, 0.08)" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: 'currentColor', opacity: 0.5, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="revenue"
                    tick={{ fill: 'currentColor', opacity: 0.5, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={55}
                    tickFormatter={(v) =>
                      v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`
                    }
                  />
                  <YAxis
                    yAxisId="enrollments"
                    orientation="right"
                    tick={{ fill: 'currentColor', opacity: 0.5, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={35}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip t={t} />} />
                  <Area
                    yAxisId="revenue"
                    type="monotone"
                    dataKey="Revenue"
                    name="Revenue"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    fill="url(#revGradient)"
                    dot={false}
                    activeDot={{ r: 5, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
                  />
                  <Area
                    yAxisId="enrollments"
                    type="monotone"
                    dataKey="Enrollments"
                    name="Enrollments"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    fill="url(#enrGradient)"
                    dot={false}
                    activeDot={{ r: 4, fill: '#06b6d4', strokeWidth: 2, stroke: '#fff' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Right 4 Cols: Recent Activity Ledger & Top Courses */}
        <div className="lg:col-span-4 flex flex-col gap-6">

          {/* Recent Enrollments Card */}
          <div className="flex flex-col gap-4 bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-white/10 rounded-3xl p-6 backdrop-blur-xl shadow-sm dark:shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {t('admin.recent.recentEnrollments')}
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {t('admin.recent.liveFeed')}
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-white/5 shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-slate-200 dark:bg-white/5 rounded w-3/4" />
                      <div className="h-2.5 bg-slate-200 dark:bg-white/5 rounded w-1/2" />
                    </div>
                  </div>
                ))
              ) : recentEnrollments.length === 0 ? (
                <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs">
                  {t('admin.recent.noEnrollments')}
                </div>
              ) : (
                recentEnrollments.slice(0, 5).map((enr: any, idx: number) => {
                  const courseTitle = lv(enr.course?.title) || t('admin.courseManagement.title');
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                    >
                      <img
                        src={
                          enr.student?.avatar?.startsWith('http')
                            ? enr.student.avatar
                            : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                enr.student?.name || 'U'
                              )}&background=6366f1&color=fff&size=36`
                        }
                        alt={enr.student?.name}
                        className="w-9 h-9 rounded-full border border-slate-200 dark:border-white/10 shrink-0 object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                          {enr.student?.name || 'Learner'}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate" title={courseTitle}>
                          {courseTitle}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-0.5 shrink-0">
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            enr.paymentStatus === 'completed'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {enr.paymentStatus === 'completed' ? t('admin.recent.paid') : t('admin.recent.free')}
                        </span>
                        <span className="text-[9px] text-slate-400 dark:text-slate-500">
                          {enr.createdAt ? new Date(enr.createdAt).toLocaleDateString(locale) : t('admin.recent.timeAgo')}
                        </span>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>

          {/* Top Courses Card */}
          {topCourses.length > 0 && (
            <div className="flex flex-col gap-4 bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-white/10 rounded-3xl p-6 backdrop-blur-xl shadow-sm dark:shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  {t('admin.topCourses.title')}
                </h3>
                <Link
                  to="/admin-dashboard/content"
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  {t('admin.topCourses.viewAll')}
                </Link>
              </div>

              <div className="flex flex-col gap-2.5">
                {topCourses.slice(0, 4).map((c: any, i: number) => {
                  const title = lv(c.title);
                  return (
                    <div
                      key={c._id || i}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black shrink-0 ${
                            i === 0
                              ? 'bg-amber-500 text-white shadow-sm'
                              : i === 1
                              ? 'bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-white'
                              : i === 2
                              ? 'bg-amber-700/80 text-white'
                              : 'text-slate-400 dark:text-slate-500'
                          }`}
                        >
                          {i + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate" title={title}>
                            {title}
                          </p>
                          {c.instructorName && (
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                              {c.instructorName}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {c.enrollmentCount}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                          {t('admin.topCourses.learners')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── 5. SYSTEM HEALTH OPERATIONAL STRIP ── */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-900/60 p-5 backdrop-blur-xl shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              {t('admin.health.title')}
            </span>
            <span className="text-slate-400 text-xs hidden sm:inline">•</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
              {t('admin.health.quickSummary')}
            </span>
          </div>
          <Link
            to="/admin-dashboard/monitoring"
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            {t('admin.health.viewFullMonitoring')}
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-1">
          {/* Tile 1: API Response */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Server className="w-4 h-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                {t('admin.health.apiResponse')}
              </span>
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 truncate">
                {health.apiLatency || '15ms'}
              </span>
            </div>
          </div>

          {/* Tile 2: DB Connection */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5">
            <div
              className={`w-8 h-8 rounded-lg ${
                health.dbConnection?.status === 'error'
                  ? 'bg-rose-500/10 text-rose-500'
                  : 'bg-emerald-500/10 text-emerald-500'
              } flex items-center justify-center shrink-0`}
            >
              <Database className="w-4 h-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                {t('admin.health.dbConnection')}
              </span>
              <span
                className={`text-sm font-bold truncate ${
                  health.dbConnection?.status === 'error' ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {health.dbConnection?.status === 'error' ? t('admin.health.degraded') : t('admin.health.optimal')}
                {health.dbConnection?.latency ? ` (${health.dbConnection.latency})` : ''}
              </span>
            </div>
          </div>

          {/* Tile 3: Node RSS Memory */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
              <Cpu className="w-4 h-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                {t('admin.health.memory')}
              </span>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                {health.memory?.rss || '142 MB'}
              </span>
            </div>
          </div>

          {/* Tile 4: Server Uptime */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                {t('admin.health.uptime')}
              </span>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                {health.uptime || '99.9%'}
              </span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default PlatformPulse;
