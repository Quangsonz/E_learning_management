import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { SectionLead } from '../ui';
import { useLocalizedValue } from '../../utils/localized';
import { Module } from '../../services/module.api';

export type CurriculumLesson = {
  _id?: string;
  title: string;
  duration: string;
  isPreview?: boolean;
  status: 'completed' | 'current' | 'unlocked' | 'preview' | 'locked';
};

export type CurriculumItem = {
  _id?: string;
  title: string;
  description?: string;
  duration: string;
  lectures: number;
  lessons: CurriculumLesson[];
};

export interface CourseCurriculumProps {
  modules?: Module[];
  lessons?: any[];
  quizzes?: any[];
  completedLessons?: string[];
  isEnrolled?: boolean;
}

const formatDuration = (totalSeconds: number): string => {
  if (!totalSeconds || isNaN(totalSeconds) || totalSeconds <= 0) return '0s';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`.trim();
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds > 0 ? `${seconds}s` : ''}`.trim();
  }
  return `${seconds}s`;
};

/* ── Memoized Lesson Item ─────────────────────────────────────────── */
interface LessonItemProps {
  lesson: CurriculumLesson;
  isEnrolled: boolean;
  t: any;
}

const LessonItem: React.FC<LessonItemProps> = React.memo(({ lesson, isEnrolled, t }) => {
  return (
    <li className="flex items-center justify-between py-2.5 group/lesson">
      <div className="flex items-center gap-3">
        <div className="shrink-0 flex items-center justify-center w-6 h-6">
          {lesson.status === 'completed' ? (
            <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
          ) : lesson.status === 'unlocked' ? (
            <svg className="w-4 h-4 text-primary-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          ) : lesson.status === 'preview' ? (
            <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
          )}
        </div>
        <span
          className={`text-sm ${
            lesson.status === 'locked'
              ? 'text-slate-500 dark:text-slate-500'
              : 'text-slate-700 dark:text-slate-200 font-medium group-hover/lesson:text-primary-600 dark:group-hover/lesson:text-primary-400 transition-colors'
          }`}
        >
          {lesson.title}
        </span>
        {lesson.isPreview && !isEnrolled && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
            {t('course.previewBadge', 'Học thử')}
          </span>
        )}
      </div>
      <div className="text-xs text-slate-400 dark:text-slate-500">{lesson.duration}</div>
    </li>
  );
});

/* ── Memoized Module Accordion Item ───────────────────────────────── */
interface ModuleAccordionItemProps {
  item: CurriculumItem;
  index: number;
  isOpen: boolean;
  onToggle: (index: number) => void;
  isEnrolled: boolean;
  t: any;
}

