import React, { useEffect, useMemo, useState } from 'react';
import { motion, MotionProps } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button, PageShell, SkeletonStats, GlassPanel } from '../components/ui';
import useSimulatedLoading from '../hooks/useSimulatedLoading';

type Stat = {
  label: string;
  value: string;
  delta: string;
  tone: 'emerald' | 'sky' | 'violet' | 'amber';
};

type SeriesPoint = {
  label: string;
  value: number;
};

type CourseMetric = {
  title: string;
  students: string;
  completion: string;
  revenue: string;
};

const MotionDiv = motion.div as unknown as React.FC<React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement> & MotionProps>>;

const stats: Stat[] = [
  { label: 'Revenue', value: '$48.2k', delta: '+18.4% this month', tone: 'emerald' },
  { label: 'Active students', value: '3,842', delta: '+12.1% this week', tone: 'sky' },
  { label: 'Courses published', value: '18', delta: '+3 new courses', tone: 'violet' },
  { label: 'Quiz pass rate', value: '92%', delta: '+4.8% improved', tone: 'amber' }
];

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
  { title: 'Product Design Masterclass', students: '1,240 students', completion: '84% completion', revenue: '$13.4k' },
  { title: 'React System Architecture', students: '980 students', completion: '78% completion', revenue: '$11.8k' },
  { title: 'Learning Analytics Strategy', students: '710 students', completion: '91% completion', revenue: '$9.3k' }
];

const quizPerformance = [
  { label: 'Easy', value: 94 },
  { label: 'Medium', value: 89 },
  { label: 'Hard', value: 76 }
];

const animatedReveal = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0 }
};

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

      if (progress < 1) {
        frame = window.requestAnimationFrame(step);
      }
    };

    frame = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(frame);
  }, [duration, target]);

  return value;
};

const ChartFrame: React.FC<{ title: string; subtitle: string; children: React.ReactNode }> = ({ title, subtitle, children }) => (
  <GlassPanel
    variants={animatedReveal}
    initial="hidden"
    animate="visible"
    transition={{ duration: 0.35, ease: 'easeOut' }}
  >
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="section-label">{subtitle}</p>
        <h3 className="mt-2 section-title">{title}</h3>
      </div>
      <div className="badge !bg-slate-50 !text-slate-500 !border-slate-200">Live</div>
    </div>
    <div className="mt-5">{children}</div>
  </GlassPanel>
);

