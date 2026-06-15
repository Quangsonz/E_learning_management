import React from 'react';
import { motion, MotionProps } from 'framer-motion';

const MotionDiv = motion.div as unknown as React.FC<React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement> & MotionProps>>;

export const LoadingScreen: React.FC<{ title?: string; message?: string }> = ({ title = 'Loading workspace', message = 'Preparing your learning experience...' }) => {
  return (
    <div className="flex min-h-[55vh] items-center justify-center px-4 py-16">
      <MotionDiv
        className="w-full max-w-2xl rounded-[32px] border border-white/70 bg-white/85 p-6 shadow-[0_24px_90px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-8"
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="flex items-start gap-4">
          <div className="relative h-12 w-12 shrink-0 rounded-2xl bg-slate-100">
            <div className="absolute inset-0 animate-pulse rounded-2xl bg-gradient-to-br from-sky-200 via-indigo-200 to-fuchsia-200" />
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Loading State</p>
            <h2 className="text-2xl font-semibold text-slate-950">{title}</h2>
            <p className="max-w-xl text-sm leading-7 text-slate-600">{message}</p>
            <div className="space-y-3 pt-2">
              <div className="h-3 w-full animate-pulse rounded-full bg-slate-100" />
              <div className="h-3 w-5/6 animate-pulse rounded-full bg-slate-100" />
              <div className="h-3 w-2/3 animate-pulse rounded-full bg-slate-100" />
            </div>
          </div>
        </div>
      </MotionDiv>
    </div>
  );
};

export const SkeletonCard: React.FC<{ lines?: number }> = ({ lines = 3 }) => {
  return (
    <div className="rounded-[28px] border border-white/70 bg-white/85 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
      <div className="h-4 w-24 animate-pulse rounded-full bg-slate-100" />
      <div className="mt-4 h-6 w-4/5 animate-pulse rounded-full bg-slate-100" />
      <div className="mt-3 space-y-3">
        {Array.from({ length: lines }).map((_, index) => (
          <div key={index} className="h-3 animate-pulse rounded-full bg-slate-100" />
        ))}
      </div>
      <div className="mt-5 h-10 w-28 animate-pulse rounded-full bg-slate-100" />
    </div>
  );
};

export const EmptyState: React.FC<{
  title: string;
  message: string;
  action?: React.ReactNode;
}> = ({ title, message, action }) => {
  return (
    <MotionDiv
      className="rounded-[30px] border border-dashed border-slate-300 bg-white/75 p-10 text-center shadow-[0_18px_60px_rgba(15,23,42,0.05)]"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
    >
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-950 text-2xl text-white shadow-lg shadow-slate-950/15">
        ◌
      </div>
      <h3 className="mt-5 text-2xl font-semibold text-slate-950">{title}</h3>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-600">{message}</p>
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </MotionDiv>
  );
};

export const ErrorState: React.FC<{
  title?: string;
  message?: string;
  action?: React.ReactNode;
}> = ({ title = 'Something went wrong', message = 'We could not load this view right now. Please try again.', action }) => {
  return (
    <MotionDiv
      className="rounded-[30px] border border-rose-200 bg-rose-50/80 p-6 text-center shadow-[0_18px_60px_rgba(15,23,42,0.05)]"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
    >
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500 text-xl text-white shadow-lg shadow-rose-500/20">
        !
      </div>
      <h3 className="mt-4 text-2xl font-semibold text-slate-950">{title}</h3>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-600">{message}</p>
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </MotionDiv>
  );
};

export const SuccessState: React.FC<{
  title: string;
  message: string;
}> = ({ title, message }) => {
  return (
    <MotionDiv
      className="rounded-[26px] border border-emerald-200 bg-emerald-50/85 px-4 py-3 text-sm text-emerald-700 shadow-[0_18px_60px_rgba(15,23,42,0.05)]"
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.22 }}
    >
      <p className="font-semibold uppercase tracking-[0.24em]">Success State</p>
      <p className="mt-2 text-base font-semibold text-slate-950">{title}</p>
      <p className="mt-1 leading-6 text-slate-600">{message}</p>
    </MotionDiv>
  );
};

export default {
  LoadingScreen,
  SkeletonCard,
  EmptyState,
  ErrorState,
  SuccessState
};