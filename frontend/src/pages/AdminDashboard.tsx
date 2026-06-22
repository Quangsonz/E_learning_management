import React, { useEffect, useMemo, useState } from 'react';
import { motion, MotionProps } from 'framer-motion';
import {
  Button,
  CanvasHero,
  ChartBlock,
  GlassPanel,
  InsightCallout,
  LiveIndicator,
  MetricsSurface,
  PageShell,
  SectionLead,
  SkeletonStats,
  Toast
} from '../components/ui';
import useSimulatedLoading from '../hooks/useSimulatedLoading';
import { floatY } from '../animations/motionVariants';

type ChartPoint = { label: string; value: number };

type HealthItem = { label: string; value: number; tone: string };

const MotionDiv = motion.div as unknown as React.FC<
  React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement> & MotionProps>
>;

const metricsSeed = [
  { label: 'Total Users', value: 24680, delta: '+11.2% MoM' },
  { label: 'Total Courses', value: 386, delta: '+24 this quarter' },
  { label: 'Active Students', value: 18420, delta: '+7.8% today' },
  { label: 'Revenue', value: 128400, delta: '+19.6% this month' }
];

const userGrowth: ChartPoint[] = [
  { label: 'Jan', value: 30 },
  { label: 'Feb', value: 38 },
  { label: 'Mar', value: 44 },
  { label: 'Apr', value: 57 },
  { label: 'May', value: 63 },
  { label: 'Jun', value: 76 },
  { label: 'Jul', value: 82 }
];

const courseGrowth: ChartPoint[] = [
  { label: 'W1', value: 12 },
  { label: 'W2', value: 18 },
  { label: 'W3', value: 22 },
  { label: 'W4', value: 28 },
  { label: 'W5', value: 35 },
  { label: 'W6', value: 41 }
];

const health: HealthItem[] = [
  { label: 'API latency', value: 97, tone: 'emerald' },
  { label: 'Uptime', value: 99, tone: 'sky' },
  { label: 'Error rate', value: 1, tone: 'violet' },
  { label: 'Queue depth', value: 24, tone: 'amber' }
];

const realtimeEvents = [
  'New enterprise account onboarded',
  'Revenue threshold crossed for today',
  '3 courses published in the last hour',
  'Student retention rate improved'
];

const useCountUp = (target: number, duration = 1200) => {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let start: number | null = null;
    let frame = 0;

    const step = (timestamp: number) => {
      if (start === null) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      setValue(Math.round(target * progress));
      if (progress < 1) frame = window.requestAnimationFrame(step);
    };

    frame = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(frame);
  }, [duration, target]);

  return value;
};

