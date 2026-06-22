import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, MotionProps } from 'framer-motion';
import { Button, LoadingScreen, PageShell, GlassPanel, Modal } from '../components/ui';
import useSimulatedLoading from '../hooks/useSimulatedLoading';

type Question = {
  id: number;
  prompt: string;
  options: string[];
  correctIndex: number;
};

const questions: Question[] = [
  {
    id: 1,
    prompt: 'Which principle helps users stay engaged during online learning?',
    options: ['Random content jumps', 'Clear progress feedback', 'Hidden navigation', 'No reminders'],
    correctIndex: 1
  },
  {
    id: 2,
    prompt: 'What is the best use of a progress bar in a quiz?',
    options: ['To distract the user', 'To show completion status', 'To hide remaining time', 'To replace questions'],
    correctIndex: 1
  },
  {
    id: 3,
    prompt: 'A timer warning should primarily do what?',
    options: ['Increase confusion', 'Create panic only', 'Focus attention gently', 'Remove all feedback'],
    correctIndex: 2
  },
  {
    id: 4,
    prompt: 'Which motion is most appropriate for a result modal?',
    options: ['Abrupt jump', 'Smooth reveal', 'No animation', 'Full screen shake'],
    correctIndex: 1
  }
];

const MotionDiv = motion.div as unknown as React.FC<React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement> & MotionProps>>;

const totalSeconds = 120;

