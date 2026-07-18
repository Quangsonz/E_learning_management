import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LoadingScreen, Toast, Button, EmptyState } from '../components/ui';
import { lessonApi, Lesson as ApiLesson } from '../services/lesson.api';
import { progressApi } from '../services/progress.api';
import { quizApi } from '../services/quiz.api';
import { enrollmentApi } from '../services/enrollment.api';
import { discussionApi, Discussion, Comment } from '../services/discussion.api';
import { useAuth } from '../contexts/AuthContext';
import { assignmentApi, Assignment, AssignmentSubmission } from '../services/assignment.api';
import { uploadApi } from '../services/upload.api';
import { store } from '../store/store';



type Resource = { title: string; type: string };

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
  const queryClient = useQueryClient();
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [showAchievement, setShowAchievement] = useState(false);
  const [notes, setNotes] = useState(notesSeed.join('\n'));
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [bookmarkNote, setBookmarkNote] = useState('');
  const [showBookmarkInput, setShowBookmarkInput] = useState(false);
  const [discussionText, setDiscussionText] = useState('');
  const [expandedDiscussionId, setExpandedDiscussionId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const { user, refreshProfile } = useAuth();
  
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [practiceLimit, setPracticeLimit] = useState(10);
  const [submitNotesText, setSubmitNotesText] = useState('');
  const [submitFileName, setSubmitFileName] = useState('');
  const [submitFileUrl, setSubmitFileUrl] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const res = await uploadApi.uploadDocument(file);
      if (res.status === 'success' && res.data?.url) {
        setSubmitFileName(res.data.filename || file.name);
        setSubmitFileUrl(res.data.url);
      }
    } catch (err) {
      console.error('File upload failed:', err);
    } finally {
      setUploadingFile(false);
    }
  };


  const { data: assignmentsData } = useQuery({
    queryKey: ['assignments', courseId],
    queryFn: () => assignmentApi.getAssignments(courseId!),
    enabled: !!courseId
  });
  const assignments = assignmentsData || [];

  const { data: mySubmissionData, refetch: refetchMySubmission } = useQuery({
    queryKey: ['my-submission', selectedAssignmentId],
    queryFn: () => assignmentApi.getMySubmission(selectedAssignmentId!),
    enabled: !!selectedAssignmentId
  });

  const submitAssignmentMutation = useMutation({
    mutationFn: ({ aId, files, notes }: { aId: string, files: any[], notes: string }) => 
      assignmentApi.submitAssignment(aId, { submittedFiles: files, studentNotes: notes }),
    onSuccess: () => {
      refetchMySubmission();
      queryClient.invalidateQueries({ queryKey: ['assignments', courseId] });
      setSubmitNotesText('');
      setSubmitFileName('');
      setSubmitFileUrl('');
    }
  });

  const { data: lessonsData, isLoading: isLoadingLessons, error } = useQuery({
    queryKey: ['lessons', courseId],
    queryFn: () => lessonApi.getLessons(courseId!),
    enabled: !!courseId,
    retry: false
  });

  const { data: progressData, isLoading: isLoadingProgress } = useQuery({
    queryKey: ['course-progress', courseId],
    queryFn: () => progressApi.getCourseProgress(courseId!),
    enabled: !!courseId
  });

  const { data: enrollmentsData, isLoading: isLoadingEnrollments } = useQuery({
    queryKey: ['my-enrollments'],
    queryFn: () => enrollmentApi.getMyEnrollments()
  });

  const isEnrolled = useMemo(() => {
    if (!enrollmentsData?.data?.enrollments || !courseId) return false;
    // Kiểm tra mảng enrollments, nếu enrollment.course là string hay object
    return enrollmentsData.data.enrollments.some((e: any) => 
      (typeof e.course === 'object' ? e.course._id : e.course) === courseId
    );
  }, [enrollmentsData, courseId]);

  const { data: quizzesData, isLoading: isLoadingQuizzes } = useQuery({
    queryKey: ['quizzes', courseId],
    queryFn: () => quizApi.getQuizzesByCourse(courseId!),
    enabled: !!courseId
  });

  const { data: discussionsData } = useQuery({
    queryKey: ['discussions', courseId, selectedLessonId],
    queryFn: () => discussionApi.getDiscussions(courseId!, selectedLessonId!),
    enabled: !!courseId && !!selectedLessonId && !selectedQuizId
  });

  const { data: commentsData } = useQuery({
    queryKey: ['comments', courseId, selectedLessonId, expandedDiscussionId],
    queryFn: () => discussionApi.getComments(courseId!, selectedLessonId!, expandedDiscussionId!),
    enabled: !!courseId && !!selectedLessonId && !!expandedDiscussionId
  });

  const discussions: Discussion[] = discussionsData?.data?.discussions || [];
  const comments: Comment[] = commentsData?.data?.comments || [];

  const lessons = lessonsData?.data?.lessons || [];
  const quizzes = quizzesData?.data?.data?.quizzes || [];
  const progressInfo = progressData?.data?.progress;
  const progressPercent = progressInfo?.progressPercentage || 0;
  const completedLessons = progressInfo?.completedLessons || [];

  useEffect(() => {
    if (lessons.length > 0 && !selectedLessonId) {
      setSelectedLessonId(progressInfo?.lastAccessedLesson || lessons[0]._id);
    }
  }, [lessons, selectedLessonId, progressInfo]);

  const selectedLesson = useMemo(() => {
    return lessons.find((item: ApiLesson) => item._id === selectedLessonId) || (!selectedQuizId ? lessons[0] : null);
  }, [selectedLessonId, selectedQuizId, lessons]);

  const groupedLessons = useMemo(() => {
    const groups: { [key: string]: ApiLesson[] } = {};
    lessons.forEach((lesson: ApiLesson) => {
      const parts = lesson.title.split(': ');
      const chapter = parts.length > 1 ? parts[0] : 'Phần chung';
      if (!groups[chapter]) groups[chapter] = [];
      groups[chapter].push({ ...lesson, title: parts.length > 1 ? parts[1] : lesson.title });
    });
    return Object.entries(groups).map(([chapter, items]) => ({ chapter, items }));
  }, [lessons]);

  const [openChapters, setOpenChapters] = useState<string[]>([]);
  
  useEffect(() => {
    if (selectedLesson) {
      const parts = selectedLesson.title.split(': ');
      const chapter = parts.length > 1 ? parts[0] : 'Phần chung';
      if (!openChapters.includes(chapter)) {
        setOpenChapters(prev => [...prev, chapter]);
      }
    }
  }, [selectedLesson]);

  const toggleChapter = (chapter: string) => {
    setOpenChapters(prev => prev.includes(chapter) ? prev.filter(c => c !== chapter) : [...prev, chapter]);
  };

  const selectedQuiz = useMemo(() => {
    return quizzes.find((item: any) => item._id === selectedQuizId);
  }, [selectedQuizId, quizzes]);

  const markCompleteMutation = useMutation({
    mutationFn: ({ cId, lId }: { cId: string, lId: string }) => progressApi.markComplete(cId, lId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-progress', courseId] });
      queryClient.invalidateQueries({ queryKey: ['my-stats'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      
      refreshProfile(); // Đồng bộ với Account Overview (Redux auth user object)
      
      setShowAchievement(true);
      window.setTimeout(() => setShowAchievement(false), 2600);
      
      // Auto-advance to next lesson if available
      const currentIndex = lessons.findIndex((l: ApiLesson) => l._id === selectedLessonId);
      if (currentIndex !== -1 && currentIndex < lessons.length - 1) {
        setSelectedLessonId(lessons[currentIndex + 1]._id);
      }
    }
  });

  const completeLesson = () => {
    if (!courseId || !selectedLessonId) return;
    markCompleteMutation.mutate({ cId: courseId, lId: selectedLessonId });
  };

  const updateVideoProgressMutation = useMutation({
    mutationFn: ({ cId, lId, time }: { cId: string, lId: string, time: number }) => progressApi.updateVideoProgress(cId, lId, time)
  });

  const addBookmarkMutation = useMutation({
    mutationFn: ({ cId, lId, time, note }: { cId: string, lId: string, time: number, note: string }) => progressApi.addBookmark(cId, lId, time, note),
    onSuccess: () => {
      setShowBookmarkInput(false);
      setBookmarkNote('');
      queryClient.invalidateQueries({ queryKey: ['course-progress', courseId] });
    }
  });

  const handleVideoPause = () => {
    if (!courseId || !selectedLessonId || !videoRef.current) return;
    updateVideoProgressMutation.mutate({ cId: courseId, lId: selectedLessonId, time: videoRef.current.currentTime });
  };

  // Ref to hold the current state values for cleanup and unload handlers
  const saveProgressRef = React.useRef({ courseId, selectedLessonId, videoRef });
  
  useEffect(() => {
    saveProgressRef.current = { courseId, selectedLessonId, videoRef };
  }, [courseId, selectedLessonId]);

  useEffect(() => {
    // 1. Unmount handler: Save progress when navigating away from this page
    return () => {
      const { courseId: cId, selectedLessonId: lId, videoRef: vRef } = saveProgressRef.current;
      if (cId && lId && vRef.current) {
        const currentTime = vRef.current.currentTime;
        if (currentTime > 0) {
          progressApi.updateVideoProgress(cId, lId, currentTime).catch(err => {
            console.error('Failed to save video progress on unmount:', err);
          });
        }
      }
    };
  }, []);

  useEffect(() => {
    // 2. Tab close / Page refresh handler: Save progress using fetch keepalive
    const handleBeforeUnload = () => {
      const { courseId: cId, selectedLessonId: lId, videoRef: vRef } = saveProgressRef.current;
      if (cId && lId && vRef.current) {
        const currentTime = vRef.current.currentTime;
        if (currentTime > 0) {
          try {
            const apiBase = import.meta.env.VITE_API_URL || '/api';
            const state = store.getState();
            const token = state.auth.accessToken;
            
            const headers: Record<string, string> = {
              'Content-Type': 'application/json',
            };
            if (token) {
              headers['Authorization'] = `Bearer ${token}`;
            }

            fetch(`${apiBase}/progress/${cId}/lessons/${lId}/video-progress`, {
              method: 'POST',
              headers,
              body: JSON.stringify({ time: currentTime }),
              keepalive: true
            }).catch(err => {
              console.error('Failed to send beacon/fetch on page unload:', err);
            });
          } catch (err) {
            console.error('Error during unload progress save:', err);
          }
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);


  const handleVideoLoadedMetadata = () => {
    if (videoRef.current && progressInfo?.videoProgress && selectedLessonId) {
      const savedTime = progressInfo.videoProgress[selectedLessonId];
      if (savedTime) {
        videoRef.current.currentTime = savedTime;
      }
    }
  };

  const handleAddBookmark = () => {
    if (!courseId || !selectedLessonId || !videoRef.current || !bookmarkNote.trim()) return;
    addBookmarkMutation.mutate({ cId: courseId, lId: selectedLessonId, time: videoRef.current.currentTime, note: bookmarkNote });
  };

  const getYoutubeVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const createDiscussionMutation = useMutation({
    mutationFn: (content: string) => discussionApi.createDiscussion(courseId!, selectedLessonId!, content),
    onSuccess: () => {
      setDiscussionText('');
      queryClient.invalidateQueries({ queryKey: ['discussions', courseId, selectedLessonId] });
    }
  });

  const addCommentMutation = useMutation({
    mutationFn: ({ dId, content }: { dId: string, content: string }) => discussionApi.addComment(courseId!, selectedLessonId!, dId, content),
    onSuccess: () => {
      setCommentText('');
      queryClient.invalidateQueries({ queryKey: ['comments', courseId, selectedLessonId, expandedDiscussionId] });
      queryClient.invalidateQueries({ queryKey: ['discussions', courseId, selectedLessonId] });
    }
  });

  const handlePostDiscussion = () => {
    if (!discussionText.trim()) return;
    createDiscussionMutation.mutate(discussionText);
  };

  const handlePostComment = (dId: string) => {
    if (!commentText.trim()) return;
    addCommentMutation.mutate({ dId, content: commentText });
  };

  if (isLoadingLessons || isLoadingProgress || isLoadingEnrollments) {
    return (
      <div className="bg-[#FBFBFA] dark:bg-[#111111] flex items-center justify-center py-32 min-h-screen">
        <LoadingScreen title="Loading workspace" message="Preparing video stream and curriculum..." />
      </div>
    );
  }

  const err: any = error;
  if ((err && err.response?.status === 403) || (!isEnrolled && user?.role === 'student')) {
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
            {selectedAssignmentId ? (
              <div className="bg-white dark:bg-[#1A1A1A] border border-slate-200 dark:border-white/10 rounded-2xl p-8 flex flex-col gap-6 shadow-sm">
                {(() => {
                  const assignment = assignments.find((a: any) => a._id === selectedAssignmentId);
                  if (!assignment) return <p className="text-slate-500">Loading assignment...</p>;
                  return (
                    <div className="space-y-8">
                      <div className="border-b border-[#EAEAEA] dark:border-white/10 pb-6 flex items-start justify-between">
                        <div>
                          <h1 className="text-3xl font-bold tracking-tight">{assignment.title}</h1>
                          <p className="text-sm text-slate-500 mt-2">
                            Due Date: {new Date(assignment.dueDate).toLocaleDateString()} | Max Score: {assignment.maxPoints} pts
                          </p>
                        </div>
                        <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full ${mySubmissionData ? (mySubmissionData.status === 'graded' ? 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-400' : 'bg-amber-100 dark:bg-amber-950/30 text-amber-800 dark:text-amber-400') : 'bg-slate-100 dark:bg-white/5 text-slate-500'}`}>
                          {mySubmissionData ? mySubmissionData.status.toUpperCase() : 'NOT SUBMITTED'}
                        </span>
                      </div>

                      <div className="space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">Assignment Description</h3>
                        <p className="text-slate-600 dark:text-slate-300 text-sm whitespace-pre-line leading-relaxed">{assignment.description}</p>
                      </div>

                      {assignment.attachmentUrl && (
                        <div className="space-y-3">
                          <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">Materials</h3>
                          <a href={assignment.attachmentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-indigo-500 hover:underline">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                            Download reference files
                          </a>
                        </div>
                      )}

                      <div className="border-t border-[#EAEAEA] dark:border-white/10 pt-8">
                        {mySubmissionData ? (
                          <div className="space-y-6">
                            <div className="space-y-2">
                              <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">Your Submission</h3>
                              <div className="bg-slate-50 dark:bg-white/5 p-5 rounded-2xl space-y-4">
                                {mySubmissionData.studentNotes && (
                                  <div>
                                    <span className="text-xs font-bold text-slate-400 block mb-1">Your notes:</span>
                                    <p className="text-sm text-slate-700 dark:text-slate-300">{mySubmissionData.studentNotes}</p>
                                  </div>
                                )}
                                <div>
                                  <span className="text-xs font-bold text-slate-400 block mb-1.5">Submitted files:</span>
                                  <div className="flex flex-col gap-2">
                                    {mySubmissionData.submittedFiles?.map((file: any, index: number) => (
                                      <a key={index} href={file.url} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-500 hover:underline flex items-center gap-2">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
                                        {file.name}
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {mySubmissionData.status === 'graded' && (
                              <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/20 p-5 rounded-2xl space-y-4">
                                <div className="flex items-center justify-between border-b border-emerald-200/20 pb-3">
                                  <span className="font-bold text-sm text-emerald-800 dark:text-emerald-400">Score Awarded:</span>
                                  <span className="font-mono font-bold text-xl text-emerald-600 dark:text-emerald-400">{mySubmissionData.grade} / {assignment.maxPoints} pts</span>
                                </div>
                                {mySubmissionData.feedback && (
                                  <div>
                                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400 block mb-1">Teacher Feedback:</span>
                                    <p className="text-sm text-slate-700 dark:text-slate-300 italic">"{mySubmissionData.feedback}"</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-6">
                            <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">Submit Your Work</h3>
                            <div className="flex flex-col gap-6">
                              <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Submission Notes</label>
                                <textarea 
                                  value={submitNotesText}
                                  onChange={(e) => setSubmitNotesText(e.target.value)}
                                  placeholder="Write notes for your instructor about your submission..."
                                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all min-h-[100px]"
                                />
                              </div>

                              <div className="border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center bg-slate-50/50 dark:bg-white/5">
                                <svg className="w-8 h-8 text-indigo-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                {uploadingFile ? (
                                  <div className="space-y-2">
                                    <div className="animate-spin w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto" />
                                    <span className="text-sm text-slate-400">Uploading file to Cloudinary...</span>
                                  </div>
                                ) : (
                                  <div className="space-y-1">
                                    <label className="cursor-pointer text-indigo-400 hover:text-indigo-300 font-bold text-sm block">
                                      <span>Click to upload your assignment file</span>
                                      <input 
                                        type="file" 
                                        className="hidden" 
                                        onChange={handleFileUpload} 
                                        accept=".pdf,.zip,.rar,.doc,.docx,.png,.jpg,.jpeg"
                                      />
                                    </label>
                                    <span className="text-xs text-slate-400 block">Supports PDF, ZIP, RAR, Word documents, or images up to 20MB</span>
                                  </div>
                                )}
                              </div>

                              <div className="grid md:grid-cols-2 gap-6">
                                <div className="flex flex-col gap-2">
                                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Attachment File Name</label>
                                  <input 
                                    type="text"
                                    value={submitFileName}
                                    onChange={(e) => setSubmitFileName(e.target.value)}
                                    placeholder="e.g. project_submission.zip"
                                    className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                  />
                                </div>
                                <div className="flex flex-col gap-2">
                                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Attachment File Link</label>
                                  <input 
                                    type="text"
                                    value={submitFileUrl}
                                    onChange={(e) => setSubmitFileUrl(e.target.value)}
                                    placeholder="e.g. https://cloudinary.com/..."
                                    className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                  />
                                </div>
                              </div>


                              <div className="flex justify-end">
                                <Button 
                                  onClick={() => {
                                    submitAssignmentMutation.mutate({
                                      aId: assignment._id,
                                      files: [{ name: submitFileName || 'submission.zip', url: submitFileUrl }],
                                      notes: submitNotesText
                                    });
                                  }}
                                  disabled={submitAssignmentMutation.isPending || !submitFileName.trim() || !submitFileUrl.trim()}
                                >
                                  {submitAssignmentMutation.isPending ? 'Submitting...' : 'Submit Assignment'}
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <>
                {/* Cinematic Video Player */}
                <div className="flex flex-col gap-5">
                  <div className="relative aspect-video w-full bg-black rounded-xl overflow-hidden group shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                    {selectedQuiz ? (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 border border-slate-800 text-center p-8">
                         <h3 className="text-2xl font-bold text-white mb-2">{selectedQuiz.title}</h3>
                         <p className="text-slate-400 mb-6">Test your knowledge to ensure you're ready to proceed. Time limit: {selectedQuiz.timeLimit || 'No limit'} minutes. Passing score: {selectedQuiz.passingScore}%.</p>
                         <Button variant="pill" onClick={() => navigate(`/courses/${courseId}/quizzes/${selectedQuiz._id}/take`)}>
                            Take Quiz Now
                         </Button>
                      </div>
                    ) : selectedLesson ? (
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
                        <video 
                          ref={videoRef}
                          controls 
                          autoPlay
                          className="w-full h-full object-contain" 
                          src={selectedLesson.videoUrl}
                          onPause={handleVideoPause}
                          onLoadedMetadata={handleVideoLoadedMetadata}
                          onEnded={completeLesson}
                        >
                          Your browser does not support the video tag.
                        </video>
                      )
                    ) : (
                      <div className="w-full h-full flex items-center justify-center opacity-60">
                         <p className="text-white">No content selected</p>
                      </div>
                    )}
                  </div>

                  {/* Bookmark Feature */}
                  {selectedLesson && !selectedQuiz && !getYoutubeVideoId(selectedLesson.videoUrl) && (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => setShowBookmarkInput(!showBookmarkInput)}
                          className="flex items-center gap-2 text-sm font-medium text-indigo-500 hover:text-indigo-400"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                          Add Bookmark at Current Time
                        </button>
                      </div>
                      {showBookmarkInput && (
                        <div className="flex items-center gap-3">
                          <input 
                            type="text" 
                            value={bookmarkNote}
                            onChange={(e) => setBookmarkNote(e.target.value)}
                            placeholder="Note for this bookmark..."
                            className="flex-1 bg-white dark:bg-[#1A1A1A] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <Button onClick={handleAddBookmark} disabled={!bookmarkNote.trim() || addBookmarkMutation.isPending}>Save</Button>
                        </div>
                      )}
                      {/* List Bookmarks */}
                      {(progressInfo?.bookmarks?.filter((b: any) => b.lesson === selectedLessonId)?.length || 0) > 0 && (
                        <div className="mt-2 space-y-2">
                          <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">Bookmarks</h4>
                          <div className="space-y-2">
                            {progressInfo?.bookmarks?.filter((b: any) => b.lesson === selectedLessonId).map((bookmark: any, idx: number) => (
                              <div key={idx} className="flex items-center gap-3 text-sm bg-slate-100 dark:bg-white/5 px-3 py-2 rounded-lg">
                                <button 
                                  onClick={() => { if(videoRef.current) videoRef.current.currentTime = bookmark.time; }}
                                  className="text-indigo-500 hover:text-indigo-400 font-mono text-xs font-bold"
                                >
                                  {Math.floor(bookmark.time / 60)}:{(Math.floor(bookmark.time % 60)).toString().padStart(2, '0')}
                                </button>
                                <span className="text-slate-700 dark:text-slate-300">{bookmark.note}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Lesson Metadata */}
                  <div className="flex items-start justify-between gap-6 pb-8 border-b border-[#EAEAEA] dark:border-white/10">
                    <div>
                      <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">{selectedQuiz ? selectedQuiz.title : (selectedLesson?.title || 'No content selected')}</h1>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{selectedQuiz ? 'Quiz' : 'Lesson'}</p>
                    </div>
                    {!selectedQuiz && (
                      <button 
                        onClick={completeLesson}
                        disabled={markCompleteMutation.isPending || (selectedLessonId ? completedLessons.includes(selectedLessonId) : false)}
                        className="shrink-0 rounded-md bg-[#111111] dark:bg-white px-5 py-2.5 text-sm font-medium text-white dark:text-[#111111] transition-transform active:scale-95 hover:bg-slate-800 dark:hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {selectedLessonId && completedLessons.includes(selectedLessonId) ? 'Completed' : 'Mark Complete'}
                      </button>
                    )}
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
              </>
            )}
          </div>

          {/* Right Column (Curriculum) */}
          <div className="lg:col-span-4 flex flex-col gap-10 lg:sticky lg:top-24">
            
            {/* Ultra-minimal Progress */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold tracking-widest uppercase mb-3 text-slate-500">
                <span>Progress</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="h-[2px] w-full bg-[#EAEAEA] dark:bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-[#111111] dark:bg-white"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            </div>

            {/* Typography-driven Curriculum */}
            <div className="flex flex-col bg-white dark:bg-[#1A1A1A] border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm sticky top-24">
              <div className="pt-6 pb-6 border-b border-[#EAEAEA] dark:border-white/10">
                <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400 mb-4">
                  Curriculum
                </h3>
                {lessons.length === 0 ? (
                  <p className="text-sm text-slate-500">No lessons available.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {groupedLessons.map((group, gIdx) => {
                      const isOpen = openChapters.includes(group.chapter);
                      return (
                        <div key={gIdx} className="border border-slate-200 dark:border-white/10 rounded-lg overflow-hidden">
                          <button
                            onClick={() => toggleChapter(group.chapter)}
                            className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-left"
                          >
                            <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">{group.chapter}</span>
                            <motion.svg animate={{ rotate: isOpen ? 180 : 0 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></motion.svg>
                          </button>
                          {isOpen && (
                            <div className="flex flex-col gap-1 p-2 bg-white dark:bg-[#1A1A1A]">
                              {group.items.map((lesson: ApiLesson, index: number) => {
                                const isActive = lesson._id === selectedLessonId && !selectedQuizId;
                                const isCompleted = completedLessons.includes(lesson._id);
                                return (
                                  <button
                                    key={lesson._id}
                                    onClick={() => { setSelectedLessonId(lesson._id); setSelectedQuizId(null); setSelectedAssignmentId(null); }}
                                    className={`group flex items-center justify-between py-2 px-2 rounded-md text-left w-full transition-colors ${isActive ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-medium' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'}`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="w-4 h-4 shrink-0 flex items-center justify-center">
                                        {isCompleted ? (
                                          <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>
                                        ) : isActive ? (
                                          <div className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400" />
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
                      )
                    })}
                  </div>
                )}
              </div>

              {quizzes.length > 0 && (
                <div className="pt-6 pb-6 border-b border-[#EAEAEA] dark:border-white/10">
                  <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400 mb-4">
                    Assessments
                  </h3>
                  <div className="flex flex-col gap-1">
                    {quizzes.map((quiz: any) => {
                      const isActive = quiz._id === selectedQuizId;
                      return (
                        <button
                          key={quiz._id}
                          onClick={() => { setSelectedQuizId(quiz._id); setSelectedLessonId(null); setSelectedAssignmentId(null); }}
                          className={`group flex items-center justify-between py-2 text-left w-full transition-colors ${isActive ? 'text-[#111111] dark:text-white font-medium' : 'text-slate-600 dark:text-slate-400 hover:text-[#111111] dark:hover:text-white'}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-4 h-4 shrink-0 flex items-center justify-center text-slate-400">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                            </div>
                            <span className="text-sm line-clamp-1">{quiz.title}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {assignments.length > 0 && (
                <div className="pt-6 pb-6 border-b border-[#EAEAEA] dark:border-white/10">
                  <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400 mb-4">
                    Assignments
                  </h3>
                  <div className="flex flex-col gap-1">
                    {assignments.map((assignment: any) => {
                      const isActive = assignment._id === selectedAssignmentId;
                      return (
                        <button
                          key={assignment._id}
                          onClick={() => { setSelectedAssignmentId(assignment._id); setSelectedLessonId(null); setSelectedQuizId(null); }}
                          className={`group flex items-center justify-between py-2 text-left w-full transition-colors ${isActive ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-medium' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-[#111111] dark:hover:text-white'}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-4 h-4 shrink-0 flex items-center justify-center text-slate-400">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                            </div>
                            <span className="text-sm line-clamp-1">{assignment.title}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="pt-6 pb-6 border-b border-[#EAEAEA] dark:border-white/10">
                <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400 mb-4">
                  Random Practice
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Number of Questions</label>
                    <select
                      value={practiceLimit}
                      onChange={(e) => setPracticeLimit(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-xs focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                    >
                      <option value={5}>5 Questions</option>
                      <option value={10}>10 Questions</option>
                      <option value={15}>15 Questions</option>
                      <option value={20}>20 Questions</option>
                    </select>
                  </div>
                  <button
                    onClick={() => navigate(`/courses/${courseId}/quizzes/smart/take?limit=${practiceLimit}`)}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl font-semibold text-sm hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                    Start Practice Quiz
                  </button>
                </div>
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
        {!selectedQuiz && (
          <div className="flex flex-col gap-8 pt-8 border-t border-[#EAEAEA] dark:border-white/10 w-full mt-12">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Discussion</h2>
              <span className="text-sm font-medium text-slate-500">{discussions.length} Discussions</span>
            </div>
            
            {/* Input */}
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center font-bold shrink-0 uppercase overflow-hidden">
                {user?.avatar ? <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" /> : user?.name?.charAt(0)}
              </div>
              <div className="flex-1 flex flex-col gap-3">
                <textarea 
                  value={discussionText}
                  onChange={(e) => setDiscussionText(e.target.value)}
                  placeholder="Ask a question or share an insight..." 
                  className="w-full min-h-[100px] resize-none bg-white dark:bg-[#1A1A1A] border border-slate-200 dark:border-white/10 rounded-xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                />
                <div className="flex justify-end">
                  <button 
                    onClick={handlePostDiscussion}
                    disabled={createDiscussionMutation.isPending || !discussionText.trim()}
                    className="px-5 py-2 bg-[#111111] dark:bg-white text-white dark:text-[#111111] text-sm font-medium rounded-lg hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors disabled:opacity-50"
                  >
                    Post Discussion
                  </button>
                </div>
              </div>
            </div>

            {/* Comments List */}
            <div className="flex flex-col gap-8 mt-4">
              {discussions.map((discussion) => (
                <div key={discussion._id} className="flex flex-col gap-4">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-slate-200">
                      {discussion.author?.avatar ? (
                        <img src={discussion.author.avatar} alt="User" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-slate-500 bg-slate-300">
                          {discussion.author?.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5 w-full">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-900 dark:text-white">{discussion.author?.name}</span>
                        <span className="text-xs text-slate-500">{new Date(discussion.createdAt).toLocaleDateString()}</span>
                        {discussion.author?.role === 'teacher' && <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">Instructor</span>}
                      </div>
                      <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                        {discussion.content}
                      </p>
                      <div className="flex items-center gap-4 mt-1 text-xs font-medium text-slate-500">
                        <button 
                          onClick={() => setExpandedDiscussionId(expandedDiscussionId === discussion._id ? null : discussion._id)}
                          className="hover:text-indigo-500 transition-colors"
                        >
                          {expandedDiscussionId === discussion._id ? 'Hide Replies' : 'Reply'}
                        </button>
                        <span className="flex items-center gap-1 text-slate-400">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
                          {discussion.commentsCount}
                        </span>
                      </div>
                    </div>
                  </div>

                  {expandedDiscussionId === discussion._id && (
                    <div className="ml-14 pl-4 border-l-2 border-slate-100 dark:border-slate-800 flex flex-col gap-6">
                      {comments.map((comment) => (
                        <div key={comment._id} className="flex gap-3">
                          <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-slate-200">
                            {comment.author?.avatar ? (
                              <img src={comment.author.avatar} alt="User" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center font-bold text-slate-500 bg-slate-300 text-xs">
                                {comment.author?.name?.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col gap-1 w-full">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-slate-900 dark:text-white">{comment.author?.name}</span>
                              <span className="text-xs text-slate-500">{new Date(comment.createdAt).toLocaleDateString()}</span>
                              {comment.author?.role === 'teacher' && <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">Instructor</span>}
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-300">{comment.content}</p>
                          </div>
                        </div>
                      ))}
                      
                      <div className="flex gap-3 mt-2">
                        <input 
                          type="text" 
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          placeholder="Write a reply..."
                          className="flex-1 bg-slate-50 dark:bg-[#1A1A1A] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button 
                          onClick={() => handlePostComment(discussion._id)}
                          disabled={!commentText.trim() || addCommentMutation.isPending}
                          className="px-4 py-2 bg-indigo-500 text-white text-sm font-medium rounded-lg hover:bg-indigo-600 transition-colors disabled:opacity-50"
                        >
                          Reply
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
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
