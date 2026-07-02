import React, { useState, useMemo } from 'react';
import { AnimatePresence, motion, MotionProps } from 'framer-motion';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { courseApi } from '../services/course.api';
import { enrollmentApi } from '../services/enrollment.api';
import { progressApi } from '../services/progress.api';
import { lessonApi } from '../services/lesson.api';
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
import { CourseCurriculum } from '../components/course/CourseCurriculum';
import { CourseReviews } from '../components/course/CourseReviews';
import { useAuth } from '../contexts/AuthContext';

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
  const { courseId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [openFaq, setOpenFaq] = useState<number>(0);
  const [isEnrolling, setIsEnrolling] = useState(false);

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
    if (!enrollmentsData?.enrollments || !courseId) return false;
    return enrollmentsData.enrollments.some(e => 
      (typeof e.course === 'object' ? e.course._id : e.course) === courseId
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

  const toggleWishlistMutation = useMutation({
    mutationFn: () => userApi.toggleWishlist(courseId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
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

  const isInstructor = user?.role === 'admin' || (user && course?.instructor && (course.instructor._id === user.id || course.instructor === user.id));

  const progressPercent = progressData?.data?.progress?.progressPercentage || 0;
  const completedLessons = progressData?.data?.progress?.completedLessons || [];
  const lessons = lessonsData?.data?.lessons || [];

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
        <LoadingScreen title="Loading course" message="Fetching curriculum, instructor details, and enrollment options..." />
      </PageShell>
    );
  }

  if (hasError) {
    return (
      <PageShell wide>
        <EmptyState
          title="Course not found"
          message="The course you are looking for does not exist or may have been removed."
          action={
            <Link to="/courses">
              <Button variant="pill">Browse courses</Button>
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

      <PageShell wide className="relative z-10 pt-12 lg:pt-20">
        <div className="max-w-[1300px] mx-auto">
          
          {/* 70/30 Split Layout */}
          <div className="grid gap-12 lg:grid-cols-[1fr_340px] items-start pb-8">
            
            {/* Left Column */}
            <div className="flex flex-col max-w-[900px] w-full">
              
              {/* Hero Content */}
              <div className="relative px-4 lg:px-0 mb-14">
            {/* Breadcrumbs */}
            <div className="inline-flex items-center gap-2 mb-6 text-sm font-semibold text-slate-400 dark:text-slate-500">
              <Link to="/courses" className="hover:text-primary-500 transition-colors">Design Hub</Link>
              <span>/</span>
              <span className="text-slate-800 dark:text-slate-300">{course?.category?.name || 'General'}</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-[4rem] font-bold tracking-tight text-slate-900 dark:text-white leading-[1.1]">
              {course?.title}
            </h1>
            
            <p className="mt-5 text-lg sm:text-xl text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
              {course?.description || 'A premium learning experience inspired by the best platforms. Master the required skills here.'}
            </p>
            
            {/* Metadata Row */}
            <div className="mt-8 flex flex-wrap items-center gap-4 text-sm font-medium text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-500">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
                <span className="font-bold">{reviewsData?.data?.averageRating?.toFixed(1) || course?.averageRating?.toFixed(1) || '0.0'}</span>
                <span className="text-slate-500 dark:text-slate-500 ml-1">({reviewsData?.data?.numReviews || 0} ratings)</span>
              </div>
              <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
              <div className="flex items-center gap-1.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100-8 4 4 0 000 8z" />
                  <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                </svg>
                18,200 learners
              </div>
              <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
              <div>Beginner to Intermediate</div>
              <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
              <div>12h 40m</div>
              <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
              <div className="flex items-center gap-1.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="8" r="7" />
                  <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
                </svg>
                Certificate
              </div>
              <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
              <div>Updated Aug 2026</div>
            </div>
          </div>

          {/* Main Content */}
          <main className="space-y-16 px-4 lg:px-0">
              
              {/* Highlights & Video Preview Split */}
              <section className="grid gap-10 md:grid-cols-2 items-start">
                {/* Video Preview */}
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-slate-500 mb-4">Course Preview</h3>
                  <MotionDiv
                    className="group relative overflow-hidden rounded-2xl bg-slate-950 shadow-elev-2 cursor-pointer aspect-video"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="absolute inset-0 bg-slate-900" />
                    <video
                      className="h-full w-full object-cover opacity-80 transition duration-500 group-hover:opacity-100"
                      poster="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80"
                    >
                    </video>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white transition-transform duration-300 group-hover:scale-110">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                      </div>
                    </div>
                  </MotionDiv>
                </div>

                {/* Highlights */}
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-slate-500 mb-4">What you'll learn</h3>
                  <ul className="space-y-3">
                    {highlights.map((item, i) => (
                      <motion.li 
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-start gap-3"
                      >
                        <svg className="shrink-0 mt-0.5 h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{item}</span>
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
                    <div className="mt-1 text-xs uppercase tracking-[0.1em] text-slate-500">Learners</div>
                  </div>
                  <div>
                    <div className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">92%</div>
                    <div className="mt-1 text-xs uppercase tracking-[0.1em] text-slate-500">Completion</div>
                  </div>
                  <div>
                    <div className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">{reviewsData?.data?.averageRating?.toFixed(1) || course?.averageRating?.toFixed(1) || '0.0'}</div>
                    <div className="mt-1 text-xs uppercase tracking-[0.1em] text-slate-500">Avg Rating</div>
                  </div>
                  <div>
                    <div className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">850+</div>
                    <div className="mt-1 text-xs uppercase tracking-[0.1em] text-slate-500">Certificates</div>
                  </div>
                </div>
              </section>

              {/* Interactive Curriculum */}
              <CourseCurriculum lessons={lessons} />

              {/* Instructor Profile */}
              <section>
                <SectionLead label="Instructor" title="Learn from an industry expert" />
                <div className="mt-6 rounded-3xl border border-slate-200/60 dark:border-white/5 bg-white dark:bg-slate-900/40 p-6 sm:p-8">
                  <div className="flex flex-col sm:flex-row gap-6 items-start">
                    <img 
                      src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80" 
                      alt={instructor.name}
                      className="w-24 h-24 rounded-full object-cover shadow-lg"
                    />
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{course?.instructor?.name || instructor.name}</h3>
                      <p className="text-primary-600 dark:text-primary-400 font-medium mt-1">{course?.instructor?.role || instructor.title}</p>
                      
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4 text-sm text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                          <span className="font-semibold">{instructor.rating}</span> Instructor Rating
                        </div>
                        <div className="flex items-center gap-1.5">
                          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100-8 4 4 0 000 8z" /></svg>
                          <span className="font-semibold">{instructor.reviews}</span> Reviews
                        </div>
                        <div className="flex items-center gap-1.5">
                          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 14l9-5-9-5-9 5 9 5z" /><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /><path d="M12 14l9-5-9-5-9 5 9 5zm0 0v6" /></svg>
                          <span className="font-semibold">{instructor.learners}</span> Students
                        </div>
                        <div className="flex items-center gap-1.5">
                          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>
                          <span className="font-semibold">{instructor.courses}</span> Courses
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
                <SectionLead label="FAQ" title="Common questions" />
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
          <aside className="hidden lg:block sticky top-24">
              <div className="relative rounded-3xl p-[1px] bg-gradient-to-b from-primary-500/30 to-transparent shadow-[0_32px_64px_rgba(15,23,42,0.08)] dark:shadow-[0_32px_64px_rgba(0,0,0,0.5)]">
                <GlassPanel
                  variant="dark"
                  padding="none"
                  className="relative overflow-hidden !border-none !bg-white/95 dark:!bg-slate-900/95"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-fuchsia-500/5 pointer-events-none" />
                {/* Thumbnail */}
                <div className="aspect-video relative overflow-hidden bg-slate-900">
                  <img src="https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=800&q=80" alt="Course thumbnail" className="w-full h-full object-cover opacity-80" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {isEnrolled && (
                    <>
                      <div className="mb-6">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="font-medium text-slate-700 dark:text-slate-300">Course Progress</span>
                          <span className="font-bold text-primary-600 dark:text-primary-400">{progressPercent}%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full transition-all duration-500" 
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>

                      {upNextLesson && (
                        <div className="mb-6 p-4 rounded-xl border border-slate-200/60 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
                          <div className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500 mb-2">Up Next</div>
                          <div className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-2">{upNextLesson.title}</div>
                          <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                            <svg className="w-4 h-4 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            {upNextLesson.duration || 'Video lesson'}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  <div className="flex items-end gap-3 mb-1">
                    <div className="text-4xl font-bold text-slate-900 dark:text-white">{Number(course?.price || 0).toLocaleString('vi-VN')}đ</div>
                    {course?.discountPercentage && course.discountPercentage > 0 ? (
                      <>
                        <div className="text-xl font-medium text-slate-400 line-through mb-1">
                          {Number(course?.estimatedPrice || 0).toLocaleString('vi-VN')}đ
                        </div>
                        <div className="px-2.5 py-1 text-xs font-bold text-rose-700 bg-rose-100 dark:text-rose-300 dark:bg-rose-500/20 rounded-full mb-1.5 ml-auto">
                          -{course.discountPercentage}%
                        </div>
                      </>
                    ) : null}
                  </div>
                  <div className="text-sm text-red-500 dark:text-red-400 font-medium mb-6 flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Offer ends in 2 days
                  </div>
                  
                  <button 
                    onClick={handleEnrollClick}
                    disabled={isEnrolling}
                    className="group w-full relative overflow-hidden bg-gradient-to-r from-primary-600 via-indigo-500 to-primary-600 bg-[length:200%_auto] animate-gradient text-white font-bold text-lg py-4 px-6 rounded-2xl shadow-[0_8px_24px_rgba(99,102,241,0.4),inset_0_1px_2px_rgba(255,255,255,0.4)] hover:-translate-y-1 transition-all duration-300 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {isEnrolling ? 'Processing...' : isEnrolled ? 'Go to Course' : 'Enroll Now'}
                  </button>
                  <p className="text-center text-xs text-slate-500 mt-3 font-medium">30-Day Money-Back Guarantee</p>

                  <div className="flex gap-3 mt-3">
                    <Button 
                      variant="outline" 
                      onClick={() => toggleWishlistMutation.mutate()}
                      disabled={toggleWishlistMutation.isPending}
                      className={`flex-1 py-3 border-slate-200 dark:border-white/10 dark:bg-white/5 transition-colors ${
                        isInWishlist 
                          ? 'text-rose-500 border-rose-500/50 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20' 
                          : 'dark:text-white dark:hover:bg-white/10'
                      }`}
                    >
                      {toggleWishlistMutation.isPending ? 'Updating...' : isInWishlist ? '♥ Wishlisted' : '♡ Wishlist'}
                    </Button>
                    <Button variant="outline" className="flex-1 py-3 border-slate-200 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10">
                      Share
                    </Button>
                  </div>

                  <div className="mt-6 pt-6 border-t border-slate-100 dark:border-white/10 text-sm text-slate-600 dark:text-slate-400 space-y-3">
                    <div className="flex items-center gap-3">
                      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      12h 40m on-demand video
                    </div>
                    <div className="flex items-center gap-3">
                      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Certificate of completion
                    </div>
                    <div className="flex items-center gap-3">
                      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                      100% online & self-paced
                    </div>
                  </div>
                </div>
              </GlassPanel>
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
            <div className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Ends in 2 days</div>
          </div>
          <button 
            onClick={handleEnrollClick}
            disabled={isEnrolling}
            className="flex-1 bg-gradient-to-r from-primary-600 via-indigo-500 to-primary-600 bg-[length:200%_auto] animate-gradient text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-primary-500/25 active:scale-95 transition-transform disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isEnrolling ? 'Processing...' : isEnrolled ? 'Go to Course' : 'Enroll Now'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;