const AdminDashboard: React.FC = () => {
  const [liveTick, setLiveTick] = useState(true);
  const [systemEvent, setSystemEvent] = useState(realtimeEvents[0]);
  const isLoading = useSimulatedLoading(900);

  const totalUsers = useCountUp(metricsSeed[0].value);
  const totalCourses = useCountUp(metricsSeed[1].value);
  const activeStudents = useCountUp(metricsSeed[2].value);
  const revenue = useCountUp(metricsSeed[3].value);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setLiveTick((current) => !current);
      setSystemEvent((current) => {
        const nextIndex = (realtimeEvents.indexOf(current) + 1) % realtimeEvents.length;
        return realtimeEvents[nextIndex];
      });
    }, 2400);

    return () => window.clearInterval(timer);
  }, []);

  const userMax = useMemo(() => Math.max(...userGrowth.map((point) => point.value)), []);
  const courseMax = useMemo(() => Math.max(...courseGrowth.map((point) => point.value)), []);

  const metrics = [
    { label: 'Total Users', value: totalUsers.toLocaleString(), delta: metricsSeed[0].delta },
    { label: 'Total Courses', value: totalCourses.toLocaleString(), delta: metricsSeed[1].delta },
    { label: 'Active Students', value: activeStudents.toLocaleString(), delta: metricsSeed[2].delta },
    { label: 'Revenue', value: `$${(revenue / 1000).toFixed(1)}k`, delta: metricsSeed[3].delta }
  ];

  return (
    <PageShell wide>
      <CanvasHero
        badge={<div className="badge">Admin dashboard</div>}
        eyebrow="Vercel Dashboard • Stripe Dashboard inspired"
        title="Enterprise control center for users, courses, students, and revenue."
        description="KPI counters, realtime updates, and animated charts designed for a polished admin experience with strong information density."
        glow="default"
        actions={
          <>
            <Button variant="pill">Manage platform</Button>
            <Button variant="outline">View reports</Button>
          </>
        }
        aside={
          <MotionDiv className="mx-auto max-w-[260px] lg:-ml-12" animate={floatY(6, 5.5)}>
            <div className="rounded-[var(--radius-section)] bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 px-6 py-5 text-white shadow-[0_24px_64px_rgba(15,23,42,0.2)]">
              <div className="flex items-center justify-between gap-3">
                <p className="section-label !text-white/55">Realtime Update</p>
                <LiveIndicator />
              </div>
              <h2 className="mt-2 text-xl font-semibold tracking-tight">System activity remains stable.</h2>
              <p className="mt-3 text-sm leading-relaxed text-white/70">{systemEvent}</p>
              <p className="mt-3 text-xs font-medium text-emerald-300/90">{liveTick ? 'Connected' : 'Refreshing'}</p>
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
          <ChartBlock label="Monthly user acquisition" title="User Growth">
            <div className="canvas-chart-area">
              <div className="flex items-end justify-between gap-2">
                {userGrowth.map((point, index) => {
                  const height = (point.value / userMax) * 220;
                  return (
                    <div key={point.label} className="flex flex-1 flex-col items-center gap-2">
                      <MotionDiv
                        className="w-full max-w-[42px] rounded-t-[20px] bg-gradient-to-t from-sky-500 via-indigo-500 to-violet-500"
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
          </ChartBlock>

          <div className="grid gap-10 lg:grid-cols-2">
            <ChartBlock label="Weekly course publishing" title="Course Growth">
              <div className="canvas-chart-area">
                <div className="flex h-56 items-end gap-4">
                  {courseGrowth.map((point, index) => {
                    const height = (point.value / courseMax) * 180;
                    return (
                      <div key={point.label} className="flex flex-1 flex-col items-center gap-2">
                        <MotionDiv
                          className="w-full rounded-t-[22px] bg-gradient-to-t from-emerald-500 to-cyan-400"
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
            </ChartBlock>

            <ChartBlock label="Infrastructure status" title="System Health">
              <div className="canvas-chart-area space-y-4">
                {health.map((item, index) => (
                  <div key={item.label} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-600">{item.label}</span>
                      <span className="font-semibold tabular-nums text-slate-950">
                        {item.value}
                        {item.label === 'Error rate' ? '%' : '%'}
                      </span>
                    </div>
                    <div className="progress-track">
                      <MotionDiv
                        className={`progress-fill bg-gradient-to-r ${
                          item.tone === 'emerald'
                            ? 'from-emerald-500 to-cyan-400'
                            : item.tone === 'sky'
                              ? 'from-sky-500 to-indigo-500'
                              : item.tone === 'violet'
                                ? 'from-violet-500 to-fuchsia-500'
                                : 'from-amber-500 to-orange-500'
                        }`}
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
            <SectionLead label="Revenue by product line" title="Revenue Analytics" />
            <div className="mt-5 grid gap-y-4 sm:grid-cols-3 sm:gap-x-8">
              {[
                { label: 'Enterprise', value: '$58.4k', tone: 'from-sky-500 to-indigo-500' },
                { label: 'Creator', value: '$34.7k', tone: 'from-emerald-500 to-cyan-400' },
                { label: 'Teams', value: '$35.3k', tone: 'from-violet-500 to-fuchsia-500' }
              ].map((item, index) => (
                <MotionDiv
                  key={item.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.06 }}
                >
                  <div className="flex items-baseline justify-between gap-4 sm:flex-col sm:items-start">
                    <span className="text-sm font-medium text-slate-500">{item.label}</span>
                    <span className="text-xl font-semibold tabular-nums text-slate-950">{item.value}</span>
                  </div>
                  <div className={`mt-3 h-1 rounded-full bg-gradient-to-r ${item.tone}`} />
                </MotionDiv>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-8 xl:pt-1">
          <div>
            <SectionLead label="Realtime Update" title="Platform pulse" meta={<LiveIndicator />} />
            <div className="mt-4 space-y-2 text-sm leading-relaxed text-slate-600">
              <p>126 new users joined in the last 24 hours.</p>
              <p>18 course updates were processed today.</p>
              <p>4 revenue spikes detected from enterprise plans.</p>
            </div>
          </div>

          <GlassPanel variant="dark" padding="lg" motionProps={{ animate: floatY(6, 5.5) }}>
            <p className="section-label !text-white/55">System Health</p>
            <h3 className="mt-2 text-xl font-semibold tracking-tight">Infrastructure stable</h3>
            <div className="mt-5 space-y-3">
              {[
                { label: 'Load balancer', value: '99.98%' },
                { label: 'Queue latency', value: '12ms' },
                { label: 'Database', value: 'Healthy' },
                { label: 'Edge cache', value: 'Warm' }
              ].map((item) => (
                <div key={item.label} className="flex items-baseline justify-between gap-4 text-sm">
                  <span className="text-white/60">{item.label}</span>
                  <span className="font-semibold tabular-nums">{item.value}</span>
                </div>
              ))}
            </div>
          </GlassPanel>

          <InsightCallout
            title="Metrics refreshed"
            description="Platform metrics sync continuously to keep admin decisions grounded in live data."
          />
        </aside>
      </section>

      <Toast
        visible={liveTick}
        title="Realtime update"
        message="Platform metrics refreshed successfully."
        variant="success"
        position="top-right"
        duration={3000}
      />
    </PageShell>
  );
};

export default AdminDashboard;
