import React, { useMemo, useState } from 'react';
import { motion, MotionProps } from 'framer-motion';
import { Button, LoadingScreen, PageShell, Toast, GlassPanel } from '../components/ui';
import useSimulatedLoading from '../hooks/useSimulatedLoading';

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
      <PageShell>
        <LoadingScreen title="Loading learning space" message="Preparing lessons, video player, and study resources..." />
      </PageShell>
    );
  }

  return (
    <PageShell>
        <GlassPanel padding="lg" motionProps={{ initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.45, ease: 'easeOut' } }}>
          <div className="flex flex-col gap-4 border-b border-slate-200/70 pb-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="section-label">Learning Page</p>
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
              <GlassPanel padding="sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="section-label">Course Content</p>
                    {!isSidebarCollapsed ? <h2 className="mt-2 text-xl font-semibold text-slate-950">Curriculum</h2> : null}
                  </div>
                  <div className="status-badge status-badge-success">Live</div>
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
                            <span className="badge !border-slate-300">
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
                                  className={`flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-3 text-left transition focus:outline-none focus:ring-4 focus:ring-primary-500/10 ${
                                    isActive ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/15' : 'bg-white text-slate-700 hover:-translate-y-0.5 hover:bg-slate-100 border border-slate-200'
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
              </GlassPanel>
            </MotionDiv>

            <main className="space-y-6">
              <GlassPanel
                motionProps={{ animate: { y: [0, -4, 0] }, transition: { duration: 5.5, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' } }}
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="section-label">Video Player</p>
                    <h2 className="mt-2 text-2xl font-semibold text-slate-950">{selectedLesson.title}</h2>
                    <p className="mt-1 text-sm text-slate-500">Duration: {selectedLesson.duration}</p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-right">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Lesson Complete</p>
                    <Button
                      variant="pill"
                      className="mt-2 !bg-emerald-600 hover:!bg-emerald-500"
                      onClick={completeLesson}
                    >
                      Mark complete
                    </Button>
                  </div>
                </div>

                <div className="mt-5 overflow-hidden rounded-[28px] border border-slate-200 bg-slate-950 shadow-elev-2">
                  <motion.div
                    className="relative aspect-video"
                    whileHover={{ scale: 1.01 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.2),transparent_24%),linear-gradient(135deg,rgba(15,23,42,0.9),rgba(14,165,233,0.45),rgba(168,85,247,0.45))]" />
                    <div className="absolute inset-0 flex items-center justify-center cursor-pointer">
                      <div className="flex h-24 w-24 items-center justify-center rounded-full border border-white/20 bg-white/15 text-white shadow-elev-3 backdrop-blur-md transition hover:scale-110">
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
                  <div className="progress-track mt-3">
                    <motion.div
                      className="progress-fill"
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
                      <p className="section-label">{item.label}</p>
                      <p className="mt-2 text-2xl font-semibold text-slate-950">{item.value}</p>
                    </div>
                  ))}
                </div>
              </GlassPanel>

              <section className="grid gap-6 lg:grid-cols-2">
                <GlassPanel hover>
                  <p className="section-label">Lesson Complete Effect</p>
                  <h3 className="mt-2 section-title">Finish tasks and unlock momentum</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    Completing a lesson updates progress, gives instant feedback, and keeps learners engaged with a subtle success state.
                  </p>
                  <Button type="button" variant="pill" className="mt-5" onClick={completeLesson}>
                    Complete this lesson
                  </Button>
                </GlassPanel>

                <GlassPanel hover>
                  <p className="section-label">Learning Tips</p>
                  <h3 className="mt-2 section-title">Keep your flow sharp</h3>
                  <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                    <li>• Pause, write one note, then continue the lesson.</li>
                    <li>• Use the resources panel to save references.</li>
                    <li>• Mark lessons complete to maintain momentum.</li>
                  </ul>
                </GlassPanel>
              </section>
            </main>

            <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
              <GlassPanel hover>
                <p className="section-label">Notes</p>
                <h3 className="mt-2 section-title">Capture key ideas</h3>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  className="mt-4 min-h-[240px] w-full rounded-[24px] border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-700 outline-none transition focus:border-primary-400 focus:bg-white focus:ring-4 focus:ring-primary-500/10"
                  aria-label="Learning notes"
                />
              </GlassPanel>

              <GlassPanel hover>
                <p className="section-label">Resources</p>
                <h3 className="mt-2 section-title">Keep reference files close</h3>
                <div className="mt-4 space-y-3">
                  {resources.map((resource) => (
                    <div key={resource.title} className="card interactive p-4 text-left">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-950">{resource.title}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.24em] text-slate-500">{resource.type}</p>
                        </div>
                        <span className="badge">Open</span>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassPanel>
            </aside>
          </div>
        </GlassPanel>

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