import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import StarBackground from '../components/ui/StarBackground';

/* ── 1. AMBIENT ECOSYSTEM BACKGROUND ── */
const EcosystemBackground = () => {
  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden bg-[#030303]">
      {/* Deep Space Lighting */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[150px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan-500/10 rounded-full blur-[150px]" />
      
      {/* Animated Flowing SVG Network */}
      <svg className="absolute inset-0 w-full h-full opacity-30" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="glowLine1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(99, 102, 241, 0)" />
            <stop offset="50%" stopColor="rgba(99, 102, 241, 0.4)" />
            <stop offset="100%" stopColor="rgba(99, 102, 241, 0)" />
          </linearGradient>
          <linearGradient id="glowLine2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(6, 182, 212, 0)" />
            <stop offset="50%" stopColor="rgba(6, 182, 212, 0.4)" />
            <stop offset="100%" stopColor="rgba(6, 182, 212, 0)" />
          </linearGradient>
        </defs>
        
        {/* Network Paths */}
        <motion.path 
          d="M-100,200 C300,100 500,600 1200,300" 
          fill="none" 
          stroke="url(#glowLine1)" 
          strokeWidth="1.5" 
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 4, ease: "easeInOut" }}
        />
        <motion.path 
          d="M1200,800 C800,700 600,100 -100,400" 
          fill="none" 
          stroke="url(#glowLine2)" 
          strokeWidth="1.5"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 5, ease: "easeInOut", delay: 0.5 }}
        />
      </svg>
      
      {/* Floating Particles/Nodes */}
      {Array.from({ length: 15 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-white/20"
          initial={{ 
            x: `${Math.random() * 100}vw`, 
            y: `${Math.random() * 100}vh`,
            opacity: Math.random() * 0.5 + 0.1
          }}
          animate={{
            y: [null, `${Math.random() * 100}vh`],
            x: [null, `${Math.random() * 100}vw`],
            opacity: [null, Math.random() * 0.8 + 0.2, 0.1]
          }}
          transition={{
            duration: Math.random() * 20 + 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      ))}
      
      {/* Interactive Star Particles */}
      <StarBackground />
    </div>
  );
};




/* ── 4. DYNAMIC HEADLINE ── */
const disciplines = [
  { text: "Frontend.", color: "from-sky-400 to-indigo-500" },
  { text: "Backend.", color: "from-emerald-400 to-teal-500" },
  { text: "Security.", color: "from-rose-400 to-red-500" },
  { text: "Cloud.", color: "from-amber-400 to-orange-500" },
  { text: "AI.", color: "from-fuchsia-400 to-purple-500" },
];

const DynamicHeadline = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % disciplines.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <h1 className="text-[3.5rem] sm:text-[5rem] lg:text-[7rem] font-light tracking-tighter leading-[1.1] text-white flex flex-col items-center">
      <span className="text-white/90">Master your craft in</span>
      <div className="h-[1.2em] relative w-full flex justify-center mt-[-0.1em]">
        <AnimatePresence mode="wait">
          <motion.span
            key={index}
            initial={{ y: 40, opacity: 0, filter: "blur(10px)" }}
            animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
            exit={{ y: -40, opacity: 0, filter: "blur(10px)" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className={`absolute font-medium text-transparent bg-clip-text bg-gradient-to-r ${disciplines[index].color}`}
          >
            {disciplines[index].text}
          </motion.span>
        </AnimatePresence>
      </div>
    </h1>
  );
};

