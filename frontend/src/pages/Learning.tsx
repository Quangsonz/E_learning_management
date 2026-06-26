import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { LoadingScreen, Toast, Button, EmptyState } from '../components/ui';
import { lessonApi, Lesson } from '../services/lesson.api';

type Lesson = {
  id: number;
  title: string;
  duration: string;
  completed?: boolean;
};

// Removed dummy modules

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
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [showAchievement, setShowAchievement] = useState(false);
  const [notes, setNotes] = useState(notesSeed.join('\n'));

  const { data, isLoading, error } = useQuery({
    queryKey: ['lessons', courseId],
    queryFn: () => lessonApi.getLessons(courseId!),
    enabled: !!courseId,
    retry: false
  });

  const lessons = data?.data?.lessons || [];

  useEffect(() => {
    if (lessons.length > 0 && !selectedLessonId) {
      setSelectedLessonId(lessons[0]._id);
    }
  }, [lessons, selectedLessonId]);

  const selectedLesson = useMemo(() => {
    return lessons.find((item: Lesson) => item._id === selectedLessonId) || lessons[0];
  }, [selectedLessonId, lessons]);

  const completeLesson = () => {
    setProgress((current) => Math.min(100, current + (100 / (lessons.length || 1))));
    setShowAchievement(true);
    window.setTimeout(() => setShowAchievement(false), 2600);
  };

  const getYoutubeVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  if (isLoading) {
    return (
      <div className="bg-[#FBFBFA] dark:bg-[#111111] flex items-center justify-center py-32 min-h-screen">
        <LoadingScreen title="Loading workspace" message="Preparing video stream and curriculum..." />
      </div>
    );
  }

  const err: any = error;
  if (err?.response?.status === 403) {
    return (
      <div className="bg-[#FBFBFA] dark:bg-[#111111] flex items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 text-rose-500 rounded-full flex items-center justify-center mx-auto">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M8 11h8"/></svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Access Denied</h2>
            <p className="mt-2 text-slate-500 dark:text-slate-400">Bạn phải mua khóa học này để có thể xem bài giảng. Hãy quay lại trang giới thiệu khóa học để đăng ký nhé.</p>
          </div>
          <Button className="w-full" onClick={() => navigate(`/courses/${courseId}`)}>Back to Course</Button>
        </div>
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
          <span className="text-sm font-semibold tracking-tight">Course Viewer</span>
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
                {selectedLesson ? (
                  getYoutubeVideoId(selectedLesson.videoUrl) ? (
                    <iframe
                      width="100%"
                      height="100%"
                      src={`https://www.youtube.com/embed/${getYoutubeVideoId(selectedLesson.videoUrl)}`}
                      title="YouTube video player"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    ></iframe>
                  ) : (
                    <video controls className="w-full h-full object-contain" src={selectedLesson.videoUrl}>
                      Your browser does not support the video tag.
                    </video>
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center opacity-60">
                     <p className="text-white">No video selected</p>
                  </div>
                )}
                {/* Minimal Control Bar Overlay */}
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
                  <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">{selectedLesson?.title || 'No lesson selected'}</h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Lesson</p>
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
              <div className="pt-6 pb-6 border-b border-[#EAEAEA] dark:border-white/10">
                <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400 mb-4">
                  Curriculum
                </h3>
                {lessons.length === 0 ? (
                  <p className="text-sm text-slate-500">No lessons available.</p>
                ) : (
                  <div className="flex flex-col gap-1">
                    {lessons.map((lesson: Lesson, index: number) => {
                      const isActive = lesson._id === selectedLessonId;
                      return (
                        <button
                          key={lesson._id}
                          onClick={() => setSelectedLessonId(lesson._id)}
                          className={`group flex items-center justify-between py-2 text-left w-full transition-colors ${isActive ? 'text-[#111111] dark:text-white font-medium' : 'text-slate-600 dark:text-slate-400 hover:text-[#111111] dark:hover:text-white'}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-4 h-4 shrink-0 flex items-center justify-center">
                              {isActive ? (
                                <div className="w-1.5 h-1.5 rounded-full bg-[#111111] dark:bg-white" />
                              ) : (
                                <span className="text-[10px] text-slate-400">{index + 1}</span>
                              )}
                            </div>
                            <span className="text-sm line-clamp-1">{lesson.title}</span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
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
