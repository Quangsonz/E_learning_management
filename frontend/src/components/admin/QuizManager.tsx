import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { quizApi } from '../../services/quiz.api';
import { Button, Modal, EmptyState, ConfirmModal } from '../ui';
import { Input } from '../ui/Input';
import { QuestionManager } from './QuestionManager';

type QuizManagerProps = {
  courseId: string;
  courseTitle: string;
  onClose: () => void;
};

export const QuizManager: React.FC<QuizManagerProps> = ({ courseId, courseTitle, onClose }) => {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [passingScore, setPassingScore] = useState('80');
  const [timeLimit, setTimeLimit] = useState('30');
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null);
  const [managingQuestionsQuiz, setManagingQuestionsQuiz] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['quizzes', courseId],
    queryFn: () => quizApi.getQuizzesByCourse(courseId)
  });

  const quizzes = data?.data?.data?.quizzes || [];

  const createMutation = useMutation({
    mutationFn: (data: any) => quizApi.createQuiz({ ...data, course: courseId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes', courseId] });
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => quizApi.updateQuiz(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes', courseId] });
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => quizApi.deleteQuiz(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes', courseId] });
    }
  });

  const resetForm = () => {
    setFormOpen(false);
    setEditingQuizId(null);
    setTitle('');
    setPassingScore('80');
    setTimeLimit('30');
  };

  const handleSave = () => {
    if (!title.trim() || !passingScore) return;
    const payload = {
      title, 
      passingScore: Number(passingScore), 
      timeLimit: timeLimit ? Number(timeLimit) : undefined 
    };

    if (editingQuizId) {
      updateMutation.mutate({ id: editingQuizId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <>
      <Modal isOpen={!managingQuestionsQuiz} onClose={onClose}>
        <div className="space-y-6">
          <div>
            <p className="section-label">Manage Quizzes</p>
            <h2 className="mt-2 section-title">{courseTitle}</h2>
          </div>

          {!formOpen ? (
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-slate-800 dark:text-slate-200">Quizzes ({quizzes.length})</h3>
              <Button size="sm" onClick={() => setFormOpen(true)}>+ Add Quiz</Button>
            </div>
          ) : (
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl space-y-4 border border-slate-200 dark:border-slate-700">
              <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                {editingQuizId ? 'Edit Quiz' : 'New Quiz'}
              </h3>
              <div className="space-y-3">
                <label className="block space-y-1">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Title</span>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Midterm Exam" />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block space-y-1">
                     <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Passing Score (%)</span>
                    <Input type="number" value={passingScore} onChange={(e) => setPassingScore(e.target.value)} placeholder="80" />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Time Limit (mins)</span>
                    <Input type="number" value={timeLimit} onChange={(e) => setTimeLimit(e.target.value)} placeholder="30" />
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" onClick={resetForm}>Cancel</Button>
                <Button size="sm" onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending || !title || !passingScore}>
                  {editingQuizId ? 'Save Changes' : 'Save Quiz'}
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {isLoading ? (
              <p className="text-sm text-slate-500">Loading quizzes...</p>
            ) : quizzes.length > 0 ? (
              quizzes.map((quiz: any, index: number) => (
                <div key={quiz._id} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-500">{index + 1}</span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{quiz.title}</p>
                      <p className="text-xs text-slate-500">Pass: {quiz.passingScore}% • {quiz.timeLimit ? `${quiz.timeLimit} mins` : 'No limit'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="!h-8 !px-3" onClick={() => setManagingQuestionsQuiz(quiz)}>
                      Questions
                    </Button>
                    <button
                      type="button"
                      className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors"
                      onClick={() => {
                        setEditingQuizId(quiz._id);
                        setTitle(quiz.title);
                        setPassingScore(quiz.passingScore.toString());
                        setTimeLimit(quiz.timeLimit ? quiz.timeLimit.toString() : '');
                        setFormOpen(true);
                      }}
                      title="Edit Quiz"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                      onClick={() => {
                        setDeleteTarget({ id: quiz._id, title: quiz.title });
                      }}
                      title="Delete Quiz"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            ) : !formOpen ? (
              <EmptyState title="No quizzes yet" message="Create a quiz to test your students' knowledge." />
            ) : null}
          </div>

          <div className="pt-4 flex justify-end border-t border-slate-200 dark:border-slate-700">
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>
        </div>
      </Modal>

      {managingQuestionsQuiz && (
        <QuestionManager 
          quizId={managingQuestionsQuiz._id} 
          quizTitle={managingQuestionsQuiz.title} 
          onClose={() => setManagingQuestionsQuiz(null)} 
        />
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Xóa bài kiểm tra?"
        message={`Bạn có chắc chắn muốn xóa Quiz "${deleteTarget?.title}" và các câu hỏi liên quan?`}
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
