import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { quizApi } from '../../services/quiz.api';
import { Button, Modal, EmptyState } from '../ui';
import { Input } from '../ui/Input';

type LessonQuestionManagerProps = {
  lessonId: string;
  lessonTitle: string;
  onClose: () => void;
};

export const LessonQuestionManager: React.FC<LessonQuestionManagerProps> = ({ lessonId, lessonTitle, onClose }) => {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [text, setText] = useState('');
  const [points, setPoints] = useState(1);
  const [options, setOptions] = useState([
    { text: '', isCorrect: true },
    { text: '', isCorrect: false }
  ]);
  const [explanation, setExplanation] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['lesson-questions', lessonId],
    queryFn: () => quizApi.getLessonQuestions(lessonId)
  });

  const questions = data?.data?.questions || [];

  const createMutation = useMutation({
    mutationFn: (data: any) => quizApi.addLessonQuestion(lessonId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson-questions', lessonId] });
      setFormOpen(false);
      resetForm();
    }
  });

  const resetForm = () => {
    setText('');
    setPoints(1);
    setOptions([
      { text: '', isCorrect: true },
      { text: '', isCorrect: false }
    ]);
    setExplanation('');
  };

  const handleOptionChange = (index: number, field: string, value: any) => {
    const newOptions = [...options];
    if (field === 'isCorrect') {
      newOptions.forEach(opt => opt.isCorrect = false);
      newOptions[index].isCorrect = true;
    } else {
      newOptions[index].text = value;
    }
    setOptions(newOptions);
  };

  const addOption = () => {
    setOptions([...options, { text: '', isCorrect: false }]);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    const newOptions = options.filter((_, i) => i !== index);
    if (!newOptions.some(opt => opt.isCorrect)) {
      newOptions[0].isCorrect = true;
    }
    setOptions(newOptions);
  };

  const handleSave = () => {
    if (!text.trim() || options.some(opt => !opt.text.trim())) return;
    createMutation.mutate({ text, points, options, explanation });
  };

  return (
    <Modal isOpen={true} onClose={onClose}>
      <div className="space-y-6">
        <div>
          <p className="section-label">Manage Lesson Questions</p>
          <h2 className="mt-2 section-title">{lessonTitle}</h2>
        </div>

        {!formOpen ? (
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200">Questions ({questions.length})</h3>
            <Button size="sm" onClick={() => setFormOpen(true)}>+ Add Question</Button>
          </div>
        ) : (
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl space-y-4 border border-slate-200 dark:border-slate-700 max-h-[500px] overflow-y-auto custom-scrollbar">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200">New Question</h3>
            <div className="space-y-3">
              <label className="block space-y-1">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Question Text</span>
                <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. What is React?" />
              </label>

              <label className="block space-y-1">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Points</span>
                <Input type="number" min="1" value={points} onChange={(e) => setPoints(Number(e.target.value))} />
              </label>

              <div className="space-y-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Options</span>
                {options.map((opt, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      name="correct-option" 
                      checked={opt.isCorrect} 
                      onChange={() => handleOptionChange(index, 'isCorrect', true)}
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                    />
                    <Input 
                      value={opt.text} 
                      onChange={(e) => handleOptionChange(index, 'text', e.target.value)} 
                      placeholder={`Option ${index + 1}`} 
                      className="flex-1"
                    />
                    {options.length > 2 && (
                      <button onClick={() => removeOption(index)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-md">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    )}
                  </div>
                ))}
                <Button variant="ghost" size="sm" onClick={addOption} className="mt-2 text-xs">+ Add Option</Button>
              </div>

              <label className="block space-y-1">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Explanation (Optional)</span>
                <Input value={explanation} onChange={(e) => setExplanation(e.target.value)} placeholder="Why is this correct?" />
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => { setFormOpen(false); resetForm(); }}>Cancel</Button>
              <Button size="sm" onClick={handleSave} disabled={createMutation.isPending || !text}>Save Question</Button>
            </div>
          </div>
        )}

        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
          {isLoading ? (
            <p className="text-sm text-slate-500">Loading questions...</p>
          ) : questions.length > 0 ? (
            questions.map((q: any, index: number) => (
              <div key={q._id} className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                <div className="flex gap-3">
                  <span className="text-sm font-bold text-slate-500">{index + 1}.</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{q.text}</p>
                    <p className="text-xs text-slate-500 mt-1">{q.points} points • {q.options.length} options</p>
                  </div>
                </div>
              </div>
            ))
          ) : !formOpen ? (
            <EmptyState title="No questions yet" message="Add questions to this lesson for the Smart Review Quiz." />
          ) : null}
        </div>

        <div className="pt-4 flex justify-end border-t border-slate-200 dark:border-slate-700">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  );
};