const ModuleAccordionItem: React.FC<ModuleAccordionItemProps> = React.memo(({
  item,
  index,
  isOpen,
  onToggle,
  isEnrolled,
  t
}) => {
  return (
    <div className="group relative rounded-2xl border border-slate-200/60 dark:border-white/5 bg-white dark:bg-slate-900/50 transition-shadow hover:shadow-md dark:hover:shadow-none overflow-hidden">
      <button
        type="button"
        onClick={() => onToggle(index)}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left focus:outline-none cursor-pointer select-none"
      >
        <div className="flex-1 pr-4 min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-primary-600 dark:text-primary-400">
            {t('curriculum.module', 'Chương')} {index + 1}
          </p>
          <h4 className="mt-1 text-base font-semibold text-slate-900 dark:text-white truncate">{item.title}</h4>
          {item.description && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{item.description}</p>
          )}
        </div>
        <div className="text-right shrink-0">
          <div className="text-sm font-medium text-slate-900 dark:text-white">{item.duration}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {item.lectures} {t('common.lessons', 'lectures')}
          </div>
        </div>
        <div
          className={`shrink-0 text-slate-400 ml-2 transition-transform duration-200 ease-out ${
            isOpen ? 'rotate-180' : 'rotate-0'
          }`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </button>

      {/* High-performance CSS Grid accordion: 0 JavaScript height calculation, native GPU composited */}
      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden min-h-0">
          <div
            className={`px-6 pb-5 pt-1 border-t border-slate-100 dark:border-white/5 transition-opacity duration-200 ${
              isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <ul className="space-y-1">
              {item.lessons.map((lesson, lIdx) => (
                <LessonItem
                  key={lesson._id || lIdx}
                  lesson={lesson}
                  isEnrolled={isEnrolled}
                  t={t}
                />
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
});

/* ── Memoized Quiz Accordion Item ─────────────────────────────────── */
interface QuizAccordionItemProps {
  quizzes: any[];
  isOpen: boolean;
  onToggle: () => void;
  lv: (val: any) => string;
  t: any;
}

const QuizAccordionItem: React.FC<QuizAccordionItemProps> = React.memo(({
  quizzes,
  isOpen,
  onToggle,
  lv,
  t
}) => {
  const totalQuestions = quizzes.reduce((sum: number, q: any) => sum + (q.questionCount || q.totalQuestions || 0), 0);

  return (
    <div className="group relative rounded-2xl border border-indigo-200/70 dark:border-indigo-500/20 bg-indigo-50/20 dark:bg-indigo-950/10 transition-shadow hover:shadow-md dark:hover:shadow-none overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left focus:outline-none cursor-pointer select-none"
      >
        <div className="flex-1 pr-4 min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-indigo-600 dark:text-indigo-400">
            {t('learning.assessments', 'Bài kiểm tra & Đánh giá')}
          </p>
          <h4 className="mt-1 text-base font-semibold text-slate-900 dark:text-white truncate">
            {t('course.quizAssessmentsTitle', 'Bài kiểm tra năng lực')}
          </h4>
        </div>
        <div className="text-right shrink-0">
          <div className="text-sm font-medium text-slate-900 dark:text-white">
            {quizzes.length} {t('learning.assessments', 'bài kiểm tra')}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {totalQuestions} {t('learning.questions', 'câu hỏi')}
          </div>
        </div>
        <div
          className={`shrink-0 text-slate-400 ml-2 transition-transform duration-200 ease-out ${
            isOpen ? 'rotate-180' : 'rotate-0'
          }`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </button>

      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden min-h-0">
          <div
            className={`px-6 pb-5 pt-1 border-t border-indigo-100 dark:border-white/5 transition-opacity duration-200 ${
              isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <ul className="space-y-1">
              {quizzes.map((quiz, qIdx) => (
                <li key={quiz._id || qIdx} className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-3">
                    <div className="shrink-0 flex items-center justify-center w-6 h-6 text-indigo-500">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10 9 9 9 8 9" />
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
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        quiz.isPassed
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                      }`}
                    >
                      {quiz.scorePercentage ?? quiz.score}% ({quiz.isPassed ? t('quizPage.passed') : t('quizPage.failed')})
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
});

/* ── Main CourseCurriculum Component ──────────────────────────────── */
export const CourseCurriculum: React.FC<CourseCurriculumProps> = React.memo(({
  modules = [],
  lessons = [],
  quizzes = [],
  completedLessons = [],
  isEnrolled = false
}) => {
  const { t } = useTranslation();
  const lv = useLocalizedValue();

  // Index 0 open by default, supports independent multi-expand
  const [openIndices, setOpenIndices] = useState<Set<number>>(() => new Set([0]));
  const [isQuizzesOpen, setIsQuizzesOpen] = useState(false);

  const handleToggle = useCallback((index: number) => {
    setOpenIndices(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  const handleToggleQuizzes = useCallback(() => {
    setIsQuizzesOpen(prev => !prev);
  }, []);

  const curriculum: CurriculumItem[] = useMemo(() => {
    // 1. If structured modules are provided, use them directly
    if (modules && modules.length > 0) {
      return modules.map(mod => {
        const modLessons = mod.lessons || [];
        const totalDuration = modLessons.reduce((acc, curr) => acc + (curr.duration || 0), 0);

        return {
          _id: mod._id,
          title: lv(mod.title) || t('curriculum.untitledModule', 'Chương chưa đặt tên'),
          description: lv(mod.description),
          duration: formatDuration(totalDuration),
          lectures: modLessons.length,
          lessons: modLessons.map(l => {
            const isCompleted = completedLessons.includes(l._id);
            const isFree = Boolean(l.isFreePreview || l.isPreview);
            let status: CurriculumLesson['status'] = 'locked';
            if (isCompleted) {
              status = 'completed';
            } else if (isEnrolled) {
              status = 'unlocked';
            } else if (isFree) {
              status = 'preview';
            } else {
              status = 'locked';
            }

            return {
              _id: l._id,
              title: lv(l.title),
              duration: formatDuration(l.duration || 0),
              isPreview: isFree,
              status
            };
          })
        };
      });
    }

    // 2. Fallback to lessons grouping if modules not available
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
      
      return {
        title: chapter,
        duration: formatDuration(totalDuration),
        lectures: items.length,
        lessons: items.map(l => {
          const isFree = Boolean(l.isFreePreview || l.isPreview);
          return {
            _id: l._id,
            title: l.title,
            duration: formatDuration(l.duration || 0),
            isPreview: isFree,
            status: completedLessons.includes(l._id) ? 'completed' : isEnrolled ? 'unlocked' : isFree ? 'preview' : 'locked'
          };
        })
      };
    });
  }, [modules, lessons, completedLessons, isEnrolled, t, lv]);

  return (
    <section>
      <SectionLead
        label={t('course.curriculumRoadmap', 'Curriculum Roadmap')}
        title={t('course.curriculumSubtitle', 'Structured path to mastery')}
      />
      <div className="mt-6 space-y-3">
        {curriculum.length === 0 && quizzes.length === 0 ? (
          <p className="text-slate-500 text-sm">{t('course.noCurriculum', 'Chưa có dữ liệu bài học.')}</p>
        ) : (
          <>
            {curriculum.map((item, index) => (
              <ModuleAccordionItem
                key={item._id || index}
                item={item}
                index={index}
                isOpen={openIndices.has(index)}
                onToggle={handleToggle}
                isEnrolled={isEnrolled}
                t={t}
              />
            ))}

            {quizzes.length > 0 && (
              <QuizAccordionItem
                quizzes={quizzes}
                isOpen={isQuizzesOpen}
                onToggle={handleToggleQuizzes}
                lv={lv}
                t={t}
              />
            )}
          </>
        )}
      </div>
    </section>
  );
});
