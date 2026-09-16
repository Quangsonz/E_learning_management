import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, MotionProps } from 'framer-motion';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { quizApi } from '../services/quiz.api';
import {
  Button,
  CanvasHero,
  LoadingScreen,
  MetricsSurface,
  Modal,
  PageShell,
  SectionLead
} from '../components/ui';
import useSimulatedLoading from '../hooks/useSimulatedLoading';
import { useLocalizedValue } from '../utils/localized';

type Question = {
  _id: string;
  text: any;
  options: { _id: string; text: any }[];
};

const MotionDiv = motion.div as unknown as React.FC<React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement> & MotionProps>>;

const Quiz: React.FC = () => {
  const { t } = useTranslation();
  const lv = useLocalizedValue();
  const { courseId, quizId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { refreshProfile } = useAuth();
  const { success: successToast, info: infoToast } = useToast();

  const limitParam = searchParams.get('limit');
  const limit = limitParam ? parseInt(limitParam, 10) : 10;
  
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['quiz', courseId, quizId, limit],
    queryFn: () => quizId === 'smart' ? quizApi.generateSmartQuiz(courseId!, limit) : quizApi.getQuizForTake(quizId!),
    refetchOnWindowFocus: false
  });
  
  const submitMutation = useMutation({
    mutationFn: (answers: any) => quizId === 'smart' ? quizApi.submitSmartQuiz(courseId!, answers) : quizApi.submitQuiz(quizId!, answers)
  });

  const quiz = data?.data?.data?.quiz;
  const questions: Question[] = data?.data?.data?.questions || [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [resultData, setResultData] = useState<any>(null);
  const [celebrate, setCelebrate] = useState(false);
  const [pulse, setPulse] = useState(false);

  // Initialize timer once quiz data loads
  useEffect(() => {
    if (quiz?.timeLimit && timeLeft === null) {
      setTimeLeft(quiz.timeLimit * 60);
    }
  }, [quiz, timeLeft]);

  useEffect(() => {
    if (showResult || celebrate || timeLeft === null) return;

    const timer = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current === null) return null;
        if (current <= 1) {
          window.clearInterval(timer);
          finishQuiz();
          return 0;
        }

        if (current <= 15) {
          setPulse(true);
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [showResult, celebrate]);

  const currentQuestion = questions[currentIndex];

  const progress = useMemo(() => {
    return ((currentIndex + 1) / questions.length) * 100;
  }, [currentIndex]);

  const formatTime = (seconds: number | null) => {
    if (seconds === null) return '--:--';
    const minutes = Math.floor(seconds / 60);
    const remaining = seconds % 60;
    return `${minutes}:${remaining.toString().padStart(2, '0')}`;
  };

  const finishQuiz = () => {
    const answersPayload = Object.entries(answers).map(([questionId, selectedOptionId]) => ({
      questionId,
      selectedOptionId
    }));

    const payload = quizId === 'smart'
      ? { questionIds: questions.map(q => q._id), answers: answersPayload }
      : answersPayload;
    
    submitMutation.mutate(payload, {
      onSuccess: (response) => {
        queryClient.invalidateQueries({ queryKey: ['quizzes', courseId] });
        queryClient.invalidateQueries({ queryKey: ['course-progress', courseId] });
        queryClient.invalidateQueries({ queryKey: ['course-progress'] });
        queryClient.invalidateQueries({ queryKey: ['my-stats'] });
        queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
        queryClient.invalidateQueries({ queryKey: ['learning-statistics'] });
        queryClient.invalidateQueries({ queryKey: ['student-dashboard-summary'] });
        refreshProfile();

        const responseData = response.data?.data || {};
        const finalResult = {
          ...responseData.result,
          ...responseData,
        };
        setResultData(finalResult);
        setCelebrate(true);

        const isPassed = Boolean(finalResult?.isPassed ?? finalResult?.passed);
        if (isPassed) {
          successToast(t('quizPage.passed'), 'Quiz');
        } else {
          infoToast(t('quizPage.failed'), 'Quiz');
        }

        window.setTimeout(() => {
          setCelebrate(false);
          setShowResult(true);
        }, 1800);
      }
    });
  };

  const selectAnswer = (optionId: string) => {
    setAnswers((current) => ({ ...current, [currentQuestion._id]: optionId }));
  };

  const restartQuiz = () => {
    setCurrentIndex(0);
    setAnswers({});
    if (quiz?.timeLimit) setTimeLeft(quiz.timeLimit * 60);
    setShowResult(false);
    setShowReview(false);
    setCelebrate(false);
    setPulse(false);
  };

  const completedQuestions = Object.keys(answers).length;
  const timerWarning = timeLeft !== null && timeLeft <= 15;

  const scorePercent = resultData?.scorePercentage ?? resultData?.score ?? 0;
  const isPassed = Boolean(resultData?.isPassed ?? resultData?.passed);
  const correctCount = resultData?.correctCount ?? (resultData?.review ? resultData.review.filter((r: any) => r.isCorrect).length : '-');
  const totalQuestionsCount = resultData?.totalQuestions ?? questions.length;

  const resultMetrics = [
    { label: t('quizPage.yourScore'), value: `${scorePercent}%` },
    { label: t('quizPage.correctCount', 'Số câu đúng'), value: `${correctCount} / ${totalQuestionsCount}` },
    { label: t('settings.preview.status'), value: isPassed ? t('quizPage.passed') : t('quizPage.failed') }
  ];

  if (isLoading) {
    return (
      <PageShell wide>
        <LoadingScreen title="Loading quiz" message="Preparing questions, timer, and assessment interface..." />
      </PageShell>
    );
  }

  if (isError) {
    const errorMsg = (error as any)?.response?.data?.message || 'Error loading quiz';
    return (
      <PageShell wide>
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl max-w-lg mx-auto my-12 gap-4">
          <span className="text-4xl">⚠️</span>
          <h3 className="text-xl font-bold">Error loading quiz</h3>
          <p className="text-slate-500 text-sm max-w-sm leading-relaxed">{errorMsg}</p>
          <Button onClick={() => navigate(`/courses/${courseId}/learn`)}>{t('quizPage.backToCourse')}</Button>
        </div>
      </PageShell>
    );
  }

  if (!quiz || !questions || questions.length === 0) {
    return (
      <PageShell wide>
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl max-w-lg mx-auto my-12 gap-4">
          <span className="text-4xl">📝</span>
          <h3 className="text-xl font-bold">Quiz Empty</h3>
          <p className="text-slate-500 text-sm max-w-sm leading-relaxed">No questions were found for this quiz.</p>
          <Button onClick={() => navigate(`/courses/${courseId}/learn`)}>{t('quizPage.backToCourse')}</Button>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell wide>
      <CanvasHero
        badge={<div className="badge">Quiz Page</div>}
        eyebrow="Real exam experience"
        title={lv(quiz?.title) || "Focus, timing, and feedback in one calm workspace."}
        description="Countdown timer, question navigator, progress tracking, and result modal designed to feel like a real online assessment."
        glow="warm"
        actions={
          <Button type="button" onClick={finishQuiz}>
            {t('quizPage.submitBtn')}
          </Button>
        }
        aside={
          <div className="flex items-baseline gap-6 lg:flex-col lg:items-end lg:gap-1.5">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('quizPage.countdown')}</span>
            <span
              className={`inline-block rounded-xl px-3 py-1 text-3xl font-semibold tabular-nums tracking-tight sm:text-4xl transition-all duration-300 ${
                timerWarning
                  ? 'bg-amber-50 text-amber-600 ring-1 ring-amber-200'
                  : 'text-slate-950 dark:text-white'
              } ${pulse ? 'animate-pulse' : ''}`}
            >
              {formatTime(timeLeft)}
            </span>
          </div>
        }
      />

      <div className="mt-6 space-y-3">
        <SectionLead
          size="md"
          label={t('quizPage.progress')}
          title={t('quizPage.questionOf', { current: currentIndex + 1, total: questions.length })}
          meta={
            <span className="status-badge status-badge-success">{t('quizPage.answered', { count: completedQuestions })}</span>
          }
        />
        <div className="progress-track">
          <MotionDiv
            className="progress-fill"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          />
        </div>
      </div>

      <div className="mt-8 grid gap-10 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.28fr)] xl:gap-12">
        <main className="space-y-8">
          <section className="relative">
            <AnimatePresence mode="wait">
              <MotionDiv
                key={currentQuestion._id}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.26, ease: 'easeOut' }}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="section-label">{t('quizPage.questionNumber', { number: currentIndex + 1 })}</p>
                    <h3 className="mt-1.5 text-xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-2xl">
                      {lv(currentQuestion?.text)}
                    </h3>
                  </div>
                  <span className="text-xs font-medium text-slate-400">{t('quizPage.selectOne')}</span>
                </div>

                <div className="mt-6 grid gap-2.5">
                  {currentQuestion?.options?.map((option, optionIndex) => {
                    const isSelected = answers[currentQuestion._id] === option._id;

                    return (
                      <button
                        key={option._id}
                        type="button"
                        onClick={() => selectAnswer(option._id!)}
                        className={`flex items-center justify-between gap-4 rounded-2xl border px-5 py-4 text-left transition focus:outline-none focus:ring-4 focus:ring-primary-500/10 ${
                          isSelected
                            ? 'border-primary-300/70 bg-primary-50/70 dark:bg-primary-900/50 dark:border-primary-700/50'
                            : 'border-slate-200/50 bg-transparent hover:bg-slate-50/80 dark:hover:bg-slate-800/50 hover:border-slate-200/80 dark:hover:border-slate-700/50'
                        }`}
                      >
                        <span className={`text-sm font-medium ${isSelected ? 'font-semibold text-indigo-900 dark:text-indigo-200' : 'text-slate-800 dark:text-slate-200'}`}>{lv(option.text)}</span>
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition ${
                            isSelected
                              ? 'bg-primary-600 text-white'
                              : 'border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {String.fromCharCode(65 + optionIndex)}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentIndex((current) => Math.max(0, current - 1))}
                    disabled={currentIndex === 0}
                    className="!rounded-full"
                  >
                    {t('quizPage.previous')}
                  </Button>
                  <Button
                    type="button"
                    variant="pill"
                    onClick={() => setCurrentIndex((current) => Math.min(questions.length - 1, current + 1))}
                    disabled={currentIndex === questions.length - 1}
                  >
                    {t('quizPage.next')}
                  </Button>
                </div>
              </MotionDiv>
            </AnimatePresence>
          </section>

          <div className="space-y-4 border-t border-slate-200/60 pt-6">
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{t('quizPage.stayCalm')}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                {t('quizPage.stayCalmDesc')}
              </p>
            </div>
          </div>
        </main>

        <aside className="xl:sticky xl:top-6 xl:self-start">
          <SectionLead size="md" label={t('quizPage.navigator')} title={t('quizPage.jumpQuestions')} />
          <div className="mt-4 grid grid-cols-4 gap-2.5 sm:grid-cols-5 xl:grid-cols-3">
            {questions.map((question, index) => {
              const isActive = index === currentIndex;
              const isAnswered = Boolean(answers[question._id] !== undefined);

              return (
                <button
                  key={question._id}
                  type="button"
                  onClick={() => setCurrentIndex(index)}
                  className={`flex h-11 items-center justify-center rounded-xl border text-sm font-semibold transition focus:outline-none focus:ring-4 focus:ring-primary-500/10 ${
                    isActive
                      ? 'border-primary-500 bg-primary-500 text-white shadow-md shadow-primary-500/15'
                      : isAnswered
                        ? 'border-emerald-200/70 dark:border-emerald-700/50 bg-emerald-50/60 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                        : 'border-slate-200/50 bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 hover:border-slate-200/80 dark:hover:border-slate-700/50'
                  }`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
          <p className="mt-4 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            {completedQuestions} / {questions.length} answered.
          </p>
        </aside>
      </div>

      <Modal isOpen={celebrate} onClose={() => {}}>
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-700">
            ✓
          </div>
          <h2 className="mt-4 text-3xl font-semibold text-slate-950 dark:text-white">{t('quizPage.completedTitle')}</h2>
        </div>
      </Modal>

      <Modal isOpen={showResult} onClose={() => setShowResult(false)} size="lg">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="mt-2 text-3xl font-semibold text-slate-950 dark:text-white">{t('quizPage.completedTitle')}</h2>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('quizPage.answered', { count: completedQuestions })}</p>
            <p className="mt-0.5 text-xl font-semibold tabular-nums text-slate-950 dark:text-white">
              {completedQuestions}/{questions.length}
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('quizPage.yourScore')}</p>
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={`mt-1 text-6xl font-semibold tracking-tight ${resultData?.isPassed || resultData?.passed ? 'text-emerald-600' : 'text-rose-600'}`}
          >
            {resultData?.scorePercentage ?? resultData?.score ?? 0}%
          </motion.div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {resultData?.isPassed || resultData?.passed ? t('quizPage.passedDesc') : t('quizPage.failedDesc')}
          </p>
        </div>

        <MetricsSurface metrics={resultMetrics} className="!mt-5 sm:!px-5" delay={0.25} />

        {resultData?.review && resultData.review.length > 0 && (
          <div className="mt-6 border-t border-slate-200/80 dark:border-slate-800 pt-5">
            <button
              type="button"
              onClick={() => setShowReview((prev) => !prev)}
              className="flex items-center justify-between w-full py-2.5 px-4 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 transition-colors"
            >
              <span>{showReview ? t('quizPage.hideReview', 'Ẩn xem lại đáp án') : t('quizPage.reviewAnswers', 'Xem lại đáp án chi tiết')}</span>
              <motion.svg animate={{ rotate: showReview ? 180 : 0 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9l6 6 6-6"/>
              </motion.svg>
            </button>

            {showReview && (
              <div className="mt-4 space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                {resultData.review.map((item: any, rIdx: number) => (
                  <div
                    key={item.questionId || rIdx}
                    className={`p-4 rounded-xl border text-left ${
                      item.isCorrect
                        ? 'bg-emerald-50/40 border-emerald-200/70 dark:bg-emerald-950/20 dark:border-emerald-800/40'
                        : 'bg-rose-50/40 border-rose-200/70 dark:bg-rose-950/20 dark:border-rose-800/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        {t('quizPage.questionNumber', { number: rIdx + 1 })}
                      </span>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          item.isCorrect
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300'
                        }`}
                      >
                        {item.isCorrect ? t('quizPage.correct', 'Đúng') : t('quizPage.incorrect', 'Sai')}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
                      {lv(item.questionText)}
                    </p>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 font-medium">{t('quizPage.yourAnswer', 'Đáp án của bạn')}:</span>
                        <span className={item.isCorrect ? 'text-emerald-700 dark:text-emerald-400 font-semibold' : 'text-rose-700 dark:text-rose-400 font-semibold'}>
                          {item.selectedOptionText ? lv(item.selectedOptionText) : '(Chưa trả lời)'}
                        </span>
                      </div>
                      {!item.isCorrect && item.correctOptionText && (
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 font-medium">{t('quizPage.correctAnswer', 'Đáp án đúng')}:</span>
                          <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                            {lv(item.correctOptionText)}
                          </span>
                        </div>
                      )}
                    </div>

                    {item.explanation && (
                      <div className="mt-3 p-2.5 rounded-lg bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                        <strong className="text-slate-700 dark:text-slate-200">{t('quizPage.explanation', 'Giải thích')}: </strong>
                        {item.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
          <Button variant="outline" onClick={() => navigate(`/courses/${courseId}/learn`)}>
            {t('quizPage.backToCourse')}
          </Button>
          <Button variant="pill" onClick={restartQuiz}>
            {t('quizPage.retakeBtn')}
          </Button>
        </div>
      </Modal>
    </PageShell>
  );
};

export default Quiz;
