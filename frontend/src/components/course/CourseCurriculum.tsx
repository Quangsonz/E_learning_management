import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SectionLead } from '../ui';

export type CurriculumLesson = {
  title: string;
  duration: string;
  status: 'completed' | 'current' | 'locked';
};

export type CurriculumItem = {
  title: string;
  duration: string;
  lectures: number;
  lessons: CurriculumLesson[];
};

const curriculum: CurriculumItem[] = [
  { 
    title: 'Course overview and success roadmap', 
    duration: '22 min', 
    lectures: 3,
    lessons: [
      { title: 'Welcome to the Masterclass', duration: '5 min', status: 'completed' },
      { title: 'Setting up your workspace', duration: '12 min', status: 'completed' },
      { title: 'How to get feedback and support', duration: '5 min', status: 'current' }
    ]
  },
  { 
    title: 'Core concepts and practical setup', 
    duration: '1h 15m', 
    lectures: 4,
    lessons: [
      { title: 'The philosophy of borderless design', duration: '18 min', status: 'locked' },
      { title: 'Typography as structure', duration: '25 min', status: 'locked' },
      { title: 'Color theory for modern SaaS', duration: '20 min', status: 'locked' },
      { title: 'Grid systems vs Canvas layouts', duration: '12 min', status: 'locked' }
    ]
  },
  { 
    title: 'Building high-converting learning experiences', 
    duration: '1h 40m', 
    lectures: 4,
    lessons: [
      { title: 'Designing the Hero section', duration: '30 min', status: 'locked' },
      { title: 'Creating immersive metadata', duration: '20 min', status: 'locked' },
      { title: 'Interactive components', duration: '25 min', status: 'locked' },
      { title: 'Progress and motivation indicators', duration: '25 min', status: 'locked' }
    ]
  },
  { 
    title: 'Design systems, motion, and polish', 
    duration: '1h 05m', 
    lectures: 3,
    lessons: [
      { title: 'Micro-interactions', duration: '20 min', status: 'locked' },
      { title: 'Framer Motion fundamentals', duration: '25 min', status: 'locked' },
      { title: 'Performance and perceived speed', duration: '20 min', status: 'locked' }
    ]
  }
];

export const CourseCurriculum: React.FC = () => {
  const [openCurriculum, setOpenCurriculum] = useState<number>(0);

  return (
    <section>
      <SectionLead label="Curriculum Roadmap" title="Structured path to mastery" />
      <div className="mt-6 space-y-3">
        {curriculum.map((item, index) => {
          const isOpen = openCurriculum === index;
          return (
            <div key={index} className="group relative rounded-2xl border border-slate-200/60 dark:border-white/5 bg-white dark:bg-slate-900/50 transition-shadow hover:shadow-md dark:hover:shadow-none overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenCurriculum(isOpen ? -1 : index)}
                className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left focus:outline-none"
              >
                <div className="flex-1 pr-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-primary-600 dark:text-primary-400">Module {index + 1}</p>
                  <h4 className="mt-1 text-base font-semibold text-slate-900 dark:text-white">{item.title}</h4>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-medium text-slate-900 dark:text-white">{item.duration}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.lectures} lectures</div>
                </div>
                <motion.div animate={{ rotate: isOpen ? 180 : 0 }} className="shrink-0 text-slate-400 ml-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </motion.div>
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <div className="px-6 pb-5 pt-1 border-t border-slate-100 dark:border-white/5">
                      <ul className="space-y-1">
                        {item.lessons.map((lesson, lIdx) => (
                          <li key={lIdx} className="flex items-center justify-between py-2.5 group/lesson">
                            <div className="flex items-center gap-3">
                              <div className="shrink-0 flex items-center justify-center w-6 h-6">
                                {lesson.status === 'completed' ? (
                                  <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>
                                ) : lesson.status === 'current' ? (
                                  <span className="flex h-4 w-4 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span><span className="relative inline-flex rounded-full h-4 w-4 bg-primary-500 border-2 border-white dark:border-slate-900"></span></span>
                                ) : (
                                  <svg className="w-4 h-4 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
                                )}
                              </div>
                              <span className={`text-sm ${lesson.status === 'locked' ? 'text-slate-500 dark:text-slate-500' : 'text-slate-700 dark:text-slate-200 font-medium group-hover/lesson:text-primary-600 dark:group-hover/lesson:text-primary-400 transition-colors'}`}>
                                {lesson.title}
                              </span>
                            </div>
                            <div className="text-xs text-slate-400 dark:text-slate-500">{lesson.duration}</div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
};
