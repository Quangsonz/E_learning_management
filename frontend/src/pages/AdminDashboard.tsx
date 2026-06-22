import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, MotionProps } from 'framer-motion';
import { Button, PageShell, SkeletonStats, Toast, GlassPanel } from '../components/ui';
import useSimulatedLoading from '../hooks/useSimulatedLoading';

type Metric = {
  label: string;
  value: number;
  suffix: string;
  delta: string;
};

type ChartPoint = {
  label: string;
  value: number;
};

type HealthItem = {
  label: string;
  value: number;
  tone: string;
};

const MotionDiv = motion.div as unknown as React.FC<React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement> & MotionProps>>;

const metrics: Metric[] = [
  { label: 'Total Users', value: 24680, suffix: '', delta: '+11.2% MoM' },
  { label: 'Total Courses', value: 386, suffix: '', delta: '+24 this quarter' },
  { label: 'Active Students', value: 18420, suffix: '', delta: '+7.8% today' },
  { label: 'Revenue', value: 128400, suffix: '$', delta: '+19.6% this month' }
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

      if (progress < 1) {
        frame = window.requestAnimationFrame(step);
      }
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

  const totalUsers = useCountUp(metrics[0].value);
  const totalCourses = useCountUp(metrics[1].value);
  const activeStudents = useCountUp(metrics[2].value);
  const revenue = useCountUp(metrics[3].value);

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

  const revenueMax = useMemo(() => Math.max(...userGrowth.map((point) => point.value)), []);
  const courseMax = useMemo(() => Math.max(...courseGrowth.map((point) => point.value)), []);

  return (
    <PageShell>
        <GlassPanel padding="lg">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div className="space-y-6">
              <div className="badge">Admin dashboard</div>
              <div>
                <p className="text-sm font-medium text-slate-500">Vercel Dashboard • Stripe Dashboard inspired</p>
                <h1 className="mt-2 max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                  Enterprise control center for users, courses, students, and revenue.
                </h1>
              </div>
              <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                KPI counters, realtime updates, and animated charts designed for a polished admin experience with strong information density.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button variant="pill">Manage platform</Button>
                <Button variant="outline">View reports</Button>
              </div>
            </div>

            <GlassPanel variant="dark" padding="lg" motionProps={{ animate: { y: [0, -6, 0] }, transition: { duration: 5.5, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' } }}>
              <p className="section-label !text-white/70">Realtime Update</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">System activity remains stable.</h2>
              <div className="mt-6 rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <span className="section-label !text-white/70">Live sync</span>
                  <span className={`status-badge ${liveTick ? 'status-badge-success !border-transparent !bg-emerald-400/20 !text-emerald-100' : '!border-transparent !bg-white/10 !text-white/70'}`}>
                    {liveTick ? 'Connected' : 'Refreshing'}
                  </span>
                </div>
                <p className="mt-4 text-sm leading-7 text-white/80">{systemEvent}</p>
              </div>
            </GlassPanel>
          </div>
        </GlassPanel>

        {isLoading ? (
          <div className="mt-6"><SkeletonStats count={4} /></div>
        ) : (
        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Total Users', value: totalUsers, suffix: '' },
            { label: 'Total Courses', value: totalCourses, suffix: '' },
            { label: 'Active Students', value: activeStudents, suffix: '' },
            { label: 'Revenue', value: revenue, suffix: '$' }
          ].map((item, index) => (
            <GlassPanel key={item.label} variant="sm" padding="sm" motionProps={{ initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3, delay: index * 0.05 } }}>
              <p className="kpi-label">{item.label}</p>
              <p className="mt-2 kpi-value">
                {item.suffix}
                {index === 3 ? `${(item.value / 1000).toFixed(1)}k` : item.value.toLocaleString()}
              </p>
              <p className="mt-2 kpi-delta">{metrics[index].delta}</p>
            </GlassPanel>
          ))}
        </section>
        )}

        <section className="mt-8 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-6">
            <ChartCard title="User Growth" subtitle="Monthly user acquisition">
              <div className="rounded-[26px] border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-end justify-between gap-2">
                  {userGrowth.map((point, index) => {
                    const height = (point.value / revenueMax) * 220;
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
            </ChartCard>

            <section className="grid gap-6 lg:grid-cols-2">
              <ChartCard title="Course Growth" subtitle="Weekly course publishing">
                <div className="rounded-[26px] border border-slate-200 bg-slate-50 p-4">
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
              </ChartCard>

              <ChartCard title="System Health" subtitle="Infrastructure status">
                <div className="space-y-4 rounded-[26px] border border-slate-200 bg-slate-50 p-4">
                  {health.map((item, index) => (
                    <div key={item.label} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-600">{item.label}</span>
                        <span className="font-semibold text-slate-950">{item.value}{item.label === 'Error rate' ? '%' : '%'}</span>
                      </div>
                      <div className="progress-track">
                        <MotionDiv
                          className={`progress-fill ${item.tone === 'emerald' ? 'from-emerald-500 to-cyan-400' : item.tone === 'sky' ? 'from-sky-500 to-indigo-500' : item.tone === 'violet' ? 'from-violet-500 to-fuchsia-500' : 'from-amber-500 to-orange-500'}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${item.value}%` }}
                          transition={{ duration: 0.8, delay: index * 0.08 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </ChartCard>
            </section>

            <ChartCard title="Revenue Analytics" subtitle="Revenue by product line">
              <div className="grid gap-4 lg:grid-cols-3">
                {[
                  { label: 'Enterprise', value: '$58.4k', tone: 'from-sky-500 to-indigo-500' },
                  { label: 'Creator', value: '$34.7k', tone: 'from-emerald-500 to-cyan-400' },
                  { label: 'Teams', value: '$35.3k', tone: 'from-violet-500 to-fuchsia-500' }
                ].map((item, index) => (
                  <MotionDiv
                    key={item.label}
                    className="rounded-[26px] border border-slate-200 bg-slate-50 p-4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.06 }}
                  >
                    <p className="section-label">{item.label}</p>
                    <p className="mt-3 text-2xl font-semibold text-slate-950">{item.value}</p>
                    <div className={`mt-4 h-2 rounded-full bg-gradient-to-r ${item.tone}`} />
                  </MotionDiv>
                ))}
              </div>
            </ChartCard>
          </div>

          <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
            <GlassPanel hover>
              <p className="section-label">Realtime Update</p>
              <h3 className="mt-2 text-2xl font-semibold text-slate-950">Platform pulse</h3>
              <div className="mt-4 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-600">
                <p>• 126 new users joined in the last 24 hours.</p>
                <p>• 18 course updates were processed today.</p>
                <p>• 4 revenue spikes detected from enterprise plans.</p>
              </div>
            </GlassPanel>

            <GlassPanel variant="dark" padding="lg" motionProps={{ animate: { y: [0, -6, 0] }, transition: { duration: 5.5, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' } }}>
              <p className="section-label !text-white/70">System Health</p>
              <h3 className="mt-3 text-2xl font-semibold tracking-tight">Infrastructure stable</h3>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                {[
                  { label: 'Load balancer', value: '99.98%' },
                  { label: 'Queue latency', value: '12ms' },
                  { label: 'Database', value: 'Healthy' },
                  { label: 'Edge cache', value: 'Warm' }
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-white/10 bg-white/10 px-4 py-4 backdrop-blur-md">
                    <p className="section-label !text-white/70">{item.label}</p>
                    <p className="mt-2 text-lg font-semibold">{item.value}</p>
                  </div>
                ))}
              </div>
            </GlassPanel>

            <GlassPanel hover>
              <p className="section-label">Revenue Analytics Snapshot</p>
              <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                <div className="flex items-end justify-between gap-3">
                  {[38, 55, 49, 68, 63].map((value, index) => (
                    <MotionDiv
                      key={index}
                      className="w-full rounded-t-lg bg-gradient-to-t from-emerald-500 via-cyan-500 to-sky-500"
                      initial={{ height: 0 }}
                      animate={{ height: `${value}%` }}
                      transition={{ duration: 0.8, delay: index * 0.06 }}
                      style={{ minHeight: 18 }}
                    />
                  ))}
                </div>
              </div>
            </GlassPanel>

            <Toast
              visible={liveTick}
              title="Realtime update"
              message="Platform metrics refreshed successfully."
              variant="success"
              position="top-right"
              duration={3000}
            />
          </aside>
        </section>
    </PageShell>
  );
};

const ChartCard: React.FC<{ title: string; subtitle: string; children: React.ReactNode }> = ({ title, subtitle, children }) => (
  <GlassPanel motionProps={{ initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35, ease: 'easeOut' } }}>
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="section-label">{subtitle}</p>
        <h3 className="mt-2 section-title">{title}</h3>
      </div>
      <div className="badge !bg-slate-50 !text-slate-500 !border-slate-200">Animated Charts</div>
    </div>
    <div className="mt-5">{children}</div>
  </GlassPanel>
);

export default AdminDashboard;