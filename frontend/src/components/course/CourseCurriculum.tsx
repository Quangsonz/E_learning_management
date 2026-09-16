import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { SectionLead } from '../ui';
import { useLocalizedValue } from '../../utils/localized';

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

export const CourseCurriculum: React.FC<{ lessons?: any[]; quizzes?: any[] }> = ({ lessons = [], quizzes = [] }) => {
  const { t } = useTranslation();
  const lv = useLocalizedValue();
  const [openCurriculum, setOpenCurriculum] = useState<number>(0);

  const curriculum = React.useMemo(() => {
    const groups: { [key: string]: any[] } = {};
    lessons.forEach(lesson => {
      const titleStr = lv(lesson.title);
      const parts = titleStr.split(': ');
      const chapter = parts.length > 1 ? parts[0] : t('learning.generalChapter', 'Phần chung');
      if (!groups[chapter]) groups[chapter] = [];
      groups[chapter].push({ ...lesson, title: parts.length > 1 ? parts[1] : titleStr });
    });
    
    return Object.entries(groups).map(([chapter, items]) => {
      const totalDuration = items.reduce((acc, curr) => acc + (curr.duration || 0), 0);
      const minutes = Math.floor(totalDuration / 60);
      const seconds = totalDuration % 60;
      
      return {
        title: chapter,
        duration: `${minutes}m ${seconds}s`,
        lectures: items.length,
        lessons: items.map(l => ({
          title: l.title,
          duration: `${Math.floor((l.duration || 0) / 60)}m ${(l.duration || 0) % 60}s`,
          status: 'locked' // Placeholder status
        }))
      };
    });
  }, [lessons, t, lv]);

  return (
    <section>
      <SectionLead label={t('course.curriculumRoadmap', 'Curriculum Roadmap')} title={t('course.curriculumSubtitle', 'Structured path to mastery')} />
      <div className="mt-6 space-y-3">
        {curriculum.length === 0 && quizzes.length === 0 ? (
           <p className="text-slate-500 text-sm">{t('course.noCurriculum', 'Chưa có dữ liệu bài học.')}</p>
        ) : (
          <>
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
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.lectures} {t('common.lessons', 'lectures')}</div>
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

        {quizzes.length > 0 && (
          <div className="group relative rounded-2xl border border-indigo-200/70 dark:border-indigo-500/20 bg-indigo-50/20 dark:bg-indigo-950/10 transition-shadow hover:shadow-md dark:hover:shadow-none overflow-hidden">
            <button
              type="button"
              onClick={() => setOpenCurriculum(openCurriculum === curriculum.length ? -1 : curriculum.length)}
              className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left focus:outline-none"
            >
              <div className="flex-1 pr-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-indigo-600 dark:text-indigo-400">
                  {t('learning.assessments', 'Bài kiểm tra & Đánh giá')}
                </p>
                <h4 className="mt-1 text-base font-semibold text-slate-900 dark:text-white">
                  {t('course.quizAssessmentsTitle', 'Bài kiểm tra năng lực')}
                </h4>
              </div>
              <div className="text-right shrink-0">
                <div className="text-sm font-medium text-slate-900 dark:text-white">
                  {quizzes.length} {t('learning.assessments', 'bài kiểm tra')}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {quizzes.reduce((sum: number, q: any) => sum + (q.questionCount || q.totalQuestions || 0), 0)} {t('learning.questions', 'câu hỏi')}
                </div>
              </div>
              <motion.div animate={{ rotate: openCurriculum === curriculum.length ? 180 : 0 }} className="shrink-0 text-slate-400 ml-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </motion.div>
            </button>

            <AnimatePresence>
              {openCurriculum === curriculum.length && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="px-6 pb-5 pt-1 border-t border-indigo-100 dark:border-white/5">
                    <ul className="space-y-1">
                      {quizzes.map((quiz, qIdx) => (
                        <li key={quiz._id || qIdx} className="flex items-center justify-between py-2.5">
                          <div className="flex items-center gap-3">
                            <div className="shrink-0 flex items-center justify-center w-6 h-6 text-indigo-500">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
                              </svg>
                            </div>
                            <div>
                              <span className="text-sm text-slate-800 dark:text-slate-200 font-medium">
                                {lv(quiz.title)}
                              </span>
                              <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                                <span>{quiz.questionCount ?? quiz.totalQuestions ?? 0} {t('learning.questions', 'câu')}</span>
                                <span>•</span>
                                <span>{quiz.timeLimit ? `${quiz.timeLimit} phút` : t('teacher.curriculum.noLimit', 'Không giới hạn')}</span>
                                <span>•</span>
                                <span>{t('teacher.curriculum.passingScore', 'Điểm đạt')}: {quiz.passingScore}%</span>
                              </div>
                            </div>
                          </div>
                          {quiz.isCompleted && (
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${quiz.isPassed ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'}`}>
                              {quiz.scorePercentage ?? quiz.score}% ({quiz.isPassed ? t('quizPage.passed') : t('quizPage.failed')})
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
        </>
        )}
      </div>
    </section>
  );
};
