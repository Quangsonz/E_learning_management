import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  BookOpen, HelpCircle, Upload, CheckCircle2, FileText 
} from 'lucide-react';

const SortableLessonItem = ({ lesson, onEdit, onDelete }: { lesson: Lesson, onEdit: (l: Lesson) => void, onDelete: (id: string) => void }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: lesson._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm mb-3">
      <button {...attributes} {...listeners} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-grab active:cursor-grabbing">
        <GripVertical size={20} />
      </button>
      
      <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
        <Video size={20} />
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-slate-900 dark:text-white truncate">{lesson.title}</h4>
        <p className="text-sm text-slate-500 truncate">{lesson.videoUrl}</p>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={() => onEdit(lesson)} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
          <Edit3 size={18} />
        </button>
        <button onClick={() => onDelete(lesson._id)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
};

const CurriculumEditor = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'lessons' | 'quizzes' | 'assignments'>('lessons');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Lesson states
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [lessonFormData, setLessonFormData] = useState({ title: '', videoUrl: '' });
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);

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
      setToast({ message: 'Curriculum order saved', type: 'success' });
    },
    onError: () => setToast({ message: 'Failed to reorder lessons', type: 'error' }),
  });

  const createLessonMutation = useMutation({
    mutationFn: (data: any) => lessonApi.createLesson(courseId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessons', courseId] });
      setIsLessonModalOpen(false);
      setToast({ message: 'Lesson added', type: 'success' });
    }
  });

  const updateLessonMutation = useMutation({
    mutationFn: (data: any) => lessonApi.updateLesson(courseId!, editingLesson!._id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessons', courseId] });
      setIsLessonModalOpen(false);
      setToast({ message: 'Lesson updated', type: 'success' });
    }
  });

  const deleteLessonMutation = useMutation({
    mutationFn: (lessonId: string) => lessonApi.deleteLesson(courseId!, lessonId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessons', courseId] });
      setToast({ message: 'Lesson deleted', type: 'success' });
    }
  });

  // Quiz Mutations
  const createQuizMutation = useMutation({
    mutationFn: (data: any) => quizApi.createQuiz({ ...data, course: courseId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes', courseId] });
      setIsQuizModalOpen(false);
      setToast({ message: 'Quiz created successfully', type: 'success' });
    }
  });

  const updateQuizMutation = useMutation({
    mutationFn: (data: any) => quizApi.updateQuiz(editingQuiz!._id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes', courseId] });
      setIsQuizModalOpen(false);
      setToast({ message: 'Quiz updated successfully', type: 'success' });
    }
  });

  const deleteQuizMutation = useMutation({
    mutationFn: (quizId: string) => quizApi.deleteQuiz(quizId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes', courseId] });
      setToast({ message: 'Quiz deleted', type: 'success' });
    }
  });

  // Question Mutations
  const createQuestionMutation = useMutation({
    mutationFn: (data: any) => quizApi.addQuestion(activeQuizForQuestions!._id, data),
    onSuccess: () => {
      refetchQuestions();
      setIsQuestionModalOpen(false);
      setToast({ message: 'Question added', type: 'success' });
    }
  });

  const updateQuestionMutation = useMutation({
    mutationFn: (data: any) => quizApi.updateQuestion(editingQuestion!._id!, data),
    onSuccess: () => {
      refetchQuestions();
      setIsQuestionModalOpen(false);
      setToast({ message: 'Question updated', type: 'success' });
    }
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: (questionId: string) => quizApi.deleteQuestion(questionId),
    onSuccess: () => {
      refetchQuestions();
      setToast({ message: 'Question deleted', type: 'success' });
    }
  });

  // Assignment Mutations
  const createAssignmentMutation = useMutation({
    mutationFn: (data: any) => assignmentApi.createAssignment(courseId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments', courseId] });
      setIsAssignmentModalOpen(false);
      setToast({ message: 'Assignment created', type: 'success' });
    }
  });

  const updateAssignmentMutation = useMutation({
    mutationFn: (data: any) => assignmentApi.updateAssignment(editingAssignment!._id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments', courseId] });
      setIsAssignmentModalOpen(false);
      setToast({ message: 'Assignment updated', type: 'success' });
    }
  });

  const deleteAssignmentMutation = useMutation({
    mutationFn: (id: string) => assignmentApi.deleteAssignment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments', courseId] });
      setToast({ message: 'Assignment deleted', type: 'success' });
    }
  });

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
    try {
      setIsUploadingVideo(true);
      const res = await uploadApi.uploadVideo(file);
      if (res.data?.data?.url) {
        setLessonFormData(prev => ({ ...prev, videoUrl: res.data.data.url }));
        setToast({ message: 'Video uploaded successfully!', type: 'success' });
      }
    } catch (err) {
      setToast({ message: 'Video upload failed', type: 'error' });
    } finally {
      setIsUploadingVideo(false);
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
      setLessonFormData({ title: lesson.title, videoUrl: lesson.videoUrl });
    } else {
      setEditingLesson(null);
      setLessonFormData({ title: '', videoUrl: '' });
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

  if (courseLoading) return <PageShell><div className="pt-24 text-center">Loading course data...</div></PageShell>;

  const quizzesList: Quiz[] = quizzesData?.data?.quizzes || quizzesData?.data?.data?.quizzes || [];
  const assignmentsList: Assignment[] = Array.isArray(assignmentsData) ? assignmentsData : (assignmentsData as any)?.data?.assignments || [];
  const questionsList: Question[] = questionsData?.data?.questions || [];

  return (
    <PageShell wide>
      <div className="max-w-5xl mx-auto py-12 px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <button onClick={() => navigate('/teacher-courses')} className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 mb-2 hover:underline inline-flex items-center gap-1">
              ← Back to Courses
            </button>
            <SectionHeader 
              label="Curriculum Management"
              title={`Curriculum: ${courseData?.data?.course?.title || 'Course'}`} 
              description="Manage lessons, quizzes, and homework assignments for your course."
            />
          </div>

          <div className="flex items-center gap-3">
            {activeTab === 'lessons' && (
              <Button onClick={() => handleOpenLessonModal(null)} className="flex items-center gap-2">
                <Plus size={18} /> Add Lesson
              </Button>
            )}
            {activeTab === 'quizzes' && (
              <Button onClick={() => handleOpenQuizModal(null)} className="flex items-center gap-2">
                <Plus size={18} /> Create Quiz
              </Button>
            )}
            {activeTab === 'assignments' && (
              <Button onClick={() => handleOpenAssignmentModal(null)} className="flex items-center gap-2">
                <Plus size={18} /> Create Assignment
              </Button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/10 mb-8 pb-1">
          <button
            onClick={() => setActiveTab('lessons')}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl transition-all ${
              activeTab === 'lessons'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
            }`}
          >
            <Video size={18} />
            Lessons ({lessons.length})
          </button>

          <button
            onClick={() => setActiveTab('quizzes')}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl transition-all ${
              activeTab === 'quizzes'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
            }`}
          >
            <HelpCircle size={18} />
            Quizzes ({quizzesList.length})
          </button>

          <button
            onClick={() => setActiveTab('assignments')}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl transition-all ${
              activeTab === 'assignments'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
            }`}
          >
            <BookOpen size={18} />
            Assignments ({assignmentsList.length})
          </button>
        </div>

        {/* TAB 1: LESSONS */}
        {activeTab === 'lessons' && (
          <div>
            {lessonsLoading ? (
              <p className="text-center py-10 text-slate-500">Loading lessons...</p>
            ) : lessons.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">No lessons added yet</h3>
                <p className="text-slate-500 mt-2">Get started by creating your first video lesson.</p>
                <Button onClick={() => handleOpenLessonModal(null)} className="mt-6">Add Lesson</Button>
              </div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={lessons.map(l => l._id)} strategy={verticalListSortingStrategy}>
                  {lessons.map((lesson) => (
                    <SortableLessonItem 
                      key={lesson._id} 
                      lesson={lesson} 
                      onEdit={handleOpenLessonModal} 
                      onDelete={(id) => confirm('Delete lesson?') && deleteLessonMutation.mutate(id)}
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
              <p className="text-center py-10 text-slate-500">Loading quizzes...</p>
            ) : quizzesList.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">No quizzes created yet</h3>
                <p className="text-slate-500 mt-2">Create multiple-choice quizzes to test student knowledge.</p>
                <Button onClick={() => handleOpenQuizModal(null)} className="mt-6">Create Quiz</Button>
              </div>
            ) : (
              <div className="space-y-4">
                {quizzesList.map((quiz) => (
                  <div key={quiz._id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                        <FileQuestion size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-lg">{quiz.title}</h4>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-1">
                          <span>Passing Score: <strong className="text-emerald-600 dark:text-emerald-400">{quiz.passingScore}%</strong></span>
                          <span>Time Limit: <strong>{quiz.timeLimit || 'No limit'} mins</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Button size="sm" variant="outline" onClick={() => setActiveQuizForQuestions(quiz)}>
                        Manage Questions
                      </Button>
                      <button onClick={() => handleOpenQuizModal(quiz)} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                        <Edit3 size={18} />
                      </button>
                      <button onClick={() => confirm('Delete quiz?') && deleteQuizMutation.mutate(quiz._id)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
                        <Trash2 size={18} />
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
              <p className="text-center py-10 text-slate-500">Loading assignments...</p>
            ) : assignmentsList.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">No assignments created yet</h3>
                <p className="text-slate-500 mt-2">Add homework assignments for students to complete and submit work.</p>
                <Button onClick={() => handleOpenAssignmentModal(null)} className="mt-6">Create Assignment</Button>
              </div>
            ) : (
              <div className="space-y-4">
                {assignmentsList.map((assignment) => (
                  <div key={assignment._id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                        <BookOpen size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-lg">{assignment.title}</h4>
                        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{assignment.description}</p>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
                          <span>Max Points: <strong className="text-indigo-600 dark:text-indigo-400">{assignment.maxPoints} pts</strong></span>
                          <span>Due Date: <strong>{new Date(assignment.dueDate).toLocaleDateString()}</strong></span>
                          {assignment.attachmentUrl && (
                            <a href={assignment.attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-sky-500 hover:underline flex items-center gap-1">
                              <FileText size={12} /> Attachment
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button onClick={() => handleOpenAssignmentModal(assignment)} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                        <Edit3 size={18} />
                      </button>
                      <button onClick={() => confirm('Delete assignment?') && deleteAssignmentMutation.mutate(assignment._id)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
                        <Trash2 size={18} />
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
      {isLessonModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 max-w-md w-full border border-slate-200 dark:border-white/10 shadow-2xl space-y-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {editingLesson ? 'Edit Lesson' : 'Add New Lesson'}
            </h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (editingLesson) updateLessonMutation.mutate(lessonFormData);
              else createLessonMutation.mutate({ ...lessonFormData, order: lessons.length + 1 });
            }} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Lesson Title</label>
                <Input 
                  value={lessonFormData.title} 
                  onChange={(e) => setLessonFormData({...lessonFormData, title: e.target.value})} 
                  placeholder="e.g. Introduction to React" 
                  required 
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Video Source</label>
                <Input 
                  value={lessonFormData.videoUrl} 
                  onChange={(e) => setLessonFormData({...lessonFormData, videoUrl: e.target.value})} 
                  placeholder="Paste YouTube or Cloudinary Video URL..." 
                  required 
                  className="w-full"
                />
                
                <div className="pt-2">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors">
                    <Upload size={14} />
                    {isUploadingVideo ? 'Uploading video...' : 'Upload Video File'}
                    <input type="file" accept="video/*" className="hidden" onChange={handleVideoFileUpload} disabled={isUploadingVideo} />
                  </label>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <Button variant="outline" type="button" onClick={() => setIsLessonModalOpen(false)}>Cancel</Button>
                <Button type="submit">{editingLesson ? 'Save Changes' : 'Add Lesson'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD/EDIT QUIZ */}
      {isQuizModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 max-w-md w-full border border-slate-200 dark:border-white/10 shadow-2xl space-y-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {editingQuiz ? 'Edit Quiz' : 'Create New Quiz'}
            </h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (editingQuiz) updateQuizMutation.mutate(quizFormData);
              else createQuizMutation.mutate(quizFormData);
            }} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Quiz Title</label>
                <Input 
                  value={quizFormData.title} 
                  onChange={(e) => setQuizFormData({...quizFormData, title: e.target.value})} 
                  placeholder="e.g. Mid-term Assessment" 
                  required 
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Passing Score (%)</label>
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
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Time Limit (Mins)</label>
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
                <Button variant="outline" type="button" onClick={() => setIsQuizModalOpen(false)}>Cancel</Button>
                <Button type="submit">{editingQuiz ? 'Save Changes' : 'Create Quiz'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: MANAGE QUESTIONS DRAWER */}
      {activeQuizForQuestions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 max-w-3xl w-full border border-slate-200 dark:border-white/10 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/10 mb-6 shrink-0">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Questions for: {activeQuizForQuestions.title}</h2>
                <p className="text-xs text-slate-500 mt-1">Add multiple choice questions to this quiz.</p>
              </div>
              <div className="flex items-center gap-3">
                <Button size="sm" onClick={() => handleOpenQuestionModal(null)}>
                  <Plus size={16} /> Add Question
                </Button>
                <button onClick={() => setActiveQuizForQuestions(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold text-lg">
                  ✕
                </button>
              </div>
            </div>

            <div className="overflow-y-auto space-y-4 pr-2 flex-1">
              {questionsLoading ? (
                <p className="text-center py-8 text-slate-500">Loading questions...</p>
              ) : questionsList.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-200 dark:border-white/10 rounded-xl">
                  <p className="text-slate-500 font-medium">No questions in this quiz yet.</p>
                  <Button size="sm" onClick={() => handleOpenQuestionModal(null)} className="mt-4">
                    Add First Question
                  </Button>
                </div>
              ) : (
                questionsList.map((q, idx) => (
                  <div key={q._id || idx} className="p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200/60 dark:border-white/5 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Question {idx + 1} ({q.points} pt{q.points > 1 ? 's' : ''})</span>
                        <h4 className="font-semibold text-slate-900 dark:text-white mt-1">{q.text}</h4>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => handleOpenQuestionModal(q)} className="p-1.5 text-slate-400 hover:text-indigo-600">
                          <Edit3 size={16} />
                        </button>
                        <button onClick={() => q._id && confirm('Delete question?') && deleteQuestionMutation.mutate(q._id)} className="p-1.5 text-slate-400 hover:text-rose-500">
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
                        Explanation: {q.explanation}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: ADD/EDIT QUESTION */}
      {isQuestionModalOpen && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 max-w-xl w-full border border-slate-200 dark:border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto space-y-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {editingQuestion ? 'Edit Question' : 'Add New Question'}
            </h2>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              if (editingQuestion) updateQuestionMutation.mutate(questionFormData);
              else createQuestionMutation.mutate(questionFormData);
            }} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Question Text</label>
                <textarea 
                  rows={2}
                  value={questionFormData.text} 
                  onChange={(e) => setQuestionFormData({...questionFormData, text: e.target.value})} 
                  placeholder="e.g. What is the primary purpose of React Hooks?" 
                  required 
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Options (Check the correct answer)</label>
                <div className="space-y-2">
                  {questionFormData.options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <input 
                        type="checkbox"
                        checked={opt.isCorrect}
                        onChange={(e) => {
                          const updated = [...questionFormData.options];
                          updated[idx].isCorrect = e.target.checked;
                          setQuestionFormData({ ...questionFormData, options: updated });
                        }}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <Input 
                        value={opt.text}
                        onChange={(e) => {
                          const updated = [...questionFormData.options];
                          updated[idx].text = e.target.value;
                          setQuestionFormData({ ...questionFormData, options: updated });
                        }}
                        placeholder={`Option ${idx + 1}`}
                        required
                        className="flex-1"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Points</label>
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
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Explanation (Optional)</label>
                <Input 
                  value={questionFormData.explanation} 
                  onChange={(e) => setQuestionFormData({...questionFormData, explanation: e.target.value})} 
                  placeholder="Explain why the correct answer is right..." 
                  className="w-full"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <Button variant="outline" type="button" onClick={() => setIsQuestionModalOpen(false)}>Cancel</Button>
                <Button type="submit">{editingQuestion ? 'Save Changes' : 'Save Question'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: ADD/EDIT ASSIGNMENT */}
      {isAssignmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 max-w-lg w-full border border-slate-200 dark:border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto space-y-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {editingAssignment ? 'Edit Assignment' : 'Create Homework Assignment'}
            </h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (editingAssignment) updateAssignmentMutation.mutate(assignmentFormData);
              else createAssignmentMutation.mutate(assignmentFormData);
            }} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Assignment Title</label>
                <Input 
                  value={assignmentFormData.title} 
                  onChange={(e) => setAssignmentFormData({...assignmentFormData, title: e.target.value})} 
                  placeholder="e.g. Build a Todo App with State Management" 
                  required 
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Instructions / Description</label>
                <textarea 
                  rows={3}
                  value={assignmentFormData.description} 
                  onChange={(e) => setAssignmentFormData({...assignmentFormData, description: e.target.value})} 
                  placeholder="Detailed guidelines on what students should submit..." 
                  required 
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Max Points</label>
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
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Due Date</label>
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
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Attachment File URL (Optional)</label>
                <Input 
                  value={assignmentFormData.attachmentUrl} 
                  onChange={(e) => setAssignmentFormData({...assignmentFormData, attachmentUrl: e.target.value})} 
                  placeholder="https://..." 
                  className="w-full"
                />

                <div className="pt-2">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors">
                    <Upload size={14} />
                    {isUploadingDoc ? 'Uploading doc...' : 'Upload Document File'}
                    <input type="file" className="hidden" onChange={handleDocFileUpload} disabled={isUploadingDoc} />
                  </label>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <Button variant="outline" type="button" onClick={() => setIsAssignmentModalOpen(false)}>Cancel</Button>
                <Button type="submit">{editingAssignment ? 'Save Changes' : 'Create Assignment'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Toast visible={!!toast} message={toast?.message || ''} variant={toast?.type} onClose={() => setToast(null)} />
    </PageShell>
  );
};

export default CurriculumEditor;
