import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PageShell, SectionHeader, Button, Toast, Input } from '../../components/ui';
import { courseApi } from '../../services/course.api';
import { moduleApi, Module } from '../../services/module.api';
import { lessonApi, Lesson } from '../../services/lesson.api';
import { quizApi, Quiz, Question } from '../../services/quiz.api';
import { assignmentApi, Assignment } from '../../services/assignment.api';
import { uploadApi } from '../../services/upload.api';
import { useLocalizedValue } from '../../utils/localized';
import { 
  GripVertical, Plus, Trash2, Edit3, Video, FileQuestion, 
  BookOpen, HelpCircle, Upload, CheckCircle2, FileText,
  Play, Clock, Search, X, AlertTriangle, Sparkles, ExternalLink,
  ChevronDown, ChevronUp, FolderPlus, Layers, Lock
} from 'lucide-react';

/* ── Video & Duration Utilities ───────────────────────────────────── */
const getYouTubeEmbedUrl = (url?: string): string | null => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? `https://www.youtube-nocookie.com/embed/${match[2]}?autoplay=1` : null;
};

const getYouTubeId = (url?: string): string | null => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

const formatDuration = (seconds?: number): string => {
  if (!seconds || seconds <= 0) return '';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const remainMins = mins % 60;
    return `${hrs}h ${remainMins}m`;
  }
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const formatTotalDuration = (lessons: Lesson[], t?: any): string => {
  const totalSeconds = lessons.reduce((sum, l) => sum + (Number(l.duration) || 0), 0);
  const minLabel = t ? t('teacher.curriculum.mins', 'phút') : 'phút';
  const secLabel = t ? t('common.seconds', 'giây') : 'giây';
  const hrLabel = t ? t('common.hours', 'giờ') : 'giờ';
  if (totalSeconds <= 0) return `0 ${minLabel}`;
  if (totalSeconds < 60) return `${totalSeconds} ${secLabel}`;
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  if (hrs > 0) {
    return `${hrs} ${hrLabel} ${mins > 0 ? `${mins} ${minLabel}` : ''}`.trim();
  }
  return `${mins} ${minLabel}`;
};

/* ── Sortable Lesson Item Component ──────────────────────────────── */
interface SortableLessonItemProps {
  lesson: Lesson;
  index: number;
  moduleId: string;
  onEdit: (l: Lesson, moduleId: string) => void;
  onDelete: (id: string, title: string) => void;
  onPreview: (l: Lesson) => void;
  lv: (val: any) => string;
  t: (key: string, fallback?: string) => string;
}

