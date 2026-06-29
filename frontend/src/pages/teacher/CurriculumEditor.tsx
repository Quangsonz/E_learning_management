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
import { GripVertical, Plus, Trash2, Edit3, Video } from 'lucide-react';

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

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // For modal (Add/Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [formData, setFormData] = useState({ title: '', videoUrl: '' });

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

  useEffect(() => {
    if (lessonsData?.data?.lessons) {
      setLessons(lessonsData.data.lessons);
    }
  }, [lessonsData]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const reorderMutation = useMutation({
    mutationFn: (newOrder: { id: string; order: number }[]) => lessonApi.reorderLessons(courseId!, newOrder),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessons', courseId] });
      setToast({ message: 'Curriculum order saved', type: 'success' });
    },
    onError: () => setToast({ message: 'Failed to reorder lessons', type: 'error' }),
  });

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setLessons((items) => {
        const oldIndex = items.findIndex((item) => item._id === active.id);
        const newIndex = items.findIndex((item) => item._id === over.id);
        const reordered = arrayMove(items, oldIndex, newIndex);
        
        // Save new order to backend
        const payload = reordered.map((l, index) => ({ id: l._id, order: index + 1 }));
        reorderMutation.mutate(payload);

        return reordered;
      });
    }
  };

  const createLessonMutation = useMutation({
    mutationFn: (data: any) => lessonApi.createLesson(courseId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessons', courseId] });
      setIsModalOpen(false);
      setToast({ message: 'Lesson added', type: 'success' });
    }
  });

  const updateLessonMutation = useMutation({
    mutationFn: (data: any) => lessonApi.updateLesson(courseId!, editingLesson!._id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessons', courseId] });
      setIsModalOpen(false);
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

  const handleOpenModal = (lesson: Lesson | null = null) => {
    if (lesson) {
      setEditingLesson(lesson);
      setFormData({ title: lesson.title, videoUrl: lesson.videoUrl });
    } else {
      setEditingLesson(null);
      setFormData({ title: '', videoUrl: '' });
    }
    setIsModalOpen(true);
  };

  const handleSaveLesson = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLesson) {
      updateLessonMutation.mutate(formData);
    } else {
      createLessonMutation.mutate({ ...formData, order: lessons.length + 1 });
    }
  };

  const handleDelete = (lessonId: string) => {
    if (confirm('Are you sure you want to delete this lesson?')) {
      deleteLessonMutation.mutate(lessonId);
    }
  };

  if (courseLoading || lessonsLoading) return <PageShell><div className="pt-24 text-center">Loading curriculum...</div></PageShell>;

  return (
    <PageShell wide>
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <button onClick={() => navigate('/teacher-courses')} className="text-sm text-indigo-600 mb-2 hover:underline">
              ← Back to Courses
            </button>
            <SectionHeader 
              title={`Curriculum: ${courseData?.data?.course?.title || 'Course'}`} 
              description="Drag and drop lessons to reorder them."
            />
          </div>
          <Button onClick={() => handleOpenModal(null)} className="flex items-center gap-2">
            <Plus size={18} /> Add Lesson
          </Button>
        </div>

        {lessons.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">No lessons yet</h3>
            <p className="text-slate-500 mt-2">Get started by adding your first lesson.</p>
            <Button onClick={() => handleOpenModal(null)} className="mt-6">Add Lesson</Button>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={lessons.map(l => l._id)} strategy={verticalListSortingStrategy}>
              {lessons.map((lesson) => (
                <SortableLessonItem 
                  key={lesson._id} 
                  lesson={lesson} 
                  onEdit={handleOpenModal} 
                  onDelete={handleDelete}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 max-w-md w-full border border-slate-200 dark:border-white/10 shadow-2xl">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
              {editingLesson ? 'Edit Lesson' : 'Add New Lesson'}
            </h2>
            <form onSubmit={handleSaveLesson} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Title</label>
                <Input 
                  value={formData.title} 
                  onChange={(e) => setFormData({...formData, title: e.target.value})} 
                  placeholder="e.g. Introduction to React" 
                  required 
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Video URL</label>
                <Input 
                  value={formData.videoUrl} 
                  onChange={(e) => setFormData({...formData, videoUrl: e.target.value})} 
                  placeholder="e.g. https://youtube.com/..." 
                  required 
                  className="w-full"
                />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit">{editingLesson ? 'Save Changes' : 'Add Lesson'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </PageShell>
  );
};

export default CurriculumEditor;
