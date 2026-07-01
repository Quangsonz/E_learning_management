import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../../services/analytics.api';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const PIE_COLORS: Record<string, string> = {
  student: '#6366f1',
  teacher: '#06b6d4',
  admin: '#f59e0b',
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 shadow-2xl">
        <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2">{label}</p>
        {payload.map((entry: any) => (
          <div key={entry.name} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
            <span className="text-xs text-white/60">{entry.name}:</span>
            <span className="text-xs font-bold text-white">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const AnalyticsTab = () => {
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: analyticsApi.getAdminDashboard,
    staleTime: 5 * 60 * 1000, // cache 5 phút
  });

  const revenueByMonth = analyticsData?.data?.revenueByMonth || [];
  const userGrowthByMonth = analyticsData?.data?.userGrowthByMonth || [];
  const roleDistribution = analyticsData?.data?.roleDistribution || [];
  const topCourses = analyticsData?.data?.topCourses || [];

  // Merge 12 months for user growth
  const userGrowthData = Array.from({ length: 12 }, (_, i) => {
    const d = userGrowthByMonth.find((m: any) => m.month === i + 1);
    return { month: MONTHS[i], 'New Users': d?.newUsers || 0 };
  });

  // Merge 12 months for revenue
  const revenueData = Array.from({ length: 12 }, (_, i) => {
    const d = revenueByMonth.find((m: any) => m.month === i + 1);
    return { month: MONTHS[i], Revenue: d?.revenue || 0, Enrollments: d?.enrollments || 0 };
  });

  // Role distribution for pie chart
  const pieData = roleDistribution.map((r: any) => ({
    name: r.role.charAt(0).toUpperCase() + r.role.slice(1),
    value: r.count,
    color: PIE_COLORS[r.role] || '#64748b'
  }));

  const LoadingPlaceholder = () => (
    <div className="h-full flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-20 mt-4">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold uppercase tracking-[0.25em] text-white/40 pl-1">Insights</span>
        <h1 className="text-4xl font-light tracking-tight text-white">Business Intelligence</h1>
        <p className="text-white/40 text-sm max-w-xl">Phân tích doanh thu, tăng trưởng người dùng và hiệu suất khóa học theo thời gian thực.</p>
      </div>

      {/* ── BENTO GRID LAYOUT ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-4">
        
        {/* Revenue + Enrollments Chart */}
        <div className="lg:col-span-12 flex flex-col gap-6 bg-[#0a0a0a]/50 border border-white/5 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-2xl">
          <h2 className="text-xl font-light tracking-tight text-white/90">Doanh thu & Enrollments ({new Date().getFullYear()})</h2>
        <div className="h-[260px]">
          {isLoading ? <LoadingPlaceholder /> : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} width={44} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Revenue" fill="#6366f1" radius={[4, 4, 0, 0]} opacity={0.85} />
                <Bar dataKey="Enrollments" fill="#06b6d4" radius={[4, 4, 0, 0]} opacity={0.6} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        </div>

        {/* User Growth Chart */}
        <div className="lg:col-span-8 flex flex-col gap-6 bg-[#0a0a0a]/50 border border-white/5 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-2xl">
          <h2 className="text-xl font-light tracking-tight text-white/90">Tăng trưởng người dùng</h2>
          <div className="h-[220px]">
            {isLoading ? <LoadingPlaceholder /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={userGrowthData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="New Users" fill="#a78bfa" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Role Distribution Pie */}
        <div className="lg:col-span-4 flex flex-col gap-6 bg-[#0a0a0a]/50 border border-white/5 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-2xl">
          <h2 className="text-xl font-light tracking-tight text-white/90">Phân phối Role</h2>
          <div className="h-[220px]">
            {isLoading ? <LoadingPlaceholder /> : pieData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-white/30 text-sm">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    dataKey="value"
                    paddingAngle={3}
                  >
                    {pieData.map((entry: any, index: number) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any, name: any) => [value, name]}
                    contentStyle={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    labelStyle={{ color: 'rgba(255,255,255,0.4)' }}
                    itemStyle={{ color: 'white' }}
                  />
                  <Legend
                    formatter={(value) => <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>


        {/* Top Courses Table */}
        <div className="lg:col-span-12 flex flex-col gap-6 bg-[#0a0a0a]/50 border border-white/5 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-2xl mt-4">
          <h2 className="text-xl font-light tracking-tight text-white/90">Top Courses by Enrollment</h2>
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="pb-3 text-xs font-bold uppercase tracking-widest text-white/30 border-b border-white/10 w-8">#</th>
                <th className="pb-3 text-xs font-bold uppercase tracking-widest text-white/30 border-b border-white/10">Course</th>
                <th className="pb-3 text-xs font-bold uppercase tracking-widest text-white/30 border-b border-white/10">Instructor</th>
                <th className="pb-3 text-xs font-bold uppercase tracking-widest text-white/30 border-b border-white/10 text-right">Enrollments</th>
                <th className="pb-3 text-xs font-bold uppercase tracking-widest text-white/30 border-b border-white/10 text-right">Price</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-white/30 text-sm">Loading...</td>
                </tr>
              ) : topCourses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-white/30 text-sm">No course data yet.</td>
                </tr>
              ) : (
                topCourses.map((c: any, idx: number) => (
                  <motion.tr
                    key={c.courseId}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.06 }}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-3 border-b border-white/5 text-white/30 text-sm font-bold">{idx + 1}</td>
                    <td className="py-3 border-b border-white/5">
                      <span className="text-sm font-medium text-white/80">{c.title}</span>
                    </td>
                    <td className="py-3 border-b border-white/5">
                      <span className="text-sm text-white/50">{c.instructorName}</span>
                    </td>
                    <td className="py-3 border-b border-white/5 text-right">
                      <span className="text-sm font-bold text-indigo-400">{c.enrollmentCount}</span>
                    </td>
                    <td className="py-3 border-b border-white/5 text-right">
                      <span className="text-sm text-white/50">{Number(c.price || 0).toLocaleString('vi-VN')}đ</span>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </div>
  );
};
