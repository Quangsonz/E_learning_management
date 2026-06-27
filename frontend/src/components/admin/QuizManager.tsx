import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { quizApi } from '../../services/quiz.api';
import { Button, Modal, EmptyState } from '../ui';
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
  const [managingQuestionsQuiz, setManagingQuestionsQuiz] = useState<any | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['quizzes', courseId],
    queryFn: () => quizApi.getQuizzesByCourse(courseId)
  });

  const quizzes = data?.data?.data?.quizzes || [];

  const createMutation = useMutation({
    mutationFn: (data: any) => quizApi.createQuiz({ ...data, course: courseId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes', courseId] });
      setFormOpen(false);
      setTitle('');
      setPassingScore('80');
      setTimeLimit('30');
    }
  });

  const handleSave = () => {
    if (!title.trim() || !passingScore) return;
    createMutation.mutate({ 
      title, 
      passingScore: Number(passingScore), 
      timeLimit: timeLimit ? Number(timeLimit) : undefined 
    });
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
              <h3 className="font-semibold text-slate-800 dark:text-slate-200">New Quiz</h3>
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
                <Button variant="ghost" size="sm" onClick={() => setFormOpen(false)}>Cancel</Button>
                <Button size="sm" onClick={handleSave} disabled={createMutation.isPending || !title || !passingScore}>Save Quiz</Button>
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
    </>
  );
};
