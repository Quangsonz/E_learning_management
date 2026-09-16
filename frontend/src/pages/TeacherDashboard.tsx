import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, MotionProps } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@tanstack/react-query';
import { analyticsApi } from '../services/analytics.api';
import { adminApi } from '../services/admin.api';
import { assignmentApi } from '../services/assignment.api';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import {
  Button,
  CanvasHero,
  ChartBlock,
  GlassPanel,
  InsightCallout,
  MetricsSurface,
  PageShell,
  SectionLead,
  SkeletonStats
} from '../components/ui';
import useSimulatedLoading from '../hooks/useSimulatedLoading';
import { CountUpValue } from '../hooks/useCountUp';
import { floatY } from '../animations/motionVariants';
import { useLocalizedValue } from '../utils/localized';
import { useTheme } from '../contexts/ThemeContext';
import { 
  Users, BookOpen, DollarSign, Award, TrendingUp, AlertCircle, 
  CheckCircle2, ChevronRight, FileText, ArrowUpRight, HelpCircle, 
  Sparkles, Plus, Wallet, Search, ExternalLink, Lightbulb, X
} from 'lucide-react';

type SeriesPoint = { label: string; value: number };

const MotionDiv = motion.div as unknown as React.FC<
  React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement> & MotionProps>
>;