/* ── 5. LEARNING PATH VISUALIZATION ── */
const RoadmapsFlow = () => {
  return (
    <div className="w-full max-w-5xl mx-auto mt-40 z-10 relative flex flex-col gap-24 px-8 mb-32">
      <div className="text-center flex flex-col items-center gap-4">
        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30">Architecture of Growth</span>
        <h2 className="text-3xl font-light tracking-tight text-white/90">Explore Learning Paths</h2>
      </div>

      <div className="flex flex-col gap-16 relative">
        {/* Flowing background track */}
        <div className="absolute left-[23px] top-4 bottom-4 w-[2px] bg-white/[0.03]" />
        
        {/* Path 1 */}
        <div className="flex gap-8 relative">
          <div className="w-12 h-12 rounded-full border border-sky-500/30 bg-sky-500/10 flex items-center justify-center shrink-0 z-10 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.8)]" />
          </div>
          <div className="flex flex-col gap-4 pt-2">
            <h3 className="text-xl font-light text-white">Frontend Engineering</h3>
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold tracking-widest uppercase text-white/40">
              <span className="text-white/80">Foundations</span>
              <span>→</span>
              <span>React ecosystem</span>
              <span>→</span>
              <span>Performance</span>
              <span>→</span>
              <span className="text-sky-400">Architect</span>
            </div>
          </div>
        </div>

        {/* Path 2 */}
        <div className="flex gap-8 relative">
          <div className="w-12 h-12 rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 flex items-center justify-center shrink-0 z-10 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-fuchsia-400 shadow-[0_0_10px_rgba(232,121,249,0.8)]" />
          </div>
          <div className="flex flex-col gap-4 pt-2">
            <h3 className="text-xl font-light text-white">Artificial Intelligence</h3>
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold tracking-widest uppercase text-white/40">
              <span className="text-white/80">Python Math</span>
              <span>→</span>
              <span>Machine Learning</span>
              <span>→</span>
              <span>LLMs</span>
              <span>→</span>
              <span className="text-fuchsia-400">AI Engineer</span>
            </div>
          </div>
        </div>

        {/* Path 3 */}
        <div className="flex gap-8 relative">
          <div className="w-12 h-12 rounded-full border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-center shrink-0 z-10 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
          </div>
          <div className="flex flex-col gap-4 pt-2">
            <h3 className="text-xl font-light text-white">Cyber Security</h3>
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold tracking-widest uppercase text-white/40">
              <span className="text-white/80">Networks</span>
              <span>→</span>
              <span>Vulnerabilities</span>
              <span>→</span>
              <span>Pen Testing</span>
              <span>→</span>
              <span className="text-emerald-400">Red Team</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

/* ── MAIN COMPONENT ── */
const Splash: React.FC = () => {
  useEffect(() => {
    // Force hide horizontal scroll on the document body for this page
    document.body.style.overflowX = 'hidden';
    return () => {
      document.body.style.overflowX = '';
    };
  }, []);

  return (
    <div className="relative min-h-screen w-full bg-[#030303] text-white selection:bg-indigo-500/30 overflow-x-hidden font-sans">
      
      <EcosystemBackground />

      {/* Main Hero Container */}
      <div className="relative z-20 flex flex-col items-center justify-center min-h-[90vh] px-6 text-center pt-24">
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.25em] text-white/50 backdrop-blur-md"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
          The Operating System for Learning
        </motion.div>

        <DynamicHeadline />

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="mt-8 max-w-2xl text-lg font-light leading-relaxed text-white/40"
        >
          A premium environment designed for extreme focus. Build skills, track true progression, and join an ecosystem of ambitious professionals.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="mt-14 flex flex-col sm:flex-row items-center gap-6"
        >
          <Link 
            to="/register" 
            className="group relative flex h-14 items-center justify-center gap-3 rounded-full bg-white px-8 font-bold uppercase tracking-widest text-black text-xs transition-transform duration-300 hover:scale-105"
          >
            Start Learning
            <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <Link 
            to="/courses" 
            className="flex h-14 items-center justify-center rounded-full border border-white/10 bg-transparent px-8 font-bold uppercase tracking-widest text-white text-xs transition-colors duration-300 hover:bg-white/5"
          >
            Explore Roadmaps
          </Link>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="mt-20 flex items-center gap-8 text-[10px] font-bold uppercase tracking-[0.2em] text-white/20"
        >
          <Link to="/login" className="hover:text-white transition-colors">Sign In</Link>
          <div className="w-1 h-1 rounded-full bg-white/10" />
          <Link to="/home" className="hover:text-white transition-colors">Go to Home</Link>
          <div className="w-1 h-1 rounded-full bg-white/10" />
          <Link to="/admin-dashboard" className="hover:text-white transition-colors">Admin Area</Link>
        </motion.div>

      </div>

      <RoadmapsFlow />
      
    </div>
  );
};

export default Splash;
