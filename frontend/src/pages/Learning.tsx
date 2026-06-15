import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion, MotionProps } from 'framer-motion';

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

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),transparent_24%),radial-gradient(circle_at_top_right,_rgba(168,85,247,0.15),transparent_24%),linear-gradient(180deg,#f8fbff_0%,#eef4fb_100%)] text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <MotionDiv
          className="rounded-[34px] border border-white/70 bg-white/75 p-6 shadow-[0_24px_90px_rgba(15,23,42,0.08)] backdrop-blur-2xl sm:p-8"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
        >
          <div className="flex flex-col gap-4 border-b border-slate-200/70 pb-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Learning Page</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                Professional learning space with focus, flow, and momentum.
              </h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
                A structured study interface with course content, lesson tree, video player, notes, resources, and achievement feedback to optimize learning.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-right">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Progress</p>
                <p className="mt-1 text-2xl font-semibold text-slate-950">{progress}%</p>
              </div>
              <button
                type="button"
                onClick={() => setIsSidebarCollapsed((current) => !current)}
                className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
              >
                {isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[0.26fr_1fr_0.28fr]">
            <MotionDiv
              className={`xl:sticky xl:top-6 xl:self-start ${isSidebarCollapsed ? 'hidden xl:block xl:w-24' : ''}`}
              animate={{ width: isSidebarCollapsed ? 96 : '100%' }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <div className="rounded-[30px] border border-slate-200 bg-white/85 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Course Content</p>
                    {!isSidebarCollapsed ? <h2 className="mt-2 text-xl font-semibold text-slate-950">Course Content</h2> : null}
                  </div>
                  <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Live</div>
                </div>

                <div className="mt-5 space-y-4">
                  {modules.map((module, moduleIndex) => (
                    <div key={module.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      {!isSidebarCollapsed ? (
                        <>
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Module {moduleIndex + 1}</p>
                              <h3 className="mt-2 text-base font-semibold text-slate-950">{module.title}</h3>
                            </div>
                            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
                              {module.lessons.length}
                            </span>
                          </div>

                          <div className="mt-4 space-y-2">
                            {module.lessons.map((lesson) => {
                              const isActive = lesson.id === selectedLessonId;

                              return (
                                <button
                                  key={lesson.id}
                                  type="button"
                                  onClick={() => setSelectedLessonId(lesson.id)}
                                  className={`flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-3 text-left transition focus:outline-none focus:ring-4 focus:ring-sky-100 ${
                                    isActive ? 'bg-slate-950 text-white shadow-lg shadow-slate-950/15' : 'bg-white text-slate-700 hover:-translate-y-0.5 hover:bg-slate-100'
                                  }`}
                                >
                                  <div>
                                    <p className="text-sm font-medium">{lesson.title}</p>
                                    <p className={`mt-1 text-xs ${isActive ? 'text-white/70' : 'text-slate-500'}`}>{lesson.duration}</p>
                                  </div>
                                  <div className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] ${lesson.completed ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
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
                          <p className="text-center text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">Collapsed</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </MotionDiv>

            <main className="space-y-6">
              <MotionDiv
                className="overflow-hidden rounded-[30px] border border-white/70 bg-white/85 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-6"
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 5.5, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Video Player</p>
                    <h2 className="mt-2 text-2xl font-semibold text-slate-950">{selectedLesson.title}</h2>
                    <p className="mt-1 text-sm text-slate-500">Duration: {selectedLesson.duration}</p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-right">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Lesson Complete</p>
                    <button
                      type="button"
                      onClick={completeLesson}
                      className="mt-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-emerald-500"
                    >
                      Mark complete
                    </button>
                  </div>
                </div>

                <div className="mt-5 overflow-hidden rounded-[28px] border border-slate-200 bg-slate-950 shadow-[0_20px_60px_rgba(15,23,42,0.18)]">
                  <motion.div
                    className="relative aspect-video"
                    whileHover={{ scale: 1.01 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.2),transparent_24%),linear-gradient(135deg,rgba(15,23,42,0.9),rgba(14,165,233,0.45),rgba(168,85,247,0.45))]" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex h-24 w-24 items-center justify-center rounded-full border border-white/20 bg-white/15 text-white shadow-[0_16px_40px_rgba(0,0,0,0.2)] backdrop-blur-md">
                        <span className="ml-1 text-3xl">▶</span>
                      </div>
                    </div>
                    <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4 text-white">
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-white/70">Progress Animation</p>
                        <p className="mt-2 text-lg font-semibold">Stay focused, finish lessons, and track your growth.</p>
                      </div>
                      <div className="rounded-2xl bg-white/15 px-4 py-3 text-right backdrop-blur-md">
                        <p className="text-[10px] uppercase tracking-[0.24em] text-white/70">Current</p>
                        <p className="mt-1 text-sm font-semibold">Lesson 03</p>
                      </div>
                    </div>
                  </motion.div>
                </div>

                <div className="mt-6">
                  <div className="flex items-center justify-between text-sm text-slate-500">
                    <span>Course progress</span>
                    <span className="font-semibold text-slate-900">{progress}%</span>
                  </div>
                  <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-indigo-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
                    />
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {[
                    { label: 'Completed lessons', value: '12' },
                    { label: 'Focus streak', value: '7 days' },
                    { label: 'Achievement level', value: 'Gold' }
                  ].map((item) => (
                    <div key={item.label} className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{item.label}</p>
                      <p className="mt-2 text-2xl font-semibold text-slate-950">{item.value}</p>
                    </div>
                  ))}
                </div>
              </MotionDiv>

              <section className="grid gap-6 lg:grid-cols-2">
                <MotionDiv className="rounded-[30px] border border-white/70 bg-white/85 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] sm:p-6" whileHover={{ y: -4 }} transition={{ duration: 0.18 }}>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Lesson Complete Effect</p>
                  <h3 className="mt-2 text-2xl font-semibold text-slate-950">Finish tasks and unlock momentum</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    Completing a lesson updates progress, gives instant feedback, and keeps learners engaged with a subtle success state.
                  </p>
                  <button
                    type="button"
                    onClick={completeLesson}
                    className="mt-5 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
                  >
                    Complete this lesson
                  </button>
                </MotionDiv>

                <MotionDiv className="rounded-[30px] border border-white/70 bg-white/85 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] sm:p-6" whileHover={{ y: -4 }} transition={{ duration: 0.18 }}>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Learning Tips</p>
                  <h3 className="mt-2 text-2xl font-semibold text-slate-950">Keep your flow sharp</h3>
                  <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                    <li>• Pause, write one note, then continue the lesson.</li>
                    <li>• Use the resources panel to save references.</li>
                    <li>• Mark lessons complete to maintain momentum.</li>
                  </ul>
                </MotionDiv>
              </section>
            </main>

            <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
              <MotionDiv className="rounded-[30px] border border-white/70 bg-white/85 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] sm:p-6" whileHover={{ y: -4 }} transition={{ duration: 0.18 }}>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Notes</p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-950">Capture key ideas</h3>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  className="mt-4 min-h-[240px] w-full rounded-[24px] border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-700 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                  aria-label="Learning notes"
                />
              </MotionDiv>

              <MotionDiv className="rounded-[30px] border border-white/70 bg-white/85 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] sm:p-6" whileHover={{ y: -4 }} transition={{ duration: 0.18 }}>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Resources</p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-950">Keep reference files close</h3>
                <div className="mt-4 space-y-3">
                  {resources.map((resource) => (
                    <div key={resource.title} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 transition hover:bg-white">
                      <div>
                        <p className="font-semibold text-slate-950">{resource.title}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.24em] text-slate-500">{resource.type}</p>
                      </div>
                      <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">Open</span>
                    </div>
                  ))}
                </div>
              </MotionDiv>
            </aside>
          </div>
        </MotionDiv>
      </div>

      <AnimatePresence>
        {showAchievement ? (
          <motion.div
            className="fixed right-4 top-4 z-50 max-w-sm rounded-[28px] border border-emerald-200 bg-white/90 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.18)] backdrop-blur-xl"
            initial={{ opacity: 0, y: -20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.96 }}
            transition={{ duration: 0.24 }}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-xl text-emerald-700">
                ★
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-600">Achievement Popup</p>
                <h4 className="mt-1 text-base font-semibold text-slate-950">Lesson completed</h4>
                <p className="mt-2 text-sm leading-6 text-slate-600">You just earned a momentum boost. Keep going to unlock the next level.</p>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

export default Learning;