const TeacherDashboard: React.FC = () => {
  const { t } = useTranslation();
  const lv = useLocalizedValue();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Payout states
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [payoutSuccessMessage, setPayoutSuccessMessage] = useState('');

  // Assignment states
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
  const [activeAssignmentId, setActiveAssignmentId] = useState<string | null>(null);
  const [activeSubmissionId, setActiveSubmissionId] = useState<string | null>(null);
  const [gradeInput, setGradeInput] = useState('');
  const [feedbackInput, setFeedbackInput] = useState('');

  const { mutate: requestPayout, isPending: isPayoutPending } = useMutation({
    mutationFn: (data: { amount: number, bankInfo: any }) => adminApi.requestPayout({ amount: data.amount, bankInfo: data.bankInfo }),
    onSuccess: () => {
      setPayoutSuccessMessage(t('teacher.dashboard.payoutSuccess'));
      setTimeout(() => {
        setShowPayoutModal(false);
        setPayoutSuccessMessage('');
        setPayoutAmount('');
        setBankName('');
        setAccountNumber('');
        setAccountName('');
      }, 2000);
    }
  });

  const { data: teacherAssignments } = useQuery({
    queryKey: ['teacher-assignments', activeCourseId],
    queryFn: () => assignmentApi.getAssignments(activeCourseId!),
    enabled: !!activeCourseId
  });

  const { data: teacherSubmissions, refetch: refetchTeacherSubmissions } = useQuery({
    queryKey: ['teacher-submissions', activeAssignmentId],
    queryFn: () => assignmentApi.getSubmissions(activeAssignmentId!),
    enabled: !!activeAssignmentId
  });

  const gradeSubmissionMutation = useMutation({
    mutationFn: ({ subId, grade, feedback }: { subId: string, grade: number, feedback: string }) => 
      assignmentApi.gradeSubmission(subId, { grade, feedback }),
    onSuccess: () => {
      refetchTeacherSubmissions();
      setActiveSubmissionId(null);
      setGradeInput('');
      setFeedbackInput('');
    }
  });

  const { data: analyticsResponse, isLoading } = useQuery({
    queryKey: ['teacher-analytics'],
    queryFn: () => analyticsApi.getTeacherDashboard()
  });

  const dashboardData = analyticsResponse?.data;
  const overview = dashboardData?.overview;
  const monthlyEnrollments = dashboardData?.monthlyEnrollments || [];
  const courseStats = dashboardData?.courseStats || [];
  const quizResults = dashboardData?.quizResults || [];
  const dropOffAnalysis = dashboardData?.dropOffAnalysis || [];

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const enrollmentChartData = monthlyEnrollments.map((item: any) => ({
    label: monthNames[item.month - 1] || `Month ${item.month}`,
    value: item.enrollments
  }));

  const metrics = [
    { label: t('teacher.dashboard.revenue'), value: <CountUpValue target={overview?.totalRevenue || 0} suffix="đ" />, delta: t('teacher.dashboard.revenueGrowth') },
    { label: t('teacher.dashboard.activeStudents'), value: <CountUpValue target={overview?.totalStudents || 0} />, delta: t('teacher.dashboard.studentsGrowth') },
    { label: t('teacher.dashboard.coursesPublished'), value: <CountUpValue target={overview?.totalCourses || 0} formatNumber={false} />, delta: t('teacher.dashboard.newCoursesDelta') },
    { label: t('teacher.dashboard.quizPassRate'), value: <CountUpValue target={quizResults.length > 0 ? (quizResults[0]?.passRate || 0) : 0} suffix="%" />, delta: t('teacher.dashboard.improvedDelta') }
  ];

  return (
    <PageShell wide>
      <CanvasHero
        badge={
          <div className="badge !border-indigo-200 !bg-indigo-50 !text-indigo-700 dark:!bg-indigo-950/40 dark:!border-indigo-800 dark:!text-indigo-300 flex items-center gap-1.5 font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            {t('teacher.dashboard.badge')}
          </div>
        }
        eyebrow={t('teacher.dashboard.eyebrow')}
        title={t('teacher.dashboard.heroTitle')}
        description={t('teacher.dashboard.heroDesc')}
        glow="cool"
        actions={
          <>
            <Link to="/teacher/courses/new">
              <Button variant="pill" className="gap-2 bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20">
                <Plus className="w-4 h-4" />
                {t('teacher.courses.createBtn', 'Tạo khóa học mới')}
              </Button>
            </Link>
            <Link to="/teacher-courses">
              <Button variant="outline" className="gap-2">
                <BookOpen className="w-4 h-4" />
                {t('teacher.dashboard.manageCourses')}
              </Button>
            </Link>
          </>
        }
        aside={
          <MotionDiv className="mx-auto max-w-[280px] lg:-ml-12" animate={floatY(6, 5.5)}>
            <div className="rounded-[var(--radius-section)] bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-5 text-white shadow-[0_24px_64px_rgba(15,23,42,0.25)] border border-white/10 relative overflow-hidden backdrop-blur-md">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                    {t('teacher.dashboard.teachingHub', 'Teaching Hub')}
                  </span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/70 font-mono">
                  {t('teacher.dashboard.coursesCount', { count: courseStats.length, defaultValue: `${courseStats.length} Courses` })}
                </span>
              </div>
              
              <h4 className="text-base font-semibold text-white tracking-tight">{t('teacher.dashboard.performingWell')}</h4>
              <p className="text-xs text-white/60 mt-0.5">
                {t('teacher.dashboard.syncRealtime', 'Real-time pedagogical analytics synchronized.')}
              </p>
              
              <div className="mt-4 pt-3 border-t border-white/10 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-white/60">{t('teacher.dashboard.completions')}:</span>
                  <span className="font-semibold text-emerald-300 font-mono">
                    {t('teacher.dashboard.completionsUnit', { count: overview?.completionCount || 0, defaultValue: `${overview?.completionCount || 0} completions` })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/60">{t('teacher.dashboard.engagementRate', 'Engagement Rate')}:</span>
                  <span className="font-semibold text-amber-300 flex items-center gap-1 font-mono">
                    94.8% <span className="text-white/40 text-[10px]">{t('teacher.dashboard.optimal', 'Optimal')}</span>
                  </span>
                </div>
              </div>

              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setShowPayoutModal(true)}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all border border-white/10 hover:border-white/20 cursor-pointer"
                >
                  <Wallet className="w-3.5 h-3.5 text-indigo-300" />
                  <span>{t('teacher.dashboard.withdrawFunds')}</span>
                </button>
              </div>
            </div>
          </MotionDiv>
        }
      />

      {isLoading ? (
        <div className="mt-5">
          <SkeletonStats count={4} />
        </div>
      ) : (
        <MetricsSurface metrics={metrics} />
      )}

      <section className="mt-10 grid gap-10 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,0.72fr)] xl:gap-12">
        <div className="space-y-10">
          <ChartBlock 
            label={t('teacher.dashboard.dropOff')} 
            title={t('teacher.dashboard.retention')} 
            badge={
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40">
                <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                {t('teacher.dashboard.liveBadge')}
              </span>
            }
          >
            {dropOffAnalysis && dropOffAnalysis.length > 0 ? (
              <div className="mt-4 space-y-3">
                {dropOffAnalysis.slice(0, 5).map((item: any, idx: number) => {
                  const maxDrop = Math.max(...dropOffAnalysis.map((d: any) => d.dropOffCount || 1), 1);
                  const percent = Math.min(100, Math.round(((item.dropOffCount || 0) / maxDrop) * 100));
                  const lessonTitle = lv(item.lessonTitle) || t('common.lessons', 'Bài học');

                  return (
                    <div 
                      key={item.lessonId || idx}
                      className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 transition-all group"
                    >
                      <div className="flex items-center justify-between gap-3 text-sm mb-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="flex items-center justify-center w-6 h-6 rounded-md bg-slate-200/70 dark:bg-white/10 text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0 font-mono">
                            #{String(idx + 1).padStart(2, '0')}
                          </span>
                          <span className="font-semibold text-slate-900 dark:text-white truncate" title={lessonTitle}>
                            {lessonTitle}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/40 font-mono">
                            {t('teacher.dashboard.studentsDroppedHere', { count: item.dropOffCount, defaultValue: `${item.dropOffCount} học viên dừng tại đây` })}
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-white/10 h-2 rounded-full overflow-hidden">
                        <MotionDiv 
                          className="bg-gradient-to-r from-amber-500 via-rose-500 to-rose-600 h-full rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${percent}%` }}
                          transition={{ duration: 0.6, delay: idx * 0.08 }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-40 flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 dark:bg-white/[0.02] rounded-2xl border border-dashed border-slate-200 dark:border-white/10 text-slate-400">
                <CheckCircle2 className="w-9 h-9 text-emerald-500 mb-2" />
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  {t('teacher.dashboard.highRetention', 'Tỷ lệ giữ chân học viên rất tốt!')}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {t('teacher.dashboard.noDropOffDesc', 'Chưa ghi nhận điểm dừng gián đoạn đáng kể trong các bài giảng.')}
                </p>
              </div>
            )}
          </ChartBlock>

          <div className="grid gap-8 lg:grid-cols-2">
            <ChartBlock label={t('teacher.dashboard.growthSubtitle')} title={t('teacher.dashboard.monthlyGrowth')}>
              <div className="canvas-chart-area h-56 mt-4">
                {enrollmentChartData && enrollmentChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={enrollmentChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} opacity={0.3} vertical={false} />
                      <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 12 }} dy={10} />
                      <RechartsTooltip 
                        cursor={{ stroke: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }} 
                        contentStyle={{ 
                          borderRadius: '12px', 
                          border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0', 
                          background: isDark ? '#0f172a' : '#ffffff', 
                          color: isDark ? '#fff' : '#0f172a',
                          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
                        }} 
                      />
                      <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-sm text-slate-400">
                    {t('teacher.dashboard.noMonthlyData', 'Chưa có dữ liệu ghi danh theo tháng.')}
                  </div>
                )}
              </div>
            </ChartBlock>

            <ChartBlock label={t('teacher.dashboard.quizSubtitle')} title={t('teacher.dashboard.quizAnalytics')}>
              <div className="canvas-chart-area space-y-4 max-h-56 overflow-y-auto pr-1">
                {quizResults.map((item: any, index: number) => (
                  <div key={item.quizTitle || index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700 dark:text-slate-300 line-clamp-1 mr-4" title={lv(item.quizTitle)}>
                        {lv(item.quizTitle)}
                      </span>
                      <span className="font-semibold tabular-nums text-slate-950 dark:text-white shrink-0 font-mono">{item.passRate}%</span>
                    </div>
                    <div className="progress-track bg-slate-100 dark:bg-white/10 h-2 rounded-full overflow-hidden">
                      <MotionDiv
                        className="bg-indigo-600 h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${item.passRate}%` }}
                        transition={{ duration: 0.8, delay: index * 0.08 }}
                      />
                    </div>
                  </div>
                ))}
                {quizResults.length === 0 && (
                  <div className="h-full flex items-center justify-center text-sm text-slate-400">
                    {t('teacher.dashboard.noQuizData')}
                  </div>
                )}
              </div>
            </ChartBlock>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <SectionLead label={t('teacher.dashboard.courseSubtitle')} title={t('teacher.dashboard.courseAnalytics')} size="md" />
              <Link to="/teacher-courses" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                {t('teacher.dashboard.viewAll', { count: courseStats.length, defaultValue: `Xem tất cả (${courseStats.length})` })} <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="mt-5 space-y-3">
              {courseStats.map((course: any, index: number) => {
                const title = lv(course.title);
                const thumb = course.thumbnailUrl || course.thumbnail?.url || course.thumbnail;
                const isPublished = course.status === 'published' || course.isPublished;

                return (
                  <MotionDiv
                    key={course._id}
                    className="p-4 rounded-2xl bg-white dark:bg-[#1A1A1A] border border-slate-200/80 dark:border-white/10 hover:border-indigo-500/40 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: index * 0.05 }}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {thumb ? (
                        <img 
                          src={thumb} 
                          alt={title} 
                          className="w-14 h-14 rounded-xl object-cover border border-slate-200 dark:border-white/10 shrink-0" 
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/40 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                          <BookOpen className="w-6 h-6" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-slate-950 dark:text-white truncate" title={title}>
                            {title}
                          </h4>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 ${
                            isPublished 
                              ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40' 
                              : 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40'
                          }`}>
                            {isPublished ? t('teacher.dashboard.published', 'Đã xuất bản') : t('teacher.dashboard.draft', 'Bản nháp')}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1 font-medium">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            {t('teacher.dashboard.enrolledCount', { count: course.enrollmentCount || 0 })}
                          </span>
                          <span>•</span>
                          <span className="font-medium">
                            {t('teacher.dashboard.completedLabel', 'Hoàn thành')}: {course.avgProgress ? course.avgProgress.toFixed(1) : 0}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100 dark:border-white/5">
                      <div className="text-right">
                        <span className="text-base font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                          {Number(course.price || 0).toLocaleString('vi-VN')}đ
                        </span>
                        {course.discountPercentage && course.discountPercentage > 0 ? (
                          <div className="text-[10px] text-slate-400 line-through">
                            {Number(course.estimatedPrice || course.price).toLocaleString('vi-VN')}đ
                          </div>
                        ) : null}
                      </div>

                      <Link to={`/teacher/courses/${course._id}/curriculum`}>
                        <Button size="sm" variant="outline" className="gap-1.5 hover:border-indigo-500 text-xs">
                          <FileText className="w-3.5 h-3.5 text-indigo-500" />
                          {t('teacher.dashboard.curriculumBtn', 'Giáo trình')}
                        </Button>
                      </Link>
                    </div>
                  </MotionDiv>
                );
              })}

              {courseStats.length === 0 && (
                <div className="p-8 text-center bg-slate-50/50 dark:bg-white/[0.02] rounded-2xl border border-dashed border-slate-200 dark:border-white/10">
                  <BookOpen className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{t('teacher.dashboard.noCourses')}</p>
                  <Link to="/teacher/courses/new" className="inline-block mt-3">
                    <Button size="sm" className="gap-1.5">
                      <Plus className="w-3.5 h-3.5" /> {t('teacher.dashboard.createFirstCourse', 'Tạo khóa học đầu tiên')}
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Assignment Management Panel */}
          <div className="mt-12 bg-white dark:bg-[#1A1A1A] border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
            <SectionLead label={t('teacher.dashboard.reviewSubmissions')} title={t('teacher.dashboard.studentAssignments')} size="md" />
            
            <div className="mt-6 grid md:grid-cols-2 gap-6">
              {/* Course Selection */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">{t('teacher.dashboard.selectCourse')}</label>
                <select 
                  value={activeCourseId || ''}
                  onChange={(e) => { setActiveCourseId(e.target.value || null); setActiveAssignmentId(null); setActiveSubmissionId(null); }}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-900 dark:text-white"
                >
                  <option value="">{t('teacher.dashboard.chooseCourse')}</option>
                  {courseStats.map((c: any) => (
                    <option key={c._id} value={c._id}>{lv(c.title)}</option>
                  ))}
                </select>
              </div>

              {/* Assignment Selection */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">{t('teacher.dashboard.selectAssignment')}</label>
                <select 
                  disabled={!activeCourseId}
                  value={activeAssignmentId || ''}
                  onChange={(e) => { setActiveAssignmentId(e.target.value || null); setActiveSubmissionId(null); }}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all disabled:opacity-50 text-slate-900 dark:text-white"
                >
                  <option value="">{t('teacher.dashboard.chooseAssignment')}</option>
                  {teacherAssignments?.map((a: any) => (
                    <option key={a._id} value={a._id}>{lv(a.title)}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Submissions List */}
            {activeAssignmentId && (
              <div className="mt-8 border-t border-slate-100 dark:border-white/5 pt-6">
                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">{t('teacher.dashboard.submissionsList')}</h4>
                {teacherSubmissions && teacherSubmissions.length > 0 ? (
                  <div className="space-y-4">
                    {teacherSubmissions.map((sub: any) => (
                      <div key={sub._id} className="flex flex-col md:flex-row md:items-center md:justify-between p-4 bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 rounded-xl gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900 dark:text-white">{sub.student?.name}</span>
                            <span className="text-xs text-slate-500">({sub.student?.email})</span>
                          </div>
                          <p className="text-xs text-slate-400">{t('teacher.dashboard.submittedAt')}: {new Date(sub.createdAt).toLocaleString('vi-VN')}</p>
                          {sub.studentNotes && <p className="text-sm text-slate-600 dark:text-slate-400 italic mt-1">"{sub.studentNotes}"</p>}
                          <div className="flex flex-wrap gap-2 mt-2">
                            {sub.submittedFiles?.map((file: any, fIdx: number) => (
                              <a key={fIdx} href={file.url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-500 hover:underline flex items-center gap-1 bg-white dark:bg-white/10 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/10">
                                <FileText className="w-3 h-3 text-indigo-500" />
                                {file.name}
                              </a>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
                          {sub.status === 'graded' ? (
                            <div className="text-right">
                              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full uppercase tracking-wider border border-emerald-200 dark:border-emerald-800/40">{t('teacher.dashboard.gradedBadge')}</span>
                              <p className="text-base font-mono font-bold mt-1 text-slate-900 dark:text-white">{sub.grade} pts</p>
                            </div>
                          ) : (
                            <Button size="sm" onClick={() => { setActiveSubmissionId(sub._id); setGradeInput(''); setFeedbackInput(''); }}>{t('teacher.dashboard.gradeWork')}</Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 italic py-4">{t('teacher.dashboard.noSubmissions')}</p>
                )}
              </div>
            )}

            {/* Grading Modal */}
            {activeSubmissionId && createPortal(
              <div 
                className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in overflow-y-auto"
                onClick={() => setActiveSubmissionId(null)}
              >
                <div 
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-6 relative my-auto max-h-[90vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => setActiveSubmissionId(null)}
                    className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('teacher.dashboard.gradeModalTitle')}</h3>
                    <p className="text-sm text-slate-500 mt-1">{t('teacher.dashboard.gradeModalSubtitle')}</p>
                  </div>
                  <div className="space-y-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t('teacher.dashboard.scoreLabel')}</label>
                      <input 
                        type="number"
                        value={gradeInput}
                        onChange={(e) => setGradeInput(e.target.value)}
                        placeholder={t('teacher.dashboard.scorePlaceholder')}
                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t('teacher.dashboard.feedbackLabel')}</label>
                      <textarea 
                        value={feedbackInput}
                        onChange={(e) => setFeedbackInput(e.target.value)}
                        placeholder={t('teacher.dashboard.feedbackPlaceholder')}
                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none min-h-[100px] text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setActiveSubmissionId(null)}>{t('teacher.dashboard.cancel')}</Button>
                    <Button 
                      onClick={() => {
                        gradeSubmissionMutation.mutate({
                          subId: activeSubmissionId,
                          grade: Number(gradeInput),
                          feedback: feedbackInput
                        });
                      }}
                      disabled={gradeSubmissionMutation.isPending || !gradeInput}
                    >
                      {gradeSubmissionMutation.isPending ? t('teacher.dashboard.saving') : t('teacher.dashboard.submitGrade')}
                    </Button>
                  </div>
                </div>
              </div>,
              document.body
            )}
          </div>
        </div>

        <aside className="space-y-8 xl:pt-1">
          <GlassPanel variant="dark" padding="lg">
            <p className="section-label !text-white/55">{t('teacher.dashboard.liveInsights')}</p>
            <h3 className="mt-2 text-xl font-semibold tracking-tight text-white">{t('teacher.dashboard.attentionTitle')}</h3>
            <div className="mt-5 space-y-3.5">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed text-white/80">
                  {courseStats.length > 0 
                    ? t('teacher.dashboard.leadCourseInsight', { title: lv(courseStats[0]?.title), count: courseStats[0]?.enrollmentCount || 0, defaultValue: `Khóa học dẫn đầu: "${lv(courseStats[0]?.title)}" đang có ${courseStats[0]?.enrollmentCount || 0} học viên theo học.` })
                    : t('teacher.dashboard.insight3')}
                </p>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed text-white/80">
                  {dropOffAnalysis.length > 0 
                    ? t('teacher.dashboard.dropOffInsight', { title: lv(dropOffAnalysis[0]?.lessonTitle), count: dropOffAnalysis[0]?.dropOffCount || 0, defaultValue: `Bài "${lv(dropOffAnalysis[0]?.lessonTitle)}" có ${dropOffAnalysis[0]?.dropOffCount} học viên dừng lại, hãy bổ sung bài tập củng cố.` })
                    : t('teacher.dashboard.insight2')}
                </p>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed text-white/80">
                  {quizResults.length > 0
                    ? t('teacher.dashboard.quizInsight', { rate: quizResults[0]?.passRate || 0, defaultValue: `Hiệu suất kiểm tra trung bình đạt ${quizResults[0]?.passRate || 0}%, chất lượng tiếp thu của học viên rất tốt.` })
                    : t('teacher.dashboard.insight1')}
                </p>
              </div>
            </div>
          </GlassPanel>

          <GlassPanel padding="lg" className="border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1A1A1A]">
            <p className="section-label">{t('teacher.dashboard.financials')}</p>
            <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-950 dark:text-white">{t('teacher.dashboard.withdrawFunds')}</h3>
            <p className="text-xs text-slate-500 mt-1">{t('teacher.dashboard.withdrawDesc')}</p>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 my-4">
              <span className="text-xs text-slate-500 dark:text-slate-400 block">{t('teacher.dashboard.availableBalance')}:</span>
              <span className="text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-1 block">
                {(overview?.totalRevenue || 0).toLocaleString('vi-VN')}đ
              </span>
            </div>

            <Button className="w-full gap-2" onClick={() => setShowPayoutModal(true)}>
              <Wallet className="w-4 h-4" />
              {t('teacher.dashboard.requestPayout')}
            </Button>
          </GlassPanel>

          <InsightCallout
            title={t('teacher.dashboard.revenueMomentum')}
            description={t('teacher.dashboard.revenueMomentumDesc')}
          />
        </aside>
      </section>

      {showPayoutModal && createPortal(
        <div 
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in overflow-y-auto"
          onClick={() => setShowPayoutModal(false)}
        >
          <div 
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-5 relative my-auto max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowPayoutModal(false)}
              className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('teacher.dashboard.payoutModalTitle')}</h3>
              <p className="text-sm text-slate-500 mt-1">{t('teacher.dashboard.payoutModalDesc')}</p>
            </div>

            {/* Available Balance Banner */}
            <div className="p-3.5 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between">
              <span className="text-xs text-indigo-700 dark:text-indigo-300 font-medium">
                {t('teacher.dashboard.availableBalance')}:
              </span>
              <span className="text-base font-bold font-mono text-indigo-950 dark:text-indigo-200">
                {(overview?.totalRevenue || 0).toLocaleString('vi-VN')}đ
              </span>
            </div>

            {payoutSuccessMessage ? (
              <div className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 p-4 rounded-xl text-sm text-center font-medium border border-emerald-200 dark:border-emerald-800/40">
                {payoutSuccessMessage}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t('teacher.dashboard.withdrawAmount')}</label>
                    <button
                      type="button"
                      onClick={() => setPayoutAmount(String(overview?.totalRevenue || 0))}
                      className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      {t('teacher.dashboard.max')}
                    </button>
                  </div>
                  <div className="relative">
                    <input 
                      type="number"
                      value={payoutAmount}
                      onChange={(e) => setPayoutAmount(e.target.value)}
                      placeholder={t('teacher.dashboard.minAmount')}
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white"
                    />
                  </div>
                  {Number(payoutAmount) > (overview?.totalRevenue || 0) && (
                    <p className="text-xs text-rose-500 font-medium flex items-center gap-1 mt-0.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {t('teacher.dashboard.amountExceedsBalance')}
                    </p>
                  )}
                  {payoutAmount !== '' && Number(payoutAmount) > 0 && Number(payoutAmount) < 50000 && (
                    <p className="text-xs text-amber-500 font-medium flex items-center gap-1 mt-0.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {t('teacher.dashboard.minAmountWarning')}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t('teacher.dashboard.bankName')}</label>
                  <input 
                    type="text"
                    list="bank-suggestions"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder={t('teacher.dashboard.bankPlaceholder')}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white"
                  />
                  <datalist id="bank-suggestions">
                    <option value="Vietcombank (VCB)" />
                    <option value="MBBank (Quân Đội)" />
                    <option value="Techcombank (TCB)" />
                    <option value="ACB (Á Châu)" />
                    <option value="BIDV" />
                    <option value="VietinBank" />
                    <option value="VPBank" />
                    <option value="TPBank" />
                    <option value="Agribank" />
                  </datalist>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t('teacher.dashboard.accountNumber')}</label>
                    <input 
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="Account number"
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t('teacher.dashboard.accountHolder')}</label>
                    <input 
                      type="text"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      placeholder={t('teacher.dashboard.accountHolderPlaceholder')}
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white uppercase"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <Button variant="outline" onClick={() => setShowPayoutModal(false)}>{t('teacher.dashboard.cancel')}</Button>
                  <Button 
                    onClick={() => {
                      requestPayout({
                        amount: Number(payoutAmount),
                        bankInfo: { bankName, accountNumber, accountName }
                      });
                    }}
                    disabled={
                      isPayoutPending || 
                      Number(payoutAmount) < 50000 || 
                      Number(payoutAmount) > (overview?.totalRevenue || 0) || 
                      !bankName || 
                      !accountNumber || 
                      !accountName
                    }
                  >
                    {isPayoutPending ? t('teacher.dashboard.submitting') : t('teacher.dashboard.confirmRequest')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </PageShell>
  );
};

export default TeacherDashboard;
