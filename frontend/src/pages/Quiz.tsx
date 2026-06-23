import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, MotionProps } from 'framer-motion';
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

  const resultMetrics = [
    { label: 'Accuracy', value: `${Math.round((score / questions.length) * 100)}%` },
    { label: 'Time left', value: formatTime(timeLeft) },
    { label: 'Status', value: score >= 3 ? 'Pass' : 'Review' }
  ];

  if (isLoading) {
    return (
      <PageShell wide>
        <LoadingScreen title="Loading quiz" message="Preparing questions, timer, and assessment interface..." />
      </PageShell>
    );
  }

  return (
    <PageShell wide>
      <CanvasHero
        badge={<div className="badge">Quiz Page</div>}
        eyebrow="Real exam experience"
        title="Focus, timing, and feedback in one calm workspace."
        description="Countdown timer, question navigator, progress tracking, and result modal designed to feel like a real online assessment."
        glow="warm"
        actions={
          <Button type="button" onClick={finishQuiz}>
            Submit quiz
          </Button>
        }
        aside={
          <div className="flex items-baseline gap-6 lg:flex-col lg:items-end lg:gap-1.5">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Countdown</span>
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
          label="Progress"
          title={`Question ${currentIndex + 1} of ${questions.length}`}
          meta={
            <span className="status-badge status-badge-success">{completedQuestions} answered</span>
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
                key={currentQuestion.id}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.26, ease: 'easeOut' }}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="section-label">Question {currentIndex + 1}</p>
                    <h3 className="mt-1.5 text-xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-2xl">
                      {currentQuestion.prompt}
                    </h3>
                  </div>
                  <span className="text-xs font-medium text-slate-400">Select one answer</span>
                </div>

                <div className="mt-6 grid gap-2.5">
                  {currentQuestion.options.map((option, optionIndex) => {
                    const isSelected = answers[currentQuestion.id] === optionIndex;

                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => selectAnswer(optionIndex)}
                        className={`flex items-center justify-between gap-4 rounded-2xl border px-5 py-4 text-left transition focus:outline-none focus:ring-4 focus:ring-primary-500/10 ${
                          isSelected
                            ? 'border-primary-300/70 bg-primary-50/70 dark:bg-primary-900/50 dark:border-primary-700/50'
                            : 'border-slate-200/50 bg-transparent hover:bg-slate-50/80 dark:hover:bg-slate-800/50 hover:border-slate-200/80 dark:hover:border-slate-700/50'
                        }`}
                      >
                        <span className={`text-sm font-medium ${isSelected ? 'font-semibold text-indigo-900 dark:text-indigo-200' : 'text-slate-800 dark:text-slate-200'}`}>{option}</span>
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
          </section>

          <div className="space-y-4 border-t border-slate-200/60 pt-6">
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Stay calm and manage time</p>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                Submitting triggers a polished completion state and score reveal that feels like a real platform.
              </p>
            </div>
            <ul className="space-y-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              <li>Check the navigator before leaving a question.</li>
              <li>Watch the timer when it turns amber.</li>
              <li>Review marked answers before submitting.</li>
            </ul>
          </div>
        </main>

        <aside className="xl:sticky xl:top-6 xl:self-start">
          <SectionLead size="md" label="Question Navigator" title="Jump between questions" />
          <div className="mt-4 grid grid-cols-4 gap-2.5 sm:grid-cols-5 xl:grid-cols-3">
            {questions.map((question, index) => {
              const isActive = index === currentIndex;
              const isAnswered = Boolean(answers[question.id] !== undefined);

              return (
                <button
                  key={question.id}
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
            {completedQuestions} / {questions.length} answered. Use the navigator to review any question before
            submitting.
          </p>
        </aside>
      </div>

      <Modal isOpen={celebrate} onClose={() => {}}>
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-700">
            ✓
          </div>
          <p className="mt-4 section-label !text-emerald-600">Achievement Popup</p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-950 dark:text-white">Quiz submitted</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
            Your answers are recorded and the result is being revealed with a smooth score animation.
          </p>
        </div>
      </Modal>

      <Modal isOpen={showResult} onClose={() => setShowResult(false)}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="section-label">Result Modal</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-950 dark:text-white">Quiz completed</h2>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Answered</p>
            <p className="mt-0.5 text-xl font-semibold tabular-nums text-slate-950 dark:text-white">
              {completedQuestions}/{questions.length}
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Score</p>
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="mt-1 text-6xl font-semibold tracking-tight text-primary-600"
          >
            {score}
          </motion.div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">out of {questions.length} correct answers</p>
        </div>

        <MetricsSurface metrics={resultMetrics} className="!mt-5 sm:!px-5" delay={0.25} />

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
