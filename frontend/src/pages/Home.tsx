import React, { useEffect, useState } from 'react';
import { MotionProps, motion } from 'framer-motion';
import {
  ActivityStream,
  Button,
  CanvasHero,
  EmptyState,
  GlassPanel,
  InsightCallout,
  LiveIndicator,
  MetricsSurface,
  PageShell,
  SectionLead,
  SkeletonCard
} from '../components/ui';
import { floatY, staggerContainer, staggerItem } from '../animations/motionVariants';

type Course = {
  title: string;
  category: string;
  progress: number;
  lesson: string;
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

const activities = [
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
  { label: 'Study Streak', value: '7 days' },
  { label: 'Average Score', value: '91%' },
  { label: 'Focus Time', value: '14h' },
  { label: 'Courses Active', value: '3' }
];

const heroFloatStats = [
  { label: '+18% focus', position: 'top-0 -left-6 sm:-left-10' },
  { label: '92% quiz avg', position: 'top-6 -right-4 sm:-right-8' },
  { label: '3 active tracks', position: 'bottom-8 -left-2 sm:-left-6' }
];

const learningRing = { size: 148, stroke: 10, value: 72 };

const MotionDiv = motion.div as unknown as React.FC<
  React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement> & MotionProps>
>;

const ProgressRing: React.FC<{ value: number; size: number; stroke: number }> = ({ value, size, stroke }) => {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (value / 100) * circumference;

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="relative h-36 w-36 -rotate-90 sm:h-40 sm:w-40" aria-label="Learning progress">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(148,163,184,0.18)" strokeWidth={stroke} />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="url(#ringGradient)"
        strokeLinecap="round"
        strokeWidth={stroke}
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
  );
};

const Home: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsLoading(false), 1200);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <PageShell wide>
      <CanvasHero
        badge={<div className="badge">Welcome back</div>}
        eyebrow="Good morning, Lan"
        title="Keep the momentum going and finish your next learning milestone."
        description="A focused dashboard inspired by Coursera structure, Duolingo energy, and Notion clarity."
        actions={
          <>
            <Button variant="pill">Continue Learning</Button>
            <Button variant="outline">Explore Courses</Button>
          </>
        }
        aside={
          <MotionDiv
            className="relative mx-auto flex w-full max-w-[220px] shrink-0 items-center justify-center lg:-ml-20 lg:mr-4 xl:-ml-28"
            animate={floatY(6, 5.5)}
          >
            <div
              className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-br from-emerald-300/25 via-cyan-300/20 to-indigo-400/20 blur-2xl"
              aria-hidden="true"
            />
            {heroFloatStats.map((item, index) => (
              <MotionDiv
                key={item.label}
                className={`absolute ${item.position} z-30 whitespace-nowrap rounded-full bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-[0_4px_24px_rgba(99,102,241,0.12)] backdrop-blur-md`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + index * 0.1, duration: 0.4 }}
              >
                {item.label}
              </MotionDiv>
            ))}
            <div className="relative flex items-center justify-center">
              <ProgressRing value={learningRing.value} size={learningRing.size} stroke={learningRing.stroke} />
              <div className="absolute text-center">
                <p className="section-label !text-[0.65rem]">Continue</p>
                <p className="mt-0.5 text-3xl font-semibold tabular-nums text-slate-950">{learningRing.value}%</p>
              </div>
            </div>
          </MotionDiv>
        }
      />

      <MetricsSurface metrics={stats} />

      <section className="mt-8 grid gap-10 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,0.72fr)] xl:gap-12">
        <div className="space-y-10">
          <MotionDiv variants={staggerContainer} initial="initial" animate="animate">
            <SectionLead label="My Courses" title="Pick up where you left off" meta={<span className="text-sm tabular-nums text-slate-400">3 active</span>} />

            <div className="mt-5">
              {isLoading ? (
                <div className="space-y-4">
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </div>
              ) : courses.length > 0 ? (
                <div className="divide-y divide-slate-200/70">
                  {courses.map((course, index) => (
                    <MotionDiv
                      key={course.title}
                      variants={staggerItem}
                      className="group cursor-pointer py-5 transition-colors duration-200 first:pt-0 hover:bg-slate-50/60 sm:-mx-3 sm:rounded-xl sm:px-3"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{course.category}</p>
                          <h3 className="mt-1 text-lg font-semibold text-slate-950 transition-colors group-hover:text-primary-600">
                            {course.title}
                          </h3>
                        </div>
                        <span className="shrink-0 text-xs font-medium text-slate-400">{course.lesson}</span>
                      </div>
                      <div className="progress-track mt-3.5">
                        <MotionDiv
                          className="progress-fill"
                          initial={{ width: 0 }}
                          animate={{ width: `${course.progress}%` }}
                          transition={{ type: 'spring', stiffness: 200, damping: 25, delay: index * 0.12 }}
                        />
                      </div>
                      <div className="mt-2.5 flex items-center justify-between text-sm">
                        <span className="tabular-nums text-slate-500">{course.progress}% complete</span>
                        <span className="font-semibold text-primary-600 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                          Resume →
                        </span>
                      </div>
                    </MotionDiv>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No active courses"
                  message="There are no courses in progress right now. Once learning starts, this section will show progress and continue actions."
                />
              )}
            </div>
          </MotionDiv>

          <GlassPanel variant="dark" padding="lg" className="!shadow-[0_24px_64px_rgba(15,23,42,0.18)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="section-label !text-white/55">Upcoming Quiz</p>
                <h2 className="mt-1.5 text-xl font-semibold sm:text-2xl">{upcomingQuiz.title}</h2>
              </div>
              <span className="text-sm font-medium text-white/60">{upcomingQuiz.time}</span>
            </div>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/70 sm:text-base">{upcomingQuiz.subtitle}</p>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/75">
              {['Multiple choice', 'Timed challenge', 'Instant feedback', 'Save progress'].map((item) => (
                <span key={item} className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-emerald-400" aria-hidden="true" />
                  {item}
                </span>
              ))}
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
        </div>

        <aside className="xl:pt-1">
          <SectionLead label="Recent Activity" title="What happened today" meta={<LiveIndicator />} />
          <ActivityStream items={activities} className="mt-6" />
          <InsightCallout
            className="mt-10"
            title="You are ahead of last week"
            description="Consistency is building. Keep the streak alive and the dashboard stays bright, calm, and motivating."
          />
        </aside>
      </section>
    </PageShell>
  );
};

export default Home;
