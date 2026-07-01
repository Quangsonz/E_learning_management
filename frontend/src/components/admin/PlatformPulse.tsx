import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../../services/analytics.api';
import { useCountUp } from '../../hooks/useCountUp';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';

// Tháng viết tắt
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface RevenueMonth {
  month: number;
  revenue: number;
  enrollments: number;
}

interface RecentEnrollment {
  student: { name: string; email: string; avatar?: string };
  course: { title: string };
  createdAt: string;
  paymentStatus: string;
}

// Custom Tooltip cho recharts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 shadow-2xl">
        <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2">{label}</p>
        {payload.map((entry: any) => (
          <div key={entry.name} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
            <span className="text-xs text-white/60">{entry.name}:</span>
            <span className="text-xs font-bold text-white">
              {entry.name === 'Revenue' ? `${entry.value.toLocaleString('vi-VN')}đ` : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const PlatformPulse = () => {
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: analyticsApi.getAdminDashboard,
  });

  const overview = analyticsData?.data?.overview || {};
  const revenueByMonth: RevenueMonth[] = analyticsData?.data?.revenueByMonth || [];
  const recentEnrollments: RecentEnrollment[] = analyticsData?.data?.recentEnrollments || [];
  const topCourses: any[] = analyticsData?.data?.topCourses || [];

  const usersTarget = overview.totalUsers || 0;
  const enrollmentsTarget = overview.totalEnrollments || 0;
  const revenueTarget = overview.totalRevenue || 0;
  const coursesTarget = overview.totalCourses || 0;

  const users = useCountUp(usersTarget);
  const enrollments = useCountUp(enrollmentsTarget);
  const revenue = useCountUp(revenueTarget);
  const courses = useCountUp(coursesTarget);

  // Build full 12-month chart data
  const chartData = Array.from({ length: 12 }, (_, i) => {
    const monthData = revenueByMonth.find(m => m.month === i + 1);
    return {
      month: MONTHS[i],
      Revenue: monthData?.revenue || 0,
      Enrollments: monthData?.enrollments || 0,
    };
  });

  return (
    <div className="flex flex-col gap-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-20">

      {/* ── HERO METRICS (BENTO ROW 1) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
        {[
          { label: 'Total Revenue', value: `${revenue.toLocaleString('vi-VN')}đ`, sub: 'All time', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
          { label: 'Total Users', value: users.toLocaleString('vi-VN'), sub: 'Registered', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
          { label: 'Total Enrollments', value: enrollments.toLocaleString('vi-VN'), sub: 'Active learners', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
          { label: 'Courses', value: courses.toLocaleString('vi-VN'), sub: 'On platform', color: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`flex flex-col gap-3 border ${kpi.color} rounded-2xl p-5 backdrop-blur-sm shadow-xl transition-all hover:scale-[1.02]`}
          >
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-70">{kpi.label}</span>
            <div className={`text-3xl font-light tracking-tight`}>
              {isLoading ? <span className="opacity-30">---</span> : kpi.value}
            </div>
            <span className="text-xs opacity-50">{kpi.sub}</span>
          </motion.div>
        ))}
      </div>

      {/* ── BENTO ROW 2: CHART & ACTIVITY ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 flex flex-col gap-6 bg-[#0a0a0a]/50 border border-white/5 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <h2 className="text-2xl font-light tracking-tight text-white/90">Revenue & Enrollments</h2>
              <span className="text-xs font-medium text-white/40">Monthly breakdown — current year</span>
            </div>
          </div>

          {/* FIX BUG-03: Recharts AreaChart với data thật từ API */}
          <div className="h-[280px] w-full">
            {isLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="enrGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={40}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="Revenue"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fill="url(#revGradient)"
                    dot={false}
                    activeDot={{ r: 4, fill: '#6366f1' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="Enrollments"
                    stroke="#06b6d4"
                    strokeWidth={1.5}
                    fill="url(#enrGradient)"
                    dot={false}
                    activeDot={{ r: 4, fill: '#06b6d4' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="w-3 h-0.5 bg-indigo-500 rounded" />
              <span className="text-xs text-white/40">Revenue</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-0.5 bg-cyan-500 rounded" />
              <span className="text-xs text-white/40">Enrollments</span>
            </div>
          </div>
        </div>

        {/* Recent Enrollments Feed */}
        <div className="lg:col-span-4 flex flex-col gap-6 bg-[#0a0a0a]/50 border border-white/5 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-light tracking-tight text-white/90">Recent Enrollments</h2>
            <span className="text-xs font-bold text-white/30 uppercase tracking-widest">Live</span>
          </div>

          <div className="flex flex-col gap-3">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-white/5" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3 bg-white/5 rounded w-3/4" />
                    <div className="h-2.5 bg-white/5 rounded w-1/2" />
                  </div>
                </div>
              ))
            ) : recentEnrollments.length === 0 ? (
              <div className="py-8 text-center text-white/30 text-sm">No enrollments yet.</div>
            ) : (
              recentEnrollments.slice(0, 6).map((enr: any, idx: number) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.06 }}
                  className="flex items-center gap-3"
                >
                  <img
                    src={enr.student?.avatar?.startsWith('http')
                      ? enr.student.avatar
                      : `https://ui-avatars.com/api/?name=${encodeURIComponent(enr.student?.name || 'U')}&background=6366f1&color=fff&size=32`
                    }
                    alt={enr.student?.name}
                    className="w-8 h-8 rounded-full border border-white/10 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white/80 truncate">{enr.student?.name}</p>
                    <p className="text-[10px] text-white/40 truncate">{enr.course?.title}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    enr.paymentStatus === 'completed'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-white/5 text-white/40'
                  }`}>
                    {enr.paymentStatus === 'completed' ? 'Paid' : 'Free'}
                  </span>
                </motion.div>
              ))
            )}
          </div>

          {/* Top Courses mini-list */}
          {topCourses.length > 0 && (
            <>
              <div className="w-full h-[1px] bg-white/5 mt-2" />
              <div className="flex flex-col gap-1">
                <h3 className="text-xs font-bold uppercase tracking-widest text-white/30 mb-2">Top Courses</h3>
                {topCourses.slice(0, 3).map((c: any, i: number) => (
                  <div key={i} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white/20 w-4">{i + 1}</span>
                      <span className="text-xs text-white/70 truncate max-w-[140px]">{c.title}</span>
                    </div>
                    <span className="text-xs font-bold text-white/40">{c.enrollmentCount}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