const SortableLessonItem = ({ lesson, index, moduleId, onEdit, onDelete, onPreview, lv, t }: SortableLessonItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: lesson._id,
    data: { type: 'lesson', moduleId }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isYouTube = lesson.provider === 'youtube' || (lesson.videoUrl && (lesson.videoUrl.includes('youtube.com') || lesson.videoUrl.includes('youtu.be')));
  const durationText = formatDuration(lesson.duration);
  const lessonTitle = lv(lesson.title) || t('common.lesson', 'Bài học');
  const isFree = Boolean(lesson.isFreePreview || lesson.isPreview);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative flex flex-col sm:flex-row sm:items-center gap-4 p-4 md:p-5 bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-200 shadow-sm hover:shadow-md mb-2.5 ${
        isDragging
          ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-xl opacity-90 z-20'
          : 'border-slate-200 dark:border-white/10 hover:border-indigo-200 dark:hover:border-white/20'
      }`}
    >
      {/* Drag handle, Index Badge & Play button */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          {...attributes}
          {...listeners}
          title={t('teacher.curriculum.dragLesson', 'Kéo để đổi thứ tự bài học')}
          className="p-1.5 -ml-1 text-slate-400 hover:text-indigo-600 dark:hover:text-white cursor-grab active:cursor-grabbing rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
        >
          <GripVertical size={18} />
        </button>

        <span className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 flex items-center justify-center text-xs font-bold font-mono text-slate-600 dark:text-slate-300 shrink-0">
          {String(index + 1).padStart(2, '0')}
        </span>

        <button
          onClick={() => onPreview(lesson)}
          title={t('teacher.curriculum.previewVideo', 'Xem trước')}
          className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-600 dark:hover:bg-indigo-600 text-indigo-600 dark:text-indigo-400 hover:text-white dark:hover:text-white flex items-center justify-center shrink-0 transition-colors shadow-sm cursor-pointer"
        >
          <Play size={18} className="fill-current ml-0.5" />
        </button>
      </div>

      {/* Main Info */}
      <div className="flex-1 min-w-0 pr-2">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <h4
            onClick={() => onPreview(lesson)}
            className="font-semibold text-slate-900 dark:text-white text-base truncate hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition-colors"
            title={lessonTitle}
          >
            {lessonTitle}
          </h4>
        </div>

        {/* Metadata Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          {isFree ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-500/20 font-semibold text-[11px]">
              <Sparkles size={12} className="text-emerald-500" />
              {t('teacher.curriculum.freeBadge', 'Học thử (Preview)')}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 font-medium text-[11px] border border-slate-200/60 dark:border-white/5">
              <Lock size={11} className="text-slate-400" />
              {t('teacher.curriculum.lockedBadge', 'Khóa học viên')}
            </span>
          )}

          {isYouTube ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-500/20 font-semibold text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              YouTube Video
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-500/20 font-semibold text-[11px]">
              <Video size={12} />
              Cloudinary Video
            </span>
          )}

          {durationText ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 font-mono text-[11px] border border-slate-200/60 dark:border-white/5">
              <Clock size={12} className="text-slate-400" />
              {durationText}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100/60 dark:bg-white/5 text-slate-400 font-mono text-[11px] border border-slate-200/40 dark:border-white/5">
              <Clock size={12} className="text-slate-400" />
              {t('teacher.curriculum.noDuration', 'Chưa có thời lượng')}
            </span>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-white/5 w-full sm:w-auto justify-end">
        <button
          onClick={() => onPreview(lesson)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded-xl transition-colors border border-indigo-100 dark:border-indigo-500/20 cursor-pointer"
          title={t('teacher.curriculum.previewVideo', 'Xem trước')}
        >
          <Play size={13} className="fill-current" />
          <span>{t('teacher.curriculum.previewVideo', 'Xem trước')}</span>
        </button>

        <button
          onClick={() => onEdit(lesson, moduleId)}
          className="p-2 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
          title={t('teacher.curriculum.editLesson', 'Chỉnh sửa bài học')}
        >
          <Edit3 size={16} />
        </button>

        <button
          onClick={() => onDelete(lesson._id, lessonTitle)}
          className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
          title={t('teacher.curriculum.deleteLessonConfirm', 'Xóa bài học')}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};

/* ── Sortable Module Card Component ──────────────────────────────── */
interface SortableModuleCardProps {
  module: Module;
  index: number;
  isCollapsed: boolean;
  onToggleCollapse: (moduleId: string) => void;
  onEditModule: (mod: Module) => void;
  onDeleteModule: (mod: Module) => void;
  onAddLesson: (moduleId: string) => void;
  onEditLesson: (lesson: Lesson, moduleId: string) => void;
  onDeleteLesson: (id: string, title: string) => void;
  onPreviewLesson: (lesson: Lesson) => void;
  lv: (val: any) => string;
  t: (key: string, fallback?: string) => string;
}

const SortableModuleCard = ({
  module,
  index,
  isCollapsed,
  onToggleCollapse,
  onEditModule,
  onDeleteModule,
  onAddLesson,
  onEditLesson,
  onDeleteLesson,
  onPreviewLesson,
  lv,
  t,
}: SortableModuleCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: module._id,
    data: { type: 'module' }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const lessons = module.lessons || [];
  const moduleTitle = lv(module.title) || `${t('curriculum.module', 'Module')} ${index + 1}`;
  const moduleDesc = lv(module.description);
  const totalDuration = formatTotalDuration(lessons, t);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-3xl border transition-all duration-200 mb-6 overflow-hidden ${
        isDragging
          ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-2xl opacity-90 z-30 bg-indigo-50/10'
          : 'border-slate-200/90 dark:border-white/10 bg-slate-50/40 dark:bg-slate-900/40 shadow-xs'
      }`}
    >
      {/* Module Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 bg-white dark:bg-slate-900/90 border-b border-slate-200/80 dark:border-white/5">
        <div className="flex items-center gap-3 min-w-0">
          <button
            {...attributes}
            {...listeners}
            title={t('teacher.curriculum.dragModule', 'Kéo để đổi thứ tự chương học')}
            className="p-1.5 -ml-1 text-slate-400 hover:text-indigo-600 dark:hover:text-white cursor-grab active:cursor-grabbing rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            <GripVertical size={20} />
          </button>

          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-mono font-black text-xs shrink-0 border border-indigo-100 dark:border-indigo-500/20">
            {String(index + 1).padStart(2, '0')}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                {t('curriculum.module', 'Module')} {index + 1}
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {lessons.length} {t('common.lessons', 'bài học')}
              </span>
              {totalDuration && (
                <>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    {totalDuration}
                  </span>
                </>
              )}
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base truncate mt-0.5">
              {moduleTitle}
            </h3>
            {moduleDesc && (
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                {moduleDesc}
              </p>
            )}
          </div>
        </div>

        {/* Module Actions */}
        <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-white/5">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAddLesson(module._id)}
            className="rounded-xl text-xs py-1.5 px-3 font-semibold h-8"
          >
            <Plus size={14} className="mr-1" /> {t('teacher.curriculum.addLesson', 'Thêm bài học')}
          </Button>

          <button
            onClick={() => onEditModule(module)}
            className="p-2 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
            title={t('teacher.curriculum.editModule', 'Chỉnh sửa chương học')}
          >
            <Edit3 size={16} />
          </button>

          <button
            onClick={() => onDeleteModule(module)}
            className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
            title={t('teacher.curriculum.deleteModule', 'Xóa chương học')}
          >
            <Trash2 size={16} />
          </button>

          <button
            onClick={() => onToggleCollapse(module._id)}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
            title={isCollapsed ? t('teacher.curriculum.expandModule', "Mở rộng danh sách bài học") : t('teacher.curriculum.collapseModule', "Thu gọn")}
          >
            {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          </button>
        </div>
      </div>

      {/* Module Lessons Container */}
      {!isCollapsed && (
        <div className="p-4 sm:p-5">
          {lessons.length === 0 ? (
            <div className="text-center py-8 px-4 border border-dashed border-slate-200 dark:border-white/10 rounded-2xl bg-white/50 dark:bg-slate-900/30">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                {t('teacher.curriculum.emptyModule', 'Chương này chưa có bài học nào.')}
              </p>
              <Button
                size="sm"
                onClick={() => onAddLesson(module._id)}
                className="rounded-xl text-xs py-1.5"
              >
                <Plus size={14} className="mr-1" /> {t('teacher.curriculum.addFirstLesson', 'Thêm bài giảng đầu tiên')}
              </Button>
            </div>
          ) : (
            <SortableContext items={lessons.map(l => l._id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2.5">
                {lessons.map((lesson, lIdx) => (
                  <SortableLessonItem
                    key={lesson._id}
                    lesson={lesson}
                    index={lIdx}
                    moduleId={module._id}
                    onEdit={(l, mId) => onEditLesson(l, mId)}
                    onDelete={(id, title) => onDeleteLesson(id, title)}
                    onPreview={onPreviewLesson}
                    lv={lv}
                    t={t}
                  />
                ))}
              </div>
            </SortableContext>
          )}
        </div>
      )}
    </div>
  );
};

/* ── Main CurriculumEditor Page ──────────────────────────────────── */
const CurriculumEditor = () => {
  const { t } = useTranslation();
  const lv = useLocalizedValue();
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const backCoursesUrl = (location.state as any)?.from || (isAdmin ? '/admin-dashboard/content' : '/teacher-courses');

  const [activeTab, setActiveTab] = useState<'lessons' | 'quizzes' | 'assignments'>('lessons');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewLesson, setPreviewLesson] = useState<Lesson | null>(null);
  const [collapsedModuleIds, setCollapsedModuleIds] = useState<string[]>([]);

  // Target for deletion modal
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'module' | 'lesson' | 'quiz' | 'question' | 'assignment';
    id: string;
    name: string;
    lessonCount?: number;
  } | null>(null);
  const [deleteCascade, setDeleteCascade] = useState(false);

  // Module state
  const [modules, setModules] = useState<Module[]>([]);
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [moduleFormData, setModuleFormData] = useState({ title: '', description: '' });

  // Lesson state
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [targetModuleIdForLesson, setTargetModuleIdForLesson] = useState<string>('');
  const [lessonFormData, setLessonFormData] = useState({ 
    title: '', 
    videoUrl: '', 
    videoPublicId: null as string | null, 
    duration: 0, 
    provider: 'cloudinary' as 'cloudinary' | 'youtube',
    moduleId: '',
    isFreePreview: false
  });
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const uploadAbortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isUploadingVideo) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isUploadingVideo]);

  // Quiz states
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [quizFormData, setQuizFormData] = useState({ title: '', passingScore: 80, timeLimit: 15 });

  // Question states
  const [activeQuizForQuestions, setActiveQuizForQuestions] = useState<Quiz | null>(null);
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [questionFormData, setQuestionFormData] = useState({
    text: '',
    points: 1,
    explanation: '',
    options: [
      { text: '', isCorrect: true },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
    ]
  });

  // Assignment states
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [assignmentFormData, setAssignmentFormData] = useState({
    title: '',
    description: '',
    attachmentUrl: '',
    maxPoints: 100,
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  // Queries
  const { data: courseData, isLoading: courseLoading } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => courseApi.getCourseById(courseId!),
    enabled: !!courseId,
  });

  const { data: modulesData, isLoading: modulesLoading } = useQuery({
    queryKey: ['modules', courseId],
    queryFn: () => moduleApi.getModules(courseId!),
    enabled: !!courseId,
  });

  const { data: quizzesData, isLoading: quizzesLoading } = useQuery({
    queryKey: ['quizzes', courseId],
    queryFn: () => quizApi.getQuizzesByCourse(courseId!),
    enabled: !!courseId,
  });

  const { data: assignmentsData, isLoading: assignmentsLoading } = useQuery({
    queryKey: ['assignments', courseId],
    queryFn: () => assignmentApi.getAssignments(courseId!),
    enabled: !!courseId,
  });

  const { data: questionsData, isLoading: questionsLoading, refetch: refetchQuestions } = useQuery({
    queryKey: ['questions', activeQuizForQuestions?._id],
    queryFn: () => quizApi.getQuestionsForTeacher(activeQuizForQuestions!._id),
    enabled: !!activeQuizForQuestions?._id
  });

  // Synchronize modules from query
  useEffect(() => {
    if (modulesData?.data?.modules) {
      setModules(modulesData.data.modules);
    }
  }, [modulesData]);

  // Aggregate all lessons across modules for search and summary
  const allLessons = useMemo(() => {
    return modules.flatMap(m => m.lessons || []);
  }, [modules]);

  const filteredLessons = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return allLessons.filter(l =>
      (lv(l.title) || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allLessons, searchQuery, lv]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // ── Module Mutations ─────────────────────────────────────────────
  const createModuleMutation = useMutation({
    mutationFn: (data: { title: string; description?: string }) => moduleApi.createModule(courseId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules', courseId] });
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
      setIsModuleModalOpen(false);
      setModuleFormData({ title: '', description: '' });
      setToast({ message: 'Tạo chương học thành công!', type: 'success' });
    },
    onError: (err: any) => {
      setToast({ message: err?.response?.data?.message || 'Tạo chương học thất bại', type: 'error' });
    }
  });

  const updateModuleMutation = useMutation({
    mutationFn: (data: { title: string; description?: string }) => moduleApi.updateModule(courseId!, editingModule!._id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules', courseId] });
      setIsModuleModalOpen(false);
      setEditingModule(null);
      setToast({ message: 'Cập nhật chương học thành công!', type: 'success' });
    },
    onError: (err: any) => {
      setToast({ message: err?.response?.data?.message || 'Cập nhật chương học thất bại', type: 'error' });
    }
  });

  const deleteModuleMutation = useMutation({
    mutationFn: ({ id, cascade }: { id: string; cascade: boolean }) => moduleApi.deleteModule(courseId!, id, cascade),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules', courseId] });
      queryClient.invalidateQueries({ queryKey: ['lessons', courseId] });
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
      setDeleteTarget(null);
      setDeleteCascade(false);
      setToast({ message: 'Xóa chương học thành công!', type: 'success' });
    },
    onError: (err: any) => {
      setToast({ message: err?.response?.data?.message || 'Xóa chương học thất bại', type: 'error' });
    }
  });

  const reorderModulesMutation = useMutation({
    mutationFn: (newOrder: { id: string; order: number }[]) => moduleApi.reorderModules(courseId!, newOrder),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules', courseId] });
      setToast({ message: 'Đã lưu thứ tự chương học!', type: 'success' });
    },
    onError: () => setToast({ message: 'Lưu thứ tự chương học thất bại', type: 'error' })
  });

  // ── Lesson Mutations ─────────────────────────────────────────────
  const reorderLessonsMutation = useMutation({
    mutationFn: (newOrder: { id: string; order: number; moduleId?: string }[]) => lessonApi.reorderLessons(courseId!, newOrder),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules', courseId] });
      queryClient.invalidateQueries({ queryKey: ['lessons', courseId] });
      setToast({ message: t('teacher.curriculum.toasts.orderSaved'), type: 'success' });
    },
    onError: () => setToast({ message: t('teacher.curriculum.toasts.orderFailed'), type: 'error' }),
  });

  const createLessonMutation = useMutation({
    mutationFn: (data: any) => lessonApi.createLesson(courseId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules', courseId] });
      queryClient.invalidateQueries({ queryKey: ['lessons', courseId] });
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
      setIsLessonModalOpen(false);
      setToast({ message: t('teacher.curriculum.toasts.lessonAdded'), type: 'success' });
    },
    onError: (err: any) => {
      const errorMsg = err?.response?.data?.message || t('teacher.curriculum.toasts.lessonAddFailed', 'Không thể thêm bài học. Vui lòng kiểm tra lại thông tin.');
      setToast({ message: errorMsg, type: 'error' });
    }
  });

  const updateLessonMutation = useMutation({
    mutationFn: (data: any) => lessonApi.updateLesson(courseId!, editingLesson!._id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules', courseId] });
      queryClient.invalidateQueries({ queryKey: ['lessons', courseId] });
      setIsLessonModalOpen(false);
      setToast({ message: t('teacher.curriculum.toasts.lessonUpdated'), type: 'success' });
    },
    onError: (err: any) => {
      const errorMsg = err?.response?.data?.message || t('teacher.curriculum.toasts.lessonUpdateFailed', 'Không thể cập nhật bài học. Vui lòng kiểm tra lại thông tin.');
      setToast({ message: errorMsg, type: 'error' });
    }
  });

  const deleteLessonMutation = useMutation({
    mutationFn: (lessonId: string) => lessonApi.deleteLesson(courseId!, lessonId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules', courseId] });
      queryClient.invalidateQueries({ queryKey: ['lessons', courseId] });
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
      setDeleteTarget(null);
      setToast({ message: t('teacher.curriculum.toasts.lessonDeleted'), type: 'success' });
    },
    onError: (err: any) => {
      const errorMsg = err?.response?.data?.message || t('teacher.curriculum.toasts.lessonDeleteFailed', 'Không thể xóa bài học.');
      setToast({ message: errorMsg, type: 'error' });
    }
  });

  // ── Quiz & Assignment Mutations ──────────────────────────────────
  const createQuizMutation = useMutation({
    mutationFn: (data: any) => quizApi.createQuiz({ ...data, course: courseId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes', courseId] });
      setIsQuizModalOpen(false);
      setToast({ message: t('teacher.curriculum.toasts.quizCreated'), type: 'success' });
    }
  });

  const updateQuizMutation = useMutation({
    mutationFn: (data: any) => quizApi.updateQuiz(editingQuiz!._id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes', courseId] });
      setIsQuizModalOpen(false);
      setToast({ message: t('teacher.curriculum.toasts.quizUpdated'), type: 'success' });
    }
  });

  const deleteQuizMutation = useMutation({
    mutationFn: (quizId: string) => quizApi.deleteQuiz(quizId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes', courseId] });
      setDeleteTarget(null);
      setToast({ message: t('teacher.curriculum.toasts.quizDeleted'), type: 'success' });
    }
  });

  const createQuestionMutation = useMutation({
    mutationFn: (data: any) => quizApi.addQuestion(activeQuizForQuestions!._id, data),
    onSuccess: () => {
      refetchQuestions();
      setIsQuestionModalOpen(false);
      setToast({ message: t('teacher.curriculum.toasts.questionAdded'), type: 'success' });
    }
  });

  const updateQuestionMutation = useMutation({
    mutationFn: (data: any) => quizApi.updateQuestion(editingQuestion!._id!, data),
    onSuccess: () => {
      refetchQuestions();
      setIsQuestionModalOpen(false);
      setToast({ message: t('teacher.curriculum.toasts.questionUpdated'), type: 'success' });
    }
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: (questionId: string) => quizApi.deleteQuestion(questionId),
    onSuccess: () => {
      refetchQuestions();
      setDeleteTarget(null);
      setToast({ message: t('teacher.curriculum.toasts.questionDeleted'), type: 'success' });
    }
  });

  const createAssignmentMutation = useMutation({
    mutationFn: (data: any) => assignmentApi.createAssignment(courseId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments', courseId] });
      setIsAssignmentModalOpen(false);
      setToast({ message: t('teacher.curriculum.toasts.assignmentCreated'), type: 'success' });
    }
  });

  const updateAssignmentMutation = useMutation({
    mutationFn: (data: any) => assignmentApi.updateAssignment(editingAssignment!._id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments', courseId] });
      setIsAssignmentModalOpen(false);
      setToast({ message: t('teacher.curriculum.toasts.assignmentUpdated'), type: 'success' });
    }
  });

  const deleteAssignmentMutation = useMutation({
    mutationFn: (id: string) => assignmentApi.deleteAssignment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments', courseId] });
      setDeleteTarget(null);
      setToast({ message: t('teacher.curriculum.toasts.assignmentDeleted'), type: 'success' });
    }
  });

  // ── Drag and Drop Handler ─────────────────────────────────────────
  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // 1. Kiểm tra xem có phải đang kéo Module
    const isModuleDrag = modules.some(m => m._id === active.id);

    if (isModuleDrag) {
      setModules((prevModules) => {
        const oldIndex = prevModules.findIndex((m) => m._id === active.id);
        const newIndex = prevModules.findIndex((m) => m._id === over.id);
        if (oldIndex === -1 || newIndex === -1) return prevModules;
        const reordered = arrayMove(prevModules, oldIndex, newIndex);
        const payload = reordered.map((m, idx) => ({ id: m._id, order: idx + 1 }));
        reorderModulesMutation.mutate(payload);
        return reordered;
      });
      return;
    }

    // 2. Kéo Lesson: Tìm module nguồn và module đích
    let sourceModuleIndex = -1;
    let targetModuleIndex = -1;
    let sourceLessonIndex = -1;
    let targetLessonIndex = -1;

    modules.forEach((mod, mIdx) => {
      const lIdx = (mod.lessons || []).findIndex(l => l._id === active.id);
      if (lIdx !== -1) {
        sourceModuleIndex = mIdx;
        sourceLessonIndex = lIdx;
      }
      const overLIdx = (mod.lessons || []).findIndex(l => l._id === over.id);
      if (overLIdx !== -1) {
        targetModuleIndex = mIdx;
        targetLessonIndex = overLIdx;
      }
    });

    // Trường hợp kéo bài học trong cùng một module
    if (sourceModuleIndex !== -1 && sourceModuleIndex === targetModuleIndex && sourceLessonIndex !== targetLessonIndex) {
      setModules((prevModules) => {
        const newModules = [...prevModules];
        const targetModule = { ...newModules[sourceModuleIndex] };
        const currentLessons = [...(targetModule.lessons || [])];
        const reorderedLessons = arrayMove(currentLessons, sourceLessonIndex, targetLessonIndex);
        targetModule.lessons = reorderedLessons;
        newModules[sourceModuleIndex] = targetModule;

        const payload = reorderedLessons.map((l, idx) => ({
          id: l._id,
          order: idx + 1,
          moduleId: targetModule._id
        }));
        reorderLessonsMutation.mutate(payload);
        return newModules;
      });
    } else if (sourceModuleIndex !== -1 && targetModuleIndex !== -1 && sourceModuleIndex !== targetModuleIndex) {
      // Kéo bài học sang module khác (Cross-module move)
      setModules((prevModules) => {
        const newModules = [...prevModules];
        const sourceMod = { ...newModules[sourceModuleIndex] };
        const targetMod = { ...newModules[targetModuleIndex] };
        const sourceLessons = [...(sourceMod.lessons || [])];
        const targetLessons = [...(targetMod.lessons || [])];

        const [movedLesson] = sourceLessons.splice(sourceLessonIndex, 1);
        movedLesson.module = targetMod._id;
        targetLessons.splice(targetLessonIndex, 0, movedLesson);

        sourceMod.lessons = sourceLessons;
        targetMod.lessons = targetLessons;
        newModules[sourceModuleIndex] = sourceMod;
        newModules[targetModuleIndex] = targetMod;

        const payload = [
          ...sourceLessons.map((l, idx) => ({ id: l._id, order: idx + 1, moduleId: sourceMod._id })),
          ...targetLessons.map((l, idx) => ({ id: l._id, order: idx + 1, moduleId: targetMod._id }))
        ];
        reorderLessonsMutation.mutate(payload);
        return newModules;
      });
    }
  };

  // ── Video File Upload ────────────────────────────────────────────
  const handleVideoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const controller = new AbortController();
    uploadAbortControllerRef.current = controller;
    setIsUploadingVideo(true);
    setUploadProgress(0);

    try {
      const res = await uploadApi.uploadVideo(
        file,
        (percent) => setUploadProgress(percent),
        controller.signal
      );
      if (res.data?.data?.url) {
        setLessonFormData(prev => ({
          ...prev,
          videoUrl: res.data.data.url,
          videoPublicId: res.data.data.publicId || null,
          duration: res.data.data.duration || 0,
          provider: 'cloudinary'
        }));
        setToast({ message: t('teacher.curriculum.videoSuccess', 'Video uploaded successfully!'), type: 'success' });
      }
    } catch (err: any) {
      if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') {
        setToast({ message: t('teacher.curriculum.videoCancelled', 'Video upload cancelled'), type: 'error' });
      } else {
        const errorMsg = err?.response?.data?.message || t('teacher.curriculum.videoFailed', 'Video upload failed');
        setToast({ message: errorMsg, type: 'error' });
      }
    } finally {
      setIsUploadingVideo(false);
      setUploadProgress(0);
      uploadAbortControllerRef.current = null;
    }
  };

  const handleCancelUpload = () => {
    if (uploadAbortControllerRef.current) {
      uploadAbortControllerRef.current.abort();
      uploadAbortControllerRef.current = null;
    }
  };

  const handleDocFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingDoc(true);
      const res = await uploadApi.uploadDocument(file);
      if (res.data?.url || res.data?.data?.url) {
        const url = res.data?.url || res.data?.data?.url;
        setAssignmentFormData(prev => ({ ...prev, attachmentUrl: url }));
        setToast({ message: 'Attachment uploaded!', type: 'success' });
      }
    } catch (err) {
      setToast({ message: 'Document upload failed', type: 'error' });
    } finally {
      setIsUploadingDoc(false);
    }
  };

  // ── Modal Open Handlers ──────────────────────────────────────────
  const handleOpenModuleModal = (mod: Module | null = null) => {
    if (mod) {
      setEditingModule(mod);
      setModuleFormData({
        title: lv(mod.title),
        description: lv(mod.description)
      });
    } else {
      setEditingModule(null);
      setModuleFormData({
        title: '',
        description: ''
      });
    }
    setIsModuleModalOpen(true);
  };

  const handleOpenLessonModal = (lesson: Lesson | null = null, defaultModuleId?: string) => {
    const chosenModuleId = defaultModuleId || (modules[0] ? modules[0]._id : '');
    setTargetModuleIdForLesson(chosenModuleId);

    if (lesson) {
      setEditingLesson(lesson);
      setLessonFormData({
        title: lv(lesson.title),
        videoUrl: lesson.videoUrl,
        videoPublicId: lesson.videoPublicId || null,
        duration: lesson.duration || 0,
        provider: lesson.provider || 'cloudinary',
        moduleId: lesson.module || lesson.moduleId || chosenModuleId,
        isFreePreview: Boolean(lesson.isFreePreview || lesson.isPreview || false)
      });
    } else {
      setEditingLesson(null);
      setLessonFormData({
        title: '',
        videoUrl: '',
        videoPublicId: null,
        duration: 0,
        provider: 'cloudinary',
        moduleId: chosenModuleId,
        isFreePreview: false
      });
    }
    setIsLessonModalOpen(true);
  };

  const handleOpenQuizModal = (quiz: Quiz | null = null) => {
    if (quiz) {
      setEditingQuiz(quiz);
      setQuizFormData({ title: quiz.title, passingScore: quiz.passingScore, timeLimit: quiz.timeLimit || 15 });
    } else {
      setEditingQuiz(null);
      setQuizFormData({ title: '', passingScore: 80, timeLimit: 15 });
    }
    setIsQuizModalOpen(true);
  };

  const handleOpenQuestionModal = (q: Question | null = null) => {
    if (q) {
      setEditingQuestion(q);
      setQuestionFormData({
        text: q.text,
        points: q.points || 1,
        explanation: q.explanation || '',
        options: q.options.map(o => ({ text: o.text, isCorrect: !!o.isCorrect }))
      });
    } else {
      setEditingQuestion(null);
      setQuestionFormData({
        text: '',
        points: 1,
        explanation: '',
        options: [
          { text: '', isCorrect: true },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
        ]
      });
    }
    setIsQuestionModalOpen(true);
  };

  const handleOpenAssignmentModal = (a: Assignment | null = null) => {
    if (a) {
      setEditingAssignment(a);
      setAssignmentFormData({
        title: a.title,
        description: a.description,
        attachmentUrl: a.attachmentUrl || '',
        maxPoints: a.maxPoints,
        dueDate: a.dueDate ? new Date(a.dueDate).toISOString().split('T')[0] : ''
      });
    } else {
      setEditingAssignment(null);
      setAssignmentFormData({
        title: '',
        description: '',
        attachmentUrl: '',
        maxPoints: 100,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
    }
    setIsAssignmentModalOpen(true);
  };

  const toggleModuleCollapse = (moduleId: string) => {
    setCollapsedModuleIds(prev =>
      prev.includes(moduleId) ? prev.filter(id => id !== moduleId) : [...prev, moduleId]
    );
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === 'module') {
      deleteModuleMutation.mutate({ id: deleteTarget.id, cascade: deleteCascade });
    } else if (deleteTarget.type === 'lesson') {
      deleteLessonMutation.mutate(deleteTarget.id);
    } else if (deleteTarget.type === 'quiz') {
      deleteQuizMutation.mutate(deleteTarget.id);
    } else if (deleteTarget.type === 'question') {
      deleteQuestionMutation.mutate(deleteTarget.id);
    } else if (deleteTarget.type === 'assignment') {
      deleteAssignmentMutation.mutate(deleteTarget.id);
    }
  };

  if (courseLoading || modulesLoading) {
    return (
      <PageShell>
        <div className="pt-24 text-center text-slate-500">{t('teacher.curriculum.loadingCourse')}</div>
      </PageShell>
    );
  }

  const quizzesList: Quiz[] = quizzesData?.data?.quizzes || quizzesData?.data?.data?.quizzes || [];
  const assignmentsList: Assignment[] = Array.isArray(assignmentsData) ? assignmentsData : (assignmentsData as any)?.data?.assignments || [];
  const questionsList: Question[] = questionsData?.data?.questions || [];

  return (
    <PageShell wide>
      <div className="max-w-5xl mx-auto pt-6 pb-16 px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <button 
              onClick={() => navigate(backCoursesUrl)} 
              className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 mb-2 hover:underline inline-flex items-center gap-1.5 cursor-pointer"
            >
              <span>←</span> {t('teacher.curriculum.backToCourses', 'Quay lại danh sách khóa học')}
            </button>
            <SectionHeader 
              label={t('teacher.curriculum.curriculumLabel', 'GIÁO TRÌNH KHÓA HỌC')}
              title={courseData?.data?.course?.title ? lv(courseData.data.course.title) : 'Curriculum Editor'} 
              description={t('teacher.curriculum.curriculumDesc', 'Xây dựng và tổ chức nội dung theo cấu trúc Chuẩn: Khóa học → Chương (Module) → Bài giảng (Lesson)')}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {activeTab === 'lessons' && (
              <>
                <Button 
                  onClick={() => handleOpenModuleModal(null)} 
                  variant="outline" 
                  className="h-10 px-4 rounded-xl flex items-center gap-2 border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50/50 font-semibold"
                >
                  <FolderPlus size={18} /> {t('teacher.curriculum.addModule', '+ Thêm Module')}
                </Button>
                {modules.length > 0 && (
                  <Button 
                    onClick={() => handleOpenLessonModal(null)} 
                    className="h-10 px-4 rounded-xl flex items-center gap-2 font-semibold shadow-sm"
                  >
                    <Plus size={18} /> {t('teacher.curriculum.addLesson', '+ Thêm bài học')}
                  </Button>
                )}
              </>
            )}
            {activeTab === 'quizzes' && (
              <Button onClick={() => handleOpenQuizModal(null)} className="h-10 px-4 rounded-xl flex items-center gap-2 font-semibold shadow-sm">
                <Plus size={18} /> {t('teacher.curriculum.createQuiz')}
              </Button>
            )}
            {activeTab === 'assignments' && (
              <Button onClick={() => handleOpenAssignmentModal(null)} className="h-10 px-4 rounded-xl flex items-center gap-2 font-semibold shadow-sm">
                <Plus size={18} /> {t('teacher.curriculum.createAssignment')}
              </Button>
            )}
          </div>
        </div>

        {/* Course Summary Metrics Bento */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 mb-8">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/40">
                {t('teacher.curriculum.modulesCount', 'Chương học')}
              </span>
              <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Layers size={14} />
              </div>
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white">{modules.length}</div>
            <span className="text-[11px] text-slate-500 dark:text-white/40 block mt-0.5">
              {t('teacher.curriculum.modulesCountSub', 'Chương')}
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/40">
                {t('teacher.curriculum.totalLessons', 'Tổng bài học')}
              </span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Video size={14} />
              </div>
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white">{allLessons.length}</div>
            <span className="text-[11px] text-slate-500 dark:text-white/40 block mt-0.5">
              {t('teacher.curriculum.totalLessonsSub', 'Bài giảng video')}
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/40">
                {t('teacher.curriculum.totalDuration', 'Thời lượng')}
              </span>
              <div className="w-7 h-7 rounded-lg bg-cyan-50 dark:bg-cyan-500/20 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                <Clock size={14} />
              </div>
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white">{formatTotalDuration(allLessons, t)}</div>
            <span className="text-[11px] text-slate-500 dark:text-white/40 block mt-0.5">
              {t('teacher.curriculum.totalDurationSub', 'Tổng video')}
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/40">
                {t('teacher.curriculum.quizzesCount', 'Trắc nghiệm')}
              </span>
              <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <HelpCircle size={14} />
              </div>
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white">{quizzesList.length}</div>
            <span className="text-[11px] text-slate-500 dark:text-white/40 block mt-0.5">
              {t('teacher.curriculum.quizzesCountSub', 'Quiz kiểm tra')}
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/40">
                {t('teacher.curriculum.assignmentsCount', 'Bài tập')}
              </span>
              <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <BookOpen size={14} />
              </div>
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white">{assignmentsList.length}</div>
            <span className="text-[11px] text-slate-500 dark:text-white/40 block mt-0.5">
              {t('teacher.curriculum.assignmentsCountSub', 'Thực hành')}
            </span>
          </div>
        </div>

        {/* Tab Navigation & Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          {/* Segmented Control */}
          <div className="inline-flex p-1.5 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('lessons')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
                activeTab === 'lessons'
                  ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers size={16} />
              <span>{t('teacher.curriculum.curriculumTab', 'Chương & Bài học')}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === 'lessons' ? 'bg-indigo-50 dark:bg-white/20 text-indigo-700 dark:text-white font-bold' : 'bg-slate-200/60 dark:bg-white/10 text-slate-600 dark:text-slate-300'}`}>
                {modules.length}M · {allLessons.length}L
              </span>
            </button>

            <button
              onClick={() => setActiveTab('quizzes')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
                activeTab === 'quizzes'
                  ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <HelpCircle size={16} />
              <span>{t('teacher.curriculum.quizzesTab', 'Trắc nghiệm')}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === 'quizzes' ? 'bg-indigo-50 dark:bg-white/20 text-indigo-700 dark:text-white font-bold' : 'bg-slate-200/60 dark:bg-white/10 text-slate-600 dark:text-slate-300'}`}>
                {quizzesList.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('assignments')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
                activeTab === 'assignments'
                  ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BookOpen size={16} />
              <span>{t('teacher.curriculum.assignmentsTab', 'Bài tập')}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === 'assignments' ? 'bg-indigo-50 dark:bg-white/20 text-indigo-700 dark:text-white font-bold' : 'bg-slate-200/60 dark:bg-white/10 text-slate-600 dark:text-slate-300'}`}>
                {assignmentsList.length}
              </span>
            </button>
          </div>

          {/* Search bar */}
          {activeTab === 'lessons' && allLessons.length > 0 && (
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={t('teacher.curriculum.searchPlaceholder', 'Tìm bài học trong các chương...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-8 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl focus:border-indigo-500 focus:outline-none transition-colors w-full sm:w-64 text-slate-900 dark:text-white placeholder:text-slate-400 shadow-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* TAB 1: MODULES & LESSONS (COURSE CURRICULUM ARCHITECTURE) */}
        {activeTab === 'lessons' && (
          <div>
            {modules.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50/50 dark:bg-slate-900/30 p-8">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4">
                  <FolderPlus size={28} />
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">
                  Khóa học chưa có Chương học (Module) nào
                </h3>
                <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto text-sm leading-relaxed">
                  Để đảm bảo tính sư phạm rõ ràng, mỗi khóa học cần được tổ chức thành các Chương (Module) lớn, mỗi Chương sẽ chứa các Bài giảng (Lessons) tương ứng.
                </p>
                <Button onClick={() => handleOpenModuleModal(null)} className="mt-6 flex items-center gap-2 mx-auto">
                  <FolderPlus size={18} /> Tạo Chương đầu tiên
                </Button>
              </div>
            ) : searchQuery ? (
              /* Search Results Flat View */
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-4 px-1">
                  <span>Tìm thấy <strong>{filteredLessons.length}</strong> bài học khớp với "{searchQuery}"</span>
                  <button onClick={() => setSearchQuery('')} className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                    Xóa bộ lọc tìm kiếm
                  </button>
                </div>
                {filteredLessons.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-slate-200 dark:border-white/10 rounded-2xl">
                    <p className="text-slate-500 text-sm">Không tìm thấy bài học nào phù hợp.</p>
                  </div>
                ) : (
                  filteredLessons.map((lesson, idx) => (
                    <SortableLessonItem 
                      key={lesson._id} 
                      lesson={lesson}
                      index={idx}
                      moduleId={lesson.module || ''}
                      onEdit={(l, mId) => handleOpenLessonModal(l, mId)} 
                      onDelete={(id, title) => setDeleteTarget({ type: 'lesson', id, name: title })}
                      onPreview={(l) => setPreviewLesson(l)}
                      lv={lv}
                      t={t}
                    />
                  ))
                )}
              </div>
            ) : (
              /* Full DnD Sortable Hierarchy View */
              <div>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={modules.map(m => m._id)} strategy={verticalListSortingStrategy}>
                    {modules.map((mod, index) => (
                      <SortableModuleCard
                        key={mod._id}
                        module={mod}
                        index={index}
                        isCollapsed={collapsedModuleIds.includes(mod._id)}
                        onToggleCollapse={toggleModuleCollapse}
                        onEditModule={handleOpenModuleModal}
                        onDeleteModule={(m) => setDeleteTarget({
                          type: 'module',
                          id: m._id,
                          name: lv(m.title) || `Chương ${index + 1}`,
                          lessonCount: m.lessons?.length || 0
                        })}
                        onAddLesson={(mId) => handleOpenLessonModal(null, mId)}
                        onEditLesson={(l, mId) => handleOpenLessonModal(l, mId)}
                        onDeleteLesson={(id, title) => setDeleteTarget({ type: 'lesson', id, name: title })}
                        onPreviewLesson={(l) => setPreviewLesson(l)}
                        lv={lv}
                        t={t}
                      />
                    ))}
                  </SortableContext>
                </DndContext>

                {/* Bottom Add Module Trigger */}
                <div className="pt-2 flex justify-center">
                  <button
                    onClick={() => handleOpenModuleModal(null)}
                    className="w-full py-4 border-2 border-dashed border-slate-200 hover:border-indigo-500 dark:border-white/10 dark:hover:border-indigo-400 rounded-3xl text-sm font-bold text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 flex items-center justify-center gap-2 transition-all cursor-pointer hover:bg-indigo-50/20 dark:hover:bg-indigo-500/5 shadow-xs"
                  >
                    <FolderPlus size={18} />
                    <span>{t('teacher.curriculum.addModuleLong', '+ Thêm Chương học mới (Module)')}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: QUIZZES */}
        {activeTab === 'quizzes' && (
          <div>
            {quizzesLoading ? (
              <p className="text-center py-10 text-slate-500">{t('teacher.curriculum.loadingQuizzes')}</p>
            ) : quizzesList.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4">
                  <HelpCircle size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">{t('teacher.curriculum.noQuizzesTitle')}</h3>
                <p className="text-slate-500 mt-1 max-w-sm mx-auto text-sm">{t('teacher.curriculum.noQuizzesDesc')}</p>
                <Button onClick={() => handleOpenQuizModal(null)} className="mt-6">{t('teacher.curriculum.createQuiz')}</Button>
              </div>
            ) : (
              <div className="space-y-3">
                {quizzesList.map((quiz, idx) => (
                  <div key={quiz._id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center gap-4">
                      <span className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 flex items-center justify-center text-xs font-bold font-mono text-slate-600 dark:text-slate-300 shrink-0">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                        <FileQuestion size={22} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-base">{lv(quiz.title)}</h4>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                          <span className="inline-flex items-center gap-1">{t('teacher.curriculum.passingScore')}: <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">{quiz.passingScore}%</strong></span>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1">{t('teacher.curriculum.timeLimit')}: <strong className="text-slate-700 dark:text-slate-300">{quiz.timeLimit || t('teacher.curriculum.noLimit')} {t('teacher.curriculum.mins')}</strong></span>
                          {quiz.questionCount !== undefined && (
                            <>
                              <span>•</span>
                              <span className="inline-flex items-center gap-1">{t('teacher.curriculum.questions', 'Questions')}: <strong className="text-indigo-600 dark:text-indigo-400">{quiz.questionCount}</strong></span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                      <Button size="sm" variant="outline" onClick={() => setActiveQuizForQuestions(quiz)} className="rounded-xl">
                        {t('teacher.curriculum.manageQuestions')}
                      </Button>
                      <button onClick={() => handleOpenQuizModal(quiz)} className="p-2 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors" title="Chỉnh sửa bài trắc nghiệm">
                        <Edit3 size={16} />
                      </button>
                      <button onClick={() => setDeleteTarget({ type: 'quiz', id: quiz._id, name: lv(quiz.title) })} className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors" title="Xóa bài trắc nghiệm">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ASSIGNMENTS */}
        {activeTab === 'assignments' && (
          <div>
            {assignmentsLoading ? (
              <p className="text-center py-10 text-slate-500">{t('teacher.curriculum.loadingAssignments')}</p>
            ) : assignmentsList.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto mb-4">
                  <BookOpen size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">{t('teacher.curriculum.noAssignmentsTitle')}</h3>
                <p className="text-slate-500 mt-1 max-w-sm mx-auto text-sm">{t('teacher.curriculum.noAssignmentsDesc')}</p>
                <Button onClick={() => handleOpenAssignmentModal(null)} className="mt-6">{t('teacher.curriculum.createAssignment')}</Button>
              </div>
            ) : (
              <div className="space-y-3">
                {assignmentsList.map((assignment, idx) => (
                  <div key={assignment._id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center gap-4">
                      <span className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 flex items-center justify-center text-xs font-bold font-mono text-slate-600 dark:text-slate-300 shrink-0">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <div className="w-11 h-11 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                        <BookOpen size={22} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-base">{assignment.title}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">{assignment.description}</p>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-2">
                          <span>{t('teacher.curriculum.maxPoints')}: <strong className="text-indigo-600 dark:text-indigo-400 font-semibold">{assignment.maxPoints} {t('teacher.curriculum.pts')}</strong></span>
                          <span>•</span>
                          <span>{t('teacher.curriculum.dueDate')}: <strong className="text-slate-700 dark:text-slate-300">{new Date(assignment.dueDate).toLocaleDateString()}</strong></span>
                          {assignment.attachmentUrl && (
                            <>
                              <span>•</span>
                              <a href={assignment.attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-sky-500 hover:underline inline-flex items-center gap-1 font-medium">
                                <FileText size={12} /> {t('teacher.curriculum.attachment')}
                              </a>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                      <button onClick={() => handleOpenAssignmentModal(assignment)} className="p-2 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors" title="Chỉnh sửa bài tập">
                        <Edit3 size={16} />
                      </button>
                      <button onClick={() => setDeleteTarget({ type: 'assignment', id: assignment._id, name: assignment.title })} className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors" title="Xóa bài tập">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL 0: ADD/EDIT MODULE */}
      {isModuleModalOpen && createPortal(
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-7 max-w-md w-full border border-slate-200 dark:border-white/10 shadow-2xl space-y-6 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <FolderPlus size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {editingModule ? t('teacher.curriculum.editModule', 'Chỉnh sửa Chương học (Module)') : t('teacher.curriculum.newModule', 'Tạo Chương học mới (Module)')}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {t('teacher.curriculum.moduleSubtitle', 'Phân nhóm nội dung bài giảng khoa học và mạch lạc')}
                </p>
              </div>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (editingModule) {
                updateModuleMutation.mutate(moduleFormData);
              } else {
                createModuleMutation.mutate(moduleFormData);
              }
            }} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {t('teacher.curriculum.moduleTitle', 'Tiêu đề Chương học')} <span className="text-rose-500">*</span>
                </label>
                <Input 
                  value={moduleFormData.title} 
                  onChange={(e) => setModuleFormData({...moduleFormData, title: e.target.value})} 
                  placeholder={t('teacher.curriculum.moduleTitlePlaceholder', 'Ví dụ: Chương 1: Giới thiệu & Cài đặt môi trường')} 
                  required 
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {t('teacher.curriculum.moduleDesc', 'Mô tả ngắn gọn (Tùy chọn)')}
                </label>
                <textarea 
                  rows={3}
                  value={moduleFormData.description} 
                  onChange={(e) => setModuleFormData({...moduleFormData, description: e.target.value})} 
                  placeholder={t('teacher.curriculum.moduleDescPlaceholder', 'Mục tiêu hoặc kiến thức trọng tâm của chương này...')} 
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <Button 
                  variant="outline" 
                  type="button" 
                  onClick={() => setIsModuleModalOpen(false)}
                >
                  {t('teacher.dashboard.cancel')}
                </Button>
                <Button 
                  type="submit"
                  disabled={createModuleMutation.isPending || updateModuleMutation.isPending}
                >
                  {editingModule ? t('teacher.curriculum.saveChanges', 'Lưu thay đổi') : t('teacher.curriculum.newModule', 'Tạo Chương học')}
                </Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 1: ADD/EDIT LESSON */}
      {isLessonModalOpen && createPortal(
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md w-full border border-slate-200 dark:border-white/10 shadow-2xl space-y-6 my-auto max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {editingLesson ? t('teacher.curriculum.editLesson') : t('teacher.curriculum.newLesson')}
            </h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (editingLesson) {
                updateLessonMutation.mutate(lessonFormData);
              } else {
                createLessonMutation.mutate(lessonFormData);
              }
            }} className="space-y-4">
              {/* Module selection dropdown */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {t('teacher.curriculum.moduleBelongLabel', 'Thuộc Chương học (Module)')} <span className="text-rose-500">*</span>
                </label>
                <select
                  value={lessonFormData.moduleId}
                  onChange={(e) => setLessonFormData({ ...lessonFormData, moduleId: e.target.value })}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  {modules.map((m, idx) => (
                    <option key={m._id} value={m._id}>
                      {t('curriculum.module', 'Module')} {idx + 1}: {lv(m.title)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">{t('teacher.curriculum.lessonTitle')}</label>
                <Input 
                  value={lessonFormData.title} 
                  onChange={(e) => setLessonFormData({...lessonFormData, title: e.target.value})} 
                  placeholder={t('teacher.curriculum.lessonTitlePlaceholder')} 
                  required 
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">{t('teacher.curriculum.videoSource')}</label>
                <Input 
                  value={lessonFormData.videoUrl} 
                  onChange={(e) => setLessonFormData({...lessonFormData, videoUrl: e.target.value})} 
                  placeholder={t('teacher.curriculum.videoPlaceholder')} 
                  required 
                  className="w-full"
                />
                
                <div className="pt-2">
                  {isUploadingVideo ? (
                    <div className="space-y-2 p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
                      <div className="flex items-center justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        <span>{t('teacher.curriculum.uploadingProgress', { progress: uploadProgress })}</span>
                        <button 
                          type="button" 
                          onClick={handleCancelUpload}
                          className="text-rose-500 hover:text-rose-600 text-xs underline font-semibold cursor-pointer"
                        >
                          {t('teacher.curriculum.cancelUpload')}
                        </button>
                      </div>
                      <div className="w-full h-1.5 bg-indigo-200 dark:bg-indigo-900 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-600 dark:bg-indigo-400 transition-all duration-200"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors">
                      <Upload size={14} />
                      {t('teacher.curriculum.uploadVideo')}
                      <input type="file" accept="video/*" className="hidden" onChange={handleVideoFileUpload} />
                    </label>
                  )}
                </div>
              </div>

              {/* Free Preview Toggle */}
              <label className="flex items-start justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 cursor-pointer hover:bg-slate-100/80 dark:hover:bg-white/10 transition-colors">
                <div className="pr-3">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <Sparkles size={15} className="text-emerald-500 shrink-0" />
                    <span>{t('teacher.curriculum.freePreview', 'Cho phép học thử miễn phí (Free Preview)')}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
                      {t('teacher.curriculum.recommendFirstLesson', 'Khuyên dùng cho bài 1')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {t('teacher.curriculum.freePreviewDesc', 'Học viên chưa mua khóa học có thể xem trước bài học này để trải nghiệm nội dung.')}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={Boolean(lessonFormData.isFreePreview)}
                  onChange={(e) => setLessonFormData({ ...lessonFormData, isFreePreview: e.target.checked })}
                  className="w-5 h-5 accent-indigo-600 rounded-lg cursor-pointer mt-0.5"
                />
              </label>

              <div className="pt-4 flex justify-end gap-3">
                <Button variant="outline" type="button" onClick={() => setIsLessonModalOpen(false)}>{t('teacher.dashboard.cancel')}</Button>
                <Button type="submit" disabled={createLessonMutation.isPending || updateLessonMutation.isPending}>
                  {editingLesson ? t('teacher.curriculum.saveChanges') : t('teacher.curriculum.addLesson')}
                </Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 2: ADD/EDIT QUIZ */}
      {isQuizModalOpen && createPortal(
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 max-w-md w-full border border-slate-200 dark:border-white/10 shadow-2xl space-y-6 my-auto max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {editingQuiz ? t('teacher.curriculum.editQuiz') : t('teacher.curriculum.newQuiz')}
            </h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (editingQuiz) updateQuizMutation.mutate(quizFormData);
              else createQuizMutation.mutate(quizFormData);
            }} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">{t('teacher.curriculum.quizTitle')}</label>
                <Input 
                  value={quizFormData.title} 
                  onChange={(e) => setQuizFormData({...quizFormData, title: e.target.value})} 
                  placeholder={t('teacher.curriculum.quizTitlePlaceholder')} 
                  required 
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">{t('teacher.curriculum.passingScorePercent')}</label>
                  <Input 
                    type="number"
                    min="0"
                    max="100"
                    value={quizFormData.passingScore} 
                    onChange={(e) => setQuizFormData({...quizFormData, passingScore: Number(e.target.value)})} 
                    required 
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">{t('teacher.curriculum.timeLimitMins')}</label>
                  <Input 
                    type="number"
                    min="1"
                    value={quizFormData.timeLimit} 
                    onChange={(e) => setQuizFormData({...quizFormData, timeLimit: Number(e.target.value)})} 
                    placeholder="15" 
                    className="w-full"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <Button variant="outline" type="button" onClick={() => setIsQuizModalOpen(false)}>{t('teacher.dashboard.cancel')}</Button>
                <Button type="submit">{editingQuiz ? t('teacher.curriculum.saveChanges') : t('teacher.curriculum.createQuiz')}</Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 3: QUESTION MANAGER */}
      {activeQuizForQuestions && createPortal(
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 max-w-2xl w-full border border-slate-200 dark:border-white/10 shadow-2xl space-y-6 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {t('teacher.curriculum.questionsFor', { title: activeQuizForQuestions.title })}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {t('teacher.curriculum.questionsHelp')}
                </p>
              </div>
              <Button size="sm" onClick={() => handleOpenQuestionModal(null)} className="flex items-center gap-1.5">
                <Plus size={16} /> {t('teacher.curriculum.addQuestion')}
              </Button>
            </div>

            {questionsLoading ? (
              <p className="text-center py-8 text-slate-500">{t('teacher.curriculum.loadingQuestions')}</p>
            ) : questionsList.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-200 dark:border-white/10 rounded-2xl">
                <p className="text-slate-500 text-sm">{t('teacher.curriculum.noQuestions')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {questionsList.map((q, idx) => (
                  <div key={q._id} className="p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold font-mono shrink-0">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white text-sm">{q.text}</p>
                          <span className="text-xs text-slate-400 font-medium">({q.points || 1} {t('teacher.curriculum.pts')})</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => handleOpenQuestionModal(q)} className="p-1.5 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">
                          <Edit3 size={15} />
                        </button>
                        <button onClick={() => setDeleteTarget({ type: 'question', id: q._id, name: q.text })} className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-9">
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} className={`p-2 rounded-lg text-xs flex items-center gap-2 border ${opt.isCorrect ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300 font-medium' : 'bg-white dark:bg-white/5 border-slate-200/60 dark:border-white/5 text-slate-600 dark:text-slate-400'}`}>
                          <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border ${opt.isCorrect ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 dark:border-slate-600'}`}>
                            {opt.isCorrect && <CheckCircle2 size={10} />}
                          </div>
                          <span className="truncate">{opt.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-4 flex justify-end">
              <Button variant="outline" onClick={() => setActiveQuizForQuestions(null)}>{t('teacher.dashboard.close')}</Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 4: ADD/EDIT QUESTION */}
      {isQuestionModalOpen && createPortal(
        <div className="fixed inset-0 z-[1010] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 max-w-lg w-full border border-slate-200 dark:border-white/10 shadow-2xl space-y-5 my-auto max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {editingQuestion ? t('teacher.curriculum.editQuestion') : t('teacher.curriculum.addQuestion')}
            </h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (editingQuestion) updateQuestionMutation.mutate(questionFormData);
              else createQuestionMutation.mutate(questionFormData);
            }} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">{t('teacher.curriculum.questionText')}</label>
                <Input 
                  value={questionFormData.text} 
                  onChange={(e) => setQuestionFormData({...questionFormData, text: e.target.value})} 
                  placeholder={t('teacher.curriculum.questionPlaceholder')} 
                  required 
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">{t('teacher.curriculum.points')}</label>
                <Input 
                  type="number" 
                  min="1" 
                  value={questionFormData.points} 
                  onChange={(e) => setQuestionFormData({...questionFormData, points: Number(e.target.value)})} 
                  required 
                  className="w-full"
                />
              </div>

              <div className="space-y-3 pt-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">{t('teacher.curriculum.answerOptions')}</label>
                {questionFormData.options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      name="correctOption" 
                      checked={opt.isCorrect} 
                      onChange={() => {
                        const newOpts = questionFormData.options.map((o, i) => ({ ...o, isCorrect: i === idx }));
                        setQuestionFormData({ ...questionFormData, options: newOpts });
                      }}
                      className="text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    />
                    <Input 
                      value={opt.text} 
                      onChange={(e) => {
                        const newOpts = [...questionFormData.options];
                        newOpts[idx].text = e.target.value;
                        setQuestionFormData({ ...questionFormData, options: newOpts });
                      }} 
                      placeholder={t('teacher.curriculum.optionPlaceholder', { index: idx + 1 })} 
                      required 
                      className="flex-1"
                    />
                  </div>
                ))}
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <Button variant="outline" type="button" onClick={() => setIsQuestionModalOpen(false)}>{t('teacher.dashboard.cancel')}</Button>
                <Button type="submit">{editingQuestion ? t('teacher.curriculum.saveChanges') : t('teacher.curriculum.addQuestion')}</Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 5: ADD/EDIT ASSIGNMENT */}
      {isAssignmentModalOpen && createPortal(
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 max-w-md w-full border border-slate-200 dark:border-white/10 shadow-2xl space-y-6 my-auto max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {editingAssignment ? t('teacher.curriculum.editAssignment') : t('teacher.curriculum.newAssignment')}
            </h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (editingAssignment) updateAssignmentMutation.mutate(assignmentFormData);
              else createAssignmentMutation.mutate(assignmentFormData);
            }} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">{t('teacher.curriculum.assignmentTitle')}</label>
                <Input 
                  value={assignmentFormData.title} 
                  onChange={(e) => setAssignmentFormData({...assignmentFormData, title: e.target.value})} 
                  placeholder={t('teacher.curriculum.assignmentTitlePlaceholder')} 
                  required 
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">{t('teacher.curriculum.instructionsLabel')}</label>
                <textarea 
                  rows={3}
                  value={assignmentFormData.description} 
                  onChange={(e) => setAssignmentFormData({...assignmentFormData, description: e.target.value})} 
                  placeholder={t('teacher.curriculum.instructionsPlaceholder')} 
                  required 
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">{t('teacher.curriculum.maxPoints')}</label>
                  <Input 
                    type="number" 
                    min="10" 
                    value={assignmentFormData.maxPoints} 
                    onChange={(e) => setAssignmentFormData({...assignmentFormData, maxPoints: Number(e.target.value)})} 
                    required 
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">{t('teacher.curriculum.dueDate')}</label>
                  <Input 
                    type="date" 
                    value={assignmentFormData.dueDate} 
                    onChange={(e) => setAssignmentFormData({...assignmentFormData, dueDate: e.target.value})} 
                    required 
                    className="w-full"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">{t('teacher.curriculum.attachmentUrlLabel')}</label>
                <Input 
                  value={assignmentFormData.attachmentUrl} 
                  onChange={(e) => setAssignmentFormData({...assignmentFormData, attachmentUrl: e.target.value})} 
                  placeholder="https://..." 
                  className="w-full"
                />

                <div className="pt-2">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors">
                    <Upload size={14} />
                    {isUploadingDoc ? t('teacher.curriculum.uploadingDoc') : t('teacher.curriculum.uploadDoc')}
                    <input type="file" className="hidden" onChange={handleDocFileUpload} disabled={isUploadingDoc} />
                  </label>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <Button variant="outline" type="button" onClick={() => setIsAssignmentModalOpen(false)}>{t('teacher.dashboard.cancel')}</Button>
                <Button type="submit">{editingAssignment ? t('teacher.curriculum.saveChanges') : t('teacher.curriculum.createAssignment')}</Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* VIDEO PREVIEW MODAL */}
      {createPortal(
        <AnimatePresence>
          {previewLesson && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden max-w-3xl w-full border border-slate-200 dark:border-white/10 shadow-2xl flex flex-col my-auto max-h-[90vh]"
              >
                <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                      <Play size={18} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                        {lv(previewLesson.title)}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="font-medium">
                          {previewLesson.videoUrl?.includes('youtube.com') || previewLesson.videoUrl?.includes('youtu.be') ? 'YouTube Video' : 'Cloudinary Video'}
                        </span>
                        {previewLesson.duration ? (
                          <>
                            <span>•</span>
                            <span className="inline-flex items-center gap-1">
                              <Clock size={12} />
                              {formatDuration(previewLesson.duration)}
                            </span>
                          </>
                        ) : null}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setPreviewLesson(null)}
                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                    title="Đóng"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="p-4 bg-black/95 flex items-center justify-center aspect-video w-full">
                  {getYouTubeEmbedUrl(previewLesson.videoUrl) ? (
                    <iframe
                      src={getYouTubeEmbedUrl(previewLesson.videoUrl)!}
                      title={lv(previewLesson.title)}
                      className="w-full h-full rounded-xl border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : previewLesson.videoUrl ? (
                    <video
                      src={previewLesson.videoUrl}
                      controls
                      autoPlay
                      className="w-full h-full rounded-xl object-contain"
                    />
                  ) : (
                    <p className="text-sm text-slate-400">{t('teacher.curriculum.noVideoUrl', 'Chưa có liên kết video')}</p>
                  )}
                </div>

                <div className="p-4 bg-slate-50 dark:bg-white/5 flex items-center justify-between gap-3 border-t border-slate-200 dark:border-white/10">
                  {previewLesson.videoUrl ? (
                    <a
                      href={previewLesson.videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                    >
                      <ExternalLink size={14} /> {t('teacher.curriculum.openVideoSource', 'Mở nguồn video')}
                    </a>
                  ) : <span />}
                  <Button variant="outline" size="sm" onClick={() => setPreviewLesson(null)}>
                    {t('common.close', 'Đóng')}
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* CONFIRM DELETE MODAL */}
      {createPortal(
        <AnimatePresence>
          {deleteTarget && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-white/10 shadow-2xl space-y-5 my-auto"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                    <AlertTriangle size={24} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {deleteTarget.type === 'module' && t('teacher.curriculum.deleteModuleTitle', 'Xác nhận xóa Chương học (Module)')}
                      {deleteTarget.type === 'lesson' && (t('teacher.curriculum.deleteLessonTitle', 'Xác nhận xóa bài học'))}
                      {deleteTarget.type === 'quiz' && (t('teacher.curriculum.deleteQuizTitle', 'Xác nhận xóa bài kiểm tra'))}
                      {deleteTarget.type === 'question' && (t('teacher.curriculum.deleteQuestionTitle', 'Xác nhận xóa câu hỏi'))}
                      {deleteTarget.type === 'assignment' && (t('teacher.curriculum.deleteAssignmentTitle', 'Xác nhận xóa bài tập'))}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {t('teacher.curriculum.deleteConfirmPrompt', 'Bạn có chắc chắn muốn xóa')} <span className="font-semibold text-slate-900 dark:text-white">"{deleteTarget.name}"</span>? {t('teacher.curriculum.cannotUndo', 'Hành động này không thể hoàn tác.')}
                    </p>

                    {deleteTarget.type === 'module' && (deleteTarget.lessonCount || 0) > 0 && (
                      <div className="pt-2">
                        <label className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/40 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={deleteCascade}
                            onChange={(e) => setDeleteCascade(e.target.checked)}
                            className="mt-0.5 rounded text-rose-600 focus:ring-rose-500"
                          />
                          <span className="text-xs text-rose-700 dark:text-rose-300 font-medium">
                            {t('teacher.curriculum.cascadeDeleteConfirm', 'Xác nhận xóa đồng thời cả')} <strong>{deleteTarget.lessonCount}</strong> {t('teacher.curriculum.cascadeDeleteLessons', 'bài học bên trong chương này (Cascade Delete)')}
                          </span>
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => {
                      setDeleteTarget(null);
                      setDeleteCascade(false);
                    }}
                    disabled={
                      deleteModuleMutation.isPending ||
                      deleteLessonMutation.isPending || 
                      deleteQuizMutation.isPending || 
                      deleteQuestionMutation.isPending || 
                      deleteAssignmentMutation.isPending
                    }
                  >
                    {t('teacher.dashboard.cancel')}
                  </Button>
                  <Button
                    variant="danger"
                    type="button"
                    onClick={handleConfirmDelete}
                    disabled={deleteTarget.type === 'module' && (deleteTarget.lessonCount || 0) > 0 && !deleteCascade}
                    loading={
                      deleteModuleMutation.isPending ||
                      deleteLessonMutation.isPending || 
                      deleteQuizMutation.isPending || 
                      deleteQuestionMutation.isPending || 
                      deleteAssignmentMutation.isPending
                    }
                  >
                    {t('teacher.curriculum.delete')}
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      <Toast visible={!!toast} message={toast?.message || ''} variant={toast?.type} onClose={() => setToast(null)} />
    </PageShell>
  );
};

export default CurriculumEditor;
