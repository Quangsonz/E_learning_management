import React, { useEffect, useState } from 'react';
import { MotionProps, motion } from 'framer-motion';
import { EmptyState, SkeletonCard } from '../components/ui/StateViews';

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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.22),transparent_26%),radial-gradient(circle_at_top_right,_rgba(168,85,247,0.16),transparent_24%),linear-gradient(180deg,#eef7ff_0%,#f7f8ff_38%,#f4f7fb_100%)] text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <header className="relative overflow-hidden rounded-[32px] border border-white/70 bg-white/70 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-2xl sm:p-8">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.9),rgba(255,255,255,0.45))]" aria-hidden="true" />
          <div className="relative grid gap-6 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">
                Welcome Banner
              </div>
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
                <button className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-300">
                  Continue Learning
                </button>
                <button className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200">
                  Explore Courses
                </button>
              </div>
            </div>

            <MotionDiv
              className="relative mx-auto flex w-full max-w-xs items-center justify-center"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 5.5, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
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
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Continue Learning</p>
                <p className="mt-2 text-4xl font-semibold text-slate-950">{learningRing.value}%</p>
                <p className="mt-1 text-sm text-slate-500">Module completion</p>
              </div>
            </MotionDiv>
          </div>
        </header>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="space-y-6">
            <MotionDiv
              className="rounded-[28px] border border-white/70 bg-white/75 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl"
              initial={false}
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 6, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Learning Statistics</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-950">Your learning rhythm this week</h2>
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
                    className="rounded-3xl border border-slate-200/70 bg-gradient-to-br from-white to-slate-50 p-5 shadow-sm"
                    initial={false}
                    animate={{ y: [0, index % 2 === 0 ? -6 : -3, 0] }}
                    transition={{ duration: 4 + index * 0.4, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
                  >
                    <p className="text-sm font-medium text-slate-500">{item.label}</p>
                    <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{item.value}</p>
                    <p className="mt-2 text-sm text-slate-600">{item.delta}</p>
                  </MotionDiv>
                ))}
              </div>
            </MotionDiv>

            <section className="grid gap-6 lg:grid-cols-2">
              <MotionDiv
                className="rounded-[28px] border border-white/70 bg-white/75 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl"
                whileHover={{ y: -8, scale: 1.01 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">My Courses</p>
                    <h2 className="mt-2 text-2xl font-semibold text-slate-950">Pick up where you left off</h2>
                  </div>
                  <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">3 active</span>
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
                        <div key={course.title} className="rounded-3xl border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300 hover:bg-white">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{course.category}</p>
                              <h3 className="mt-2 text-lg font-semibold text-slate-950">{course.title}</h3>
                            </div>
                            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">{course.lesson}</span>
                          </div>
                          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
                            <MotionDiv
                              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-indigo-500"
                              initial={{ width: 0 }}
                              animate={{ width: `${course.progress}%` }}
                              transition={{ duration: 1.1, delay: index * 0.15 }}
                            />
                          </div>
                          <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
                            <span>{course.progress}% complete</span>
                            <span className="font-semibold text-slate-900">Resume</span>
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
              </MotionDiv>

              <MotionDiv
                className="rounded-[28px] border border-white/70 bg-gradient-to-br from-slate-950 to-slate-800 p-6 text-white shadow-[0_20px_60px_rgba(15,23,42,0.18)]"
                whileHover={{ y: -8, scale: 1.01 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/60">Upcoming Quiz</p>
                    <h2 className="mt-2 text-2xl font-semibold">{upcomingQuiz.title}</h2>
                  </div>
                  <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
                    {upcomingQuiz.time}
                  </span>
                </div>

                <div className="mt-6 rounded-[24px] border border-white/10 bg-white/6 p-5 backdrop-blur-xl">
                  <p className="text-base leading-7 text-white/75">{upcomingQuiz.subtitle}</p>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {['Multiple choice', 'Timed challenge', 'Instant feedback', 'Save progress'].map((item) => (
                      <div key={item} className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-sm text-white/85">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-white/30">
                    Start quiz
                  </button>
                  <button className="rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/15 focus:outline-none focus:ring-4 focus:ring-white/20">
                    Review notes
                  </button>
                </div>
              </MotionDiv>
            </section>
          </div>

          <aside className="space-y-6">
            <MotionDiv
              className="rounded-[28px] border border-white/70 bg-white/75 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl"
              whileHover={{ y: -6 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Recent Activities</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-950">What happened today</h2>
                </div>
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">Live</span>
              </div>
              <div className="mt-6 space-y-4">
                {activities.map((activity) => (
                  <div key={activity.title} className="rounded-3xl border border-slate-200 bg-slate-50 p-4 transition hover:bg-white">
                    <div className="flex items-start gap-4">
                      <div className="mt-1 h-3 w-3 rounded-full bg-gradient-to-br from-cyan-500 to-indigo-500" aria-hidden="true" />
                      <div>
                        <h3 className="font-semibold text-slate-950">{activity.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{activity.detail}</p>
                        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{activity.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </MotionDiv>

            <MotionDiv
              className="rounded-[28px] border border-white/70 bg-gradient-to-br from-emerald-500 via-cyan-500 to-sky-600 p-6 text-white shadow-[0_24px_70px_rgba(14,165,233,0.25)]"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 5.8, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
            >
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/75">Floating Stats</p>
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
            </MotionDiv>
          </aside>
        </section>
      </div>
    </div>
  );
};

export default Home;