const TeacherDashboard: React.FC = () => {
  const [showPulse, setShowPulse] = useState(true);
  const isLoading = useSimulatedLoading(900);
  const revenueValue = useCountUp(48200);
  const studentsValue = useCountUp(3842);
  const coursesValue = useCountUp(18);
  const passRateValue = useCountUp(92);

  useEffect(() => {
    const timer = window.setInterval(() => setShowPulse((current) => !current), 2200);
    return () => window.clearInterval(timer);
  }, []);

  const revenueMax = useMemo(() => Math.max(...revenueSeries.map((item) => item.value)), []);
  const studentMax = useMemo(() => Math.max(...studentSeries.map((item) => item.value)), []);

  return (
    <PageShell>
        <GlassPanel padding="lg">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="space-y-6">
              <div className="badge !border-sky-200 !bg-sky-50 !text-sky-700">
                Teacher Dashboard
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Stripe Dashboard • Linear Dashboard inspired</p>
                <h1 className="mt-2 max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                  Manage revenue, students, courses, and quizzes from one premium LMS control center.
                </h1>
              </div>
              <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                Clean KPI counters, animated charts, and live statistics designed to give teachers a confident, high-signal dashboard experience.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/courses">
                  <Button variant="pill">View courses</Button>
                </Link>
                <Link to="/quiz">
                  <Button variant="outline">Review quizzes</Button>
                </Link>
              </div>
            </div>

            <GlassPanel variant="dark" padding="lg" motionProps={{ animate: { y: [0, -6, 0] }, transition: { duration: 5.5, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' } }}>
              <p className="section-label !text-white/70">Live Statistics</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">Your LMS is performing strongly.</h2>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {[
                  { label: 'Revenue growth', value: '+18.4%' },
                  { label: 'Student retention', value: '91.2%' },
                  { label: 'Completion rate', value: '84.7%' },
                  { label: 'Quiz average', value: '92.0%' }
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-white/10 bg-white/10 px-4 py-4 backdrop-blur-md">
                    <p className="section-label !text-white/70">{item.label}</p>
                    <p className="mt-2 text-2xl font-semibold">{item.value}</p>
                  </div>
                ))}
              </div>
            </GlassPanel>
          </div>
        </GlassPanel>

        {isLoading ? (
          <div className="mt-6"><SkeletonStats count={4} /></div>
        ) : (
        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((item, index) => {
            const rawValue = [revenueValue, studentsValue, coursesValue, passRateValue][index];
            const displayValue = index === 0 ? `$${(rawValue / 1000).toFixed(1)}k` : index === 1 ? rawValue.toLocaleString() : index === 2 ? rawValue.toString() : `${rawValue}%`;

            return (
              <GlassPanel
                key={item.label}
                variant="sm"
                padding="sm"
                motionProps={{ initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35, delay: index * 0.05 } }}
              >
                <p className="kpi-label">{item.label}</p>
                <p className="mt-3 kpi-value">{displayValue}</p>
                <p className="mt-2 kpi-delta">{item.delta}</p>
              </GlassPanel>
            );
          })}
        </section>
        )}

        <section className="mt-8 grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-6">
            <ChartFrame title="Revenue Analytics" subtitle="Monthly revenue trend">
              <div className="rounded-[26px] border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-end justify-between gap-2">
                  {revenueSeries.map((point, index) => {
                    const height = (point.value / revenueMax) * 190;
                    return (
                      <div key={point.label} className="flex flex-1 flex-col items-center gap-2">
                        <MotionDiv
                          className="w-full max-w-[42px] rounded-t-[20px] bg-gradient-to-t from-sky-500 via-indigo-500 to-violet-500 shadow-elev-2"
                          initial={{ height: 0 }}
                          animate={{ height }}
                          transition={{ duration: 0.8, delay: index * 0.05 }}
                        />
                        <span className="text-xs font-medium text-slate-500">{point.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </ChartFrame>

            <section className="grid gap-6 lg:grid-cols-2">
              <ChartFrame title="Student Analytics" subtitle="Weekly enrollment growth">
                <div className="rounded-[26px] border border-slate-200 bg-slate-50 p-4">
                  <div className="flex h-56 items-end gap-4">
                    {studentSeries.map((point, index) => {
                      const height = (point.value / studentMax) * 170;
                      return (
                        <div key={point.label} className="flex flex-1 flex-col items-center gap-2">
                          <MotionDiv
                            className={`w-full rounded-t-[22px] ${showPulse && index === studentSeries.length - 1 ? 'bg-gradient-to-t from-emerald-500 to-cyan-400' : 'bg-gradient-to-t from-slate-700 to-slate-500'}`}
                            initial={{ height: 0 }}
                            animate={{ height }}
                            transition={{ duration: 0.85, delay: index * 0.06 }}
                          />
                          <span className="text-xs font-medium text-slate-500">{point.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </ChartFrame>

              <ChartFrame title="Quiz Analytics" subtitle="Quiz performance split">
                <div className="space-y-4 rounded-[26px] border border-slate-200 bg-slate-50 p-4">
                  {quizPerformance.map((item, index) => (
                    <div key={item.label} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-600">{item.label}</span>
                        <span className="font-semibold text-slate-950">{item.value}%</span>
                      </div>
                      <div className="progress-track">
                        <MotionDiv
                          className="progress-fill from-amber-500 via-orange-500 to-rose-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${item.value}%` }}
                          transition={{ duration: 0.8, delay: index * 0.08 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </ChartFrame>
            </section>

            <ChartFrame title="Course Analytics" subtitle="Course health overview">
              <div className="space-y-4">
                {courseMetrics.map((course, index) => (
                  <MotionDiv
                    key={course.title}
                    className="rounded-[26px] border border-slate-200 bg-slate-50 p-4 transition duration-sm hover:border-slate-300 hover:bg-white hover:shadow-elev-1"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: index * 0.05 }}
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <h4 className="text-lg font-semibold text-slate-950">{course.title}</h4>
                        <p className="mt-1 text-sm text-slate-500">{course.students}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm">
                        <span className="rounded-full bg-white px-3 py-1 font-semibold text-slate-700 shadow-sm">{course.completion}</span>
                        <span className="rounded-full bg-primary-500 px-3 py-1 font-semibold text-white shadow-sm">{course.revenue}</span>
                      </div>
                    </div>
                  </MotionDiv>
                ))}
              </div>
            </ChartFrame>
          </div>

          <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
            <GlassPanel variant="dark" motionProps={{ animate: { y: [0, -6, 0] }, transition: { duration: 5.5, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' } }}>
              <p className="section-label !text-white/70">Live Insights</p>
              <h3 className="mt-3 text-2xl font-semibold tracking-tight">What needs your attention</h3>
              <div className="mt-5 space-y-3">
                {[
                  '2 quizzes need review before the weekly deadline.',
                  'One high-value course is underperforming in completion.',
                  'Revenue from design courses is outpacing the rest of the catalog.'
                ].map((item) => (
                  <div key={item} className="rounded-2xl border border-white/10 bg-white/10 px-4 py-4 text-sm leading-7 text-white/85 backdrop-blur-md">
                    {item}
                  </div>
                ))}
              </div>
            </GlassPanel>

            <GlassPanel hover>
              <p className="section-label">Revenue Analytics Snapshot</p>
              <div className="mt-4 rounded-[26px] bg-slate-50 p-4">
                <div className="flex items-end justify-between gap-3">
                  {[42, 58, 49, 71, 64].map((value, index) => (
                    <MotionDiv
                      key={index}
                      className="w-full rounded-t-[18px] bg-gradient-to-t from-emerald-500 via-cyan-500 to-sky-500 shadow-elev-1"
                      initial={{ height: 0 }}
                      animate={{ height: `${value}%` }}
                      transition={{ duration: 0.8, delay: index * 0.06 }}
                      style={{ minHeight: 18 }}
                    />
                  ))}
                </div>
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                Smooth chart motion helps the dashboard feel alive while keeping the signal clear and readable.
              </p>
            </GlassPanel>
          </aside>
        </section>
    </PageShell>
  );
};

export default TeacherDashboard;