import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import StarBackground from '../components/ui/StarBackground';

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.15
    }
  }
};

const Splash: React.FC = () => {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#050816] text-white flex flex-col items-center justify-center selection:bg-sky-500/30">
      {/* Immersive Background Image & Gradients */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Abstract Dark Background Image */}
        <div 
          className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-luminosity" 
        />
        {/* Overlay to ensure text readability */}
        <div className="absolute inset-0 bg-slate-950/80" />
        
        {/* Animated Galaxy Stars */}
        <StarBackground />

        <div className="absolute -top-[30%] -left-[10%] w-[70%] h-[70%] rounded-full bg-[radial-gradient(circle,rgba(14,165,233,0.25),transparent_60%)] blur-[120px]" />
        <div className="absolute top-[20%] -right-[20%] w-[60%] h-[60%] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.25),transparent_60%)] blur-[120px]" />
        <div className="absolute -bottom-[20%] left-[10%] w-[50%] h-[50%] rounded-full bg-[radial-gradient(circle,rgba(236,72,153,0.2),transparent_60%)] blur-[120px]" />
        {/* Grain overlay for texture */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
      </div>

      <motion.div 
        className="relative z-10 w-full max-w-4xl px-6 text-center"
        initial="initial"
        animate="animate"
        variants={staggerContainer}
      >
        <motion.div variants={fadeUp} className="mb-6 inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-sky-300 backdrop-blur-md shadow-[0_0_20px_rgba(56,189,248,0.15)]">
          <span className="h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
          E-Learning Platform
        </motion.div>

        <motion.h1 
          variants={fadeUp} 
          className="text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/60 sm:text-7xl lg:text-[5rem] leading-[1.1]"
        >
          Master your craft in a <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-indigo-400 to-fuchsia-400">living workspace.</span>
        </motion.h1>

        <motion.p 
          variants={fadeUp} 
          className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-slate-300 sm:text-xl"
        >
          A premium, distraction-free environment designed to help you focus, track progress, and achieve your learning goals without the clutter.
        </motion.p>

        <motion.div variants={fadeUp} className="mt-12 flex flex-col items-center justify-center gap-5 sm:flex-row">
          <Link 
            to="/register" 
            className="group relative flex h-14 w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-white px-8 font-semibold text-slate-900 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(255,255,255,0.3)]"
          >
            Start Learning
            <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <Link 
            to="/courses" 
            className="flex h-14 w-full sm:w-auto items-center justify-center rounded-full border border-white/10 bg-white/5 px-8 font-semibold text-white backdrop-blur-md transition-all duration-300 hover:bg-white/10 hover:border-white/20"
          >
            Explore Courses
          </Link>
        </motion.div>

        <motion.div variants={fadeUp} className="mt-16 border-t border-white/10 pt-8 flex items-center justify-center gap-8 text-sm font-medium text-slate-400">
          <Link to="/login" className="hover:text-white transition-colors">Sign In</Link>
          <div className="h-1 w-1 rounded-full bg-white/20" />
          <Link to="/home" className="hover:text-white transition-colors">Go to Home</Link>
          <div className="h-1 w-1 rounded-full bg-white/20" />
          <Link to="/admin-dashboard" className="hover:text-white transition-colors">Admin Area</Link>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Splash;
