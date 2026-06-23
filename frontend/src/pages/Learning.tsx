import React, { useMemo, useState } from 'react';
import { motion, MotionProps } from 'framer-motion';
import {
  Button,
  CanvasHero,
  InsightCallout,
  LoadingScreen,
  LiveIndicator,
  MetricsSurface,
  PageShell,
  SectionLead,
  Toast
} from '../components/ui';
import useSimulatedLoading from '../hooks/useSimulatedLoading';
import { floatY } from '../animations/motionVariants';

type Lesson = {
  id: number;
  title: string;
  duration: string;
  completed?: boolean;
};

type Module = {
  id: number;
  title: string;
  lessons: Lesson[];
};

type Resource = {
  title: string;
  type: string;
};

const MotionDiv = motion.div as unknown as React.FC<React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement> & MotionProps>>;

const modules: Module[] = [
  {
    id: 1,
    title: 'Getting Started',
    lessons: [
      { id: 101, title: 'Welcome and learning goals', duration: '08:00', completed: true },
      { id: 102, title: 'How the platform is structured', duration: '12:30', completed: true },
      { id: 103, title: 'Setup your workflow', duration: '15:20' }
    ]
  },
  {
    id: 2,
    title: 'Core Practice',
    lessons: [
      { id: 201, title: 'Watch and take notes', duration: '18:10' },
      { id: 202, title: 'Practice with guided tasks', duration: '22:15' },
      { id: 203, title: 'Knowledge check', duration: '10:05' }
    ]
  },
  {
    id: 3,
    title: 'Advanced Strategy',
    lessons: [
      { id: 301, title: 'Optimize your learning system', duration: '19:40' },
      { id: 302, title: 'Build a personal study plan', duration: '16:25' }
    ]
  }
];

const resources: Resource[] = [
  { title: 'Lesson slides PDF', type: 'PDF' },
  { title: 'Design notes template', type: 'DOC' },
  { title: 'Practice checklist', type: 'TXT' },
  { title: 'Community discussion', type: 'LINK' }
];

const lessonMetrics = [
  { label: 'Completed lessons', value: '12' },
  { label: 'Focus streak', value: '7 days' },
  { label: 'Achievement level', value: 'Gold' }
];

const notesSeed = [
  'Focus on the learning objective before each session.',
  'Pause the video and write one insight per lesson.',
  'Use the resources panel to save reference materials.'
];

