import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { LoadingScreen, Toast } from '../components/ui';
import useSimulatedLoading from '../hooks/useSimulatedLoading';

type Lesson = {
  id: number;
  title: string;
  duration: string;
  completed?: boolean;
};

type Module = {
  id: number;
  title: string;
  lessons: Lesson[];
};

type Resource = {
  title: string;
  type: string;
};

const modules: Module[] = [
  {
    id: 1,
    title: 'Getting Started',
    lessons: [
      { id: 101, title: 'Welcome and learning goals', duration: '08:00', completed: true },
      { id: 102, title: 'How the platform is structured', duration: '12:30', completed: true },
      { id: 103, title: 'Setup your workflow', duration: '15:20' }
    ]
  },
  {
    id: 2,
    title: 'Core Practice',
    lessons: [
      { id: 201, title: 'Watch and take notes', duration: '18:10' },
      { id: 202, title: 'Practice with guided tasks', duration: '22:15' },
      { id: 203, title: 'Knowledge check', duration: '10:05' }
    ]
  },
  {
    id: 3,
    title: 'Advanced Strategy',
    lessons: [
      { id: 301, title: 'Optimize your learning system', duration: '19:40' },
      { id: 302, title: 'Build a personal study plan', duration: '16:25' }
    ]
  }
];

const resources: Resource[] = [
  { title: 'Lesson slides PDF', type: 'PDF' },
  { title: 'Design notes template', type: 'DOC' },
  { title: 'Practice checklist', type: 'TXT' },
  { title: 'Community discussion', type: 'LINK' }
];

const notesSeed = [
  'Focus on the learning objective before each session.',
  'Pause the video and write one insight per lesson.',
  'Use the resources panel to save reference materials.'
];

