import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { lessonApi } from '../../services/lesson.api';
import { moduleApi, Module } from '../../services/module.api';
import { Button, Modal, EmptyState, ConfirmModal } from '../ui';
import { Input } from '../ui/Input';
import { LessonQuestionManager } from './LessonQuestionManager';
import { useLocalizedValue } from '../../utils/localized';

type LessonManagerProps = {
  courseId: string;
  courseTitle: string;
  onClose: () => void;
};

export const LessonManager: React.FC<LessonManagerProps> = ({ courseId, courseTitle, onClose }) => {
  const lv = useLocalizedValue();
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [selectedModuleId, setSelectedModuleId] = useState('');
  const [activeQuestionLesson, setActiveQuestionLesson] = useState<{ id: string, title: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['lessons', courseId],
    queryFn: () => lessonApi.getLessons(courseId)
  });

  const { data: modulesData } = useQuery({
    queryKey: ['modules', courseId],
    queryFn: () => moduleApi.getModules(courseId)
  });

  const modules: Module[] = modulesData?.data?.modules || [];
  const lessons = data?.data?.lessons || [];

  const createMutation = useMutation({
    mutationFn: (payload: any) => lessonApi.createLesson(courseId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessons', courseId] });
      queryClient.invalidateQueries({ queryKey: ['modules', courseId] });
      setFormOpen(false);
      setTitle('');
      setVideoUrl('');
      setSelectedModuleId('');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (lessonId: string) => lessonApi.deleteLesson(courseId, lessonId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessons', courseId] });
      queryClient.invalidateQueries({ queryKey: ['modules', courseId] });
    }
  });

  const handleSave = () => {
    if (!title.trim() || !videoUrl.trim()) return;
    const moduleId = selectedModuleId || (modules.length > 0 ? modules[0]._id : undefined);
    createMutation.mutate({ title, videoUrl, moduleId });
  };

  return (
    <>
      <Modal isOpen={true} onClose={onClose}>
        <div className="space-y-6">
          <div>
            <p className="section-label">Manage Lessons</p>
            <h2 className="mt-2 section-title">{courseTitle}</h2>
          </div>

          {!formOpen ? (
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-slate-800 dark:text-slate-200">Curriculum ({lessons.length})</h3>
              <Button size="sm" onClick={() => setFormOpen(true)}>+ Add Lesson</Button>
            </div>
          ) : (
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl space-y-4 border border-slate-200 dark:border-slate-700">
              <h3 className="font-semibold text-slate-800 dark:text-slate-200">New Lesson</h3>
              <div className="space-y-3">
                {modules.length > 0 && (
                  <label className="block space-y-1">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Chương học</span>
                    <select
                      value={selectedModuleId || modules[0]._id}
                      onChange={(e) => setSelectedModuleId(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {modules.map((m) => (
                        <option key={m._id} value={m._id}>
                          {lv(m.title)}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <label className="block space-y-1">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Title</span>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Introduction to the course" />
                </label>
                <label className="block space-y-1">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Video URL (YouTube or MP4)</span>
                  <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." />
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" onClick={() => setFormOpen(false)}>Cancel</Button>
                <Button size="sm" onClick={handleSave} disabled={createMutation.isPending || !title || !videoUrl}>Save Lesson</Button>
              </div>
            </div>
          )}

          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {isLoading ? (
              <p className="text-sm text-slate-500">Loading lessons...</p>
            ) : lessons.length > 0 ? (
              lessons.map((lesson: any, index: number) => {
                const modId = typeof lesson.module === 'object' ? lesson.module?._id : (lesson.module || lesson.moduleId);
                const foundModule = modules.find(m => m._id === modId);
                const moduleName = foundModule ? lv(foundModule.title) : null;

                return (
                  <div key={lesson._id} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-500">{index + 1}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{lv(lesson.title)}</p>
                          {moduleName && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                              {moduleName}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 truncate max-w-[200px] sm:max-w-[300px]">{lesson.videoUrl}</p>
                      </div>
                    </div>
                  <div className="flex items-center gap-1">
                    <button
                      className="p-2 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-md transition-colors text-xs font-semibold"
                      onClick={() => setActiveQuestionLesson({ id: lesson._id, title: lv(lesson.title) })}
                      title="Manage questions for this lesson"
                    >
                      Questions
                    </button>
                    <button 
                      className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-md transition-colors"
                      onClick={() => setDeleteTarget({ id: lesson._id, title: lv(lesson.title) })}
                      title="Delete lesson"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2 2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                  </div>
                </div>
              );
            })
            ) : !formOpen ? (
              <EmptyState title="No lessons yet" message="Add your first video lesson to start building this course." />
            ) : null}
          </div>

          <div className="pt-4 flex justify-end border-t border-slate-200 dark:border-slate-700">
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>
        </div>
        
        {activeQuestionLesson && (
          <LessonQuestionManager
            lessonId={activeQuestionLesson.id}
            lessonTitle={activeQuestionLesson.title}
            onClose={() => setActiveQuestionLesson(null)}
          />
        )}
      </Modal>

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Xóa bài giảng?"
        message={`Bạn có chắc muốn xóa bài giảng "${deleteTarget?.title}"? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa"
        confirmVariant="danger"
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
};

