import React from 'react';
import { motion } from 'framer-motion';
import { fadeUp } from '../../animations/motionVariants';

type AuthLayoutProps = {
  badge: string;
  headline: string;
  description: string;
  bannerLabel: string;
  bannerTitle: string;
  bannerDescription: string;
  highlights: string[];
  children: React.ReactNode;
  footer?: React.ReactNode;
};

const floatVariants = {
  animate: (offset: number) => ({
    y: [0, -10 - offset, 0],
    x: [0, 6 - offset, 0],
    transition: {
      duration: 5 + offset * 0.35,
      repeat: Number.POSITIVE_INFINITY,
      ease: 'easeInOut' as const
    }
  })
};

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  badge,
  headline,
  description,
  bannerLabel,
  bannerTitle,
  bannerDescription,
  highlights,
  children,
  footer
}) => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050816] text-white">
      <motion.div
        className="absolute inset-0 bg-[linear-gradient(135deg,rgba(56,189,248,0.26)_0%,rgba(99,102,241,0.18)_38%,rgba(236,72,153,0.18)_100%)] opacity-80"
        aria-hidden="true"
        animate={{ backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'] }}
        transition={{ duration: 18, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }}
        style={{ backgroundSize: '200% 200%' }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.14),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.2),transparent_34%)]" />

      <div className="relative mx-auto grid min-h-screen w-full max-w-7xl items-stretch px-4 py-4 sm:px-6 lg:grid-cols-[1.08fr_0.92fr] lg:px-8 lg:py-6">
        <motion.section
          className="relative hidden overflow-hidden rounded-[32px] border border-white/10 bg-white/10 p-8 backdrop-blur-2xl lg:flex lg:flex-col lg:justify-between xl:p-12"
          initial="initial"
          animate="animate"
          variants={fadeUp}
        >
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.16),rgba(255,255,255,0.02))]" />

          <div className="relative z-10 flex items-center justify-between">
            <span className="inline-flex items-center rounded-full border border-white/15 bg-white/12 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-100">
              {badge}
            </span>
            <div className="rounded-full border border-white/12 bg-white/10 px-4 py-2 text-sm text-white/80 backdrop-blur-md">
              Smart onboarding
            </div>
          </div>

          <div className="relative z-10 mt-10 max-w-xl">
            <h1 className="max-w-lg text-5xl font-semibold leading-tight tracking-tight text-white xl:text-6xl">
              {headline}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-white/72">
              {description}
            </p>

            <div className="mt-8 inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-5 py-3 text-sm font-medium text-cyan-50 shadow-[0_12px_40px_rgba(34,211,238,0.2)] backdrop-blur-md">
              {bannerLabel}
            </div>

            <div className="mt-6 rounded-[28px] border border-white/10 bg-white/10 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.3)] backdrop-blur-xl">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.25em] text-cyan-100/80">{bannerTitle}</p>
                  <p className="mt-3 max-w-md text-base leading-7 text-white/75">{bannerDescription}</p>
                </div>
                <div className="rounded-2xl border border-white/12 bg-white/10 px-4 py-3 text-right">
                  <p className="text-xs uppercase tracking-[0.28em] text-white/55">Active learners</p>
                  <p className="mt-2 text-2xl font-semibold text-white">12.4k</p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {highlights.map((item, index) => (
                  <div key={item} className="rounded-2xl border border-white/10 bg-slate-950/25 px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-white/45">Feature {index + 1}</p>
                    <p className="mt-2 text-sm leading-6 text-white/80">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-12 grid gap-4 sm:grid-cols-3">
            <div className="rounded-[24px] border border-white/12 bg-white/10 p-4 backdrop-blur-md">
              <p className="text-xs uppercase tracking-[0.24em] text-white/55">Learning Banner</p>
              <p className="mt-2 text-lg font-semibold text-white">Launch your next cohort in days.</p>
            </div>
            <div className="rounded-[24px] border border-white/12 bg-white/10 p-4 backdrop-blur-md sm:col-span-2">
              <p className="text-xs uppercase tracking-[0.24em] text-white/55">Marketing Message</p>
              <p className="mt-2 text-lg leading-7 text-white/85">
                Designed for modern SaaS teams who need a polished, confident, and conversion-focused learning experience.
              </p>
            </div>
          </div>

          <div className="absolute right-8 top-10 h-28 w-28 rounded-full bg-cyan-300/20 blur-3xl" />
          <div className="absolute bottom-16 left-10 h-36 w-36 rounded-full bg-fuchsia-400/20 blur-3xl" />
          <motion.div
            custom={0}
            variants={floatVariants}
            animate="animate"
            className="absolute left-[18%] top-[18%] rounded-2xl border border-white/15 bg-white/15 px-4 py-3 text-sm text-white shadow-[0_12px_30px_rgba(15,23,42,0.25)] backdrop-blur-xl"
          >
            Live progress
          </motion.div>
          <motion.div
            custom={1}
            variants={floatVariants}
            animate="animate"
            className="absolute bottom-[18%] right-[12%] rounded-2xl border border-white/15 bg-white/15 px-4 py-3 text-sm text-white shadow-[0_12px_30px_rgba(15,23,42,0.25)] backdrop-blur-xl"
          >
            Interactive lessons
          </motion.div>
        </motion.section>

        <motion.section
          className="relative flex min-h-full items-center justify-center lg:px-8"
          initial="initial"
          animate="animate"
          variants={fadeUp}
        >
          <div className="w-full max-w-lg rounded-[28px] border border-white/15 bg-white/85 p-5 text-slate-900 shadow-[0_30px_90px_rgba(15,23,42,0.3)] backdrop-blur-2xl sm:p-8 lg:bg-white/80">
            <div className="mb-8 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">{badge}</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{headline}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
              </div>
              <div className="hidden rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-right sm:block">
                <p className="text-xs uppercase tracking-[0.24em] text-sky-500">Secure</p>
                <p className="mt-1 text-sm font-semibold text-slate-800">SSO ready</p>
              </div>
            </div>

            {children}

            {footer ? <div className="mt-6">{footer}</div> : null}
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default AuthLayout;