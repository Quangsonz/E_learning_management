import React, { useEffect, useMemo, useState } from 'react';
import { motion, MotionProps } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../services/analytics.api';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import {
  Button,
  CanvasHero,
  ChartBlock,
  GlassPanel,
  InsightCallout,
  MetricsSurface,
  PageShell,
  SectionLead,
  SkeletonStats
} from '../components/ui';
import useSimulatedLoading from '../hooks/useSimulatedLoading';
import { floatY } from '../animations/motionVariants';

type SeriesPoint = { label: string; value: number };

type CourseMetric = {
  title: string;
  students: string;
  completion: string;
  revenue: string;
};

const MotionDiv = motion.div as unknown as React.FC<
  React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement> & MotionProps>
>;

const revenueSeries: SeriesPoint[] = [
  { label: 'Mon', value: 28 },
  { label: 'Tue', value: 34 },
  { label: 'Wed', value: 31 },
  { label: 'Thu', value: 42 },
  { label: 'Fri', value: 55 },
  { label: 'Sat', value: 49 },
  { label: 'Sun', value: 61 }
];

const studentSeries: SeriesPoint[] = [
  { label: 'Week 1', value: 22 },
  { label: 'Week 2', value: 30 },
  { label: 'Week 3', value: 37 },
  { label: 'Week 4', value: 52 }
];

const courseMetrics: CourseMetric[] = [
  { title: 'Product Design Masterclass', students: '1.240 students', completion: '84% completion', revenue: '300.000.000đ' },
  { title: 'React System Architecture', students: '980 students', completion: '78% completion', revenue: '280.000.000đ' },
  { title: 'Learning Analytics Strategy', students: '710 students', completion: '91% completion', revenue: '230.000.000đ' }
];

const quizPerformance = [
  { label: 'Easy', value: 94 },
  { label: 'Medium', value: 89 },
  { label: 'Hard', value: 76 }
];

const useCountUp = (target: number, duration = 1200) => {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let start: number | null = null;
    let frame = 0;

    const step = (timestamp: number) => {
      if (start === null) start = timestamp;
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / duration, 1);
      setValue(Math.round(progress * target));
      if (progress < 1) frame = window.requestAnimationFrame(step);
    };

    frame = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(frame);
  }, [duration, target]);

  return value;
};