const Learning: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedLessonId, setSelectedLessonId] = useState(103);
  const [progress, setProgress] = useState(58);
  const [showAchievement, setShowAchievement] = useState(false);
  const [notes, setNotes] = useState(notesSeed.join('\n'));
  const isLoading = useSimulatedLoading(750);

  const selectedLesson = useMemo(() => {
    for (const module of modules) {
      const lesson = module.lessons.find((item) => item.id === selectedLessonId);
      if (lesson) return lesson;
    }

    return modules[0].lessons[0];
  }, [selectedLessonId]);

  const completeLesson = () => {
    setProgress((current) => Math.min(100, current + 8));
    setShowAchievement(true);
    window.setTimeout(() => setShowAchievement(false), 2600);
  };

  if (isLoading) {
    return (
      <PageShell wide>
        <LoadingScreen title="Loading learning space" message="Preparing lessons, video player, and study resources..." />
      </PageShell>
    );
  }

  return (
    <PageShell wide>
      <CanvasHero
        eyebrow="Your Learning Space"
        title="Professional learning space with focus, flow, and momentum."
        description="A structured study interface with course content, lesson tree, video player, notes, resources, and achievement feedback to optimize learning."
        glow="cool"
        actions={
          <button
            type="button"
            onClick={() => setIsSidebarCollapsed((current) => !current)}
            className="rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
          >
            {isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          </button>
        }
        aside={
          <MotionDiv
            className="relative mx-auto flex w-full max-w-[180px] shrink-0 items-center justify-center lg:-ml-16 lg:mr-2 xl:-ml-20"
            animate={floatY(5, 5)}
          >
            <div
              className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-br from-emerald-300/20 via-cyan-300/15 to-indigo-400/15 blur-2xl"
              aria-hidden="true"
            />
            <div className="relative text-right">
              <p className="section-label">Progress</p>
              <motion.p
                className="mt-1 text-4xl font-semibold tabular-nums tracking-tight text-slate-950 dark:text-white"
                key={progress}
                initial={{ opacity: 0.6, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 24 }}
              >
                {progress}%
              </motion.p>
            </div>
          </MotionDiv>
        }
      />

      <div className="mt-8 grid gap-10 xl:grid-cols-[minmax(0,0.26fr)_minmax(0,1fr)_minmax(0,0.28fr)] xl:gap-8">
        <MotionDiv
          className={`xl:sticky xl:top-6 xl:self-start ${isSidebarCollapsed ? 'hidden xl:block xl:w-24' : ''}`}
          animate={{ width: isSidebarCollapsed ? 96 : '100%' }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        >
          <SectionLead
            label="Course Content"
            title="Curriculum"
            size="md"
            meta={
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
                <LiveIndicator />
                Live
              </span>
            }
          />

          <div className="mt-5">
            {modules.map((module, moduleIndex) => (
              <div key={module.id} className="py-5 first:pt-0">
                {!isSidebarCollapsed ? (
                  <>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                          Module {moduleIndex + 1}
                        </p>
                        <h3 className="mt-1.5 text-base font-semibold text-slate-950 dark:text-white">{module.title}</h3>
                      </div>
                      <span className="badge !border-slate-300">{module.lessons.length}</span>
                    </div>

                    <div className="mt-4 space-y-1">
                      {module.lessons.map((lesson) => {
                        const isActive = lesson.id === selectedLessonId;

                        return (
                          <button
                            key={lesson.id}
                            type="button"
                            onClick={() => setSelectedLessonId(lesson.id)}
                            className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-3 text-left transition focus:outline-none focus:ring-4 focus:ring-indigo-500/10 ${
                              isActive
                                ? 'border-indigo-200 bg-indigo-50 dark:bg-indigo-900/30 dark:border-indigo-700/50 text-indigo-800 dark:text-indigo-200'
                                : 'border-transparent text-slate-700 dark:text-slate-200 hover:border-slate-100 dark:hover:border-slate-700/50 hover:bg-slate-50/80 dark:hover:bg-slate-800/50'
                            }`}
                          >
                            <div>
                              <p className="text-sm font-medium">{lesson.title}</p>
                              <p className={`mt-1 text-xs ${isActive ? 'text-white/70' : 'text-slate-500 dark:text-slate-400'}`}>
                                {lesson.duration}
                              </p>
                            </div>
                            <div
                              className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] ${
                                lesson.completed
                                  ? isActive
                                    ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'
                                    : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400'
                                  : isActive
                                    ? 'bg-indigo-100/60 dark:bg-indigo-900/30 text-indigo-500 dark:text-indigo-400'
                                    : 'bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400'
                              }`}
                            >
                              {lesson.completed ? 'Done' : 'Open'}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-3 py-2">
                    <div className="rounded-2xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white">C</div>
                    <p className="text-center text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                      Collapsed
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </MotionDiv>

        <main className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionLead
              label="Video Player"
              title={selectedLesson.title}
              size="md"
              meta={
                <span className="text-sm text-slate-500 dark:text-slate-400">Duration: {selectedLesson.duration}</span>
              }
            />
            <Button
              variant="pill"
              className="!bg-emerald-600 hover:!bg-emerald-500"
              onClick={completeLesson}
            >
              Mark complete
            </Button>
          </div>

          <div className="overflow-hidden rounded-[28px] bg-slate-950 shadow-elev-2">
            <motion.div
              className="relative aspect-video"
              layoutId="course-hero-video"
              whileHover={{ scale: 1.01 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.2),transparent_24%),linear-gradient(135deg,rgba(15,23,42,0.9),rgba(14,165,233,0.45),rgba(168,85,247,0.45))]" />
              <div className="absolute inset-0 flex cursor-pointer items-center justify-center">
                <div className="flex h-24 w-24 items-center justify-center rounded-full border border-white/20 bg-white/15 dark:bg-white/10 text-white shadow-elev-3 backdrop-blur-md transition hover:scale-110">
                  <span className="ml-1 text-3xl">▶</span>
                </div>
              </div>
              <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4 text-white">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-white/70">Progress Animation</p>
                  <p className="mt-2 text-lg font-semibold">Stay focused, finish lessons, and track your growth.</p>
                </div>
                <div className="rounded-2xl bg-white/15 dark:bg-white/10 px-4 py-3 text-right backdrop-blur-md">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-white/70">Current</p>
                  <p className="mt-1 text-sm font-semibold">Lesson 03</p>
                </div>
              </div>
            </motion.div>
          </div>

          <div>
            <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
              <span>Course progress</span>
              <span className="font-semibold text-slate-900 dark:text-white">{progress}%</span>
            </div>
            <div className="progress-track mt-3">
              <motion.div
                className="progress-fill"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ type: 'spring', stiffness: 200, damping: 25 }}
              />
            </div>
          </div>

          <MetricsSurface
            metrics={lessonMetrics}
            className="!mt-0 [&>div]:lg:grid-cols-3"
            delay={0.25}
          />

          <div className="space-y-5 pt-2">
            <InsightCallout
              title="Finish tasks and unlock momentum"
              description="Completing a lesson updates progress, gives instant feedback, and keeps learners engaged with a subtle success state."
            />
            <MotionDiv
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.45 }}
            >
              <p className="section-label">Learning Tips</p>
              <h3 className="mt-1.5 text-lg font-semibold text-slate-950 dark:text-white">Keep your flow sharp</h3>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                <li>Pause, write one note, then continue the lesson.</li>
                <li>Use the resources panel to save references.</li>
                <li>Mark lessons complete to maintain momentum.</li>
              </ul>
              <Button type="button" variant="pill" className="mt-4" onClick={completeLesson}>
                Complete this lesson
              </Button>
            </MotionDiv>
          </div>
        </main>

        <aside className="space-y-10 xl:sticky xl:top-6 xl:self-start">
          <section>
            <SectionLead label="Notes" title="Capture key ideas" size="md" />
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="mt-4 min-h-[240px] w-full rounded-2xl border border-slate-200/70 dark:border-slate-700/50 bg-slate-50/80 dark:bg-slate-800/30 p-4 text-sm leading-7 text-slate-700 dark:text-slate-200 outline-none transition focus:border-primary-400 focus:bg-white dark:focus:bg-slate-900/50 focus:ring-4 focus:ring-primary-500/10"
              aria-label="Learning notes"
            />
          </section>

          <section>
            <SectionLead label="Resources" title="Keep reference files close" size="md" />
            <div className="mt-4 divide-y divide-slate-200/70">
              {resources.map((resource) => (
                <button
                  key={resource.title}
                  type="button"
                  className="group flex w-full items-center justify-between gap-3 py-4 text-left transition first:pt-0 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 sm:-mx-2 sm:px-2 sm:rounded-lg"
                >
                  <div>
                    <p className="font-semibold text-slate-950 dark:text-white transition-colors group-hover:text-primary-600 dark:group-hover:text-primary-400">
                      {resource.title}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">{resource.type}</p>
                  </div>
                  <span className="text-xs font-semibold text-slate-400 transition-colors group-hover:text-primary-600">
                    Open →
                  </span>
                </button>
              ))}
            </div>
          </section>
        </aside>
      </div>

      <Toast
        visible={showAchievement}
        title="Lesson completed"
        message="You just earned a momentum boost. Keep going to unlock the next level."
        variant="success"
        position="top-right"
      />
    </PageShell>
  );
};

export default Learning;