const Learning: React.FC = () => {
  const [selectedLessonId, setSelectedLessonId] = useState(103);
  const [progress, setProgress] = useState(58);
  const [showAchievement, setShowAchievement] = useState(false);
  const [notes, setNotes] = useState(notesSeed.join('\n'));
  const isLoading = useSimulatedLoading(750);

  const selectedLesson = useMemo(() => {
    for (const module of modules) {
      const lesson = module.lessons.find((item) => item.id === selectedLessonId);
      if (lesson) return lesson;
    }
    return modules[0].lessons[0];
  }, [selectedLessonId]);

  const completeLesson = () => {
    setProgress((current) => Math.min(100, current + 8));
    setShowAchievement(true);
    window.setTimeout(() => setShowAchievement(false), 2600);
  };

    if (isLoading) {
    return (
      <div className="bg-[#FBFBFA] dark:bg-[#111111] flex items-center justify-center py-32">
        <LoadingScreen title="Loading workspace" message="Preparing video stream and curriculum..." />
      </div>
    );
  }

  return (
    <div className="bg-[#FBFBFA] dark:bg-[#111111] text-[#111111] dark:text-[#FBFBFA] selection:bg-slate-200 dark:selection:bg-slate-800">
      
      {/* Top minimal nav */}
      <nav className="h-14 border-b border-[#EAEAEA] dark:border-white/10 flex items-center px-6 lg:px-8 bg-[#FBFBFA]/80 dark:bg-[#111111]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-4 w-full max-w-[1400px] mx-auto">
          <Link to="/courses" className="text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors flex items-center gap-1.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Back to Course
          </Link>
          <div className="w-[1px] h-4 bg-slate-200 dark:bg-white/10"></div>
          <span className="text-sm font-semibold tracking-tight">Product Design Masterclass</span>
        </div>
      </nav>

      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-8 lg:py-12">
        
        {/* Asymmetrical Layout */}
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* Left Column (Video + Notes) */}
          <div className="lg:col-span-8 flex flex-col gap-10">
            
            {/* Cinematic Video Player */}
            <div className="flex flex-col gap-5">
              <div className="relative aspect-video w-full bg-black rounded-xl overflow-hidden group shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                <img src="https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=1600&q=80" alt="Video cover" className="w-full h-full object-cover opacity-60 transition-opacity duration-500 group-hover:opacity-40" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <button className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition-transform duration-300 hover:scale-105 hover:bg-white/20 active:scale-95">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                  </button>
                </div>
                {/* Minimal Control Bar */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-between text-white text-xs font-medium">
                  <div className="flex items-center gap-3">
                    <button className="hover:opacity-80 transition-opacity"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg></button>
                    <span>02:14 / {selectedLesson.duration}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <button className="hover:opacity-80 transition-opacity">1x</button>
                    <button className="hover:opacity-80 transition-opacity">CC</button>
                    <button className="hover:opacity-80 transition-opacity"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg></button>
                  </div>
                </div>
              </div>

              {/* Lesson Metadata */}
              <div className="flex items-start justify-between gap-6 pb-8 border-b border-[#EAEAEA] dark:border-white/10">
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">{selectedLesson.title}</h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Lesson • {selectedLesson.duration}</p>
                </div>
                <button 
                  onClick={completeLesson}
                  className="shrink-0 rounded-md bg-[#111111] dark:bg-white px-5 py-2.5 text-sm font-medium text-white dark:text-[#111111] transition-transform active:scale-95 hover:bg-slate-800 dark:hover:bg-slate-200"
                >
                  Mark Complete
                </button>
              </div>
            </div>

            {/* Notion-style Notes Editor */}
            <div className="flex flex-col gap-4 mt-2">
              <h2 className="text-3xl font-bold tracking-tight text-slate-300 dark:text-slate-700 select-none">Notes</h2>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Start typing your notes..."
                className="w-full min-h-[100px] resize-none bg-transparent border-none outline-none text-base leading-relaxed text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:ring-0 p-0"
              />
            </div>

          </div>

          {/* Right Column (Curriculum) */}
          <div className="lg:col-span-4 flex flex-col gap-10 lg:sticky lg:top-24">
            
            {/* Ultra-minimal Progress */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold tracking-widest uppercase mb-3 text-slate-500">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <div className="h-[2px] w-full bg-[#EAEAEA] dark:bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-[#111111] dark:bg-white"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            </div>

            {/* Typography-driven Curriculum */}
            <div className="flex flex-col">
              {modules.map((module, mIdx) => (
                <div key={module.id} className="pt-6 first:pt-0 pb-6 border-b border-[#EAEAEA] dark:border-white/10 last:border-0">
                  <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400 mb-4">
                    {mIdx + 1}. {module.title}
                  </h3>
                  <div className="flex flex-col gap-1">
                    {module.lessons.map((lesson) => {
                      const isActive = lesson.id === selectedLessonId;
                      return (
                        <button
                          key={lesson.id}
                          onClick={() => setSelectedLessonId(lesson.id)}
                          className={`group flex items-center justify-between py-2 text-left w-full transition-colors ${isActive ? 'text-[#111111] dark:text-white font-medium' : 'text-slate-600 dark:text-slate-400 hover:text-[#111111] dark:hover:text-white'}`}
                        >
                          <div className="flex items-center gap-3">
                            {/* Checkmark indicator */}
                            <div className="w-4 h-4 shrink-0 flex items-center justify-center">
                              {lesson.completed ? (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-slate-400"><path d="M20 6L9 17l-5-5"/></svg>
                              ) : isActive ? (
                                <div className="w-1.5 h-1.5 rounded-full bg-[#111111] dark:bg-white" />
                              ) : null}
                            </div>
                            <span className="text-sm">{lesson.title}</span>
                          </div>
                          <span className={`text-xs ${isActive ? 'text-slate-500' : 'text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity'}`}>{lesson.duration}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Resources minimal list */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400 mb-4">Resources</h3>
              <div className="flex flex-col gap-2">
                {resources.map((res) => (
                  <a key={res.title} href="#" className="flex items-center justify-between group py-1">
                    <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-[#111111] dark:group-hover:text-white transition-colors underline decoration-slate-300 dark:decoration-slate-700 underline-offset-4">{res.title}</span>
                    <span className="text-[10px] font-mono text-slate-400 uppercase">{res.type}</span>
                  </a>
                ))}
              </div>
            </div>

          </div>

        </div>

        {/* Discussion / Q&A Section (Full Width) */}
        <div className="flex flex-col gap-8 pt-8 border-t border-[#EAEAEA] dark:border-white/10 w-full">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Discussion</h2>
            <span className="text-sm font-medium text-slate-500">12 Comments</span>
          </div>
          
          {/* Input */}
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center font-bold shrink-0">
              U
            </div>
            <div className="flex-1 flex flex-col gap-3">
              <textarea 
                placeholder="Ask a question or share an insight..." 
                className="w-full min-h-[100px] resize-none bg-white dark:bg-[#1A1A1A] border border-slate-200 dark:border-white/10 rounded-xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              />
              <div className="flex justify-end">
                <button className="px-5 py-2 bg-[#111111] dark:bg-white text-white dark:text-[#111111] text-sm font-medium rounded-lg hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors">
                  Post Comment
                </button>
              </div>
            </div>
          </div>

          {/* Comments List */}
          <div className="flex flex-col gap-8 mt-4">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-slate-200">
                <img src="https://i.pravatar.cc/150?u=12" alt="User" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col gap-1.5 w-full">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-slate-900 dark:text-white">Sarah Jenkins</span>
                  <span className="text-xs text-slate-500">2 days ago</span>
                </div>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  I found the explanation on component architecture really helpful! Does anyone know if there's a specific pattern for handling global state in this setup?
                </p>
                <div className="flex items-center gap-4 mt-1 text-xs font-medium text-slate-500">
                  <button className="hover:text-indigo-500 transition-colors">Reply</button>
                  <button className="hover:text-indigo-500 transition-colors flex items-center gap-1">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
                    12
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-slate-200">
                <img src="https://i.pravatar.cc/150?u=34" alt="User" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col gap-1.5 w-full">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-slate-900 dark:text-white">Michael Chang</span>
                  <span className="text-xs text-slate-500">4 days ago</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">Instructor</span>
                </div>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  Great question Sarah. In the next module, we dive deep into Context API vs Redux. For now, keep your state localized as much as possible to avoid unnecessary re-renders.
                </p>
                <div className="flex items-center gap-4 mt-1 text-xs font-medium text-slate-500">
                  <button className="hover:text-indigo-500 transition-colors">Reply</button>
                  <button className="hover:text-indigo-500 transition-colors flex items-center gap-1">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
                    34
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Toast
        visible={showAchievement}
        title="Lesson completed"
        message="Progress saved. Continue to the next module."
        variant="success"
        position="bottom-right"
      />
    </div>
  );
};

export default Learning;