const Quiz: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState(totalSeconds);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [celebrate, setCelebrate] = useState(false);
  const [pulse, setPulse] = useState(false);
  const isLoading = useSimulatedLoading(700);

  useEffect(() => {
    if (showResult || celebrate) return;

    const timer = window.setInterval(() => {
      setTimeLeft((current) => {
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

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remaining = seconds % 60;
    return `${minutes}:${remaining.toString().padStart(2, '0')}`;
  };

  const finishQuiz = () => {
    const finalScore = questions.reduce((accumulator, question) => {
      return answers[question.id] === question.correctIndex ? accumulator + 1 : accumulator;
    }, 0);

    setScore(finalScore);
    setCelebrate(true);
    window.setTimeout(() => {
      setCelebrate(false);
      setShowResult(true);
    }, 1800);
  };

  const selectAnswer = (optionIndex: number) => {
    setAnswers((current) => ({ ...current, [currentQuestion.id]: optionIndex }));
  };

  const restartQuiz = () => {
    setCurrentIndex(0);
    setAnswers({});
    setTimeLeft(totalSeconds);
    setShowResult(false);
    setCelebrate(false);
    setPulse(false);
  };

  const completedQuestions = Object.keys(answers).length;
  const timerWarning = timeLeft <= 15;

  if (isLoading) {
    return (
      <PageShell>
        <LoadingScreen title="Loading quiz" message="Preparing questions, timer, and assessment interface..." />
      </PageShell>
    );
  }

  return (
    <PageShell>
        <GlassPanel padding="lg" motionProps={{ initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.45, ease: 'easeOut' } }}>
          <div className="flex flex-col gap-4 border-b border-slate-200/70 pb-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="section-label">Quiz Page</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                Real exam experience with focus, timing, and feedback.
              </h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
                Countdown timer, question navigator, progress tracking, and result modal designed to feel like a real online assessment.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className={`rounded-2xl border px-4 py-3 text-right transition ${timerWarning ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-slate-50'} ${pulse ? 'animate-pulse' : ''}`}>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Countdown Timer</p>
                <p className={`mt-1 text-2xl font-semibold ${timerWarning ? 'text-amber-700' : 'text-slate-950'}`}>{formatTime(timeLeft)}</p>
              </div>
              <Button
                type="button"
                onClick={finishQuiz}
              >
                Submit quiz
              </Button>
            </div>
          </div>

          <div className="mt-5 grid gap-6 xl:grid-cols-[1fr_0.28fr]">
            <main className="space-y-6">
              <GlassPanel>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="section-label">Progress Bar</p>
                    <h2 className="mt-2 text-2xl font-semibold text-slate-950">Question {currentIndex + 1} of {questions.length}</h2>
                  </div>
                  <div className="status-badge status-badge-success">
                    {completedQuestions} answered
                  </div>
                </div>

                <div className="progress-track mt-4">
                  <MotionDiv
                    className="progress-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                  />
                </div>
              </GlassPanel>

              <GlassPanel>
                <AnimatePresence mode="wait">
                  <MotionDiv
                    key={currentQuestion.id}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -24 }}
                    transition={{ duration: 0.26, ease: 'easeOut' }}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="section-label">Question Transition</p>
                        <h3 className="mt-2 text-2xl font-semibold text-slate-950">{currentQuestion.prompt}</h3>
                      </div>
                      <div className="badge !border-slate-200 !bg-slate-50 !text-slate-600">
                        Select one answer
                      </div>
                    </div>

                    <div className="mt-6 grid gap-3">
                      {currentQuestion.options.map((option, optionIndex) => {
                        const isSelected = answers[currentQuestion.id] === optionIndex;

                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() => selectAnswer(optionIndex)}
                            className={`flex items-center justify-between gap-4 rounded-[24px] border px-5 py-4 text-left transition focus:outline-none focus:ring-4 focus:ring-primary-500/10 ${
                              isSelected
                                ? 'border-primary-300 bg-primary-50 shadow-lg shadow-primary-500/10'
                                : 'border-slate-200 bg-slate-50 hover:-translate-y-0.5 hover:bg-white hover:border-slate-300 hover:shadow-elev-1'
                            }`}
                          >
                            <span className="text-sm font-medium text-slate-800">{option}</span>
                            <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition ${isSelected ? 'bg-primary-600 text-white' : 'bg-white text-slate-500 shadow-sm border border-slate-200'}`}>
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
                        Previous
                      </Button>
                      <Button
                        type="button"
                        variant="pill"
                        onClick={() => setCurrentIndex((current) => Math.min(questions.length - 1, current + 1))}
                        disabled={currentIndex === questions.length - 1}
                      >
                        Next question
                      </Button>
                    </div>
                  </MotionDiv>
                </AnimatePresence>
              </GlassPanel>

              <section className="grid gap-6 lg:grid-cols-2">
                <GlassPanel hover>
                  <p className="section-label">Success Effect</p>
                  <h3 className="mt-2 section-title">Clean feedback after submission</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    Submitting the quiz triggers a polished completion state and score reveal animation that feels like a real platform.
                  </p>
                </GlassPanel>

                <GlassPanel hover>
                  <p className="section-label">Exam Tips</p>
                  <h3 className="mt-2 section-title">Stay calm and manage time</h3>
                  <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                    <li>• Check the navigator before leaving a question.</li>
                    <li>• Watch the timer when it turns amber.</li>
                    <li>• Review marked answers before submitting.</li>
                  </ul>
                </GlassPanel>
              </section>
            </main>

            <aside className="xl:sticky xl:top-6 xl:self-start">
              <GlassPanel hover>
                <p className="section-label">Question Navigator</p>
                <h3 className="mt-2 section-title">Jump between questions</h3>
                <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-5 xl:grid-cols-2">
                  {questions.map((question, index) => {
                    const isActive = index === currentIndex;
                    const isAnswered = Boolean(answers[question.id] !== undefined);

                    return (
                      <button
                        key={question.id}
                        type="button"
                        onClick={() => setCurrentIndex(index)}
                        className={`flex h-12 items-center justify-center rounded-2xl border text-sm font-semibold transition focus:outline-none focus:ring-4 focus:ring-primary-500/10 ${
                          isActive
                            ? 'border-primary-500 bg-primary-500 text-white shadow-lg shadow-primary-500/15'
                            : isAnswered
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : 'border-slate-200 bg-slate-50 text-slate-600 hover:-translate-y-0.5 hover:bg-white'
                        }`}
                      >
                        {index + 1}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-5 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Question status</p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    {completedQuestions} / {questions.length} answered. Use the navigator to review any question before submitting.
                  </p>
                </div>
              </GlassPanel>
            </aside>
          </div>
        </GlassPanel>

      <Modal isOpen={celebrate} onClose={() => {}}>
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-700">
            ✓
          </div>
          <p className="mt-4 section-label !text-emerald-600">Achievement Popup</p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-950">Quiz submitted</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Your answers are recorded and the result is being revealed with a smooth score animation.
          </p>
        </div>
      </Modal>

      <Modal isOpen={showResult} onClose={() => setShowResult(false)}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="section-label">Result Modal</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-950">Quiz completed</h2>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-right border border-slate-200">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Total</p>
            <p className="mt-1 text-sm font-semibold text-slate-800">
              {completedQuestions}/{questions.length}
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-[28px] border border-slate-200 bg-slate-50 p-5 text-center">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Score Reveal Animation</p>
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="mt-3 text-6xl font-semibold tracking-tight text-primary-600"
          >
            {score}
          </motion.div>
          <p className="mt-2 text-sm text-slate-500">out of {questions.length} correct answers</p>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {[
            { label: 'Accuracy', value: `${Math.round((score / questions.length) * 100)}%` },
            { label: 'Time left', value: formatTime(timeLeft) },
            { label: 'Status', value: score >= 3 ? 'Pass' : 'Review' }
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-center shadow-sm">
              <p className="section-label">{item.label}</p>
              <p className="mt-2 text-xl font-semibold text-slate-950">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
          <Button variant="outline" onClick={() => setShowResult(false)}>
            Close
          </Button>
          <Button variant="pill" onClick={restartQuiz}>
            Restart quiz
          </Button>
        </div>
      </Modal>
    </PageShell>
  );
};

export default Quiz;