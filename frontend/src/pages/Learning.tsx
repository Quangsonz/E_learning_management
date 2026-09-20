import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LoadingScreen, Toast, Button, EmptyState } from '../components/ui';
import { lessonApi, Lesson as ApiLesson } from '../services/lesson.api';
import { moduleApi, Module } from '../services/module.api';
import { progressApi } from '../services/progress.api';
import { quizApi } from '../services/quiz.api';
import { enrollmentApi } from '../services/enrollment.api';
import { discussionApi, Discussion, Comment } from '../services/discussion.api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { assignmentApi, Assignment, AssignmentSubmission } from '../services/assignment.api';
import { uploadApi } from '../services/upload.api';
import { certificateApi, Certificate } from '../services/certificate.api';
import { store } from '../store/store';
import { API_BASE } from '../services/axios';
import { courseApi } from '../services/course.api';
import { useTranslation } from 'react-i18next';
import { useLocalizedValue } from '../utils/localized';
import { 
  Settings, 
  Zap, 
  ChevronDown, 
  Check, 
  Bookmark as BookmarkIcon
} from 'lucide-react';

export type VideoQuality = 'auto' | '1080p' | '720p' | '480p' | '360p';

export const QUALITY_OPTIONS: { id: VideoQuality; label: string; tag: string }[] = [
  { id: 'auto', label: 'Tự động (Gốc)', tag: 'Auto' },
  { id: '1080p', label: '1080p Full HD', tag: 'FHD' },
  { id: '720p', label: '720p HD', tag: 'HD' },
  { id: '480p', label: '480p SD', tag: 'SD' },
  { id: '360p', label: '360p Tiết kiệm', tag: '360p' }
];

export const SPEED_OPTIONS: number[] = [0.5, 0.75, 1, 1.25, 1.5, 2];

export const getTransformedVideoUrl = (rawUrl?: string, quality: VideoQuality = 'auto'): string => {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  if (quality === 'auto') return rawUrl;

  // Cloudinary video transformation
  if (rawUrl.includes('res.cloudinary.com') && rawUrl.includes('/video/upload/')) {
    let transformation = 'q_auto,w_1280,h_720,c_limit';
    if (quality === '1080p') transformation = 'q_auto,w_1920,h_1080,c_limit';
    else if (quality === '720p') transformation = 'q_auto,w_1280,h_720,c_limit';
    else if (quality === '480p') transformation = 'q_auto,w_854,h_480,c_limit';
    else if (quality === '360p') transformation = 'q_auto,w_640,h_360,c_limit';

    const uploadIdx = rawUrl.indexOf('/video/upload/');
    const prefix = rawUrl.slice(0, uploadIdx + '/video/upload/'.length);
    const rest = rawUrl.slice(uploadIdx + '/video/upload/'.length);

    if (rest.startsWith('q_auto') || rest.startsWith('w_') || rest.startsWith('c_')) {
      const slashAfterTransform = rest.indexOf('/');
      if (slashAfterTransform !== -1) {
        return `${prefix}${transformation}/${rest.slice(slashAfterTransform + 1)}`;
      }
    }
    return `${prefix}${transformation}/${rest}`;
  }

  return rawUrl;
};

type Resource = { title: string; type: string };

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

interface SidebarLessonItemProps {
  lesson: ApiLesson;
  index: number;
  isActive: boolean;
  isCompleted: boolean;
  onSelect: (id: string) => void;
  lv: (val: any) => string;
}

const SidebarLessonItem = React.memo<SidebarLessonItemProps>(({
  lesson,
  index,
  isActive,
  isCompleted,
  onSelect,
  lv,
}) => {
  const handleClick = useCallback(() => {
    onSelect(lesson._id);
  }, [onSelect, lesson._id]);

  return (
    <button
      onClick={handleClick}
      className={`group flex items-start justify-between py-2 px-2.5 rounded-md text-left w-full transition-colors ${
        isActive
          ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-medium'
          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
      }`}
    >
      <div className="flex items-start gap-3 w-full">
        <div className="w-4 h-4 shrink-0 flex items-center justify-center mt-0.5">
          {isCompleted ? (
            <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
          ) : isActive ? (
            <div className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400" />
          ) : (
            <span className="text-[10px] text-slate-400">{index + 1}</span>
          )}
        </div>
        <span className="text-sm line-clamp-2 leading-snug break-words flex-1" title={lv(lesson.title)}>
          {lv(lesson.title)}
        </span>
      </div>
    </button>
  );
});
SidebarLessonItem.displayName = 'SidebarLessonItem';

interface SidebarModuleItemProps {
  module: {
    id: string;
    title: string;
    lessons: ApiLesson[];
  };
  isOpen: boolean;
  onToggle: (id: string) => void;
  selectedLessonId: string | null;
  selectedQuizId: string | null;
  completedLessons: string[];
  onSelectLesson: (id: string) => void;
  t: (key: string, defaultVal?: string) => string;
  lv: (val: any) => string;
}

