import React from 'react';
import { motion, AnimatePresence, MotionProps } from 'framer-motion';
import { fadeUp } from '../../animations/motionVariants';
import { Button } from './Button';

const MotionDiv = motion.div as unknown as React.FC<
  React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement> & MotionProps>
>;

/* ── Loading Screen ─────────────────────────────────────── */
export const LoadingScreen: React.FC<{ title?: string; message?: string }> = ({
  title = 'Loading workspace',
  message = 'Preparing your learning experience...'
}) => {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-16">
      <MotionDiv
        className="glass-panel w-full max-w-xl p-8"
        initial={{ opacity: 0, scale: 0.97, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className="flex items-start gap-5">
          {/* Animated icon container */}
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-100 to-primary-50 shadow-sm">
            <span className="spinner spinner-lg" aria-hidden="true" />
            {/* Pulse ring */}
            <span className="absolute inset-0 rounded-2xl animate-ping bg-primary-200 opacity-25" />
          </div>

          <div className="min-w-0 flex-1 space-y-4">
            <div>
              <p className="section-label">Loading</p>
              <h2 className="mt-1.5 text-xl font-semibold tracking-tight text-slate-950">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">{message}</p>
            </div>

            {/* Skeleton progress bars */}
            <div className="space-y-2.5 pt-1">
              <div className="skeleton skeleton-text h-2.5 w-full" />
              <div className="skeleton skeleton-text h-2.5 w-5/6" style={{ animationDelay: '0.1s' }} />
              <div className="skeleton skeleton-text h-2.5 w-2/3" style={{ animationDelay: '0.2s' }} />
            </div>
          </div>
        </div>
      </MotionDiv>
    </div>
  );
};

/* ── Inline Loader ──────────────────────────────────────── */
export const InlineLoader: React.FC<{ label?: string; size?: 'sm' | 'md' }> = ({
  label = 'Loading...',
  size = 'md'
}) => (
  <div
    className={`flex items-center justify-center gap-3 text-slate-400 ${size === 'sm' ? 'py-6 text-xs' : 'py-12 text-sm'}`}
    role="status"
    aria-live="polite"
  >
    <span className={`spinner ${size === 'sm' ? 'spinner-sm' : ''}`} aria-hidden="true" />
    <span>{label}</span>
  </div>
);

/* ── Skeleton Line ──────────────────────────────────────── */
export const SkeletonLine: React.FC<{ className?: string }> = ({
  className = 'h-2.5 w-full'
}) => (
  <div className={`skeleton skeleton-text ${className}`} aria-hidden="true" />
);

/* ── Skeleton Card ──────────────────────────────────────── */
export const SkeletonCard: React.FC<{ lines?: number }> = ({ lines = 3 }) => {
  return (
    <div className="glass-panel p-5 space-y-4" aria-hidden="true">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="skeleton skeleton-circle h-10 w-10 shrink-0" />
        <div className="flex-1 space-y-2 pt-1">
          <SkeletonLine className="h-2.5 w-24" />
          <SkeletonLine className="h-3 w-4/5" />
        </div>
      </div>
      {/* Body lines */}
      <div className="space-y-2.5">
        {Array.from({ length: lines }).map((_, index) => (
          <SkeletonLine
            key={index}
            className={`h-2.5 ${index === lines - 1 ? 'w-3/4' : 'w-full'}`}
          />
        ))}
      </div>
      {/* Footer */}
      <div className="flex items-center justify-between pt-1">
        <SkeletonLine className="h-7 w-24 rounded-full" />
        <SkeletonLine className="h-7 w-20 rounded-lg" />
      </div>
    </div>
  );
};

/* ── Skeleton Grid ──────────────────────────────────────── */
export const SkeletonGrid: React.FC<{ count?: number; columns?: string }> = ({
  count = 3,
  columns = 'grid gap-6 md:grid-cols-2 xl:grid-cols-3'
}) => (
  <div className={columns} aria-busy="true" aria-label="Loading content">
    {Array.from({ length: count }).map((_, index) => (
      <SkeletonCard key={index} />
    ))}
  </div>
);

/* ── Skeleton Table ─────────────────────────────────────── */
export const SkeletonTable: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div
    className="overflow-hidden rounded-[var(--radius-section)] border border-slate-100 bg-white"
    aria-busy="true"
    aria-label="Loading table"
  >
    {/* Header */}
    <div className="border-b border-slate-100 bg-slate-50 px-5 py-3.5">
      <div className="flex items-center gap-6">
        <SkeletonLine className="h-2.5 w-24" />
        <SkeletonLine className="h-2.5 w-16" />
        <SkeletonLine className="h-2.5 w-20" />
        <SkeletonLine className="ml-auto h-2.5 w-16" />
      </div>
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, index) => (
      <div
        key={index}
        className="flex items-center gap-4 border-b border-slate-50 px-5 py-4 last:border-0"
        style={{ opacity: 1 - index * 0.1 }}
      >
        <div className="skeleton skeleton-circle h-9 w-9 shrink-0" />
        <SkeletonLine className="h-2.5 w-1/4" />
        <SkeletonLine className="h-2.5 w-1/5" />
        <SkeletonLine className="h-2.5 w-1/6" />
        <div className="ml-auto flex items-center gap-2">
          <SkeletonLine className="h-7 w-14 rounded-full" />
          <SkeletonLine className="h-7 w-16 rounded-lg" />
        </div>
      </div>
    ))}
  </div>
);

