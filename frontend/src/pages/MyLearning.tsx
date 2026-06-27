import React, { useMemo } from 'react';
import { motion, MotionProps } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  CanvasHero,
  EmptyState,
  MetricsSurface,
  PageShell,
  SectionLead,
  SkeletonGrid
} from '../components/ui';
import { progressApi } from '../services/progress.api';

const MotionDiv = motion.div as unknown as React.FC<React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement> & MotionProps>>;

const MyLearning: React.FC = () => {
  const { data: statsData, isLoading } = useQuery({
    queryKey: ['learning-statistics'],
    queryFn: () => progressApi.getLearningStatistics()
  });

  const stats = statsData?.data?.statistics;
  const enrolledCourses = stats?.details || [];

  const catalogMetrics = [
    { label: 'Total Enrolled', value: stats?.totalEnrolled || 0 },
    { label: 'Ongoing', value: stats?.ongoingCourses || 0 },
    { label: 'Completed', value: stats?.completedCourses || 0 },
  ];

  const categoryAccent: Record<string, string> = {
    Design:      'from-violet-500 to-fuchsia-500',
    Frontend:    'from-sky-500 to-cyan-400',
    Development: 'from-sky-500 to-cyan-400',
    Data:        'from-emerald-500 to-teal-400',
    Business:    'from-amber-500 to-orange-400',
    Marketing:   'from-rose-500 to-pink-500',
  };
  const DEFAULT_ACCENT = 'from-indigo-500 to-violet-400';

  return (
    <PageShell wide>
      <CanvasHero
        badge={<div className="badge">My Learning</div>}
        eyebrow="Pick up where you left off"
        title="Your personal learning workspace"
        description="Track your progress, continue your courses, and take smart quizzes based on your recent activity."
        glow="cool"
      />

      <MetricsSurface metrics={catalogMetrics} />

      <section className="mt-16 space-y-6">
        <SectionLead label="Enrolled Courses" title="Continue Learning" size="md" />
        
        {isLoading ? (
          <SkeletonGrid count={3} />
        ) : enrolledCourses.length > 0 ? (
          <div className="grid gap-12 md:gap-x-10 md:gap-y-16 md:grid-cols-2 xl:grid-cols-3">
            {enrolledCourses.map((progress: any) => {
              const course = progress.course;
              if (!course) return null; // Safety check
              const accent = DEFAULT_ACCENT;

              return (
                <MotionDiv
                  key={progress._id}
                  className="group relative flex flex-col gap-5 transition duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                >
                  {/* Image Container */}
                  <div className="relative z-10 overflow-hidden rounded-[2rem] aspect-[4/3] bg-slate-100 dark:bg-slate-900 shadow-sm transition-transform duration-500 group-hover:-translate-y-2 group-hover:shadow-[0_24px_48px_rgba(15,23,42,0.12)]">
                    <Link to={`/courses/${course._id}/learn`} className="block h-full w-full">
                      <img
                        src={course.thumbnailUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(course.title)}&background=random`}
                        alt={course.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
                      />
                    </Link>
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/0 to-transparent opacity-80 pointer-events-none" />
                  </div>

                  {/* Text Content */}
                  <div className="relative z-10 flex flex-col gap-3 px-1">
                    <Link to={`/courses/${course._id}/learn`} className="group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                      <h3 className="line-clamp-2 text-xl font-bold tracking-tight text-slate-950 dark:text-white leading-[1.3]">{course.title}</h3>
                    </Link>
                    
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                        <span className="uppercase tracking-wider">Progress</span>
                        <span className="tabular-nums text-slate-900 dark:text-white">{progress.progressPercentage}%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <MotionDiv
                          className={`h-full bg-gradient-to-r ${accent}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${progress.progressPercentage}%` }}
                          transition={{ duration: 1.05, ease: [0.4, 0, 0.2, 1] }}
                        />
                      </div>
                    </div>
                  </div>
                </MotionDiv>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="No courses yet"
            message="You haven't enrolled in any courses yet. Explore our catalog to get started."
          />
        )}
      </section>
    </PageShell>
  );
};

export default MyLearning;