const SidebarModuleItem = React.memo<SidebarModuleItemProps>(({
  module,
  isOpen,
  onToggle,
  selectedLessonId,
  selectedQuizId,
  completedLessons,
  onSelectLesson,
  t,
  lv,
}) => {
  const completedCount = useMemo(() => {
    return module.lessons.filter((l: ApiLesson) => completedLessons.includes(l._id)).length;
  }, [module.lessons, completedLessons]);

  const handleToggle = useCallback(() => {
    onToggle(module.id);
  }, [onToggle, module.id]);

  return (
    <div className="border border-slate-200 dark:border-white/10 rounded-lg overflow-hidden">
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-left"
      >
        <div className="flex-1 pr-2 min-w-0">
          <span className="font-semibold text-sm text-slate-800 dark:text-slate-200 block truncate">
            {module.title}
          </span>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 block mt-0.5">
            {completedCount}/{module.lessons.length} {t('common.lessons', 'bài học')}
          </span>
        </div>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`shrink-0 text-slate-400 ml-1 transition-transform duration-200 ease-out ${isOpen ? 'rotate-180' : ''}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      <div
        className="grid transition-[grid-template-rows] duration-200 ease-out"
        style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <div className={`flex flex-col gap-1 p-2 bg-white dark:bg-[#1A1A1A] transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
            {module.lessons.map((lesson: ApiLesson, index: number) => {
              const isActive = lesson._id === selectedLessonId && !selectedQuizId;
              const isCompleted = completedLessons.includes(lesson._id);
              return (
                <SidebarLessonItem
                  key={lesson._id}
                  lesson={lesson}
                  index={index}
                  isActive={isActive}
                  isCompleted={isCompleted}
                  onSelect={onSelectLesson}
                  lv={lv}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
});
SidebarModuleItem.displayName = 'SidebarModuleItem';

interface LearningCurriculumSidebarProps {
  curriculumModules: Array<{
    id: string;
    title: string;
    lessons: ApiLesson[];
  }>;
  allLessons: ApiLesson[];
  selectedLessonId: string | null;
  selectedQuizId: string | null;
  selectedAssignmentId: string | null;
  completedLessons: string[];
  quizzes: any[];
  assignments: any[];
  practiceLimit: number;
  onSelectLesson: (id: string) => void;
  onSelectQuiz: (id: string) => void;
  onSelectAssignment: (id: string) => void;
  onStartPractice: (limit: number) => void;
  onPracticeLimitChange: (limit: number) => void;
  t: any;
  lv: (val: any) => string;
}

const LearningCurriculumSidebar = React.memo<LearningCurriculumSidebarProps>(({
  curriculumModules,
  allLessons,
  selectedLessonId,
  selectedQuizId,
  selectedAssignmentId,
  completedLessons,
  quizzes,
  assignments,
  practiceLimit,
  onSelectLesson,
  onSelectQuiz,
  onSelectAssignment,
  onStartPractice,
  onPracticeLimitChange,
  t,
  lv,
}) => {
  const [openModuleIds, setOpenModuleIds] = useState<string[]>([]);

  // Auto-expand module containing the active lesson
  useEffect(() => {
    if (selectedLessonId && curriculumModules.length > 0) {
      const activeModule = curriculumModules.find(m => 
        m.lessons.some(l => l._id === selectedLessonId)
      );
      if (activeModule) {
        setOpenModuleIds(prev => prev.includes(activeModule.id) ? prev : [...prev, activeModule.id]);
      }
    } else if (curriculumModules.length > 0 && openModuleIds.length === 0) {
      setOpenModuleIds([curriculumModules[0].id]);
    }
  }, [selectedLessonId, curriculumModules]);

  const toggleModule = useCallback((id: string) => {
    setOpenModuleIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  }, []);

  return (
    <div className="flex flex-col bg-white dark:bg-[#1A1A1A] border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm max-h-[calc(100vh-12rem)] overflow-y-auto custom-scrollbar pr-1">
      <div className="pt-2 pb-5 border-b border-[#EAEAEA] dark:border-white/10">
        <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400 mb-4">
          {t('learning.curriculum', 'Nội dung khóa học')}
        </h3>
        {allLessons.length === 0 ? (
          <p className="text-sm text-slate-500">{t('learning.noLessons', 'Không có bài học nào.')}</p>
        ) : (
          <div className="flex flex-col gap-2">
            {curriculumModules.map((module) => (
              <SidebarModuleItem
                key={module.id}
                module={module}
                isOpen={openModuleIds.includes(module.id)}
                onToggle={toggleModule}
                selectedLessonId={selectedLessonId}
                selectedQuizId={selectedQuizId}
                completedLessons={completedLessons}
                onSelectLesson={onSelectLesson}
                t={t}
                lv={lv}
              />
            ))}
          </div>
        )}
      </div>

      {quizzes.length > 0 && (
        <div className="pt-5 pb-5 border-b border-[#EAEAEA] dark:border-white/10">
          <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400 mb-4">
            {t('learning.assessments', 'Bài kiểm tra')}
          </h3>
          <div className="flex flex-col gap-1">
            {quizzes.map((quiz: any) => {
              const isActive = quiz._id === selectedQuizId;
              const isCompleted = Boolean(quiz.isCompleted);
              return (
                <button
                  key={quiz._id}
                  onClick={() => onSelectQuiz(quiz._id)}
                  className={`group flex items-start justify-between py-2 px-2.5 rounded-md text-left w-full transition-colors ${isActive ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-medium' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-[#111111] dark:hover:text-white'}`}
                >
                  <div className="flex items-start gap-3 w-full">
                    <div className="w-4 h-4 shrink-0 flex items-center justify-center mt-0.5">
                      {isCompleted ? (
                        <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm line-clamp-2 leading-snug break-words" title={lv(quiz.title)}>{lv(quiz.title)}</span>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span>{quiz.questionCount ?? quiz.totalQuestions ?? 0} {t('learning.questions', 'câu')}</span>
                        {quiz.isCompleted && (
                          <>
                            <span>•</span>
                            <span className={quiz.isPassed ? 'text-emerald-500 font-semibold' : 'text-rose-500 font-semibold'}>
                              {quiz.scorePercentage ?? quiz.score}%
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {assignments.length > 0 && (
        <div className="pt-5 pb-5 border-b border-[#EAEAEA] dark:border-white/10">
          <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400 mb-4">
            {t('learning.assignments', 'Bài tập về nhà')}
          </h3>
          <div className="flex flex-col gap-1">
            {assignments.map((assignment: any) => {
              const isActive = assignment._id === selectedAssignmentId;
              return (
                <button
                  key={assignment._id}
                  onClick={() => onSelectAssignment(assignment._id)}
                  className={`group flex items-start justify-between py-2 px-2.5 rounded-md text-left w-full transition-colors ${isActive ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-medium' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-[#111111] dark:hover:text-white'}`}
                >
                  <div className="flex items-start gap-3 w-full">
                    <div className="w-4 h-4 shrink-0 flex items-center justify-center text-slate-400 mt-0.5">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    </div>
                    <span className="text-sm line-clamp-2 leading-snug break-words flex-1" title={lv(assignment.title)}>{lv(assignment.title)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="pt-5 pb-2">
        <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400 mb-4">
          {t('learning.randomPractice', 'Luyện tập ngẫu nhiên')}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">{t('learning.numQuestions', 'Số lượng câu hỏi')}</label>
            <select
              value={practiceLimit}
              onChange={(e) => onPracticeLimitChange(Number(e.target.value))}
              className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-xs focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
            >
              <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value={5}>5 {t('learning.questions', 'câu hỏi')}</option>
              <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value={10}>10 {t('learning.questions', 'câu hỏi')}</option>
              <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value={15}>15 {t('learning.questions', 'câu hỏi')}</option>
              <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value={20}>20 {t('learning.questions', 'câu hỏi')}</option>
              <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value={25}>25 {t('learning.questions', 'câu hỏi')}</option>
              <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value={30}>30 {t('learning.questions', 'câu hỏi')}</option>
              <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value={40}>40 {t('learning.questions', 'câu hỏi')}</option>
              <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value={50}>50 {t('learning.questions', 'câu hỏi')}</option>
            </select>
          </div>
          <button
            onClick={() => onStartPractice(practiceLimit)}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl font-semibold text-sm hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
            {t('learning.startPractice', 'Bắt đầu luyện tập')}
          </button>
        </div>
      </div>
    </div>
  );
});
LearningCurriculumSidebar.displayName = 'LearningCurriculumSidebar';

const Learning: React.FC = () => {
  const { t } = useTranslation();
  const lv = useLocalizedValue();
  const { courseId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [showAchievement, setShowAchievement] = useState(false);
  const [notes, setNotes] = useState(notesSeed.join('\n'));
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [bookmarkNote, setBookmarkNote] = useState('');
  const [showBookmarkInput, setShowBookmarkInput] = useState(false);
  const [discussionText, setDiscussionText] = useState('');
  const [expandedDiscussionId, setExpandedDiscussionId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const { user, refreshProfile } = useAuth();
  const { success: successToast, error: errorToast } = useToast();
  
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [practiceLimit, setPracticeLimit] = useState(10);
  const [submitNotesText, setSubmitNotesText] = useState('');
  const [submitFileName, setSubmitFileName] = useState('');
  const [submitFileUrl, setSubmitFileUrl] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [claimedCertificate, setClaimedCertificate] = useState<Certificate | null>(null);
  const [showCertSuccess, setShowCertSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'discussion' | 'notes' | 'resources'>('discussion');

  // Video Quality & Speed Controls
  const [selectedQuality, setSelectedQuality] = useState<VideoQuality>('auto');
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  // Synchronized navbar vs page header visibility (Mutual Exclusivity)
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);

  useEffect(() => {
    const handleNavVisibilityChange = (e: any) => {
      if (typeof e.detail?.isVisible === 'boolean') {
        setIsNavbarVisible(e.detail.isVisible);
      }
    };
    window.addEventListener('app:nav-visibility-change', handleNavVisibilityChange);
    return () => window.removeEventListener('app:nav-visibility-change', handleNavVisibilityChange);
  }, []);

  const toggleNavbarVisibility = useCallback(() => {
    setIsNavbarVisible(prev => {
      const next = !prev;
      window.dispatchEvent(new CustomEvent('app:set-nav-visibility', { detail: { isVisible: next } }));
      return next;
    });
  }, []);

  const { data: courseData } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => courseApi.getCourseById(courseId!),
    enabled: !!courseId,
    staleTime: 5 * 60 * 1000
  });

  const qualitySwitchTimeRef = React.useRef<number | null>(null);

  const handleQualityChange = useCallback((newQuality: VideoQuality) => {
    if (videoRef.current) {
      const currentPos = videoRef.current.currentTime;
      const wasPlaying = !videoRef.current.paused;
      qualitySwitchTimeRef.current = currentPos;

      const restoreState = () => {
        if (videoRef.current && qualitySwitchTimeRef.current !== null) {
          videoRef.current.currentTime = qualitySwitchTimeRef.current;
          videoRef.current.playbackRate = playbackSpeed;
          if (wasPlaying) {
            videoRef.current.play().catch(() => {});
          }
          qualitySwitchTimeRef.current = null;
          videoRef.current.removeEventListener('loadedmetadata', restoreState);
        }
      };

      videoRef.current.addEventListener('loadedmetadata', restoreState);
    }

    setSelectedQuality(newQuality);
    setShowQualityMenu(false);

    const opt = QUALITY_OPTIONS.find(o => o.id === newQuality);
    successToast(`Chất lượng video: ${opt?.label || newQuality}`, 'Trình phát Video');
  }, [playbackSpeed, successToast]);

  const handleSpeedChange = useCallback((speed: number) => {
    setPlaybackSpeed(speed);
    setShowSpeedMenu(false);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const res = await uploadApi.uploadDocument(file);
      if (res.status === 'success' && res.data?.url) {
        setSubmitFileName(res.data.filename || file.name);
        setSubmitFileUrl(res.data.url);
      }
    } catch (err) {
      console.error('File upload failed:', err);
    } finally {
      setUploadingFile(false);
    }
  };


  const { data: assignmentsData } = useQuery({
    queryKey: ['assignments', courseId],
    queryFn: () => assignmentApi.getAssignments(courseId!),
    enabled: !!courseId
  });
  const assignments = assignmentsData || [];

  const { data: mySubmissionData, refetch: refetchMySubmission } = useQuery({
    queryKey: ['my-submission', selectedAssignmentId],
    queryFn: () => assignmentApi.getMySubmission(selectedAssignmentId!),
    enabled: !!selectedAssignmentId
  });

  const submitAssignmentMutation = useMutation({
    mutationFn: ({ aId, files, notes }: { aId: string, files: any[], notes: string }) => 
      assignmentApi.submitAssignment(aId, { submittedFiles: files, studentNotes: notes }),
    onSuccess: () => {
      refetchMySubmission();
      queryClient.invalidateQueries({ queryKey: ['assignments', courseId] });
      setSubmitNotesText('');
      setSubmitFileName('');
      setSubmitFileUrl('');
    }
  });

  const { data: lessonsData, isLoading: isLoadingLessons, error } = useQuery({
    queryKey: ['lessons', courseId],
    queryFn: () => lessonApi.getLessons(courseId!),
    enabled: !!courseId,
    staleTime: 0,
    refetchOnMount: 'always',
    retry: false
  });

  const { data: modulesData, isLoading: isLoadingModules } = useQuery({
    queryKey: ['modules', courseId],
    queryFn: () => moduleApi.getModules(courseId!),
    enabled: !!courseId,
    staleTime: 0,
    refetchOnMount: 'always',
    retry: false
  });

  const { data: progressData, isLoading: isLoadingProgress } = useQuery({
    queryKey: ['course-progress', courseId],
    queryFn: () => progressApi.getCourseProgress(courseId!),
    enabled: !!courseId,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const { data: enrollmentsData, isLoading: isLoadingEnrollments } = useQuery({
    queryKey: ['my-enrollments'],
    queryFn: () => enrollmentApi.getMyEnrollments(),
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const isEnrolled = useMemo(() => {
    if (!enrollmentsData?.data?.enrollments || !courseId) return false;
    // Kiểm tra mảng enrollments, nếu enrollment.course là string hay object
    return enrollmentsData.data.enrollments.some((e: any) => 
      String(typeof e.course === 'object' ? e.course?._id : e.course) === String(courseId)
    );
  }, [enrollmentsData, courseId]);

  const { data: quizzesData, isLoading: isLoadingQuizzes } = useQuery({
    queryKey: ['quizzes', courseId],
    queryFn: () => quizApi.getQuizzesByCourse(courseId!),
    enabled: !!courseId,
    staleTime: 5 * 60 * 1000
  });

  const { data: discussionsData } = useQuery({
    queryKey: ['discussions', courseId, selectedLessonId],
    queryFn: () => discussionApi.getDiscussions(courseId!, selectedLessonId!),
    enabled: !!courseId && !!selectedLessonId && !selectedQuizId && activeTab === 'discussion',
    staleTime: 60 * 1000
  });

  const { data: commentsData } = useQuery({
    queryKey: ['comments', courseId, selectedLessonId, expandedDiscussionId],
    queryFn: () => discussionApi.getComments(courseId!, selectedLessonId!, expandedDiscussionId!),
    enabled: !!courseId && !!selectedLessonId && !!expandedDiscussionId && activeTab === 'discussion',
    staleTime: 60 * 1000
  });

  const discussions: Discussion[] = discussionsData?.data?.discussions || [];
  const comments: Comment[] = commentsData?.data?.comments || [];

  const modules: Module[] = modulesData?.data?.modules || [];
  const lessons = lessonsData?.data?.lessons || [];
  const quizzes = quizzesData?.data?.data?.quizzes || [];
  const progressInfo = progressData?.data?.progress;
  const progressPercent = progressInfo?.progressPercentage || 0;
  const completedLessons = progressInfo?.completedLessons || [];

  // Structured curriculum modules: prefer real modules with fallback to legacy grouping
  const curriculumModules = useMemo(() => {
    if (modules && modules.length > 0) {
      return modules.map((m, idx) => ({
        id: m._id,
        title: lv(m.title) || `${t('curriculum.module', 'Chương')} ${idx + 1}`,
        description: lv(m.description),
        lessons: (m.lessons || []).map((l: ApiLesson) => ({
          ...l,
          title: lv(l.title)
        }))
      }));
    }
    const groups: { [key: string]: ApiLesson[] } = {};
    lessons.forEach((lesson: ApiLesson) => {
      const titleStr = lv(lesson.title);
      const parts = titleStr.split(': ');
      const chapter = parts.length > 1 ? parts[0] : t('learning.generalChapter', 'Phần chung');
      if (!groups[chapter]) groups[chapter] = [];
      groups[chapter].push({ ...lesson, title: parts.length > 1 ? parts[1] : titleStr });
    });
    return Object.entries(groups).map(([chapter, items], idx) => ({
      id: `legacy-${idx}`,
      title: chapter,
      description: '',
      lessons: items
    }));
  }, [modules, lessons, t, lv]);

  // Flat sequence of all lessons across modules
  const allLessons: ApiLesson[] = useMemo(() => {
    if (curriculumModules.length > 0) {
      const flat = curriculumModules.flatMap(m => m.lessons);
      if (flat.length > 0) return flat;
    }
    return lessons;
  }, [curriculumModules, lessons]);

  useEffect(() => {
    if (allLessons.length > 0 && !selectedLessonId) {
      setSelectedLessonId(progressInfo?.lastAccessedLesson || allLessons[0]._id);
    }
  }, [allLessons, selectedLessonId, progressInfo]);

  const selectedLesson = useMemo(() => {
    return allLessons.find((item: ApiLesson) => item._id === selectedLessonId) || (!selectedQuizId ? allLessons[0] : null);
  }, [selectedLessonId, selectedQuizId, allLessons]);

  const handleSelectLesson = useCallback((lessonId: string) => {
    if (courseId && selectedLessonId && videoRef.current && videoRef.current.currentTime > 0) {
      progressApi.updateVideoProgress(courseId, selectedLessonId, videoRef.current.currentTime).catch(err => {
        console.error('Failed to save progress on lesson switch:', err);
      });
    }
    setSelectedLessonId(lessonId);
    setSelectedQuizId(null);
    setSelectedAssignmentId(null);
  }, [courseId, selectedLessonId]);

  const handleSelectQuiz = useCallback((quizId: string) => {
    setSelectedQuizId(quizId);
    setSelectedLessonId(null);
    setSelectedAssignmentId(null);
  }, []);

  const handleSelectAssignment = useCallback((assignmentId: string) => {
    setSelectedAssignmentId(assignmentId);
    setSelectedLessonId(null);
    setSelectedQuizId(null);
  }, []);

  const handleStartPractice = useCallback((limit: number) => {
    navigate(`/courses/${courseId}/quizzes/smart/take?limit=${limit}`);
  }, [navigate, courseId]);

  const activeModuleTitle = useMemo(() => {
    if (!selectedLesson) return '';
    const activeModule = curriculumModules.find(m => 
      m.lessons.some(l => l._id === selectedLesson._id)
    );
    return activeModule?.title || '';
  }, [selectedLesson, curriculumModules]);

  const selectedQuiz = useMemo(() => {
    return quizzes.find((item: any) => item._id === selectedQuizId);
  }, [selectedQuizId, quizzes]);

  const markCompleteMutation = useMutation({
    mutationFn: ({ cId, lId }: { cId: string, lId: string }) => progressApi.markComplete(cId, lId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-progress', courseId] });
      queryClient.invalidateQueries({ queryKey: ['my-stats'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      // Phase 2: Invalidate home dashboard summary so progress cards refresh
      queryClient.invalidateQueries({ queryKey: ['student-dashboard-summary'] });
      
      refreshProfile(); // Đồng bộ với Account Overview (Redux auth user object)
      
      setShowAchievement(true);
      window.setTimeout(() => setShowAchievement(false), 2600);
      
      // Auto-advance to next lesson if available
      const currentIndex = allLessons.findIndex((l: ApiLesson) => l._id === selectedLessonId);
      if (currentIndex !== -1 && currentIndex < allLessons.length - 1) {
        setSelectedLessonId(allLessons[currentIndex + 1]._id);
      }
    }
  });

  // Phase 1: Certificate claim mutation
  const claimCertificateMutation = useMutation({
    mutationFn: (cId: string) => certificateApi.claimCertificate(cId),
    onSuccess: (cert) => {
      setClaimedCertificate(cert);
      setShowCertSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['my-certificates'] });
      window.setTimeout(() => setShowCertSuccess(false), 4000);
    }
  });

  const completeLesson = () => {
    if (!courseId || !selectedLessonId) return;
    markCompleteMutation.mutate({ cId: courseId, lId: selectedLessonId });
  };

  const updateVideoProgressMutation = useMutation({
    mutationFn: ({ cId, lId, time }: { cId: string, lId: string, time: number }) => progressApi.updateVideoProgress(cId, lId, time)
  });

  const addBookmarkMutation = useMutation({
    mutationFn: ({ cId, lId, time, note }: { cId: string, lId: string, time: number, note: string }) => progressApi.addBookmark(cId, lId, time, note),
    onSuccess: () => {
      setShowBookmarkInput(false);
      setBookmarkNote('');
      queryClient.invalidateQueries({ queryKey: ['course-progress', courseId] });
    }
  });

  const handleVideoPause = () => {
    if (!courseId || !selectedLessonId || !videoRef.current) return;
    updateVideoProgressMutation.mutate({ cId: courseId, lId: selectedLessonId, time: videoRef.current.currentTime });
  };

  const lastSavedTimeRef = React.useRef<number>(0);

  // Periodic 10-second auto-save while video is actively playing
  useEffect(() => {
    if (!courseId || !selectedLessonId) return;

    const interval = setInterval(() => {
      if (
        videoRef.current &&
        !videoRef.current.paused &&
        !videoRef.current.ended &&
        videoRef.current.currentTime > 0
      ) {
        const currentTime = videoRef.current.currentTime;
        if (Math.abs(currentTime - lastSavedTimeRef.current) >= 2) {
          lastSavedTimeRef.current = currentTime;
          progressApi.updateVideoProgress(courseId, selectedLessonId, currentTime).catch(err => {
            console.error('Failed periodic progress save:', err);
          });
        }
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [courseId, selectedLessonId]);

  // Ref to hold the current state values for cleanup and unload handlers
  const saveProgressRef = React.useRef({ courseId, selectedLessonId, videoRef });
  
  useEffect(() => {
    saveProgressRef.current = { courseId, selectedLessonId, videoRef };
  }, [courseId, selectedLessonId]);

  useEffect(() => {
    // 1. Unmount handler: Save progress when navigating away from this page
    return () => {
      const { courseId: cId, selectedLessonId: lId, videoRef: vRef } = saveProgressRef.current;
      if (cId && lId && vRef.current) {
        const currentTime = vRef.current.currentTime;
        if (currentTime > 0) {
          progressApi.updateVideoProgress(cId, lId, currentTime).catch(err => {
            console.error('Failed to save video progress on unmount:', err);
          });
        }
      }
    };
  }, []);

  useEffect(() => {
    // 2. Tab close / Page refresh handler: Save progress using fetch keepalive
    const handleBeforeUnload = () => {
      const { courseId: cId, selectedLessonId: lId, videoRef: vRef } = saveProgressRef.current;
      if (cId && lId && vRef.current) {
        const currentTime = vRef.current.currentTime;
        if (currentTime > 0) {
          try {
            const state = store.getState();
            const token = state.auth.accessToken;
            
            const headers: Record<string, string> = {
              'Content-Type': 'application/json',
            };
            if (token) {
              headers['Authorization'] = `Bearer ${token}`;
            }

            fetch(`${API_BASE}/progress/${cId}/lessons/${lId}/video-progress`, {
              method: 'POST',
              headers,
              credentials: 'include',
              body: JSON.stringify({ time: currentTime }),
              keepalive: true
            }).catch(err => {
              console.error('Failed to send beacon/fetch on page unload:', err);
            });
          } catch (err) {
            console.error('Error during unload progress save:', err);
          }
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);


  const handleVideoLoadedMetadata = () => {
    if (qualitySwitchTimeRef.current !== null) {
      // Quality switch in progress - restore handled by quality callback
      return;
    }
    if (videoRef.current && progressInfo?.videoProgress && selectedLessonId) {
      const savedTime = progressInfo.videoProgress[selectedLessonId];
      if (savedTime) {
        videoRef.current.currentTime = savedTime;
      }
    }
  };

  const handleAddBookmark = () => {
    if (!courseId || !selectedLessonId || !videoRef.current || !bookmarkNote.trim()) return;
    addBookmarkMutation.mutate({ cId: courseId, lId: selectedLessonId, time: videoRef.current.currentTime, note: bookmarkNote });
  };

  const getYoutubeVideoId = (url?: string): string | null => {
    if (!url || typeof url !== 'string') return null;
    const cleanUrl = url.trim();
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = cleanUrl.match(regExp);
    if (match && match[2] && match[2].length === 11) {
      return match[2];
    }
    try {
      const parsed = new URL(cleanUrl);
      if (parsed.hostname.includes('youtube.com') || parsed.hostname.includes('youtu.be')) {
        const v = parsed.searchParams.get('v');
        if (v && v.length === 11) return v;
      }
    } catch {}
    return null;
  };

  const createDiscussionMutation = useMutation({
    mutationFn: (content: string) => discussionApi.createDiscussion(courseId!, selectedLessonId!, content),
    onSuccess: () => {
      setDiscussionText('');
      queryClient.invalidateQueries({ queryKey: ['discussions', courseId, selectedLessonId] });
      successToast(t('learning.toast.discussionPosted'), t('common.success'));
    }
  });

  const addCommentMutation = useMutation({
    mutationFn: ({ dId, content }: { dId: string, content: string }) => discussionApi.addComment(courseId!, selectedLessonId!, dId, content),
    onSuccess: () => {
      setCommentText('');
      queryClient.invalidateQueries({ queryKey: ['comments', courseId, selectedLessonId, expandedDiscussionId] });
      queryClient.invalidateQueries({ queryKey: ['discussions', courseId, selectedLessonId] });
      successToast(t('learning.toast.replyPosted'), t('common.success'));
    }
  });

  const handlePostDiscussion = () => {
    if (!discussionText.trim()) return;
    createDiscussionMutation.mutate(discussionText);
  };

  const handlePostComment = (dId: string) => {
    if (!commentText.trim()) return;
    addCommentMutation.mutate({ dId, content: commentText });
  };

  if (isLoadingLessons || isLoadingModules || isLoadingProgress || isLoadingEnrollments) {
    return (
      <div className="bg-[#FBFBFA] dark:bg-[#111111] flex items-center justify-center py-32 min-h-screen">
        <LoadingScreen title={t('common.loadingWorkspace')} message={t('learning.loading')} />
      </div>
    );
  }

  const err: any = error;
  if ((err && err.response?.status === 403) || (!isEnrolled && user?.role === 'student')) {
    return (
      <div className="bg-[#FBFBFA] dark:bg-[#111111] flex items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 text-rose-500 rounded-full flex items-center justify-center mx-auto">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M8 11h8"/></svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('learning.accessDenied')}</h2>
            <p className="mt-2 text-slate-500 dark:text-slate-400">{t('learning.accessDeniedDesc')}</p>
          </div>
          <Button className="w-full" onClick={() => navigate(`/courses/${courseId}`)}>{t('learning.backToCourse')}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#FBFBFA] dark:bg-[#111111] text-[#111111] dark:text-[#FBFBFA] selection:bg-slate-200 dark:selection:bg-slate-800 min-h-screen">
      
      {/* Top minimal nav: Synchronized with floating navbar (hidden when navbar is visible, shown when navbar is hidden) */}
      <header className={`fixed top-0 left-0 right-0 h-14 border-b border-[#EAEAEA] dark:border-white/10 flex items-center px-6 lg:px-8 bg-white/95 dark:bg-[#111111]/95 backdrop-blur-md z-40 transition-all duration-300 ease-out transform ${
        isNavbarVisible 
          ? '-translate-y-full opacity-0 pointer-events-none' 
          : 'translate-y-0 opacity-100 pointer-events-auto shadow-sm'
      }`}>
        <div className="flex items-center justify-between w-full max-w-[1400px] mx-auto gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <Link to={`/courses/${courseId || ''}`} className="text-sm font-medium text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 transition-colors flex items-center gap-1.5 shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              {t('learning.backToCourse', 'Quay lại khóa học')}
            </Link>
            <div className="w-[1px] h-4 bg-slate-200 dark:bg-white/10 shrink-0"></div>
            <span className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white truncate">
              {courseData?.data?.course?.title ? lv(courseData.data.course.title) : t('learning.courseViewer', 'Xem bài giảng')}
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 hidden sm:inline">
              {completedLessons.length}/{allLessons.length} {t('common.lessons', 'bài học')} ({progressPercent}%)
            </span>
            <button
              type="button"
              onClick={toggleNavbarVisibility}
              className="px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
              title="Mở thanh điều hướng trang chính"
            >
              <span>🧭 Menu chính</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area: Sufficient top spacing so floating navbar does not overlap */}
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 pt-24 lg:pt-28 pb-12">
        {/* Subtle breadcrumb bar and focus mode toggle */}
        <div className="flex items-center justify-between gap-4 mb-6 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2 min-w-0">
            <Link to={`/courses/${courseId || ''}`} className="hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold flex items-center gap-1 shrink-0 transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              {t('learning.backToCourse', 'Quay lại khóa học')}
            </Link>
            <span>/</span>
            <span className="truncate text-slate-700 dark:text-slate-200 font-medium">
              {courseData?.data?.course?.title ? lv(courseData.data.course.title) : ''}
            </span>
            {selectedLesson && (
              <>
                <span>/</span>
                <span className="truncate text-indigo-600 dark:text-indigo-400 font-semibold">
                  {lv(selectedLesson.title)}
                </span>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={toggleNavbarVisibility}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-600 dark:text-slate-300 font-medium transition-colors shrink-0 shadow-xs"
            title={isNavbarVisible ? 'Ẩn menu chính (Chế độ tập trung)' : 'Hiện lại menu chính'}
          >
            <span>{isNavbarVisible ? 'Ẩn menu (Tập trung)' : 'Hiện menu chính'}</span>
          </button>
        </div>
        
        {/* Asymmetrical Layout */}
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* Left Column (Video + Notes) */}
          <div className="lg:col-span-8 flex flex-col gap-10">
            {selectedAssignmentId ? (
              <div className="bg-white dark:bg-[#1A1A1A] border border-slate-200 dark:border-white/10 rounded-2xl p-8 flex flex-col gap-6 shadow-sm">
                {(() => {
                  const assignment = assignments.find((a: any) => a._id === selectedAssignmentId);
                  if (!assignment) return <p className="text-slate-500">Loading assignment...</p>;
                  return (
                    <div className="space-y-8">
                        <div className="border-b border-[#EAEAEA] dark:border-white/10 pb-6 flex items-start justify-between gap-4">
                          <div>
                          <h1 className="text-3xl font-bold tracking-tight">{assignment.title}</h1>
                          <p className="text-sm text-slate-500 mt-2">
                            {t('learning.assignment.dueDate')}: {new Date(assignment.dueDate).toLocaleDateString()} | {t('learning.assignment.maxScore')}: {assignment.maxPoints} pts
                          </p>
                        </div>
                        <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full ${mySubmissionData ? (mySubmissionData.status === 'graded' ? 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-400' : 'bg-amber-100 dark:bg-amber-950/30 text-amber-800 dark:text-amber-400') : 'bg-slate-100 dark:bg-white/5 text-slate-500'}`}>
                          {mySubmissionData ? mySubmissionData.status.toUpperCase() : t('learning.assignment.notSubmitted')}
                        </span>
                      </div>

                      <div className="space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">{t('common.description', 'Description')}</h3>
                        <p className="text-slate-600 dark:text-slate-300 text-sm whitespace-pre-line leading-relaxed">{assignment.description}</p>
                      </div>

                      {assignment.attachmentUrl && (
                        <div className="space-y-3">
                          <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">{t('learning.assignment.materials', 'Materials')}</h3>
                          <a href={assignment.attachmentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-indigo-500 hover:underline">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                            {t('learning.assignment.downloadRef', 'Download reference files')}
                          </a>
                        </div>
                      )}

                      <div className="border-t border-[#EAEAEA] dark:border-white/10 pt-8">
                        {mySubmissionData ? (
                          <div className="space-y-6">
                            <div className="space-y-2">
                              <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">{t('learning.assignment.yourSubmission')}</h3>
                              <div className="bg-slate-50 dark:bg-white/5 p-5 rounded-2xl space-y-4">
                                {mySubmissionData.studentNotes && (
                                  <div>
                                    <span className="text-xs font-bold text-slate-400 block mb-1">{t('learning.assignment.notes')}:</span>
                                    <p className="text-sm text-slate-700 dark:text-slate-300">{mySubmissionData.studentNotes}</p>
                                  </div>
                                )}
                                <div>
                                  <span className="text-xs font-bold text-slate-400 block mb-1.5">{t('learning.assignment.submittedFiles')}:</span>
                                  <div className="flex flex-col gap-2">
                                    {mySubmissionData.submittedFiles?.map((file: any, index: number) => (
                                      <a key={index} href={file.url} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-500 hover:underline flex items-center gap-2">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
                                        {file.name}
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {mySubmissionData.status === 'graded' && (
                              <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/20 p-5 rounded-2xl space-y-4">
                                <div className="flex items-center justify-between border-b border-emerald-200/20 pb-3">
                                  <span className="font-bold text-sm text-emerald-800 dark:text-emerald-400">{t('learning.assignment.scoreAwarded')}:</span>
                                  <span className="font-mono font-bold text-xl text-emerald-600 dark:text-emerald-400">{mySubmissionData.grade} / {assignment.maxPoints} pts</span>
                                </div>
                                {mySubmissionData.feedback && (
                                  <div>
                                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400 block mb-1">{t('learning.assignment.teacherFeedback')}:</span>
                                    <p className="text-sm text-slate-700 dark:text-slate-300 italic">"{mySubmissionData.feedback}"</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-6">
                            <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">{t('learning.assignment.submitWork')}</h3>
                            <div className="flex flex-col gap-6">
                              <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">{t('learning.assignment.submissionNotes')}</label>
                                <textarea 
                                  value={submitNotesText}
                                  onChange={(e) => setSubmitNotesText(e.target.value)}
                                  placeholder={t('learning.assignment.writeNotes')}
                                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all min-h-[100px]"
                                />
                              </div>

                              <div className="border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center bg-slate-50/50 dark:bg-white/5">
                                <svg className="w-8 h-8 text-indigo-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                {uploadingFile ? (
                                  <div className="space-y-2">
                                    <div className="animate-spin w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto" />
                                    <span className="text-sm text-slate-400">{t('common.loading')}</span>
                                  </div>
                                ) : (
                                  <div className="space-y-1">
                                    <label className="cursor-pointer text-indigo-400 hover:text-indigo-300 font-bold text-sm block">
                                      <span>{t('learning.assignment.uploadFile')}</span>
                                      <input 
                                        type="file" 
                                        className="hidden" 
                                        onChange={handleFileUpload} 
                                        accept=".pdf,.zip,.rar,.doc,.docx,.png,.jpg,.jpeg"
                                      />
                                    </label>
                                    <span className="text-xs text-slate-400 block">{t('learning.assignment.uploadHint')}</span>
                                  </div>
                                )}
                              </div>

                              <div className="grid md:grid-cols-2 gap-6">
                                <div className="flex flex-col gap-2">
                                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">{t('learning.assignment.fileName')}</label>
                                  <input 
                                    type="text" 
                                    value={submitFileName}
                                    onChange={(e) => setSubmitFileName(e.target.value)}
                                    placeholder="e.g. project_submission.zip"
                                    className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                  />
                                </div>
                                <div className="flex flex-col gap-2">
                                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">{t('learning.assignment.fileLink')}</label>
                                  <input 
                                    type="text" 
                                    value={submitFileUrl}
                                    onChange={(e) => setSubmitFileUrl(e.target.value)}
                                    placeholder="e.g. https://cloudinary.com/..."
                                    className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                  />
                                </div>
                              </div>

                              <div className="flex justify-end">
                                <Button 
                                  onClick={() => {
                                    submitAssignmentMutation.mutate({
                                      aId: assignment._id,
                                      files: [{ name: submitFileName || 'submission.zip', url: submitFileUrl }],
                                      notes: submitNotesText
                                    });
                                  }}
                                  disabled={submitAssignmentMutation.isPending || !submitFileName.trim() || !submitFileUrl.trim()}
                                >
                                  {submitAssignmentMutation.isPending ? t('learning.assignment.submitting') : t('learning.assignment.submitBtn')}
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <>
                {/* Cinematic Video Player */}
                <div className="flex flex-col gap-5">
                  <div className="relative aspect-video w-full bg-black rounded-xl overflow-hidden group shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                    {selectedQuiz ? (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 border border-slate-800 text-center p-8">
                         <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
                           <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                             <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
                           </svg>
                         </div>
                         <h3 className="text-2xl font-bold text-white mb-2">{lv(selectedQuiz.title)}</h3>
                         <p className="text-slate-400 max-w-md mb-4 text-sm leading-relaxed">{t('learning.quiz.readyPrompt')}</p>
                         
                         <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400 mb-6 bg-slate-800/60 px-5 py-2.5 rounded-xl border border-slate-700/50">
                           <span>{t('learning.questions', 'Questions')}: <strong className="text-white">{selectedQuiz.questionCount ?? selectedQuiz.totalQuestions ?? 0}</strong></span>
                           <span>•</span>
                           <span>{t('teacher.curriculum.timeLimit', 'Time limit')}: <strong className="text-white">{selectedQuiz.timeLimit ? `${selectedQuiz.timeLimit} mins` : t('teacher.curriculum.noLimit')}</strong></span>
                           <span>•</span>
                           <span>{t('teacher.curriculum.passingScore', 'Passing score')}: <strong className="text-white">{selectedQuiz.passingScore}%</strong></span>
                         </div>

                         {selectedQuiz.isCompleted && (
                           <div className={`mb-6 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 ${selectedQuiz.isPassed ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                             <span>{selectedQuiz.isPassed ? '✓ ' + t('quizPage.passed') : '✕ ' + t('quizPage.failed')}</span>
                             <span>—</span>
                             <span>{t('quizPage.yourScore')}: <strong>{selectedQuiz.scorePercentage ?? selectedQuiz.score}%</strong></span>
                           </div>
                         )}

                         <Button variant="pill" onClick={() => navigate(`/courses/${courseId}/quizzes/${selectedQuiz._id}/take`)}>
                            {selectedQuiz.isCompleted ? t('quizPage.retakeBtn') : t('learning.quiz.takeNow')}
                         </Button>
                      </div>
                    ) : selectedLesson ? (
                      selectedLesson.videoUrl && getYoutubeVideoId(selectedLesson.videoUrl) ? (
                        <iframe
                          width="100%"
                          height="100%"
                          src={`https://www.youtube.com/embed/${getYoutubeVideoId(selectedLesson.videoUrl)}?autoplay=1`}
                          title="YouTube video player"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="w-full h-full"
                        ></iframe>
                      ) : selectedLesson.videoUrl ? (
                        <>
                          <video 
                            key={selectedLessonId || 'video-player'}
                            ref={videoRef}
                            controls 
                            autoPlay
                            className="w-full h-full object-contain" 
                            src={getTransformedVideoUrl(selectedLesson.videoUrl, selectedQuality)}
                            onPause={handleVideoPause}
                            onLoadedMetadata={handleVideoLoadedMetadata}
                            onEnded={completeLesson}
                          >
                            Your browser does not support the video tag.
                          </video>

                          {/* In-Player Floating Quality Indicator & Quick Switcher */}
                          <div className="absolute top-3 right-3 z-30 opacity-90 hover:opacity-100 transition-opacity pointer-events-auto">
                            <div className="relative">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowQualityMenu(!showQualityMenu);
                                  setShowSpeedMenu(false);
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/75 hover:bg-black/90 text-white backdrop-blur-md border border-white/20 text-xs font-semibold shadow-lg transition-all"
                                title="Điều chỉnh chất lượng video MP4"
                              >
                                <Settings size={13} className="text-indigo-400" />
                                <span className="font-mono text-emerald-400 font-bold uppercase">{selectedQuality}</span>
                                <ChevronDown size={12} className={`transition-transform duration-200 ${showQualityMenu ? 'rotate-180' : ''}`} />
                              </button>

                              {showQualityMenu && (
                                <>
                                  <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setShowQualityMenu(false); }} />
                                  <div className="absolute right-0 top-full mt-2 w-48 rounded-2xl bg-slate-900/95 border border-white/20 shadow-2xl p-1.5 z-50 flex flex-col gap-0.5 backdrop-blur-xl text-white">
                                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-white/10 mb-1">
                                      Chất lượng phát MP4
                                    </div>
                                    {QUALITY_OPTIONS.map((opt) => (
                                      <button
                                        key={opt.id}
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleQualityChange(opt.id);
                                        }}
                                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors text-left ${
                                          selectedQuality === opt.id
                                            ? 'bg-indigo-600 text-white font-bold'
                                            : 'text-slate-300 hover:bg-white/10'
                                        }`}
                                      >
                                        <span>{opt.label}</span>
                                        {selectedQuality === opt.id && <Check size={14} className="text-white" />}
                                      </button>
                                    ))}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 border border-slate-800 text-center p-8 gap-3">
                          <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                          </div>
                          <p className="text-white font-medium text-base">{t('learning.videoNotAvailable', 'Bài học này chưa có video hoặc đang được cập nhật.')}</p>
                          <p className="text-slate-400 text-xs">{t('learning.checkBackLater', 'Vui lòng kiểm tra lại sau hoặc liên hệ giảng viên.')}</p>
                        </div>
                      )
                    ) : (
                      <div className="w-full h-full flex items-center justify-center opacity-60">
                         <p className="text-white">{t('learning.noContent')}</p>
                      </div>
                    )}
                  </div>

                  {/* Video Actions & Quality Toolbar */}
                  {selectedLesson && !selectedQuiz && (
                    <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 sm:p-3 bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-2xl shadow-xs">
                      {/* Left: Bookmark Feature */}
                      <div className="flex items-center gap-2">
                        {!getYoutubeVideoId(selectedLesson.videoUrl) ? (
                          <button 
                            type="button"
                            onClick={() => setShowBookmarkInput(!showBookmarkInput)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
                          >
                            <BookmarkIcon size={14} />
                            <span>{t('learning.bookmark.add', 'Đánh dấu thời điểm')}</span>
                          </button>
                        ) : (
                          <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1 px-2">
                            <span>▶</span> YouTube Player
                          </span>
                        )}
                      </div>

                      {/* Right: Quality & Speed Controls */}
                      <div className="flex items-center gap-2">
                        {/* Video Quality Dropdown (Available for HTML5 / Cloudinary videos) */}
                        {!getYoutubeVideoId(selectedLesson.videoUrl) && (
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => { setShowQualityMenu(!showQualityMenu); setShowSpeedMenu(false); }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-white/10 transition-colors"
                              title="Chất lượng video"
                            >
                              <Settings size={13} className="text-indigo-500" />
                              <span className="text-slate-400 text-[11px] hidden sm:inline">Chất lượng:</span>
                              <span className="font-bold uppercase text-indigo-600 dark:text-indigo-400">{selectedQuality}</span>
                              <ChevronDown size={12} className={`transition-transform duration-200 ${showQualityMenu ? 'rotate-180' : ''}`} />
                            </button>

                            {showQualityMenu && (
                              <>
                                <div className="fixed inset-0 z-30" onClick={() => setShowQualityMenu(false)} />
                                <div className="absolute right-0 bottom-full mb-2 w-48 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/15 shadow-2xl p-1.5 z-40 flex flex-col gap-0.5">
                                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-white/10 mb-1">
                                    Chất lượng phát
                                  </div>
                                  {QUALITY_OPTIONS.map((opt) => (
                                    <button
                                      key={opt.id}
                                      type="button"
                                      onClick={() => handleQualityChange(opt.id)}
                                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors text-left ${
                                        selectedQuality === opt.id
                                          ? 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-bold'
                                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                                      }`}
                                    >
                                      <span>{opt.label}</span>
                                      {selectedQuality === opt.id && <Check size={14} className="text-indigo-600 dark:text-indigo-400" />}
                                    </button>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        )}

                        {/* Playback Speed Dropdown */}
                        {!getYoutubeVideoId(selectedLesson.videoUrl) && (
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => { setShowSpeedMenu(!showSpeedMenu); setShowQualityMenu(false); }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-white/10 transition-colors"
                              title="Tốc độ phát"
                            >
                              <Zap size={13} className="text-amber-500" />
                              <span className="text-slate-400 text-[11px] hidden sm:inline">Tốc độ:</span>
                              <span className="font-bold text-slate-800 dark:text-white">{playbackSpeed}x</span>
                              <ChevronDown size={12} className={`transition-transform duration-200 ${showSpeedMenu ? 'rotate-180' : ''}`} />
                            </button>

                            {showSpeedMenu && (
                              <>
                                <div className="fixed inset-0 z-30" onClick={() => setShowSpeedMenu(false)} />
                                <div className="absolute right-0 bottom-full mb-2 w-36 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/15 shadow-2xl p-1.5 z-40 flex flex-col gap-0.5">
                                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-white/10 mb-1">
                                    Tốc độ phát
                                  </div>
                                  {SPEED_OPTIONS.map((speed) => (
                                    <button
                                      key={speed}
                                      type="button"
                                      onClick={() => handleSpeedChange(speed)}
                                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors text-left ${
                                        playbackSpeed === speed
                                          ? 'bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold'
                                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                                      }`}
                                    >
                                      <span>{speed === 1 ? '1x (Chuẩn)' : `${speed}x`}</span>
                                      {playbackSpeed === speed && <Check size={14} className="text-amber-600 dark:text-amber-400" />}
                                    </button>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Bookmark Input Row */}
                  {showBookmarkInput && (
                    <div className="flex items-center gap-3">
                      <input 
                        type="text" 
                        value={bookmarkNote}
                        onChange={(e) => setBookmarkNote(e.target.value)}
                        placeholder={t('learning.bookmark.placeholder')}
                        className="flex-1 bg-white dark:bg-[#1A1A1A] border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <Button onClick={handleAddBookmark} disabled={!bookmarkNote.trim() || addBookmarkMutation.isPending}>{t('common.save')}</Button>
                    </div>
                  )}
                      {/* List Bookmarks */}
                      {(progressInfo?.bookmarks?.filter((b: any) => b.lesson === selectedLessonId)?.length || 0) > 0 && (
                        <div className="mt-2 space-y-2">
                          <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">{t('learning.bookmark.title')}</h4>
                          <div className="space-y-2">
                            {progressInfo?.bookmarks?.filter((b: any) => b.lesson === selectedLessonId).map((bookmark: any, idx: number) => (
                              <div key={idx} className="flex items-center gap-3 text-sm bg-slate-100 dark:bg-white/5 px-3 py-2 rounded-lg">
                                <button 
                                  onClick={() => { if(videoRef.current) videoRef.current.currentTime = bookmark.time; }}
                                  className="text-indigo-500 hover:text-indigo-400 font-mono text-xs font-bold"
                                >
                                  {Math.floor(bookmark.time / 60)}:{(Math.floor(bookmark.time % 60)).toString().padStart(2, '0')}
                                </button>
                                <span className="text-slate-700 dark:text-slate-300">{bookmark.note}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                  {/* Lesson Metadata */}
                  <div className="flex items-start justify-between gap-6 pb-8 border-b border-[#EAEAEA] dark:border-white/10">
                    <div>
                      {activeModuleTitle && (
                        <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1.5">
                          {activeModuleTitle}
                        </p>
                      )}
                      <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">{selectedQuiz ? lv(selectedQuiz.title) : (lv(selectedLesson?.title) || t('learning.noContent'))}</h1>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{selectedQuiz ? t('common.quiz') : t('common.lesson')}</p>
                    </div>
                    {!selectedQuiz && (
                      <button 
                        onClick={completeLesson}
                        disabled={markCompleteMutation.isPending || (selectedLessonId ? completedLessons.includes(selectedLessonId) : false)}
                        className="shrink-0 rounded-md bg-[#111111] dark:bg-white px-5 py-2.5 text-sm font-medium text-white dark:text-[#111111] transition-transform active:scale-95 hover:bg-slate-800 dark:hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {selectedLessonId && completedLessons.includes(selectedLessonId) ? t('learning.completed') : t('learning.markComplete')}
                      </button>
                    )}
                  </div>
                </div>

                {/* Interactive Studio Tabs under Video */}
                <div className="flex flex-col gap-6 mt-4">
                  <div className="flex items-center gap-2 border-b border-[#EAEAEA] dark:border-white/10 pb-px">
                    <button
                      onClick={() => setActiveTab('discussion')}
                      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
                        activeTab === 'discussion'
                          ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                          : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                      }`}
                    >
                      <span>{t('learning.discussion.title', 'Thảo luận & Hỏi đáp')}</span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-400">
                        {discussions.length}
                      </span>
                    </button>
                    <button
                      onClick={() => setActiveTab('notes')}
                      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
                        activeTab === 'notes'
                          ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                          : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                      }`}
                    >
                      <span>{t('learning.notes', 'Ghi chú cá nhân')}</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('resources')}
                      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
                        activeTab === 'resources'
                          ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                          : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                      }`}
                    >
                      <span>{t('learning.resources', 'Tài liệu đính kèm')}</span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-400">
                        {resources.length}
                      </span>
                    </button>
                  </div>

                  {/* Tab Content: Discussion */}
                  {activeTab === 'discussion' && (
                    <div className="flex flex-col gap-6">
                      {/* Input */}
                      <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center font-bold shrink-0 uppercase overflow-hidden">
                          {user?.avatar ? <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" /> : user?.name?.charAt(0)}
                        </div>
                        <div className="flex-1 flex flex-col gap-3">
                          <textarea 
                            value={discussionText}
                            onChange={(e) => setDiscussionText(e.target.value)}
                            placeholder={t('learning.discussion.askPrompt', 'Đặt câu hỏi hoặc thảo luận về bài giảng này...')} 
                            className="w-full min-h-[90px] resize-none bg-white dark:bg-[#1A1A1A] border border-slate-200 dark:border-white/10 rounded-xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                          />
                          <div className="flex justify-end">
                            <button 
                              onClick={handlePostDiscussion}
                              disabled={createDiscussionMutation.isPending || !discussionText.trim()}
                              className="px-5 py-2 bg-[#111111] dark:bg-white text-white dark:text-[#111111] text-sm font-medium rounded-lg hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors disabled:opacity-50"
                            >
                              {t('learning.discussion.postBtn', 'Đăng câu hỏi')}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Comments List */}
                      <div className="flex flex-col gap-4 mt-2">
                        {discussions.length === 0 ? (
                          <div className="text-center py-8 text-slate-400 text-sm">
                            Chưa có thảo luận nào cho bài giảng này. Hãy là người đầu tiên đặt câu hỏi!
                          </div>
                        ) : (
                          discussions.map((discussion) => (
                            <div key={discussion._id} className="flex flex-col gap-3 bg-white dark:bg-[#1A1A1A] border border-slate-200/80 dark:border-white/5 rounded-2xl p-4">
                              <div className="flex gap-3">
                                <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 bg-slate-200">
                                  {discussion.author?.avatar ? (
                                    <img src={discussion.author.avatar} alt="User" className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center font-bold text-slate-500 bg-slate-300">
                                      {discussion.author?.name?.charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                </div>
                                <div className="flex flex-col gap-1 w-full">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-sm text-slate-900 dark:text-white">{discussion.author?.name}</span>
                                    <span className="text-xs text-slate-500">{new Date(discussion.createdAt).toLocaleDateString()}</span>
                                    {discussion.author?.role === 'teacher' && <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full">{t('learning.discussion.instructorTag', 'Giảng viên')}</span>}
                                  </div>
                                  <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                                    {discussion.content}
                                  </p>
                                  <div className="flex items-center gap-4 mt-1 text-xs font-medium text-slate-500">
                                    <button 
                                      onClick={() => setExpandedDiscussionId(expandedDiscussionId === discussion._id ? null : discussion._id)}
                                      className="hover:text-indigo-500 transition-colors"
                                    >
                                      {expandedDiscussionId === discussion._id ? t('learning.discussion.hideReplies', 'Ẩn phản hồi') : t('learning.discussion.reply', 'Trả lời')}
                                    </button>
                                    <span className="flex items-center gap-1 text-slate-400">
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
                                      {discussion.commentsCount}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {expandedDiscussionId === discussion._id && (
                                <div className="ml-12 pl-3 border-l-2 border-slate-100 dark:border-slate-800 flex flex-col gap-4 pt-2">
                                  {comments.map((comment) => (
                                    <div key={comment._id} className="flex gap-3">
                                      <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 bg-slate-200">
                                        {comment.author?.avatar ? (
                                          <img src={comment.author.avatar} alt="User" className="w-full h-full object-cover" />
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center font-bold text-slate-500 bg-slate-300 text-xs">
                                            {comment.author?.name?.charAt(0).toUpperCase()}
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex flex-col gap-1 w-full">
                                        <div className="flex items-center gap-2">
                                          <span className="font-semibold text-xs text-slate-900 dark:text-white">{comment.author?.name}</span>
                                          <span className="text-[10px] text-slate-500">{new Date(comment.createdAt).toLocaleDateString()}</span>
                                          {comment.author?.role === 'teacher' && <span className="text-[9px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full">{t('learning.discussion.instructorTag', 'Giảng viên')}</span>}
                                        </div>
                                        <p className="text-xs text-slate-600 dark:text-slate-300">{comment.content}</p>
                                      </div>
                                    </div>
                                  ))}
                                  
                                  <div className="flex gap-2 mt-1">
                                    <input 
                                      type="text" 
                                      value={commentText}
                                      onChange={(e) => setCommentText(e.target.value)}
                                      placeholder={t('learning.discussion.replyPlaceholder', 'Viết phản hồi...')}
                                      className="flex-1 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <button 
                                      onClick={() => handlePostComment(discussion._id)}
                                      disabled={!commentText.trim() || addCommentMutation.isPending}
                                      className="px-3 py-1.5 bg-indigo-500 text-white text-xs font-medium rounded-lg hover:bg-indigo-600 transition-colors disabled:opacity-50"
                                    >
                                      {t('learning.discussion.reply', 'Gửi')}
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* Tab Content: Notes */}
                  {activeTab === 'notes' && (
                    <div className="flex flex-col gap-4">
                      <div className="bg-white dark:bg-[#1A1A1A] border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">{t('learning.notes', 'Ghi chú cá nhân')}</h3>
                          <span className="text-xs text-slate-400">Tự động đồng bộ</span>
                        </div>
                        <textarea
                          value={notes}
                          onChange={(event) => setNotes(event.target.value)}
                          placeholder={t('learning.notesPlaceholder', 'Bắt đầu gõ ghi chú của bạn...')}
                          className="w-full min-h-[140px] resize-none bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4 text-sm leading-relaxed text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* Tab Content: Resources */}
                  {activeTab === 'resources' && (
                    <div className="grid sm:grid-cols-2 gap-3">
                      {resources.map((res) => (
                        <div key={res.title} className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1A1A1A] flex items-center justify-between shadow-sm">
                          <div>
                            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{res.title}</h4>
                            <span className="text-xs font-mono text-indigo-500 uppercase">{res.type}</span>
                          </div>
                          <button className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 hover:text-indigo-600 transition-colors">
                            Tải về
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Right Column (Curriculum) */}
          <div className="lg:col-span-4 flex flex-col gap-6 lg:sticky lg:top-20">
            
            {/* Ultra-minimal Progress */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold tracking-widest uppercase mb-3 text-slate-500">
                <span>{t('learning.progress', 'Tiến độ')}</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="h-[2px] w-full bg-[#EAEAEA] dark:bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-[#111111] dark:bg-white"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>

              {/* Phase 1: Certificate claim — appears only when course is 100% complete */}
              {progressPercent >= 100 && (
                <div className="mt-4">
                  {claimedCertificate ? (
                    <a
                      href={claimedCertificate.pdfUrl || claimedCertificate.validationUrl || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-xl text-sm font-semibold border border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                      {t('learning.certificate.viewBtn', 'Xem chứng chỉ')}
                    </a>
                  ) : (
                    <button
                      onClick={() => courseId && claimCertificateMutation.mutate(courseId)}
                      disabled={claimCertificateMutation.isPending}
                      className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-xl text-sm font-semibold border border-amber-200 dark:border-amber-500/20 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>
                      {claimCertificateMutation.isPending ? t('learning.certificate.generating', 'Đang tạo...') : t('learning.certificate.claimBtn', 'Nhận chứng chỉ')}
                    </button>
                  )}
                  {claimCertificateMutation.isError && (
                    <p className="mt-2 text-xs text-rose-500 text-center">
                      {(claimCertificateMutation.error as any)?.response?.data?.message || 'Không thể tạo chứng chỉ.'}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Typography-driven Curriculum with Independent Scroll */}
            <LearningCurriculumSidebar
              curriculumModules={curriculumModules}
              allLessons={allLessons}
              selectedLessonId={selectedLessonId}
              selectedQuizId={selectedQuizId}
              selectedAssignmentId={selectedAssignmentId}
              completedLessons={completedLessons}
              quizzes={quizzes}
              assignments={assignments}
              practiceLimit={practiceLimit}
              onSelectLesson={handleSelectLesson}
              onSelectQuiz={handleSelectQuiz}
              onSelectAssignment={handleSelectAssignment}
              onStartPractice={handleStartPractice}
              onPracticeLimitChange={setPracticeLimit}
              t={t}
              lv={lv}
            />

          </div>
        </div>
      </div>

      <Toast
        visible={showAchievement}
        title={t('learning.toast.lessonCompleted')}
        message={t('learning.toast.lessonCompleted')}
        variant="success"
        position="bottom-right"
      />
      <Toast
        visible={showCertSuccess}
        title={t('learning.certificate.readyTitle')}
        message={t('learning.certificate.readyMsg')}
        variant="success"
        position="bottom-right"
      />
    </div>
  );
};

export default Learning;
