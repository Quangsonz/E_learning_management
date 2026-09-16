import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, MotionProps } from 'framer-motion';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { courseApi } from '../services/course.api';
import { enrollmentApi } from '../services/enrollment.api';
import { progressApi } from '../services/progress.api';
import { lessonApi } from '../services/lesson.api';
import { quizApi } from '../services/quiz.api';
import { reviewApi, Review } from '../services/review.api';
import { userApi } from '../services/user.api';
import {
  Button,
  EmptyState,
  GlassPanel,
  LoadingScreen,
  PageShell,
  SectionLead
} from '../components/ui';
import { floatY } from '../animations/motionVariants';
import useSimulatedLoading from '../hooks/useSimulatedLoading';
import { CourseCurriculum, CurriculumItem } from '../components/course/CourseCurriculum';
import { CourseReviews } from '../components/course/CourseReviews';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useLocalizedValue } from '../utils/localized';
import { 
  Play, Star, Users, Clock, Award, Calendar, Check, X, 
  ExternalLink, Share2, Heart, ShieldCheck, Sparkles 
} from 'lucide-react';

const getYouTubeEmbedUrl = (url?: string): string | null => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? `https://www.youtube-nocookie.com/embed/${match[2]}?autoplay=1` : null;
};

type FAQItem = {
  question: string;
  answer: string;
};

type MotionDivProps = React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement> & MotionProps>;
const MotionDiv = motion.div as unknown as React.FC<MotionDivProps>;

const highlights = [
  'Build complete UI systems from scratch',
  'Master design hierarchy and spatial composition',
  'Learn subtle, premium motion design',
  'Create production-ready interactive products',
  'Understand fluid typography and dynamic spacing',
  'Design for dark mode and dynamic themes'
];

const curriculum: CurriculumItem[] = [
  { 
    title: 'Course overview and success roadmap', 
    duration: '22 min', 
    lectures: 3,
    lessons: [
      { title: 'Welcome to the Masterclass', duration: '5 min', status: 'completed' },
      { title: 'Setting up your workspace', duration: '12 min', status: 'completed' },
      { title: 'How to get feedback and support', duration: '5 min', status: 'current' }
    ]
  },
  { 
    title: 'Core concepts and practical setup', 
    duration: '1h 15m', 
    lectures: 4,
    lessons: [
      { title: 'The philosophy of borderless design', duration: '18 min', status: 'locked' },
      { title: 'Typography as structure', duration: '25 min', status: 'locked' },
      { title: 'Color theory for modern SaaS', duration: '20 min', status: 'locked' },
      { title: 'Grid systems vs Canvas layouts', duration: '12 min', status: 'locked' }
    ]
  },
  { 
    title: 'Building high-converting learning experiences', 
    duration: '1h 40m', 
    lectures: 4,
    lessons: [
      { title: 'Designing the Hero section', duration: '30 min', status: 'locked' },
      { title: 'Creating immersive metadata', duration: '20 min', status: 'locked' },
      { title: 'Interactive components', duration: '25 min', status: 'locked' },
      { title: 'Progress and motivation indicators', duration: '25 min', status: 'locked' }
    ]
  },
  { 
    title: 'Design systems, motion, and polish', 
    duration: '1h 05m', 
    lectures: 3,
    lessons: [
      { title: 'Micro-interactions', duration: '20 min', status: 'locked' },
      { title: 'Framer Motion fundamentals', duration: '25 min', status: 'locked' },
      { title: 'Performance and perceived speed', duration: '20 min', status: 'locked' }
    ]
  }
];

const faqs: FAQItem[] = [
  {
    question: 'What level is this course designed for?',
    answer: 'This course is designed for beginners to intermediate learners who want a premium, structured path through practical product learning.'
  },
  {
    question: 'Do I get lifetime access?',
    answer: 'Yes, once enrolled you can revisit the curriculum, preview lessons, and continue learning at your own pace whenever you need.'
  },
  {
    question: 'Is there a certificate after completion?',
    answer: 'A completion certificate can be issued after finishing all core modules and the final project review. It can be added directly to your LinkedIn profile.'
  },
  {
    question: 'What software do I need?',
    answer: 'We primarily use Figma for design exercises, and VS Code for any frontend implementation details. A modern browser is all you need to consume the content.'
  }
];

