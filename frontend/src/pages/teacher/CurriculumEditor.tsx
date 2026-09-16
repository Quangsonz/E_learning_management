import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
import { lessonApi, Lesson } from '../../services/lesson.api';
import { quizApi, Quiz, Question } from '../../services/quiz.api';
import { assignmentApi, Assignment } from '../../services/assignment.api';
import { uploadApi } from '../../services/upload.api';
import { 
  GripVertical, Plus, Trash2, Edit3, Video, FileQuestion, 
  BookOpen, HelpCircle, Upload, CheckCircle2, FileText,
  Play, Clock, Search, X, AlertTriangle, Sparkles, ExternalLink
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

const formatTotalDuration = (lessons: Lesson[]): string => {
  const totalSeconds = lessons.reduce((sum, l) => sum + (Number(l.duration) || 0), 0);
  if (totalSeconds <= 0) return '0 phút';
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  if (hrs > 0) {
    return `${hrs} giờ ${mins > 0 ? `${mins} phút` : ''}`;
  }
  return `${mins} phút`;
};

interface SortableLessonItemProps {
  lesson: Lesson;
  index: number;
  onEdit: (l: Lesson) => void;
  onDelete: (id: string, title: string) => void;
  onPreview: (l: Lesson) => void;
}

const SortableLessonItem = ({ lesson, index, onEdit, onDelete, onPreview }: SortableLessonItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lesson._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isYouTube = lesson.provider === 'youtube' || (lesson.videoUrl && (lesson.videoUrl.includes('youtube.com') || lesson.videoUrl.includes('youtu.be')));
  const durationText = formatDuration(lesson.duration);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative flex flex-col sm:flex-row sm:items-center gap-4 p-4 md:p-5 bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-200 shadow-sm hover:shadow-md mb-3 ${
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
          title="Kéo để đổi thứ tự bài học"
          className="p-1.5 -ml-1 text-slate-400 hover:text-indigo-600 dark:hover:text-white cursor-grab active:cursor-grabbing rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
        >
          <GripVertical size={18} />
        </button>

        <span className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 flex items-center justify-center text-xs font-bold font-mono text-slate-600 dark:text-slate-300 shrink-0">
          {String(index + 1).padStart(2, '0')}
        </span>

        <button
          onClick={() => onPreview(lesson)}
          title="Xem trước bài giảng"
          className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-600 dark:hover:bg-indigo-600 text-indigo-600 dark:text-indigo-400 hover:text-white dark:hover:text-white flex items-center justify-center shrink-0 transition-colors shadow-sm"
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
            title={lesson.title}
          >
            {lesson.title}
          </h4>
        </div>

        {/* Metadata Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
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

          {durationText && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 font-mono text-[11px] border border-slate-200/60 dark:border-white/5">
              <Clock size={12} className="text-slate-400" />
              {durationText}
            </span>
          )}

          {lesson.videoUrl && (
            <span className="hidden md:inline-flex items-center gap-1 text-slate-400 truncate max-w-xs text-[11px]">
              <span className="text-slate-300 dark:text-slate-600">•</span>
              {isYouTube ? (getYouTubeId(lesson.videoUrl) ? `ID: ${getYouTubeId(lesson.videoUrl)}` : 'YouTube') : 'Hosted file'}
            </span>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-white/5 w-full sm:w-auto justify-end">
        <button
          onClick={() => onPreview(lesson)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded-xl transition-colors border border-indigo-100 dark:border-indigo-500/20"
          title="Xem trước video"
        >
          <Play size={13} className="fill-current" />
          <span>Xem trước</span>
        </button>

        <button
          onClick={() => onEdit(lesson)}
          className="p-2 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors"
          title="Chỉnh sửa bài học"
        >
          <Edit3 size={16} />
        </button>

        <button
          onClick={() => onDelete(lesson._id, lesson.title)}
          className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors"
          title="Xóa bài học"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};

const CurriculumEditor = () => {
  const { t } = useTranslation();
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'lessons' | 'quizzes' | 'assignments'>('lessons');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewLesson, setPreviewLesson] = useState<Lesson | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'lesson' | 'quiz' | 'question' | 'assignment';
    id: string;
    name: string;
  } | null>(null);

  // Lesson states
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [lessonFormData, setLessonFormData] = useState({ 
    title: '', 
    videoUrl: '', 
    videoPublicId: null as string | null, 
    duration: 0, 
    provider: 'cloudinary' as 'cloudinary' | 'youtube' 
  });
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const uploadAbortControllerRef = React.useRef<AbortController | null>(null);

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

  const { data: lessonsData, isLoading: lessonsLoading } = useQuery({
    queryKey: ['lessons', courseId],
    queryFn: () => lessonApi.getLessons(courseId!),
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

  useEffect(() => {
    if (lessonsData?.data?.lessons) {
      setLessons(lessonsData.data.lessons);
    }
  }, [lessonsData]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Lesson Mutations
  const reorderMutation = useMutation({
    mutationFn: (newOrder: { id: string; order: number }[]) => lessonApi.reorderLessons(courseId!, newOrder),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessons', courseId] });
      setToast({ message: t('teacher.curriculum.toasts.orderSaved'), type: 'success' });
    },
    onError: () => setToast({ message: t('teacher.curriculum.toasts.orderFailed'), type: 'error' }),
  });

  const createLessonMutation = useMutation({
    mutationFn: (data: any) => lessonApi.createLesson(courseId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessons', courseId] });
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
      queryClient.invalidateQueries({ queryKey: ['lessons', courseId] });
      setToast({ message: t('teacher.curriculum.toasts.lessonDeleted'), type: 'success' });
    },
    onError: (err: any) => {
      const errorMsg = err?.response?.data?.message || t('teacher.curriculum.toasts.lessonDeleteFailed', 'Không thể xóa bài học.');
      setToast({ message: errorMsg, type: 'error' });
    }
  });

  // Quiz Mutations
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
      setToast({ message: t('teacher.curriculum.toasts.quizDeleted'), type: 'success' });
    }
  });

  // Question Mutations
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
      setToast({ message: t('teacher.curriculum.toasts.questionDeleted'), type: 'success' });
    }
  });

  // Assignment Mutations
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
      setToast({ message: t('teacher.curriculum.toasts.assignmentDeleted'), type: 'success' });
    }
  });

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'lesson') {
      deleteLessonMutation.mutate(deleteTarget.id, {
        onSettled: () => setDeleteTarget(null)
      });
    } else if (deleteTarget.type === 'quiz') {
      deleteQuizMutation.mutate(deleteTarget.id, {
        onSettled: () => setDeleteTarget(null)
      });
    } else if (deleteTarget.type === 'question') {
      deleteQuestionMutation.mutate(deleteTarget.id, {
        onSettled: () => setDeleteTarget(null)
      });
    } else if (deleteTarget.type === 'assignment') {
      deleteAssignmentMutation.mutate(deleteTarget.id, {
        onSettled: () => setDeleteTarget(null)
      });
    }
  };

  // Handlers
  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setLessons((items) => {
        const oldIndex = items.findIndex((item) => item._id === active.id);
        const newIndex = items.findIndex((item) => item._id === over.id);
        const reordered = arrayMove(items, oldIndex, newIndex);
        const payload = reordered.map((l, index) => ({ id: l._id, order: index + 1 }));
        reorderMutation.mutate(payload);
        return reordered;
      });
    }
  };

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

  // Modal Handlers
  const handleOpenLessonModal = (lesson: Lesson | null = null) => {
    if (lesson) {
      setEditingLesson(lesson);
      setLessonFormData({
        title: lesson.title,
        videoUrl: lesson.videoUrl,
        videoPublicId: lesson.videoPublicId || null,
        duration: lesson.duration || 0,
        provider: lesson.provider || 'cloudinary'
      });
    } else {
      setEditingLesson(null);
      setLessonFormData({
        title: '',
        videoUrl: '',
        videoPublicId: null,
        duration: 0,
        provider: 'cloudinary'
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

  if (courseLoading) return <PageShell><div className="pt-24 text-center">{t('teacher.curriculum.loadingCourse')}</div></PageShell>;

  const quizzesList: Quiz[] = quizzesData?.data?.quizzes || quizzesData?.data?.data?.quizzes || [];
  const assignmentsList: Assignment[] = Array.isArray(assignmentsData) ? assignmentsData : (assignmentsData as any)?.data?.assignments || [];
  const questionsList: Question[] = questionsData?.data?.questions || [];

  const filteredLessons = lessons.filter(l =>
    l.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <PageShell wide>
      <div className="max-w-5xl mx-auto py-12 px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <button onClick={() => navigate('/teacher-courses')} className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 mb-2 hover:underline inline-flex items-center gap-1">
              {t('teacher.curriculum.backToCourses')}
            </button>
            <SectionHeader 
              label={t('teacher.curriculum.title')}
              title={t('teacher.curriculum.curriculumFor', { title: courseData?.data?.course?.title || 'Course' })} 
              description={t('teacher.curriculum.subtitle')}
            />
          </div>

          <div className="flex items-center gap-3">
            {activeTab === 'lessons' && (
              <Button onClick={() => handleOpenLessonModal(null)} className="flex items-center gap-2">
                <Plus size={18} /> {t('teacher.curriculum.addLesson')}
              </Button>
            )}
            {activeTab === 'quizzes' && (
              <Button onClick={() => handleOpenQuizModal(null)} className="flex items-center gap-2">
                <Plus size={18} /> {t('teacher.curriculum.createQuiz')}
              </Button>
            )}
            {activeTab === 'assignments' && (
              <Button onClick={() => handleOpenAssignmentModal(null)} className="flex items-center gap-2">
                <Plus size={18} /> {t('teacher.curriculum.createAssignment')}
              </Button>
            )}
          </div>
        </div>

        {/* Course Summary Metrics Bento */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-white/40">Tổng bài học</span>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Video size={16} />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{lessons.length}</div>
            <span className="text-xs text-slate-500 dark:text-white/40 mt-1 block">Bài giảng video</span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-white/40">Thời lượng</span>
              <div className="w-8 h-8 rounded-xl bg-cyan-50 dark:bg-cyan-500/20 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                <Clock size={16} />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{formatTotalDuration(lessons)}</div>
            <span className="text-xs text-slate-500 dark:text-white/40 mt-1 block">Nội dung học tập</span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-white/40">Trắc nghiệm</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <HelpCircle size={16} />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{quizzesList.length}</div>
            <span className="text-xs text-slate-500 dark:text-white/40 mt-1 block">Bài kiểm tra & Quiz</span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-white/40">Bài tập</span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <BookOpen size={16} />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{assignmentsList.length}</div>
            <span className="text-xs text-slate-500 dark:text-white/40 mt-1 block">Bài tập về nhà & thực hành</span>
          </div>
        </div>

        {/* Tab Navigation & Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          {/* Segmented Control */}
          <div className="inline-flex p-1.5 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('lessons')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all ${
                activeTab === 'lessons'
                  ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Video size={16} />
              <span>{t('teacher.curriculum.tabLessons')}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === 'lessons' ? 'bg-indigo-50 dark:bg-white/20 text-indigo-700 dark:text-white font-bold' : 'bg-slate-200/60 dark:bg-white/10 text-slate-600 dark:text-slate-300'}`}>
                {lessons.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('quizzes')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all ${
                activeTab === 'quizzes'
                  ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <HelpCircle size={16} />
              <span>{t('teacher.curriculum.tabQuizzes')}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === 'quizzes' ? 'bg-indigo-50 dark:bg-white/20 text-indigo-700 dark:text-white font-bold' : 'bg-slate-200/60 dark:bg-white/10 text-slate-600 dark:text-slate-300'}`}>
                {quizzesList.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('assignments')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all ${
                activeTab === 'assignments'
                  ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BookOpen size={16} />
              <span>{t('teacher.curriculum.tabAssignments')}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === 'assignments' ? 'bg-indigo-50 dark:bg-white/20 text-indigo-700 dark:text-white font-bold' : 'bg-slate-200/60 dark:bg-white/10 text-slate-600 dark:text-slate-300'}`}>
                {assignmentsList.length}
              </span>
            </button>
          </div>

          {/* Search bar */}
          {activeTab === 'lessons' && lessons.length > 0 && (
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm bài học..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-8 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl focus:border-indigo-500 focus:outline-none transition-colors w-full sm:w-60 text-slate-900 dark:text-white placeholder:text-slate-400 shadow-sm"
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

        {/* TAB 1: LESSONS */}
        {activeTab === 'lessons' && (
          <div>
            {lessonsLoading ? (
              <p className="text-center py-10 text-slate-500">{t('teacher.curriculum.loadingLessons')}</p>
            ) : lessons.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4">
                  <Video size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">{t('teacher.curriculum.noLessonsTitle')}</h3>
                <p className="text-slate-500 mt-1 max-w-sm mx-auto text-sm">{t('teacher.curriculum.noLessonsDesc')}</p>
                <Button onClick={() => handleOpenLessonModal(null)} className="mt-6">{t('teacher.curriculum.addLesson')}</Button>
              </div>
            ) : searchQuery ? (
              /* Filtered View (Reordering disabled while searching) */
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-3 px-1">
                  <span>Tìm thấy <strong>{filteredLessons.length}</strong> bài học khớp với "{searchQuery}"</span>
                  <span className="text-[11px] text-amber-600 dark:text-amber-400">(Kéo thả tạm tắt khi đang lọc)</span>
                </div>
                {filteredLessons.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-slate-200 dark:border-white/10 rounded-2xl">
                    <p className="text-slate-500 text-sm">Không tìm thấy bài học nào phù hợp.</p>
                    <button onClick={() => setSearchQuery('')} className="mt-2 text-xs font-semibold text-indigo-600 hover:underline">
                      Xóa bộ lọc
                    </button>
                  </div>
                ) : (
                  filteredLessons.map((lesson, idx) => (
                    <SortableLessonItem 
                      key={lesson._id} 
                      lesson={lesson}
                      index={idx}
                      onEdit={handleOpenLessonModal} 
                      onDelete={(id, title) => setDeleteTarget({ type: 'lesson', id, name: title })}
                      onPreview={(l) => setPreviewLesson(l)}
                    />
                  ))
                )}
              </div>
            ) : (
              /* Full DnD Sortable View */
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={lessons.map(l => l._id)} strategy={verticalListSortingStrategy}>
                  {lessons.map((lesson, idx) => (
                    <SortableLessonItem 
                      key={lesson._id} 
                      lesson={lesson}
                      index={idx}
                      onEdit={handleOpenLessonModal} 
                      onDelete={(id, title) => setDeleteTarget({ type: 'lesson', id, name: title })}
                      onPreview={(l) => setPreviewLesson(l)}
                    />
                  ))}
                </SortableContext>
              </DndContext>
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
                  <FileQuestion size={24} />
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
                        <h4 className="font-bold text-slate-900 dark:text-white text-base">{quiz.title}</h4>
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
                      <button onClick={() => setDeleteTarget({ type: 'quiz', id: quiz._id, name: quiz.title })} className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors" title="Xóa bài trắc nghiệm">
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

      {/* MODAL 1: ADD/EDIT LESSON */}
      {isLessonModalOpen && createPortal(
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 max-w-md w-full border border-slate-200 dark:border-white/10 shadow-2xl space-y-6 my-auto max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {editingLesson ? t('teacher.curriculum.editLesson') : t('teacher.curriculum.newLesson')}
            </h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (editingLesson) updateLessonMutation.mutate(lessonFormData);
              else createLessonMutation.mutate({ ...lessonFormData, order: lessons.length + 1 });
            }} className="space-y-4">
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

              <div className="pt-4 flex justify-end gap-3">
                <Button variant="outline" type="button" onClick={() => setIsLessonModalOpen(false)}>{t('teacher.dashboard.cancel')}</Button>
                <Button type="submit">{editingLesson ? t('teacher.curriculum.saveChanges') : t('teacher.curriculum.addLesson')}</Button>
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
                    required 
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

      {/* MODAL 3: MANAGE QUESTIONS DRAWER */}
      {activeQuizForQuestions && createPortal(
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 max-w-3xl w-full border border-slate-200 dark:border-white/10 shadow-2xl max-h-[90vh] flex flex-col my-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/10 mb-6 shrink-0">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('teacher.curriculum.questionsFor', { title: activeQuizForQuestions.title })}</h2>
                <p className="text-xs text-slate-500 mt-1">{t('teacher.curriculum.questionsDesc')}</p>
              </div>
              <div className="flex items-center gap-3">
                <Button size="sm" onClick={() => handleOpenQuestionModal(null)}>
                  <Plus size={16} /> {t('teacher.curriculum.addQuestion')}
                </Button>
                <button onClick={() => setActiveQuizForQuestions(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold text-lg">
                  ✕
                </button>
              </div>
            </div>

            <div className="overflow-y-auto space-y-4 pr-2 flex-1">
              {questionsLoading ? (
                <p className="text-center py-8 text-slate-500">{t('teacher.curriculum.loadingQuestions')}</p>
              ) : questionsList.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-200 dark:border-white/10 rounded-xl">
                  <p className="text-slate-500 font-medium">{t('teacher.curriculum.noQuestions')}</p>
                  <Button size="sm" onClick={() => handleOpenQuestionModal(null)} className="mt-4">
                    {t('teacher.curriculum.addFirstQuestion')}
                  </Button>
                </div>
              ) : (
                questionsList.map((q, idx) => (
                  <div key={q._id || idx} className="p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200/60 dark:border-white/5 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">{t('teacher.curriculum.questionNumber', { number: idx + 1, points: q.points, suffix: q.points > 1 ? 's' : '' })}</span>
                        <h4 className="font-semibold text-slate-900 dark:text-white mt-1">{q.text}</h4>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => handleOpenQuestionModal(q)} className="p-1.5 text-slate-400 hover:text-indigo-600">
                          <Edit3 size={16} />
                        </button>
                        <button 
                          onClick={() => q._id && setDeleteTarget({ type: 'question', id: q._id, name: q.text })}
                          className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-2 text-xs">
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} className={`p-2.5 rounded-lg border flex items-center gap-2 ${opt.isCorrect ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-semibold' : 'bg-white dark:bg-black/20 border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400'}`}>
                          {opt.isCorrect ? <CheckCircle2 size={14} className="text-emerald-500 shrink-0" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />}
                          <span className="truncate">{opt.text}</span>
                        </div>
                      ))}
                    </div>

                    {q.explanation && (
                      <p className="text-xs text-slate-400 italic bg-black/20 p-2.5 rounded-lg">
                        {t('teacher.curriculum.explanation')}: {q.explanation}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 4: ADD/EDIT QUESTION */}
      {isQuestionModalOpen && createPortal(
        <div className="fixed inset-0 z-[1010] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 max-w-xl w-full border border-slate-200 dark:border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto space-y-6 my-auto">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {editingQuestion ? t('teacher.curriculum.editQuestion') : t('teacher.curriculum.newQuestion')}
            </h2>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              if (editingQuestion) updateQuestionMutation.mutate(questionFormData);
              else createQuestionMutation.mutate(questionFormData);
            }} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">{t('teacher.curriculum.questionText')}</label>
                <textarea 
                  rows={2}
                  value={questionFormData.text} 
                  onChange={(e) => setQuestionFormData({...questionFormData, text: e.target.value})} 
                  placeholder={t('teacher.curriculum.questionTextPlaceholder')} 
                  required 
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">{t('teacher.curriculum.optionsLabel')}</label>
                <div className="space-y-2">
                  {questionFormData.options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <input 
                        type="radio" 
                        name="correctOptionRadio"
                        checked={opt.isCorrect}
                        onChange={() => {
                          const updated = questionFormData.options.map((o, i) => ({
                            ...o,
                            isCorrect: i === idx
                          }));
                          setQuestionFormData({ ...questionFormData, options: updated });
                        }}
                        className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                      />
                      <Input 
                        value={opt.text}
                        onChange={(e) => {
                          const updated = [...questionFormData.options];
                          updated[idx].text = e.target.value;
                          setQuestionFormData({ ...questionFormData, options: updated });
                        }}
                        placeholder={t('teacher.curriculum.optionPlaceholder', { number: idx + 1 })}
                        required
                        className="flex-1"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">{t('teacher.curriculum.pointsLabel')}</label>
                  <Input 
                    type="number"
                    min="1"
                    value={questionFormData.points} 
                    onChange={(e) => setQuestionFormData({...questionFormData, points: Number(e.target.value)})} 
                    required 
                    className="w-full"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">{t('teacher.curriculum.explanationOptional')}</label>
                <Input 
                  value={questionFormData.explanation} 
                  onChange={(e) => setQuestionFormData({...questionFormData, explanation: e.target.value})} 
                  placeholder={t('teacher.curriculum.explanationPlaceholder')} 
                  className="w-full"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <Button variant="outline" type="button" onClick={() => setIsQuestionModalOpen(false)}>{t('teacher.dashboard.cancel')}</Button>
                <Button type="submit">{editingQuestion ? t('teacher.curriculum.saveChanges') : t('teacher.curriculum.saveQuestion')}</Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 5: ADD/EDIT ASSIGNMENT */}
      {isAssignmentModalOpen && createPortal(
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 max-w-lg w-full border border-slate-200 dark:border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto space-y-6 my-auto">
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
                        {previewLesson.title}
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
                      title={previewLesson.title}
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
                    <p className="text-sm text-slate-400">Chưa có liên kết video</p>
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
                      <ExternalLink size={14} /> Mở nguồn video
                    </a>
                  ) : <span />}
                  <Button variant="outline" size="sm" onClick={() => setPreviewLesson(null)}>
                    Đóng
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
                className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-200 dark:border-white/10 shadow-2xl space-y-5 my-auto"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                    <AlertTriangle size={24} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {deleteTarget.type === 'lesson' && (t('teacher.curriculum.deleteLessonTitle', 'Xác nhận xóa bài học'))}
                      {deleteTarget.type === 'quiz' && (t('teacher.curriculum.deleteQuizTitle', 'Xác nhận xóa bài kiểm tra'))}
                      {deleteTarget.type === 'question' && (t('teacher.curriculum.deleteQuestionTitle', 'Xác nhận xóa câu hỏi'))}
                      {deleteTarget.type === 'assignment' && (t('teacher.curriculum.deleteAssignmentTitle', 'Xác nhận xóa bài tập'))}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Bạn có chắc chắn muốn xóa <span className="font-semibold text-slate-900 dark:text-white">"{deleteTarget.name}"</span>? Hành động này không thể hoàn tác.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => setDeleteTarget(null)}
                    disabled={
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
                    loading={
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
