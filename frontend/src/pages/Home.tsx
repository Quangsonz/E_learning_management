import React, { useEffect, useState } from 'react';
import { MotionProps, motion } from 'framer-motion';
import { Button, EmptyState, PageShell, SkeletonCard, GlassPanel } from '../components/ui';
import { floatY } from '../animations/motionVariants';

type Course = {
  title: string;
  category: string;
  progress: number;
  lesson: string;
};

type Activity = {
  title: string;
  detail: string;
  time: string;
};

type Quiz = {
  title: string;
  subtitle: string;
  time: string;
};

const courses: Course[] = [
  { title: 'UI Design Foundations', category: 'Design', progress: 72, lesson: 'Lesson 8 of 12' },
  { title: 'React for Product Teams', category: 'Frontend', progress: 48, lesson: 'Lesson 5 of 10' },
  { title: 'Learning Analytics', category: 'Data', progress: 85, lesson: 'Lesson 11 of 13' }
];

const activities: Activity[] = [
  { title: 'Completed Color Systems', detail: 'You finished a module in UI Design Foundations.', time: '12 min ago' },
  { title: 'Quiz score improved', detail: 'Your latest React quiz score increased to 92%.', time: '45 min ago' },
  { title: 'Joined study streak', detail: 'You kept your learning streak alive for 7 days.', time: 'Today' }
];

const upcomingQuiz: Quiz = {
  title: 'React Components Quiz',
  subtitle: 'Covers props, state, effects, and component composition.',
  time: 'Tomorrow, 8:30 AM'
};

const stats = [
  { label: 'Study streak', value: '7 days', delta: '+2 from last week' },
  { label: 'Courses active', value: '3', delta: '1 due this week' },
  { label: 'Average score', value: '91%', delta: 'Top 8% of learners' },
  { label: 'Focus time', value: '14h', delta: '+3h this month' }
];

const learningRing = {
  size: 168,
  stroke: 12,
  value: 72
};

const MotionDiv = motion.div as unknown as React.FC<
  React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement> & MotionProps>
>;

