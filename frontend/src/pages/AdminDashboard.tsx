import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, MotionProps } from 'framer-motion';

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

const adminSteps = ['Draft', 'Review', 'Publish'];

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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.16),transparent_24%),radial-gradient(circle_at_top_right,_rgba(99,102,241,0.14),transparent_24%),linear-gradient(180deg,#f8fbff_0%,#eef4fb_100%)] text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <MotionDiv
          className="overflow-hidden rounded-[34px] border border-white/70 bg-white/75 shadow-[0_24px_90px_rgba(15,23,42,0.08)] backdrop-blur-2xl"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
        >
          <div className="grid gap-6 p-6 lg:grid-cols-[1.2fr_0.8fr] lg:p-8">
            <div className="space-y-6">
              <div className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">
                Admin Dashboard
              </div>
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
                <button className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800">
                  Manage platform
                </button>
                <button className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-50">
                  View reports
                </button>
              </div>
            </div>

            <MotionDiv
              className="rounded-[30px] border border-slate-200/70 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-700 p-6 text-white shadow-[0_22px_70px_rgba(15,23,42,0.22)]"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 5.5, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
            >
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/70">Realtime Update</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">System activity remains stable.</h2>
              <div className="mt-6 rounded-[26px] border border-white/10 bg-white/10 p-4 backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <span className="text-sm uppercase tracking-[0.24em] text-white/70">Live sync</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${liveTick ? 'bg-emerald-400/20 text-emerald-100' : 'bg-white/10 text-white/70'}`}>
                    {liveTick ? 'Connected' : 'Refreshing'}
                  </span>
                </div>
                <p className="mt-4 text-sm leading-7 text-white/80">{systemEvent}</p>
              </div>
            </MotionDiv>
          </div>
        </MotionDiv>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Total Users', value: totalUsers, suffix: '' },
            { label: 'Total Courses', value: totalCourses, suffix: '' },
            { label: 'Active Students', value: activeStudents, suffix: '' },
            { label: 'Revenue', value: revenue, suffix: '$' }
          ].map((item, index) => (
            <MotionDiv
              key={item.label}
              className="rounded-[28px] border border-white/70 bg-white/85 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)]"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">KPI Counter</p>
              <p className="mt-3 text-sm font-medium text-slate-500">{item.label}</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                {item.suffix}
                {index === 3 ? `${(item.value / 1000).toFixed(1)}k` : item.value.toLocaleString()}
              </p>
              <p className="mt-2 text-sm text-emerald-600">{metrics[index].delta}</p>
            </MotionDiv>
          ))}
        </section>

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
                          className="w-full max-w-[42px] rounded-t-[20px] bg-gradient-to-t from-sky-500 via-indigo-500 to-violet-500 shadow-[0_14px_30px_rgba(99,102,241,0.18)]"
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
                      <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                        <MotionDiv
                          className={`h-full rounded-full ${item.tone === 'emerald' ? 'bg-gradient-to-r from-emerald-500 to-cyan-400' : item.tone === 'sky' ? 'bg-gradient-to-r from-sky-500 to-indigo-500' : item.tone === 'violet' ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500' : 'bg-gradient-to-r from-amber-500 to-orange-500'}`}
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
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{item.label}</p>
                    <p className="mt-3 text-2xl font-semibold text-slate-950">{item.value}</p>
                    <div className={`mt-4 h-2 rounded-full bg-gradient-to-r ${item.tone}`} />
                  </MotionDiv>
                ))}
              </div>
            </ChartCard>
          </div>

          <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
            <MotionDiv
              className="rounded-[30px] border border-white/70 bg-white/85 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] sm:p-6"
              whileHover={{ y: -4 }}
              transition={{ duration: 0.18 }}
            >
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Realtime Update</p>
              <h3 className="mt-2 text-2xl font-semibold text-slate-950">Platform pulse</h3>
              <div className="mt-4 space-y-3 rounded-[26px] border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-600">
                <p>• 126 new users joined in the last 24 hours.</p>
                <p>• 18 course updates were processed today.</p>
                <p>• 4 revenue spikes detected from enterprise plans.</p>
              </div>
            </MotionDiv>

            <MotionDiv
              className="rounded-[30px] border border-white/70 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-700 p-6 text-white shadow-[0_22px_70px_rgba(15,23,42,0.22)]"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 5.5, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
            >
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/70">System Health</p>
              <h3 className="mt-3 text-2xl font-semibold tracking-tight">Infrastructure stable</h3>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                {[
                  { label: 'Load balancer', value: '99.98%' },
                  { label: 'Queue latency', value: '12ms' },
                  { label: 'Database', value: 'Healthy' },
                  { label: 'Edge cache', value: 'Warm' }
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-white/10 bg-white/10 px-4 py-4 backdrop-blur-md">
                    <p className="text-xs uppercase tracking-[0.24em] text-white/70">{item.label}</p>
                    <p className="mt-2 text-lg font-semibold">{item.value}</p>
                  </div>
                ))}
              </div>
            </MotionDiv>

            <MotionDiv className="rounded-[30px] border border-white/70 bg-white/85 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] sm:p-6" whileHover={{ y: -4 }} transition={{ duration: 0.18 }}>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Revenue Analytics Snapshot</p>
              <div className="mt-4 rounded-[26px] bg-slate-50 p-4">
                <div className="flex items-end justify-between gap-3">
                  {[38, 55, 49, 68, 63].map((value, index) => (
                    <MotionDiv
                      key={index}
                      className="w-full rounded-t-[18px] bg-gradient-to-t from-emerald-500 via-cyan-500 to-sky-500"
                      initial={{ height: 0 }}
                      animate={{ height: `${value}%` }}
                      transition={{ duration: 0.8, delay: index * 0.06 }}
                      style={{ minHeight: 18 }}
                    />
                  ))}
                </div>
              </div>
            </MotionDiv>

            <AnimatePresence>
              {liveTick ? (
                <motion.div
                  className="rounded-[28px] border border-emerald-200 bg-white/90 px-4 py-3 text-sm font-semibold text-emerald-700 shadow-[0_20px_60px_rgba(15,23,42,0.12)] backdrop-blur-xl"
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.98 }}
                  transition={{ duration: 0.22 }}
                >
                  Realtime update: platform metrics refreshed successfully.
                </motion.div>
              ) : null}
            </AnimatePresence>
          </aside>
        </section>
      </div>
    </div>
  );
};

const ChartCard: React.FC<{ title: string; subtitle: string; children: React.ReactNode }> = ({ title, subtitle, children }) => (
  <MotionDiv
    className="rounded-[30px] border border-white/70 bg-white/85 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-6"
    initial={{ opacity: 0, y: 14 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, ease: 'easeOut' }}
  >
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">{subtitle}</p>
        <h3 className="mt-2 text-2xl font-semibold text-slate-950">{title}</h3>
      </div>
      <div className="rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500">Animated Charts</div>
    </div>
    <div className="mt-5">{children}</div>
  </MotionDiv>
);

export default AdminDashboard;