/* ── Skeleton Stats ─────────────────────────────────────── */
export const SkeletonStats: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <div
    className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
    aria-busy="true"
    aria-label="Loading statistics"
  >
    {Array.from({ length: count }).map((_, index) => (
      <div
        key={index}
        className="glass-panel-sm p-5 space-y-3"
        style={{ animationDelay: `${index * 60}ms` }}
      >
        <SkeletonLine className="h-2 w-20" />
        <SkeletonLine className="h-8 w-28" />
        <SkeletonLine className="h-2 w-36" />
      </div>
    ))}
  </div>
);

/* ── Empty State ────────────────────────────────────────── */
export const EmptyState: React.FC<{
  title: string;
  message: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}> = ({ title, message, action, icon }) => {
  return (
    <MotionDiv
      className="flex flex-col items-center rounded-[var(--radius-section)] border border-dashed border-slate-200 bg-white/60 px-6 py-12 text-center"
      style={{ backdropFilter: 'blur(8px)' }}
      variants={fadeUp}
      initial="initial"
      animate="animate"
    >
      {/* Icon container */}
      <div className="relative mb-5">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-100 to-primary-50 text-2xl shadow-sm ring-4 ring-primary-50">
          {icon ?? (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="#6366F1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      </div>

      <h3 className="text-lg font-semibold tracking-tight text-slate-900">{title}</h3>
      <p className="mx-auto mt-2.5 max-w-md text-sm leading-6 text-slate-500">{message}</p>

      {action ? (
        <div className="mt-6 flex justify-center">{action}</div>
      ) : null}
    </MotionDiv>
  );
};

/* ── Error State ────────────────────────────────────────── */
export const ErrorState: React.FC<{
  title?: string;
  message?: string;
  action?: React.ReactNode;
  onRetry?: () => void;
}> = ({
  title = 'Something went wrong',
  message = 'We could not load this view right now. Please try again.',
  action,
  onRetry
}) => {
  const retryAction = onRetry ? (
    <Button variant="pill" onClick={onRetry}>
      Try again
    </Button>
  ) : null;

  return (
    <MotionDiv
      className="flex flex-col items-center rounded-[var(--radius-section)] border border-red-100 bg-red-50/60 px-6 py-10 text-center"
      style={{ backdropFilter: 'blur(8px)' }}
      variants={fadeUp}
      initial="initial"
      animate="animate"
      role="alert"
    >
      {/* Error icon */}
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600 shadow-sm ring-4 ring-red-50">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <h3 className="text-lg font-semibold tracking-tight text-slate-900">{title}</h3>
      <p className="mx-auto mt-2.5 max-w-md text-sm leading-6 text-slate-500">{message}</p>

      <div className="mt-6 flex justify-center gap-3">
        {action ?? retryAction}
      </div>
    </MotionDiv>
  );
};

/* ── Success State ──────────────────────────────────────── */
export const SuccessState: React.FC<{
  title: string;
  message: string;
  compact?: boolean;
}> = ({ title, message, compact = false }) => {
  if (compact) {
    return (
      <MotionDiv
        className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-3"
        initial={{ opacity: 0, y: 6, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
        role="status"
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-white shadow-sm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          <p className="mt-0.5 text-sm text-slate-600">{message}</p>
        </div>
      </MotionDiv>
    );
  }

  return (
    <MotionDiv
      className="flex flex-col items-center rounded-[var(--radius-section)] border border-emerald-200 bg-emerald-50/70 px-6 py-10 text-center"
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      role="status"
    >
      {/* Animated checkmark */}
      <MotionDiv
        className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 ring-4 ring-emerald-100"
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </MotionDiv>

      <h3 className="text-lg font-semibold tracking-tight text-slate-900">{title}</h3>
      <p className="mx-auto mt-2.5 max-w-md text-sm leading-6 text-slate-500">{message}</p>
    </MotionDiv>
  );
};

export default {
  LoadingScreen,
  InlineLoader,
  SkeletonLine,
  SkeletonCard,
  SkeletonGrid,
  SkeletonTable,
  SkeletonStats,
  EmptyState,
  ErrorState,
  SuccessState
};