const Home: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsLoading(false), 1200);
    return () => window.clearTimeout(timer);
  }, []);

  const radius = (learningRing.size - learningRing.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (learningRing.value / 100) * circumference;

  return (
    <PageShell>
        <header className="relative overflow-hidden rounded-[var(--radius-panel)] border border-white/70 bg-white/70 p-6 shadow-elev-3 backdrop-blur-2xl sm:p-8">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.9),rgba(255,255,255,0.45))]" aria-hidden="true" />
          <div className="relative grid gap-6 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
            <div className="space-y-5">
              <div className="badge">Welcome back</div>
              <div>
                <p className="text-sm font-medium text-slate-500">Good morning, Lan</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                  Keep the momentum going and finish your next learning milestone.
                </h1>
              </div>
              <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                A focused dashboard inspired by Coursera structure, Duolingo energy, and Notion clarity, designed to make learning feel rewarding.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button variant="pill">Continue Learning</Button>
                <Button variant="outline">Explore Courses</Button>
              </div>
            </div>

            <MotionDiv
              className="relative mx-auto flex w-full max-w-xs items-center justify-center"
              animate={floatY(8, 5.5)}
            >
              <div className="absolute h-40 w-40 rounded-full bg-cyan-300/20 blur-3xl" aria-hidden="true" />
              <svg viewBox={`0 0 ${learningRing.size} ${learningRing.size}`} className="relative h-44 w-44 -rotate-90 sm:h-52 sm:w-52" aria-label="Animated progress ring">
                <circle
                  cx={learningRing.size / 2}
                  cy={learningRing.size / 2}
                  r={radius}
                  fill="none"
                  stroke="rgba(148,163,184,0.22)"
                  strokeWidth={learningRing.stroke}
                />
                <motion.circle
                  cx={learningRing.size / 2}
                  cy={learningRing.size / 2}
                  r={radius}
                  fill="none"
                  stroke="url(#ringGradient)"
                  strokeLinecap="round"
                  strokeWidth={learningRing.stroke}
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset: dashOffset }}
                  transition={{ duration: 1.3, ease: [0.4, 0, 0.2, 1] }}
                />
                <defs>
                  <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#22c55e" />
                    <stop offset="45%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute text-center">
                <p className="section-label">Continue</p>
                <p className="mt-1 text-4xl font-semibold text-slate-950">{learningRing.value}%</p>
              </div>
            </MotionDiv>
          </div>
        </header>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="space-y-6">
            <GlassPanel
              motionProps={{
                initial: false,
                animate: { y: [0, -4, 0] },
                transition: { duration: 6, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }
              }}
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="section-label">Learning Statistics</p>
                  <h2 className="mt-2 section-title">Your learning rhythm this week</h2>
                </div>
                <div className="hidden rounded-2xl bg-emerald-50 px-4 py-3 text-right sm:block">
                  <p className="text-xs uppercase tracking-[0.24em] text-emerald-600">Floats up</p>
                  <p className="mt-1 text-sm font-semibold text-slate-700">+18% engagement</p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {stats.map((item, index) => (
                  <MotionDiv
                    key={item.label}
                    className="kpi-card"
                    initial={false}
                    animate={{ y: [0, index % 2 === 0 ? -6 : -3, 0] }}
                    transition={{ duration: 4 + index * 0.4, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
                  >
                    <p className="kpi-label">{item.label}</p>
                    <p className="mt-3 kpi-value">{item.value}</p>
                    <p className="mt-2 kpi-delta">{item.delta}</p>
                  </MotionDiv>
                ))}
              </div>
            </GlassPanel>

            <section className="grid gap-6 lg:grid-cols-2">
              <GlassPanel hover>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="section-label">My Courses</p>
                    <h2 className="mt-2 section-title">Pick up where you left off</h2>
                  </div>
                  <span className="badge">3 active</span>
                </div>

                <div className="mt-6 space-y-4">
                  {isLoading ? (
                    <div className="grid gap-4">
                      <SkeletonCard />
                      <SkeletonCard />
                      <SkeletonCard />
                    </div>
                  ) : courses.length > 0 ? (
                    courses.map((course, index) => (
                        <div key={course.title} className="card interactive p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="section-label">{course.category}</p>
                              <h3 className="mt-2 text-lg font-semibold text-slate-950">{course.title}</h3>
                            </div>
                            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm border border-slate-200">{course.lesson}</span>
                          </div>
                          <div className="progress-track mt-4">
                            <MotionDiv
                              className="progress-fill"
                              initial={{ width: 0 }}
                              animate={{ width: `${course.progress}%` }}
                              transition={{ type: 'spring', stiffness: 200, damping: 25, delay: index * 0.15 }}
                            />
                          </div>
                          <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
                            <span>{course.progress}% complete</span>
                            <span className="font-semibold text-primary-600">Resume</span>
                          </div>
                        </div>
                      ))
                  ) : (
                    <EmptyState
                      title="No active courses"
                      message="There are no courses in progress right now. Once learning starts, this section will show progress and continue actions."
                    />
                  )}
                </div>
              </GlassPanel>

              <GlassPanel variant="dark" hover>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="section-label !text-white/60">Upcoming Quiz</p>
                    <h2 className="mt-2 text-2xl font-semibold">{upcomingQuiz.title}</h2>
                  </div>
                  <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
                    {upcomingQuiz.time}
                  </span>
                </div>

                <div className="mt-6 rounded-[24px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
                  <p className="text-base leading-7 text-white/75">{upcomingQuiz.subtitle}</p>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {['Multiple choice', 'Timed challenge', 'Instant feedback', 'Save progress'].map((item) => (
                      <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/85">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Button variant="pill" className="!bg-white !text-slate-950 hover:!bg-slate-100">
                    Start quiz
                  </Button>
                  <Button variant="outline" className="!border-white/15 !bg-white/10 !text-white hover:!bg-white/15">
                    Review notes
                  </Button>
                </div>
              </GlassPanel>
            </section>
          </div>

          <aside className="space-y-6">
            <GlassPanel hover>
              <div className="flex items-center justify-between">
                <div>
                  <p className="section-label">Recent Activities</p>
                  <h2 className="mt-2 section-title">What happened today</h2>
                </div>
                <span className="status-badge status-badge-warning">Live</span>
              </div>
              <div className="mt-6 space-y-4">
                {activities.map((activity) => (
                  <div key={activity.title} className="card interactive p-4">
                    <div className="flex items-start gap-4">
                      <div className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-primary-500 shadow-sm" aria-hidden="true" />
                      <div>
                        <h3 className="font-semibold text-slate-950">{activity.title}</h3>
                        <p className="mt-1 text-sm leading-6 text-slate-600">{activity.detail}</p>
                        <p className="mt-2 text-xs font-medium text-slate-400">{activity.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </GlassPanel>

            <GlassPanel variant="dark" motionProps={{ animate: { y: [0, -6, 0] }, transition: { duration: 5.8, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' } }}>
              <p className="section-label !text-white/70">Floating Stats</p>
              <h2 className="mt-2 text-2xl font-semibold">You are ahead of last week</h2>
              <p className="mt-3 text-sm leading-6 text-white/85">
                Consistency is building. Keep the streak alive and the dashboard will stay bright, calm, and motivating.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                {['+18% focus', '7-day streak', '92% quiz avg', '3 active tracks'].map((item) => (
                  <div key={item} className="rounded-2xl border border-white/15 bg-white/10 px-4 py-4 text-sm font-medium backdrop-blur-md">
                    {item}
                  </div>
                ))}
              </div>
            </GlassPanel>
          </aside>
        </section>
    </PageShell>
  );
};

export default Home;