const instructor = {
  name: 'Dr. Evelyn Hart',
  title: 'Lead Learning Experience Designer',
  bio: 'Evelyn has designed learning products for top-tier SaaS teams, enterprise academies, and modern creator platforms. Her focus is on engagement, cognitive load reduction, and absolute visual clarity.',
  learners: '42k',
  courses: '16',
  rating: '4.9',
  reviews: '12k'
};

const CourseDetail: React.FC = () => {
  const { t } = useTranslation();
  const lv = useLocalizedValue();
  const { courseId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [openFaq, setOpenFaq] = useState<number>(0);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Lấy dữ liệu khóa học
  const { data: courseData, isLoading, isError } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => courseApi.getCourseById(courseId!),
    enabled: !!courseId
  });

  const hasError = !courseId || isError;
  const course = courseData?.data?.course;

  // Lấy danh sách đăng ký để kiểm tra
  const { data: enrollmentsData } = useQuery({
    queryKey: ['my-enrollments'],
    queryFn: () => enrollmentApi.getMyEnrollments()
  });

  const isEnrolled = useMemo(() => {
    const list = (enrollmentsData as any)?.data?.enrollments || (enrollmentsData as any)?.enrollments;
    if (!list || !courseId) return false;
    return list.some((e: any) => 
      (typeof e.course === 'object' ? e.course?._id : e.course) === courseId
    );
  }, [enrollmentsData, courseId]);

  const enrollMutation = useMutation({
    mutationFn: (id: string) => enrollmentApi.enrollCourse(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-enrollments'] });
      navigate(`/courses/${courseId}/learn`);
    },
    onSettled: () => setIsEnrolling(false)
  });

  const { data: wishlistData } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => userApi.getWishlist()
  });

  const isInWishlist = useMemo(() => {
    if (!wishlistData?.data?.wishlist || !courseId) return false;
    return wishlistData.data.wishlist.some((c: any) => c._id === courseId);
  }, [wishlistData, courseId]);

  const { success: successToast } = useToast();

  const toggleWishlistMutation = useMutation({
    mutationFn: () => userApi.toggleWishlist(courseId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      successToast(
        isInWishlist ? t('course.toast.wishlistRemoved') : t('course.toast.wishlistAdded'),
        isInWishlist ? t('course.toast.wishlistTitle') : t('course.toast.wishlistSavedTitle')
      );
    }
  });

  const { data: progressData } = useQuery({
    queryKey: ['course-progress', courseId],
    queryFn: () => progressApi.getCourseProgress(courseId!),
    enabled: isEnrolled
  });

  const { data: lessonsData } = useQuery({
    queryKey: ['lessons', courseId],
    queryFn: () => lessonApi.getLessons(courseId!),
    enabled: !!courseId
  });

  const { data: reviewsData } = useQuery({
    queryKey: ['reviews', courseId],
    queryFn: () => reviewApi.getCourseReviews(courseId!),
    enabled: !!courseId
  });

  const { data: quizzesData } = useQuery({
    queryKey: ['quizzes', courseId],
    queryFn: () => quizApi.getQuizzesByCourse(courseId!),
    enabled: !!courseId
  });

  const isInstructor = user?.role === 'admin' || (user && course?.instructor && (course.instructor._id === user.id));

  const progressPercent = progressData?.data?.progress?.progressPercentage || 0;
  const completedLessons = progressData?.data?.progress?.completedLessons || [];
  const lessons = lessonsData?.data?.lessons || [];
  const quizzes = quizzesData?.data?.quizzes || quizzesData?.data?.data?.quizzes || [];

  const upNextLesson = useMemo(() => {
    if (!lessons.length) return null;
    const lastAccessed = progressData?.data?.progress?.lastAccessedLesson;
    if (lastAccessed) {
      const idx = lessons.findIndex((l: any) => l._id === lastAccessed);
      if (idx !== -1 && idx < lessons.length - 1 && completedLessons.includes(lastAccessed)) {
        return lessons[idx + 1];
      }
      if (idx !== -1) return lessons[idx];
    }
    return lessons.find((l: any) => !completedLessons.includes(l._id)) || lessons[0];
  }, [lessons, completedLessons, progressData]);

  const previewVideoUrl = useMemo(() => {
    const lessonWithVid = lessons.find((l: any) => !!l.videoUrl && typeof l.videoUrl === 'string' && l.videoUrl.trim() !== '');
    return lessonWithVid?.videoUrl || (course as any)?.previewVideoUrl || (course as any)?.trailerUrl || '';
  }, [lessons, course]);

  const courseThumbnail = course?.thumbnailUrl || "https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=800&q=80";

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      successToast(t('course.toast.linkCopied', 'Đã sao chép liên kết khóa học!'));
    }
  };

  const handleEnrollClick = () => {
    if (isEnrolled) {
      navigate(`/courses/${courseId}/learn`);
    } else {
      // For MVP, assume all courses need checkout unless explicitly price === 0
      if (course?.price !== 0) {
        navigate(`/checkout/${courseId}`);
      } else {
        setIsEnrolling(true);
        enrollMutation.mutate(courseId!);
      }
    }
  };

  if (isLoading) {
    return (
      <PageShell wide>
        <LoadingScreen title={t('common.loading')} message={t('learning.loading')} />
      </PageShell>
    );
  }

  if (hasError) {
    return (
      <PageShell wide>
        <EmptyState
          title={t('course.notFoundTitle')}
          message={t('course.notFoundMessage')}
          action={
            <Link to="/courses">
              <Button variant="pill">{t('course.browseCourses')}</Button>
            </Link>
          }
        />
      </PageShell>
    );
  }

  return (
    <div className="relative w-full">
      {/* Hero Background - Reduced Height */}
      <div className="absolute top-0 left-0 right-0 h-[45vh] z-0 pointer-events-none overflow-hidden [mask-image:linear-gradient(to_bottom,black_40%,transparent_100%)]">
        <div className="absolute inset-0 bg-slate-50/90 dark:bg-slate-900/95" />
        <div 
          className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')] bg-cover bg-center opacity-[0.05] dark:opacity-20 mix-blend-luminosity" 
        />
        {/* Glows */}
        <div className="absolute -top-[30%] left-[10%] w-[50%] h-[50%] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.1),transparent_60%)] dark:bg-[radial-gradient(circle,rgba(99,102,241,0.2),transparent_60%)] blur-[100px]" />
      </div>

      <PageShell wide className="relative z-10 pt-20 lg:pt-28">
        <div className="max-w-[1300px] mx-auto">
          
          {/* 70/30 Split Layout */}
          <div className="grid gap-12 lg:grid-cols-[1fr_340px] items-start pb-8">
            
            {/* Left Column */}
            <div className="flex flex-col max-w-[900px] w-full">
              
              {/* Hero Content */}
              <div className="relative px-4 lg:px-0 mb-12">
                {/* Breadcrumbs */}
                <nav className="inline-flex items-center gap-2 mb-4 text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">
                  <Link to="/courses" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                    {t('courses.title', 'Courses')}
                  </Link>
                  <span className="text-slate-300 dark:text-slate-600">/</span>
                  <span className="text-slate-800 dark:text-slate-200 font-medium">
                    {lv(course?.category?.name) || t('common.all', 'General')}
                  </span>
                </nav>
                
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.18]">
                  {lv(course?.title)}
                </h1>
                
                <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl font-normal">
                  {lv(course?.description) || 'Khóa học toàn diện hướng dẫn kiến thức và thực hành chuyên sâu theo chuẩn doanh nghiệp.'}
                </p>
                
                {/* Modern Metadata Micro-Badges */}
                <div className="mt-6 flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs">
                  {/* Rating Badge */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/25 font-bold">
                    <Star size={14} className="fill-amber-500 text-amber-500" />
                    <span>{reviewsData?.data?.averageRating?.toFixed(1) || course?.averageRating?.toFixed(1) || '0.0'}</span>
                    <span className="font-normal text-amber-600/80 dark:text-amber-300/70">
                      ({reviewsData?.data?.numReviews || 0} {t('course.ratings', 'đánh giá')})
                    </span>
                  </div>

                  {/* Learners */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-white/10 font-medium">
                    <Users size={14} className="text-slate-500" />
                    <span>18,200 {t('course.learners', 'học viên')}</span>
                  </div>

                  {/* Level */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-500/20 font-medium">
                    <Sparkles size={14} className="text-indigo-500" />
                    <span>{t('course.level', 'Cơ bản đến Nâng cao')}</span>
                  </div>

                  {/* Duration */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-white/10 font-medium">
                    <Clock size={14} className="text-slate-500" />
                    <span>12h 40m</span>
                  </div>

                  {/* Certificate */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-500/20 font-medium">
                    <Award size={14} className="text-emerald-600" />
                    <span>{t('course.certificate', 'Chứng chỉ')}</span>
                  </div>

                  {/* Updated date */}
                  <div className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400 ml-1">
                    <Calendar size={13} />
                    <span>{t('course.updated', 'Cập nhật')} 08/2026</span>
                  </div>
                </div>
              </div>

              {/* Main Content */}
              <main className="space-y-16 px-4 lg:px-0">
                  
                {/* Highlights & Video Preview Split */}
                <section className="grid gap-8 md:grid-cols-2 items-start">
                  {/* Video Preview */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
                      <Play size={14} className="text-indigo-500" />
                      <span>{t('course.preview', 'Xem trước khóa học')}</span>
                    </h3>
                    <div
                      onClick={() => setIsPreviewOpen(true)}
                      className="group relative overflow-hidden rounded-2xl bg-slate-950 shadow-lg cursor-pointer aspect-video border border-slate-200/60 dark:border-white/10"
                      title="Bấm để phát video xem thử"
                    >
                      <img 
                        src={courseThumbnail} 
                        alt="Course preview thumbnail"
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover opacity-80 transition duration-500 group-hover:scale-105 group-hover:opacity-90"
                      />
                      <div className="absolute inset-0 bg-black/35 group-hover:bg-black/15 transition-colors flex items-center justify-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/25 backdrop-blur-md text-white border border-white/40 shadow-2xl transition-transform duration-300 group-hover:scale-110">
                          <Play size={24} className="fill-white translate-x-0.5" />
                        </div>
                      </div>
                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                        <span className="px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-white text-[11px] font-semibold flex items-center gap-1.5">
                          <Play size={10} className="fill-white" />
                          <span>Phát video xem thử</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Highlights */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
                      <Check size={14} className="text-emerald-500" />
                      <span>{t('course.whatYouLearn', 'Nội dung bạn sẽ học')}</span>
                    </h3>
                    <ul className="space-y-2.5">
                      {highlights.map((item, i) => (
                        <motion.li 
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-start gap-2.5"
                        >
                          <div className="w-5 h-5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                            <Check size={12} strokeWidth={3} />
                          </div>
                          <span className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm leading-relaxed font-medium">
                            {item}
                          </span>
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                </section>

              {/* Learning Impact (Social Proof) */}
              <section className="rounded-3xl border border-slate-200/60 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] p-8 sm:p-10">
                <div className="grid grid-cols-2 gap-8 md:grid-cols-4 text-center">
                  <div>
                    <div className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">18k+</div>
                    <div className="mt-1 text-xs uppercase tracking-[0.1em] text-slate-500">{t('course.learners', 'Learners')}</div>
                  </div>
                  <div>
                    <div className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">92%</div>
                    <div className="mt-1 text-xs uppercase tracking-[0.1em] text-slate-500">{t('course.completion', 'Completion')}</div>
                  </div>
                  <div>
                    <div className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">{reviewsData?.data?.averageRating?.toFixed(1) || course?.averageRating?.toFixed(1) || '0.0'}</div>
                    <div className="mt-1 text-xs uppercase tracking-[0.1em] text-slate-500">{t('course.avgRating', 'Avg Rating')}</div>
                  </div>
                  <div>
                    <div className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">850+</div>
                    <div className="mt-1 text-xs uppercase tracking-[0.1em] text-slate-500">{t('course.certificates', 'Certificates')}</div>
                  </div>
                </div>
              </section>

              {/* Interactive Curriculum */}
              <div id="curriculum">
                <CourseCurriculum lessons={lessons} quizzes={quizzes} />
              </div>

              {/* Instructor Profile */}
              <section>
                <SectionLead label={t('course.instructor', 'Instructor')} title={t('course.instructorLead', 'Learn from an industry expert')} />
                <div className="mt-6 rounded-3xl border border-slate-200/60 dark:border-white/5 bg-white dark:bg-slate-900/40 p-6 sm:p-8">
                  <div className="flex flex-col sm:flex-row gap-6 items-start">
                    <img 
                      src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80" 
                      alt={instructor.name}
                      loading="lazy"
                      decoding="async"
                      className="w-24 h-24 rounded-full object-cover shadow-lg"
                    />
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{course?.instructor?.name || instructor.name}</h3>
                      <p className="text-primary-600 dark:text-primary-400 font-medium mt-1">{course?.instructor?.role || instructor.title}</p>
                      
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4 text-sm text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                          <span className="font-semibold">{instructor.rating}</span> {t('course.instructorRating', 'Instructor Rating')}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100-8 4 4 0 000 8z" /></svg>
                          <span className="font-semibold">{instructor.reviews}</span> {t('course.reviews', 'Reviews')}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 14l9-5-9-5-9 5 9 5z" /><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /><path d="M12 14l9-5-9-5-9 5 9 5zm0 0v6" /></svg>
                          <span className="font-semibold">{instructor.learners}</span> {t('course.students', 'Students')}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>
                          <span className="font-semibold">{instructor.courses}</span> {t('course.courses', 'Courses')}
                        </div>
                      </div>

                      <p className="mt-5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                        {instructor.bio}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Reviews - Testimonial Stream */}
              <CourseReviews courseId={courseId!} isEnrolled={isEnrolled} isInstructor={Boolean(isInstructor)} reviewsData={reviewsData} />

              {/* FAQ Accordion */}
              <section>
                <SectionLead label={t('course.faqs', 'FAQ')} title={t('course.faqTitle', 'Common questions')} />
                <div className="mt-6 space-y-2">
                  {faqs.map((item, index) => {
                    const isOpen = openFaq === index;
                    return (
                      <div key={index} className="border-b border-slate-200 dark:border-slate-800/80">
                        <button
                          type="button"
                          onClick={() => setOpenFaq(isOpen ? -1 : index)}
                          className="w-full flex items-center justify-between py-5 text-left focus:outline-none"
                        >
                          <span className="text-base font-medium text-slate-900 dark:text-white pr-4">{item.question}</span>
                          <motion.span animate={{ rotate: isOpen ? 45 : 0 }} className="text-2xl font-light text-slate-400">+</motion.span>
                        </button>
                        <AnimatePresence>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className="overflow-hidden"
                            >
                              <p className="pb-6 pr-8 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                                {item.answer}
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </section>
            </main>
          </div>

          {/* Right Column: Sticky CTA Panel */}
          <aside className="hidden lg:block sticky top-28 z-20">
            <div className="relative rounded-3xl p-[1px] bg-gradient-to-b from-indigo-500/30 via-slate-200/30 dark:via-white/10 to-transparent shadow-[0_20px_50px_rgba(15,23,42,0.08)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
              <div className="relative overflow-hidden rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-white/10">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-fuchsia-500/5 pointer-events-none" />

                {/* Thumbnail with Play trigger */}
                <div 
                  onClick={() => setIsPreviewOpen(true)}
                  className="aspect-video relative overflow-hidden bg-slate-900 cursor-pointer group"
                  title="Bấm để phát video xem thử"
                >
                  <img 
                    src={courseThumbnail} 
                    alt={lv(course?.title) || "Course thumbnail"} 
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover opacity-85 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" 
                  />
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/15 transition-colors flex items-center justify-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/30 backdrop-blur-md text-white border border-white/40 shadow-xl group-hover:scale-110 group-hover:bg-white/40 transition-all duration-300">
                      <Play size={22} className="fill-white translate-x-0.5" />
                    </div>
                  </div>
                  <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold flex items-center gap-1.5">
                    <Play size={10} className="fill-white" />
                    <span>Xem giới thiệu</span>
                  </div>
                </div>

                <div className="p-6">
                  {isEnrolled && (
                    <>
                      <div className="mb-6">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{t('course.progress', 'Tiến độ khóa học')}</span>
                          <span className="font-bold text-indigo-600 dark:text-indigo-400">{progressPercent}%</span>
                        </div>
                        <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full transition-all duration-500" 
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>

                      {upNextLesson && (
                        <div className="mb-6 p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03]">
                          <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-indigo-600 dark:text-indigo-400 mb-1">{t('course.upNext', 'Bài học tiếp theo')}</div>
                          <div className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-2">{upNextLesson.title}</div>
                          <div className="flex items-center gap-2 mt-2 text-xs text-slate-500 dark:text-slate-400">
                            <Play size={12} className="text-indigo-500" />
                            <span>{upNextLesson.duration || t('course.videoLesson', 'Video bài học')}</span>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Pricing Section with 100% Contrast */}
                  <div className="flex items-baseline gap-3 mb-1">
                    <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                      {Number(course?.price || 0).toLocaleString('vi-VN')}đ
                    </div>
                    {course?.discountPercentage && course.discountPercentage > 0 ? (
                      <>
                        <div className="text-lg font-medium text-slate-400 dark:text-slate-500 line-through">
                          {Number(course?.estimatedPrice || 0).toLocaleString('vi-VN')}đ
                        </div>
                        <div className="px-2.5 py-0.5 text-xs font-bold text-rose-700 bg-rose-100 dark:text-rose-300 dark:bg-rose-500/20 rounded-full ml-auto">
                          -{course.discountPercentage}%
                        </div>
                      </>
                    ) : null}
                  </div>

                  <div className="text-xs text-rose-600 dark:text-rose-400 font-semibold mb-6 flex items-center gap-1.5">
                    <Clock size={13} />
                    <span>{t('course.offerEnds', 'Ưu đãi kết thúc sau 2 ngày')}</span>
                  </div>
                  
                  <button 
                    onClick={handleEnrollClick}
                    disabled={isEnrolling}
                    className="group w-full relative overflow-hidden bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 bg-[length:200%_auto] hover:bg-right text-white font-bold text-base py-3.5 px-6 rounded-2xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isEnrolling ? t('course.processing', 'Đang xử lý...') : isEnrolled ? t('course.goToCourse', 'Vào học ngay') : t('course.enrollNow', 'Đăng ký học ngay')}
                  </button>
                  <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-3 font-medium flex items-center justify-center gap-1">
                    <ShieldCheck size={14} className="text-emerald-500" />
                    <span>{t('course.guarantee', 'Cam kết hoàn tiền trong 30 ngày')}</span>
                  </p>

                  <div className="flex gap-2.5 mt-4">
                    <button 
                      type="button"
                      onClick={() => toggleWishlistMutation.mutate()}
                      disabled={toggleWishlistMutation.isPending}
                      className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                        isInWishlist 
                          ? 'text-rose-600 border-rose-500/40 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-400 hover:bg-rose-100' 
                          : 'text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10'
                      }`}
                    >
                      <Heart size={14} className={isInWishlist ? "fill-rose-500 text-rose-500" : ""} />
                      <span>{toggleWishlistMutation.isPending ? '...' : isInWishlist ? t('course.wishlisted', 'Đã lưu') : t('course.wishlist', 'Yêu thích')}</span>
                    </button>
                    <button 
                      type="button"
                      onClick={handleShare}
                      className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Share2 size={14} />
                      <span>{t('course.share', 'Chia sẻ')}</span>
                    </button>
                  </div>

                  <div className="mt-6 pt-5 border-t border-slate-200/80 dark:border-white/10 text-xs text-slate-600 dark:text-slate-300 space-y-3 font-medium">
                    <div className="flex items-center gap-2.5">
                      <Clock size={15} className="text-indigo-500 shrink-0" />
                      <span>{t('course.onDemandVideo', '12h 40m video bài giảng theo yêu cầu')}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Award size={15} className="text-emerald-500 shrink-0" />
                      <span>{t('course.certOfCompletion', 'Chứng chỉ hoàn thành được công nhận')}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Check size={15} className="text-cyan-500 shrink-0" />
                      <span>{t('course.onlinePaced', '100% học trực tuyến & chủ động lộ trình')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>
          </div>
        </div>
      </PageShell>

      {/* Mobile Sticky CTA */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200 dark:border-white/10 z-50 shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between gap-4 max-w-lg mx-auto">
          <div className="flex flex-col">
            <div className="flex items-end gap-2">
              <div className="text-xl font-bold text-slate-900 dark:text-white">{Number(course?.price || 0).toLocaleString('vi-VN')}đ</div>
              {course?.discountPercentage && course.discountPercentage > 0 ? (
                <div className="text-sm font-medium text-slate-400 line-through mb-0.5">
                  {Number(course?.estimatedPrice || 0).toLocaleString('vi-VN')}đ
                </div>
              ) : null}
            </div>
            <div className="text-[10px] font-bold text-red-500 uppercase tracking-wider">{t('course.offerEnds', 'Ends in 2 days')}</div>
          </div>
          <button 
            onClick={handleEnrollClick}
            disabled={isEnrolling}
            className="flex-1 bg-gradient-to-r from-primary-600 via-indigo-500 to-primary-600 bg-[length:200%_auto] animate-gradient text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-primary-500/25 active:scale-95 transition-transform disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isEnrolling ? t('course.processing', 'Processing...') : isEnrolled ? t('course.goToCourse', 'Go to Course') : t('course.enrollNow', 'Enroll Now')}
          </button>
        </div>
      </div>

      {/* Video Preview Modal */}
      {createPortal(
        <AnimatePresence>
          {isPreviewOpen && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="relative my-auto bg-white dark:bg-slate-900 rounded-2xl overflow-hidden max-w-3xl w-full border border-slate-200 dark:border-white/10 shadow-2xl flex flex-col max-h-[90vh]"
              >
                <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                      <Play size={18} className="fill-indigo-600 dark:fill-indigo-400" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                        {lv(course?.title) || 'Xem trước khóa học'}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {previewVideoUrl ? 'Video bài giảng mẫu / Giới thiệu khóa học' : 'Chưa cập nhật video'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsPreviewOpen(false)}
                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                    title="Đóng"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="p-4 bg-black/95 flex items-center justify-center aspect-video w-full overflow-hidden">
                  {previewVideoUrl ? (
                    getYouTubeEmbedUrl(previewVideoUrl) ? (
                      <iframe
                        src={getYouTubeEmbedUrl(previewVideoUrl)!}
                        title="Course preview"
                        className="w-full h-full rounded-xl border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <video
                        src={previewVideoUrl}
                        controls
                        autoPlay
                        className="w-full h-full rounded-xl object-contain"
                      />
                    )
                  ) : (
                    <div className="text-center p-8 space-y-3">
                      <p className="text-slate-400 text-sm">Khóa học này hiện chưa có video xem thử trực tiếp.</p>
                      <button
                        onClick={() => {
                          setIsPreviewOpen(false);
                          const el = document.getElementById('curriculum');
                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="inline-block text-xs text-indigo-400 hover:underline font-semibold cursor-pointer"
                      >
                        Xem danh sách bài học chi tiết bên dưới ↓
                      </button>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-slate-50 dark:bg-white/5 flex items-center justify-between gap-3 border-t border-slate-200 dark:border-white/10">
                  {previewVideoUrl ? (
                    <a
                      href={previewVideoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                    >
                      <ExternalLink size={14} /> Mở nguồn video gốc
                    </a>
                  ) : <span />}
                  <Button variant="outline" size="sm" onClick={() => setIsPreviewOpen(false)}>
                    {t('common.close', 'Đóng')}
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

export default CourseDetail;
