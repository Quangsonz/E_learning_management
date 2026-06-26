import React from 'react';
import { motion } from 'framer-motion';
import { fadeUp } from '../../animations/motionVariants';
import StarBackground from '../ui/StarBackground';

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
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white flex flex-col lg:flex-row">
      {/* Background Image & Gradients */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Abstract Dark Background Image */}
        <div 
          className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-luminosity" 
        />
        {/* Overlay to ensure text readability */}
        <div className="absolute inset-0 bg-slate-950/80" />

        {/* Animated Galaxy Stars */}
        <StarBackground />

        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.25),transparent_60%)] blur-3xl" />
        <div className="absolute top-[40%] -right-[10%] w-[50%] h-[60%] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.2),transparent_60%)] blur-3xl" />
        <div className="absolute -bottom-[20%] left-[20%] w-[40%] h-[40%] rounded-full bg-[radial-gradient(circle,rgba(236,72,153,0.15),transparent_60%)] blur-3xl" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')] opacity-20 mix-blend-overlay" />
      </div>

      {/* Left 60%: Experience Area */}
      <motion.section
        className="relative z-10 hidden lg:flex lg:w-[60%] flex-col justify-center p-12 xl:p-20"
        initial="initial"
        animate="animate"
        variants={fadeUp}
      >
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-sky-300">
            <span className="h-2 w-2 rounded-full bg-sky-400" />
            {badge}
          </span>
          <h1 className="mt-8 text-5xl font-bold leading-[1.1] tracking-tight text-white xl:text-[4rem]">
            {headline}
          </h1>
          <p className="mt-6 text-xl leading-relaxed text-slate-300 max-w-lg">
            {description}
          </p>

          {/* Floating Learning Insights */}
          <div className="relative mt-16 h-48 w-full max-w-lg">
            {/* Streak Insight */}
            <motion.div
              animate={{ y: [-2, 2, -2] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute left-0 top-0 rounded-2xl border border-white/5 bg-white/5 p-4 backdrop-blur-xl shadow-xl flex items-center gap-4"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-500/20 text-orange-400 text-xl">🔥</div>
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400">Current Streak</p>
                <p className="text-xl font-bold text-white">12 Days</p>
              </div>
            </motion.div>

            {/* Courses Completed */}
            <motion.div
              animate={{ y: [2, -2, 2] }}
              transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute right-0 top-8 rounded-2xl border border-white/5 bg-white/5 p-4 backdrop-blur-xl shadow-xl flex items-center gap-4"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-xl">✨</div>
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400">Completed</p>
                <p className="text-xl font-bold text-white">4 Courses</p>
              </div>
            </motion.div>

            {/* Learning Stats */}
            <motion.div
              animate={{ y: [-1, 1, -1] }}
              transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute left-16 bottom-0 rounded-2xl border border-white/5 bg-white/5 p-4 backdrop-blur-xl shadow-xl flex items-center gap-4"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400 text-xl">🧠</div>
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400">Focus Time</p>
                <p className="text-xl font-bold text-white">34 Hours</p>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Right 40%: Auth Area */}
      <motion.section
        className="relative z-10 flex w-full lg:w-[40%] min-h-screen flex-col justify-center px-6 py-12 lg:px-12"
        initial="initial"
        animate="animate"
        variants={fadeUp}
      >
        <div className="w-full max-w-md mx-auto relative rounded-3xl border border-white/5 bg-white/5 p-8 shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-xl sm:p-10">
          <div className="mb-8 lg:hidden">
             <span className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-sky-300">
               {badge}
             </span>
             <h2 className="mt-4 text-2xl font-bold text-white">{headline}</h2>
             <p className="mt-2 text-sm text-slate-400">{description}</p>
          </div>

          {children}

          {footer ? <div className="mt-8">{footer}</div> : null}
        </div>
      </motion.section>
    </div>
  );
};

export default AuthLayout;