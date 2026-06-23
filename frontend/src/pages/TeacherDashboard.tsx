import React, { useEffect, useMemo, useState } from 'react';
import { motion, MotionProps } from 'framer-motion';
import { Link } from 'react-router-dom';
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
  { title: 'Product Design Masterclass', students: '1,240 students', completion: '84% completion', revenue: '$13.4k' },
  { title: 'React System Architecture', students: '980 students', completion: '78% completion', revenue: '$11.8k' },
  { title: 'Learning Analytics Strategy', students: '710 students', completion: '91% completion', revenue: '$9.3k' }
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

  const metrics = [
    { label: 'Revenue', value: `$${(revenueValue / 1000).toFixed(1)}k`, delta: '+18.4% this month' },
    { label: 'Active Students', value: studentsValue.toLocaleString(), delta: '+12.1% this week' },
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
            <Link to="/courses">
              <Button variant="pill">View courses</Button>
            </Link>
            <Link to="/quiz">
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
                {[
                  { label: 'Revenue growth', value: '+18.4%' },
                  { label: 'Student retention', value: '91.2%' },
                  { label: 'Completion rate', value: '84.7%' },
                  { label: 'Quiz average', value: '92.0%' }
                ].map((item) => (
                  <div key={item.label} className="flex items-baseline justify-between gap-4">
                    <span className="text-white/60">{item.label}</span>
                    <span className="font-semibold tabular-nums">{item.value}</span>
                  </div>
                ))}
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
          <ChartBlock label="Monthly revenue trend" title="Revenue Analytics" badge={<span className="text-xs font-medium text-slate-400">Live</span>}>
            <div className="canvas-chart-area">
              <div className="flex items-end justify-between gap-2">
                {revenueSeries.map((point, index) => {
                  const height = (point.value / revenueMax) * 190;
                  return (
                    <div key={point.label} className="flex flex-1 flex-col items-center gap-2">
                      <MotionDiv
                        className="w-full max-w-[42px] rounded-t-[20px] chart-bar-growth"
                        initial={{ height: 0 }}
                        animate={{ height }}
                        transition={{ duration: 0.8, delay: index * 0.05 }}
                      />
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{point.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </ChartBlock>

          <div className="grid gap-10 lg:grid-cols-2">
            <ChartBlock label="Weekly enrollment growth" title="Student Analytics">
              <div className="canvas-chart-area">
                <div className="flex h-56 items-end gap-4">
                  {studentSeries.map((point, index) => {
                    const height = (point.value / studentMax) * 170;
                    return (
                      <div key={point.label} className="flex flex-1 flex-col items-center gap-2">
                        <MotionDiv
                          className={`w-full rounded-t-[22px] ${
                            showPulse && index === studentSeries.length - 1
                              ? 'chart-bar-success'
                              : 'chart-bar-neutral'
                          }`}
                          initial={{ height: 0 }}
                          animate={{ height }}
                          transition={{ duration: 0.85, delay: index * 0.06 }}
                        />
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{point.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </ChartBlock>

            <ChartBlock label="Quiz performance split" title="Quiz Analytics">
              <div className="canvas-chart-area space-y-4">
                {quizPerformance.map((item, index) => (
                  <div key={item.label} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-600 dark:text-slate-300">{item.label}</span>
                      <span className="font-semibold tabular-nums text-slate-950 dark:text-white">{item.value}%</span>
                    </div>
                    <div className="progress-track">
                      <MotionDiv
                        className="progress-fill chart-bar-growth"
                        initial={{ width: 0 }}
                        animate={{ width: `${item.value}%` }}
                        transition={{ duration: 0.8, delay: index * 0.08 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </ChartBlock>
          </div>

          <div>
            <SectionLead label="Course health overview" title="Course Analytics" size="md" />
            <div className="mt-5">
              {courseMetrics.map((course, index) => (
                <MotionDiv
                  key={course.title}
                  className="flex flex-col gap-3 py-4 border-b border-slate-100 last:border-0 lg:flex-row lg:items-center lg:justify-between"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: index * 0.05 }}
                >
                  <div>
                    <h4 className="text-lg font-semibold text-slate-950 dark:text-white">{course.title}</h4>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{course.students}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-600 dark:text-slate-300">
                    <span>{course.completion}</span>
                    <span className="font-semibold text-primary-600">{course.revenue}</span>
                  </div>
                </MotionDiv>
              ))}
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