const TeacherDashboard: React.FC = () => {
  const [showPulse, setShowPulse] = useState(true);

  const { data: analyticsResponse, isLoading } = useQuery({
    queryKey: ['teacher-analytics'],
    queryFn: () => analyticsApi.getTeacherDashboard()
  });

  const dashboardData = analyticsResponse?.data;
  const overview = dashboardData?.overview;
  const monthlyEnrollments = dashboardData?.monthlyEnrollments || [];
  const courseStats = dashboardData?.courseStats || [];
  const quizResults = dashboardData?.quizResults || [];
  const dropOffAnalysis = dashboardData?.dropOffAnalysis || [];

  const revenueValue = useCountUp(overview?.totalRevenue || 0);
  const studentsValue = useCountUp(overview?.totalStudents || 0);
  const coursesValue = useCountUp(overview?.totalCourses || 0);
  const passRateValue = useCountUp(quizResults.length > 0 ? (quizResults[0]?.passRate || 0) : 0);

  useEffect(() => {
    const timer = window.setInterval(() => setShowPulse((current) => !current), 2200);
    return () => window.clearInterval(timer);
  }, []);

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const enrollmentChartData = monthlyEnrollments.map((item: any) => ({
    label: monthNames[item.month - 1] || `Month ${item.month}`,
    value: item.enrollments
  }));

  const metrics = [
    { label: 'Revenue', value: `${revenueValue.toLocaleString('vi-VN')}đ`, delta: '+18.4% this month' },
    { label: 'Active Students', value: studentsValue.toLocaleString('vi-VN'), delta: '+12.1% this week' },
    { label: 'Courses Published', value: coursesValue.toString(), delta: '+3 new courses' },
    { label: 'Quiz Pass Rate', value: `${passRateValue}%`, delta: '+4.8% improved' }
  ];

  return (
    <PageShell wide>
      <CanvasHero
        badge={<div className="badge !border-sky-200 !bg-sky-50 !text-sky-700">Teacher Dashboard</div>}
        eyebrow="Stripe Dashboard • Linear Dashboard inspired"
        title="Manage revenue, students, courses, and quizzes from one premium LMS control center."
        description="Clean KPI counters, animated charts, and live statistics designed to give teachers a confident, high-signal dashboard experience."
        glow="cool"
        actions={
          <>
            <Link to="/teacher-courses">
              <Button variant="pill">Manage courses</Button>
            </Link>
            <Link to="/teacher-courses">
              <Button variant="outline">Review quizzes</Button>
            </Link>
          </>
        }
        aside={
          <MotionDiv className="mx-auto max-w-[260px] lg:-ml-12" animate={floatY(6, 5.5)}>
            <div className="rounded-[var(--radius-section)] bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 px-6 py-5 text-white shadow-[0_24px_64px_rgba(15,23,42,0.2)]">
              <p className="section-label !text-white/55">Live Statistics</p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight">Your LMS is performing strongly.</h2>
              <div className="mt-4 space-y-2.5 text-sm">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-white/60">Total Revenue</span>
                  <span className="font-semibold tabular-nums">{overview?.totalRevenue?.toLocaleString('vi-VN') || 0}đ</span>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-white/60">Total Students</span>
                  <span className="font-semibold tabular-nums">{overview?.totalStudents?.toLocaleString('vi-VN') || 0}</span>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-white/60">Completions</span>
                  <span className="font-semibold tabular-nums">{overview?.completionCount?.toLocaleString('vi-VN') || 0}</span>
                </div>
              </div>
            </div>
          </MotionDiv>
        }
      />

      {isLoading ? (
        <div className="mt-5">
          <SkeletonStats count={4} />
        </div>
      ) : (
        <MetricsSurface metrics={metrics} />
      )}

      <section className="mt-10 grid gap-10 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,0.72fr)] xl:gap-12">
        <div className="space-y-10">
          <ChartBlock label="Drop-off Analysis" title="Student Retention" badge={<span className="text-xs font-medium text-slate-400">Live</span>}>
            <div className="canvas-chart-area h-64 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dropOffAnalysis} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="lessonTitle" type="category" width={150} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <RechartsTooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ borderRadius: '12px', border: 'none', background: '#0f172a', color: '#fff' }} />
                  <Bar dataKey="dropOffCount" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartBlock>

          <div className="grid gap-10 lg:grid-cols-2">
            <ChartBlock label="Monthly enrollment growth" title="Student Analytics">
              <div className="canvas-chart-area h-56 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={enrollmentChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} vertical={false} />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                    <RechartsTooltip cursor={{ stroke: 'rgba(255,255,255,0.1)' }} contentStyle={{ borderRadius: '12px', border: 'none', background: '#0f172a', color: '#fff' }} />
                    <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={4} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </ChartBlock>

            <ChartBlock label="Quiz performance" title="Quiz Analytics">
              <div className="canvas-chart-area space-y-4">
                {quizResults.map((item: any, index: number) => (
                  <div key={item.quizTitle} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-600 dark:text-slate-300 line-clamp-1 mr-4">{item.quizTitle}</span>
                      <span className="font-semibold tabular-nums text-slate-950 dark:text-white shrink-0">{item.passRate}%</span>
                    </div>
                    <div className="progress-track">
                      <MotionDiv
                        className="progress-fill chart-bar-growth"
                        initial={{ width: 0 }}
                        animate={{ width: `${item.passRate}%` }}
                        transition={{ duration: 0.8, delay: index * 0.08 }}
                      />
                    </div>
                  </div>
                ))}
                {quizResults.length === 0 && <p className="text-sm text-slate-500">No quiz data available.</p>}
              </div>
            </ChartBlock>
          </div>

          <div>
            <SectionLead label="Course health overview" title="Course Analytics" size="md" />
            <div className="mt-5">
              {courseStats.map((course: any, index: number) => (
                <MotionDiv
                  key={course._id}
                  className="flex flex-col gap-3 py-4 border-b border-slate-100 last:border-0 lg:flex-row lg:items-center lg:justify-between"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: index * 0.05 }}
                >
                  <div>
                    <h4 className="text-lg font-semibold text-slate-950 dark:text-white">{course.title}</h4>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{course.enrollmentCount} students enrolled</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-600 dark:text-slate-300">
                    <span>{course.avgProgress?.toFixed(1) || 0}% completion</span>
                    <div className="flex flex-col items-end">
                      <span className="font-semibold text-primary-600">{Number(course.price || 0).toLocaleString('vi-VN')}đ</span>
                      {course.discountPercentage && course.discountPercentage > 0 ? (
                        <span className="text-[10px] text-slate-400 line-through">
                          {Number(course.estimatedPrice || course.price).toLocaleString('vi-VN')}đ
                        </span>
                      ) : null}
                    </div>
                  </div>
                </MotionDiv>
              ))}
              {courseStats.length === 0 && <p className="text-sm text-slate-500">No courses published yet.</p>}
            </div>
          </div>
        </div>

        <aside className="space-y-8 xl:pt-1">
          <GlassPanel variant="dark" padding="lg">
            <p className="section-label !text-white/55">Live Insights</p>
            <h3 className="mt-2 text-xl font-semibold tracking-tight">What needs your attention</h3>
            <div className="mt-5 space-y-4">
              {[
                '2 quizzes need review before the weekly deadline.',
                'One high-value course is underperforming in completion.',
                'Revenue from design courses is outpacing the rest of the catalog.'
              ].map((item) => (
                <p key={item} className="text-sm leading-relaxed text-white/75">
                  {item}
                </p>
              ))}
            </div>
          </GlassPanel>

          <InsightCallout
            title="Revenue momentum"
            description="Smooth chart motion helps the dashboard feel alive while keeping the signal clear and readable."
          />
        </aside>
      </section>
    </PageShell>
  );
};

export default TeacherDashboard;
