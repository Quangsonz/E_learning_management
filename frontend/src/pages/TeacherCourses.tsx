import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { 
  PageShell, 
  Button, 
  MetricsSurface,
  GlassPanel,
  Modal
} from '../components/ui';
import CourseManagementTab from './CourseManagementTab';
import { courseApi } from '../services/course.api';
import { analyticsApi } from '../services/analytics.api';
import { Plus, BookOpen, Users, Star, FileEdit, Sparkles, CheckCircle2, Lightbulb } from 'lucide-react';

const TeacherCourses: React.FC = () => {
  const { t } = useTranslation();
  const [showTipsModal, setShowTipsModal] = useState(false);

  // Fetch teacher's courses to calculate quick stats
  const { data: teacherCoursesData } = useQuery({
    queryKey: ['teacher-courses-stats'],
    queryFn: () => courseApi.getMyCourses({ limit: 100 })
  });

  // Fetch teacher analytics summary
  const { data: analyticsData } = useQuery({
    queryKey: ['teacher-analytics-stats'],
    queryFn: () => analyticsApi.getTeacherDashboard()
  });

  const courses = teacherCoursesData?.data?.courses || [];
  const overview = analyticsData?.data?.overview;

  const totalCourses = teacherCoursesData?.data?.total ?? (courses.length > 0 ? courses.length : (overview?.totalCourses || 0));
  const publishedCourses = courses.length > 0 ? courses.filter((c: any) => c.status === 'published').length : (overview?.totalCourses || 0);
  const draftCourses = courses.filter((c: any) => c.status === 'draft').length;
  const totalStudents = overview?.totalStudents || courses.reduce((acc: number, c: any) => acc + (c.students || 0), 0);
  
  const avgRating = courses.length > 0 
    ? (courses.reduce((acc: number, c: any) => acc + (c.averageRating || 5.0), 0) / courses.length).toFixed(1)
    : '5.0';

  const stats = [
    { 
      label: t('teacher.courses.totalCourses'), 
      value: totalCourses.toString(),
      delta: t('teacher.courses.publishedDelta', { count: publishedCourses })
    },
    { 
      label: t('teacher.courses.totalEnrolled'), 
      value: totalStudents.toLocaleString('vi-VN'),
      delta: t('teacher.courses.thisMonthGrowth')
    },
    { 
      label: t('teacher.courses.draftCourses'), 
      value: draftCourses.toString(),
      delta: draftCourses > 0 ? t('teacher.courses.needFinishing') : t('teacher.courses.allPublished')
    },
    { 
      label: t('teacher.courses.avgRating'), 
      value: `${avgRating} ★`,
      delta: t('teacher.courses.basedOnReviews')
    }
  ];

  return (
    <PageShell wide>
      <div className="flex flex-col gap-10 pb-16">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t('teacher.courses.title')}
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {t('teacher.courses.subtitle')}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link 
              to="/teacher-dashboard" 
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors dark:text-white dark:bg-white/10 dark:hover:bg-white/20"
            >
              {t('teacher.courses.statsBtn')}
            </Link>
            <Link to="/teacher/courses/new">
              <Button className="flex items-center gap-2">
                <Plus size={16} /> {t('teacher.courses.createBtn')}
              </Button>
            </Link>
          </div>
        </div>

        {/* 1. Quick Stats Grid */}
        <MetricsSurface metrics={stats} />

        {/* 2. Teacher Hero Action Card */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 p-8 sm:p-10 text-white shadow-2xl border border-indigo-500/20">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-500/10 blur-[100px] rounded-full pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold uppercase tracking-wider">
                <Sparkles size={14} /> {t('teacher.courses.heroBadge')}
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
                {t('teacher.courses.heroTitle')}
              </h2>
              <p className="text-sm text-indigo-200/80 leading-relaxed">
                {t('teacher.courses.heroDesc')}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 shrink-0">
              <Link to="/teacher/courses/new">
                <button
                  type="button"
                  className="w-full sm:w-auto px-6 h-12 rounded-full bg-white text-indigo-950 hover:bg-slate-100 font-bold shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Plus size={18} />
                  <span>{t('teacher.courses.createBtn')}</span>
                </button>
              </Link>
              <button 
                type="button" 
                onClick={() => setShowTipsModal(true)}
                className="w-full sm:w-auto px-6 h-12 rounded-full border border-white/30 text-white hover:bg-white/10 font-bold transition-all flex items-center justify-center gap-2 cursor-pointer backdrop-blur-sm"
              >
                <Lightbulb size={18} className="text-amber-400" />
                <span>{t('teacher.courses.tipsBtn')}</span>
              </button>
            </div>
          </div>
        </section>

        {/* 3. Course Management Table */}
        <CourseManagementTab teacherMode={true} />
      </div>

      {/* Teaching Tips Modal */}
      {showTipsModal && (
        <Modal 
          isOpen={showTipsModal} 
          onClose={() => setShowTipsModal(false)}
          title={t('teacher.courses.tipsModalTitle')}
          size="md"
        >
          <div className="space-y-6">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {t('teacher.courses.tipsModalDesc')}
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-4 bg-indigo-50/50 dark:bg-indigo-500/10 rounded-2xl border border-indigo-100 dark:border-indigo-500/20 space-y-2">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                  <BookOpen size={18} /> {t('teacher.courses.tip1Title')}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {t('teacher.courses.tip1Desc')}
                </p>
              </div>

              <div className="p-4 bg-amber-50/50 dark:bg-amber-500/10 rounded-2xl border border-amber-100 dark:border-amber-500/20 space-y-2">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm">
                  <Sparkles size={18} /> {t('teacher.courses.tip2Title')}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {t('teacher.courses.tip2Desc')}
                </p>
              </div>

              <div className="p-4 bg-purple-50/50 dark:bg-purple-500/10 rounded-2xl border border-purple-100 dark:border-purple-500/20 space-y-2">
                <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold text-sm">
                  <FileEdit size={18} /> {t('teacher.courses.tip3Title')}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {t('teacher.courses.tip3Desc')}
                </p>
              </div>

              <div className="p-4 bg-emerald-50/50 dark:bg-emerald-500/10 rounded-2xl border border-emerald-100 dark:border-emerald-500/20 space-y-2">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                  <Users size={18} /> {t('teacher.courses.tip4Title')}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {t('teacher.courses.tip4Desc')}
                </p>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <Button onClick={() => setShowTipsModal(false)}>{t('teacher.courses.tipsGotIt')}</Button>
            </div>
          </div>
        </Modal>
      )}
    </PageShell>
  );
};

export default TeacherCourses;
