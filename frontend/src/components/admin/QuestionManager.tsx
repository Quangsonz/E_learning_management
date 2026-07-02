import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { quizApi } from '../../services/quiz.api';
import { Button, Modal, EmptyState } from '../ui';
import { Input } from '../ui/Input';

type QuestionManagerProps = {
  quizId: string;
  quizTitle: string;
  onClose: () => void;
};

export const QuestionManager: React.FC<QuestionManagerProps> = ({ quizId, quizTitle, onClose }) => {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [text, setText] = useState('');
  const [points, setPoints] = useState('1');
  const [explanation, setExplanation] = useState('');
  const [options, setOptions] = useState<{ text: string; isCorrect: boolean }[]>([
    { text: '', isCorrect: true },
    { text: '', isCorrect: false }
  ]);

  const { data, isLoading } = useQuery({
    queryKey: ['questions', quizId],
    queryFn: () => quizApi.getQuestionsForTeacher(quizId)
  });

  const questions = data?.data?.data?.questions || [];
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: (data: any) => quizApi.addQuestion(quizId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions', quizId] });
      setFormOpen(false);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => quizApi.updateQuestion(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions', quizId] });
      setFormOpen(false);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => quizApi.deleteQuestion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions', quizId] });
    }
  });

  const resetForm = () => {
    setText('');
    setPoints('1');
    setExplanation('');
    setEditingQuestionId(null);
    setOptions([
      { text: '', isCorrect: true },
      { text: '', isCorrect: false }
    ]);
  };

  const handleAddOption = () => {
    setOptions([...options, { text: '', isCorrect: false }]);
  };

  const handleOptionChange = (index: number, val: string) => {
    const newOptions = [...options];
    newOptions[index].text = val;
    setOptions(newOptions);
  };

  const handleOptionCorrectChange = (index: number) => {
    const newOptions = options.map((opt, i) => ({
      ...opt,
      isCorrect: i === index
    }));
    setOptions(newOptions);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) return;
    const newOptions = options.filter((_, i) => i !== index);
    if (!newOptions.some(o => o.isCorrect)) {
      newOptions[0].isCorrect = true;
    }
    setOptions(newOptions);
  };

  const handleSave = () => {
    if (!text.trim() || options.some(o => !o.text.trim()) || options.length < 2) return;
    const payload = {
      text, 
      points: Number(points), 
      explanation: explanation.trim() || undefined,
      options 
    };

    if (editingQuestionId) {
      updateMutation.mutate({ id: editingQuestionId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose}>
      <div className="space-y-6">
        <div>
          <p className="section-label">Manage Questions</p>
          <h2 className="mt-2 section-title">{quizTitle}</h2>
        </div>

        {!formOpen ? (
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200">Questions ({questions.length})</h3>
            <Button size="sm" onClick={() => setFormOpen(true)}>+ Add Question</Button>
          </div>
        ) : (
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl space-y-4 border border-slate-200 dark:border-slate-700 max-h-[60vh] overflow-y-auto custom-scrollbar">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200">
              {editingQuestionId ? 'Edit Question' : 'New Question'}
            </h3>
            <div className="space-y-4">
              <label className="block space-y-1">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Question Text</span>
                <textarea 
                  value={text} 
                  onChange={(e) => setText(e.target.value)} 
                  placeholder="Enter the question..." 
                  className="w-full min-h-[80px] p-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-primary-500"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Points</span>
                <Input type="number" value={points} onChange={(e) => setPoints(e.target.value)} placeholder="1" />
              </label>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Options</span>
                  <button type="button" onClick={handleAddOption} className="text-xs text-primary-600 font-medium hover:underline">+ Add Option</button>
                </div>
                {options.map((opt, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      name="correctOption" 
                      checked={opt.isCorrect} 
                      onChange={() => handleOptionCorrectChange(index)} 
                      className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-slate-300"
                    />
                    <Input 
                      value={opt.text} 
                      onChange={(e) => handleOptionChange(index, e.target.value)} 
                      placeholder={`Option ${index + 1}`} 
                      className="flex-1"
                    />
                    {options.length > 2 && (
                      <button type="button" onClick={() => handleRemoveOption(index)} className="p-2 text-slate-400 hover:text-rose-500">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <label className="block space-y-1">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Explanation (Optional)</span>
                <Input value={explanation} onChange={(e) => setExplanation(e.target.value)} placeholder="Explain the correct answer..." />
              </label>
            </div>
            
            <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
              <Button variant="ghost" size="sm" onClick={() => { setFormOpen(false); resetForm(); }}>Cancel</Button>
              <Button size="sm" onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending || !text || options.some(o => !o.text)}>
                {editingQuestionId ? 'Save Changes' : 'Save Question'}
              </Button>
            </div>
          </div>
        )}

        {!formOpen && (
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {isLoading ? (
              <p className="text-sm text-slate-500">Loading questions...</p>
            ) : questions.length > 0 ? (
              questions.map((question: any, index: number) => (
                <div key={question._id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-500">{index + 1}</span>
                    <div className="space-y-2 w-full">
                      <div className="flex justify-between items-start gap-2">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white leading-relaxed">{question.text}</p>
                        <div className="flex gap-1.5 shrink-0">
                          <button
                            type="button"
                            className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                            onClick={() => {
                              setEditingQuestionId(question._id);
                              setText(question.text);
                              setPoints(question.points.toString());
                              setExplanation(question.explanation || '');
                              setOptions(question.options.map((opt: any) => ({
                                text: opt.text,
                                isCorrect: !!opt.isCorrect
                              })));
                              setFormOpen(true);
                            }}
                            title="Edit Question"
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                              <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                          </button>
                          <button
                            type="button"
                            className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                            onClick={() => {
                              if (window.confirm('Bạn có chắc chắn muốn xóa câu hỏi này?')) {
                                deleteMutation.mutate(question._id);
                              }
                            }}
                            title="Delete Question"
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div className="grid gap-1.5">
                        {question.options.map((opt: any, i: number) => (
                          <div key={opt._id || i} className={`text-xs p-2 rounded-lg border ${opt.isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-300' : 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'}`}>
                            {opt.text} {opt.isCorrect && '✓'}
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-slate-400">Points: {question.points} {question.explanation && `• Explanation: ${question.explanation}`}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState title="No questions yet" message="Add some questions to this quiz." />
            )}
          </div>
        )}

        <div className="pt-4 flex justify-end border-t border-slate-200 dark:border-slate-700">
          <Button variant="outline" onClick={onClose}>Done</Button>
        </div>
      </div>
    </Modal>
  );
};
