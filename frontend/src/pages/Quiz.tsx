import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, MotionProps } from 'framer-motion';

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

  useEffect(() => {
    if (showResult) return;

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
  }, [showResult]);

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
    setShowResult(true);
    setCelebrate(true);
    window.setTimeout(() => setCelebrate(false), 1800);
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

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),transparent_24%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.12),transparent_24%),linear-gradient(180deg,#f8fbff_0%,#eef4fb_100%)] text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <MotionDiv
          className="rounded-[34px] border border-white/70 bg-white/75 p-5 shadow-[0_24px_90px_rgba(15,23,42,0.08)] backdrop-blur-2xl sm:p-6"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
        >
          <div className="flex flex-col gap-4 border-b border-slate-200/70 pb-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Quiz Page</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                Real exam experience with focus, timing, and feedback.
              </h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
                Countdown timer, question navigator, progress tracking, and result modal designed to feel like a real online assessment.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className={`rounded-2xl border px-4 py-3 text-right ${timerWarning ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-slate-50'} ${pulse ? 'animate-pulse' : ''}`}>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Countdown Timer</p>
                <p className={`mt-1 text-2xl font-semibold ${timerWarning ? 'text-amber-700' : 'text-slate-950'}`}>{formatTime(timeLeft)}</p>
              </div>
              <button
                type="button"
                onClick={finishQuiz}
                className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
              >
                Submit quiz
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-6 xl:grid-cols-[1fr_0.28fr]">
            <main className="space-y-6">
              <section className="rounded-[30px] border border-white/70 bg-white/85 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Progress Bar</p>
                    <h2 className="mt-2 text-2xl font-semibold text-slate-950">Question {currentIndex + 1} of {questions.length}</h2>
                  </div>
                  <div className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                    {completedQuestions} answered
                  </div>
                </div>

                <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200">
                  <MotionDiv
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-indigo-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                  />
                </div>
              </section>

              <section className="rounded-[30px] border border-white/70 bg-white/85 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-6">
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
                        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Question Transition</p>
                        <h3 className="mt-2 text-2xl font-semibold text-slate-950">{currentQuestion.prompt}</h3>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
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
                            className={`flex items-center justify-between gap-4 rounded-[24px] border px-5 py-4 text-left transition focus:outline-none focus:ring-4 focus:ring-sky-100 ${
                              isSelected
                                ? 'border-sky-300 bg-sky-50 shadow-[0_12px_30px_rgba(14,165,233,0.12)]'
                                : 'border-slate-200 bg-slate-50 hover:-translate-y-0.5 hover:bg-white'
                            }`}
                          >
                            <span className="text-sm font-medium text-slate-800">{option}</span>
                            <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${isSelected ? 'bg-sky-600 text-white' : 'bg-white text-slate-500 shadow-sm'}`}>
                              {String.fromCharCode(65 + optionIndex)}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setCurrentIndex((current) => Math.max(0, current - 1))}
                        disabled={currentIndex === 0}
                        className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Previous
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrentIndex((current) => Math.min(questions.length - 1, current + 1))}
                        disabled={currentIndex === questions.length - 1}
                        className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Next question
                      </button>
                    </div>
                  </MotionDiv>
                </AnimatePresence>
              </section>

              <section className="grid gap-6 lg:grid-cols-2">
                <MotionDiv className="rounded-[30px] border border-white/70 bg-white/85 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-6" whileHover={{ y: -4 }} transition={{ duration: 0.18 }}>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Success Effect</p>
                  <h3 className="mt-2 text-2xl font-semibold text-slate-950">Clean feedback after submission</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    Submitting the quiz triggers a polished completion state and score reveal animation that feels like a real platform.
                  </p>
                </MotionDiv>

                <MotionDiv className="rounded-[30px] border border-white/70 bg-white/85 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-6" whileHover={{ y: -4 }} transition={{ duration: 0.18 }}>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Exam Tips</p>
                  <h3 className="mt-2 text-2xl font-semibold text-slate-950">Stay calm and manage time</h3>
                  <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                    <li>• Check the navigator before leaving a question.</li>
                    <li>• Watch the timer when it turns amber.</li>
                    <li>• Review marked answers before submitting.</li>
                  </ul>
                </MotionDiv>
              </section>
            </main>

            <aside className="xl:sticky xl:top-6 xl:self-start">
              <MotionDiv className="rounded-[30px] border border-white/70 bg-white/85 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] sm:p-6" whileHover={{ y: -4 }} transition={{ duration: 0.18 }}>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Question Navigator</p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-950">Jump between questions</h3>
                <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-5 xl:grid-cols-2">
                  {questions.map((question, index) => {
                    const isActive = index === currentIndex;
                    const isAnswered = Boolean(answers[question.id]);

                    return (
                      <button
                        key={question.id}
                        type="button"
                        onClick={() => setCurrentIndex(index)}
                        className={`flex h-12 items-center justify-center rounded-2xl border text-sm font-semibold transition focus:outline-none focus:ring-4 focus:ring-sky-100 ${
                          isActive
                            ? 'border-slate-950 bg-slate-950 text-white shadow-lg shadow-slate-950/15'
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
              </MotionDiv>
            </aside>
          </div>
        </MotionDiv>
      </div>

      <AnimatePresence>
        {celebrate ? (
          <motion.div
            className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-md rounded-[30px] border border-white/70 bg-white p-6 text-center shadow-[0_24px_90px_rgba(15,23,42,0.2)]"
              initial={{ scale: 0.9, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 16 }}
              transition={{ duration: 0.25 }}
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-700">
                ✓
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-600">Achievement Popup</p>
              <h2 className="mt-2 text-3xl font-semibold text-slate-950">Quiz submitted</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Your answers are recorded and the result is being revealed with a smooth score animation.
              </p>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {showResult ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-lg rounded-[34px] border border-white/70 bg-white p-6 shadow-[0_24px_90px_rgba(15,23,42,0.24)]"
              initial={{ scale: 0.9, opacity: 0, y: 18 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 18 }}
              transition={{ duration: 0.28 }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Result Modal</p>
                  <h2 className="mt-2 text-3xl font-semibold text-slate-950">Quiz completed</h2>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-right">
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
                  className="mt-3 text-6xl font-semibold tracking-tight text-slate-950"
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
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{item.label}</p>
                    <p className="mt-2 text-xl font-semibold text-slate-950">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowResult(false)}
                  className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={restartQuiz}
                  className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
                >
                  Restart quiz
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

export default Quiz;