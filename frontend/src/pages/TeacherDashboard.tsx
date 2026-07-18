import React, { useEffect, useMemo, useState } from 'react';
import { motion, MotionProps } from 'framer-motion';
import { Link } from 'react-router-dom';
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
import { floatY } from '../animations/motionVariants';

type SeriesPoint = { label: string; value: number };

const MotionDiv = motion.div as unknown as React.FC<
  React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement> & MotionProps>
>;

const useCountUp = (target: number, duration = 1200) => {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let start: number | null = null;
    let frame = 0;

    const step = (timestamp: number) => {
      if (start === null) start = timestamp;
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / duration, 1);
      setValue(Math.round(progress * target));
      if (progress < 1) frame = window.requestAnimationFrame(step);
    };

    frame = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(frame);
  }, [duration, target]);

  return value;
};

const TeacherDashboard: React.FC = () => {
  const [showPulse, setShowPulse] = useState(true);

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
      setPayoutSuccessMessage('Yêu cầu rút tiền đã được gửi thành công!');
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

  const revenueValue = useCountUp(overview?.totalRevenue || 0);
  const studentsValue = useCountUp(overview?.totalStudents || 0);
  const coursesValue = useCountUp(overview?.totalCourses || 0);
  const passRateValue = useCountUp(quizResults.length > 0 ? (quizResults[0]?.passRate || 0) : 0);

  useEffect(() => {
    const timer = window.setInterval(() => setShowPulse((current) => !current), 2200);
    return () => window.clearInterval(timer);
  }, []);

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const enrollmentChartData = monthlyEnrollments.map((item: any) => ({
    label: monthNames[item.month - 1] || `Month ${item.month}`,
    value: item.enrollments
  }));

  const metrics = [
    { label: 'Revenue', value: `${revenueValue.toLocaleString('vi-VN')}đ`, delta: '+18.4% this month' },
    { label: 'Active Students', value: studentsValue.toLocaleString('vi-VN'), delta: '+12.1% this week' },
    { label: 'Courses Published', value: coursesValue.toString(), delta: '+3 new courses' },
    { label: 'Quiz Pass Rate', value: `${passRateValue}%`, delta: '+4.8% improved' }
  ];

  return (
    <PageShell wide>
      <CanvasHero
        badge={<div className="badge !border-sky-200 !bg-sky-50 !text-sky-700">Teacher Dashboard</div>}
        eyebrow="Stripe Dashboard • Linear Dashboard inspired"
        title="Manage revenue, students, courses, and quizzes from one premium LMS control center."
        description="Clean KPI counters, animated charts, and live statistics designed to give teachers a confident, high-signal dashboard experience."
        glow="cool"
        actions={
          <>
            <Link to="/teacher-courses">
              <Button variant="pill">Manage courses</Button>
            </Link>
            <Link to="/teacher-courses">
              <Button variant="outline">Review quizzes</Button>
            </Link>
          </>
        }
        aside={
          <MotionDiv className="mx-auto max-w-[260px] lg:-ml-12" animate={floatY(6, 5.5)}>
            <div className="rounded-[var(--radius-section)] bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 px-6 py-5 text-white shadow-[0_24px_64px_rgba(15,23,42,0.2)]">
              <p className="section-label !text-white/55">Live Statistics</p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight">Your LMS is performing strongly.</h2>
              <div className="mt-4 space-y-2.5 text-sm">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-white/60">Total Revenue</span>
                  <span className="font-semibold tabular-nums">{overview?.totalRevenue?.toLocaleString('vi-VN') || 0}đ</span>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-white/60">Total Students</span>
                  <span className="font-semibold tabular-nums">{overview?.totalStudents?.toLocaleString('vi-VN') || 0}</span>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-white/60">Completions</span>
                  <span className="font-semibold tabular-nums">{overview?.completionCount?.toLocaleString('vi-VN') || 0}</span>
                </div>
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
          <ChartBlock label="Drop-off Analysis" title="Student Retention" badge={<span className="text-xs font-medium text-slate-400">Live</span>}>
            <div className="canvas-chart-area h-64 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dropOffAnalysis} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="lessonTitle" type="category" width={150} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <RechartsTooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ borderRadius: '12px', border: 'none', background: '#0f172a', color: '#fff' }} />
                  <Bar dataKey="dropOffCount" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartBlock>

          <div className="grid gap-10 lg:grid-cols-2">
            <ChartBlock label="Monthly enrollment growth" title="Student Analytics">
              <div className="canvas-chart-area h-56 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={enrollmentChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} vertical={false} />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                    <RechartsTooltip cursor={{ stroke: 'rgba(255,255,255,0.1)' }} contentStyle={{ borderRadius: '12px', border: 'none', background: '#0f172a', color: '#fff' }} />
                    <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={4} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </ChartBlock>

            <ChartBlock label="Quiz performance" title="Quiz Analytics">
              <div className="canvas-chart-area space-y-4">
                {quizResults.map((item: any, index: number) => (
                  <div key={item.quizTitle} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-600 dark:text-slate-300 line-clamp-1 mr-4">{item.quizTitle}</span>
                      <span className="font-semibold tabular-nums text-slate-950 dark:text-white shrink-0">{item.passRate}%</span>
                    </div>
                    <div className="progress-track">
                      <MotionDiv
                        className="progress-fill chart-bar-growth"
                        initial={{ width: 0 }}
                        animate={{ width: `${item.passRate}%` }}
                        transition={{ duration: 0.8, delay: index * 0.08 }}
                      />
                    </div>
                  </div>
                ))}
                {quizResults.length === 0 && <p className="text-sm text-slate-500">No quiz data available.</p>}
              </div>
            </ChartBlock>
          </div>

          <div>
            <SectionLead label="Course health overview" title="Course Analytics" size="md" />
            <div className="mt-5">
              {courseStats.map((course: any, index: number) => (
                <MotionDiv
                  key={course._id}
                  className="flex flex-col gap-3 py-4 border-b border-slate-100 last:border-0 lg:flex-row lg:items-center lg:justify-between"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: index * 0.05 }}
                >
                  <div>
                    <h4 className="text-lg font-semibold text-slate-950 dark:text-white">{course.title}</h4>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{course.enrollmentCount} students enrolled</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-600 dark:text-slate-300">
                    <span>{course.avgProgress?.toFixed(1) || 0}% completion</span>
                    <div className="flex flex-col items-end">
                      <span className="font-semibold text-primary-600">{Number(course.price || 0).toLocaleString('vi-VN')}đ</span>
                      {course.discountPercentage && course.discountPercentage > 0 ? (
                        <span className="text-[10px] text-slate-400 line-through">
                          {Number(course.estimatedPrice || course.price).toLocaleString('vi-VN')}đ
                        </span>
                      ) : null}
                    </div>
                  </div>
                </MotionDiv>
              ))}
              {courseStats.length === 0 && <p className="text-sm text-slate-500">No courses published yet.</p>}
            </div>
          </div>

          {/* Assignment Management Panel */}
          <div className="mt-12 bg-white dark:bg-[#1A1A1A] border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
            <SectionLead label="Review submissions" title="Student Assignments" size="md" />
            
            <div className="mt-6 grid md:grid-cols-3 gap-6">
              {/* Course Selection */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">Select Course</label>
                <select 
                  onChange={(e) => { setActiveCourseId(e.target.value || null); setActiveAssignmentId(null); setActiveSubmissionId(null); }}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                >
                  <option value="">-- Choose Course --</option>
                  {courseStats.map((c: any) => (
                    <option key={c._id} value={c._id}>{c.title}</option>
                  ))}
                </select>
              </div>

              {/* Assignment Selection */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">Select Assignment</label>
                <select 
                  disabled={!activeCourseId}
                  onChange={(e) => { setActiveAssignmentId(e.target.value || null); setActiveSubmissionId(null); }}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all disabled:opacity-50"
                >
                  <option value="">-- Choose Assignment --</option>
                  {teacherAssignments?.map((a: any) => (
                    <option key={a._id} value={a._id}>{a.title}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Submissions List */}
            {activeAssignmentId && (
              <div className="mt-8 border-t border-slate-100 dark:border-white/5 pt-6">
                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">Student Submissions</h4>
                {teacherSubmissions && teacherSubmissions.length > 0 ? (
                  <div className="space-y-4">
                    {teacherSubmissions.map((sub: any) => (
                      <div key={sub._id} className="flex flex-col md:flex-row md:items-center md:justify-between p-4 bg-slate-50 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 rounded-xl gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900 dark:text-white">{sub.student?.name}</span>
                            <span className="text-xs text-slate-500">({sub.student?.email})</span>
                          </div>
                          <p className="text-xs text-slate-400">Submitted: {new Date(sub.createdAt).toLocaleString()}</p>
                          {sub.studentNotes && <p className="text-sm text-slate-600 dark:text-slate-400 italic">Notes: "{sub.studentNotes}"</p>}
                          <div className="flex gap-2 mt-2">
                            {sub.submittedFiles?.map((file: any, fIdx: number) => (
                              <a key={fIdx} href={file.url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-500 hover:underline flex items-center gap-1">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
                                {file.name}
                              </a>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          {sub.status === 'graded' ? (
                            <div className="text-right">
                              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/30 px-2.5 py-1 rounded-full uppercase text-[10px] tracking-wider">Graded</span>
                              <p className="text-sm font-mono font-bold mt-1 text-slate-900 dark:text-white">{sub.grade} pts</p>
                            </div>
                          ) : (
                            <Button size="sm" onClick={() => { setActiveSubmissionId(sub._id); setGradeInput(''); setFeedbackInput(''); }}>Grade Work</Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 italic">No submissions for this assignment yet.</p>
                )}
              </div>
            )}

            {/* Grading Modal */}
            {activeSubmissionId && (
              <div className="fixed inset-0 z-55 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 w-full max-w-md rounded-2xl p-6 shadow-xl space-y-6">
                  <div>
                    <h3 className="text-lg font-bold">Grade Student Submission</h3>
                    <p className="text-sm text-slate-500 mt-1">Provide points and constructive feedback.</p>
                  </div>
                  <div className="space-y-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Score</label>
                      <input 
                        type="number"
                        value={gradeInput}
                        onChange={(e) => setGradeInput(e.target.value)}
                        placeholder="Enter points (e.g. 90)"
                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Feedback</label>
                      <textarea 
                        value={feedbackInput}
                        onChange={(e) => setFeedbackInput(e.target.value)}
                        placeholder="Good job! Keep it up..."
                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none min-h-[100px]"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setActiveSubmissionId(null)}>Cancel</Button>
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
                      {gradeSubmissionMutation.isPending ? 'Saving...' : 'Submit Grade'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-8 xl:pt-1">
          <GlassPanel variant="dark" padding="lg">
            <p className="section-label !text-white/55">Live Insights</p>
            <h3 className="mt-2 text-xl font-semibold tracking-tight">What needs your attention</h3>
            <div className="mt-5 space-y-4">
              {[
                '2 quizzes need review before the weekly deadline.',
                'One high-value course is underperforming in completion.',
                'Revenue from design courses is outpacing the rest of the catalog.'
              ].map((item) => (
                <p key={item} className="text-sm leading-relaxed text-white/75">
                  {item}
                </p>
              ))}
            </div>
          </GlassPanel>

          <GlassPanel padding="lg" className="border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1A1A1A]">
            <p className="section-label">Financials</p>
            <h3 className="mt-2 text-xl font-semibold tracking-tight">Withdraw Funds</h3>
            <p className="text-xs text-slate-500 mt-1">Request payouts from your course earnings directly to your bank account.</p>
            <div className="mt-5">
              <Button className="w-full" onClick={() => setShowPayoutModal(true)}>Request Payout</Button>
            </div>
          </GlassPanel>

          <InsightCallout
            title="Revenue momentum"
            description="Smooth chart motion helps the dashboard feel alive while keeping the signal clear and readable."
          />
        </aside>
      </section>

      {showPayoutModal && (
        <div className="fixed inset-0 z-55 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 w-full max-w-md rounded-2xl p-6 shadow-xl space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Request Payout</h3>
              <p className="text-sm text-slate-500 mt-1">Submit bank transfer details.</p>
            </div>

            {payoutSuccessMessage ? (
              <div className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 p-4 rounded-xl text-sm text-center font-medium">
                {payoutSuccessMessage}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Withdrawal Amount (VND)</label>
                  <input 
                    type="number"
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    placeholder="Min 50,000đ"
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Bank Name</label>
                  <input 
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g. Vietcombank"
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Account Number</label>
                    <input 
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="Account number"
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Account Name</label>
                    <input 
                      type="text"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      placeholder="Account holder name"
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={() => setShowPayoutModal(false)}>Cancel</Button>
                  <Button 
                    onClick={() => {
                      requestPayout({
                        amount: Number(payoutAmount),
                        bankInfo: { bankName, accountNumber, accountName }
                      });
                    }}
                    disabled={isPayoutPending || Number(payoutAmount) < 50000 || !bankName || !accountNumber || !accountName}
                  >
                    {isPayoutPending ? 'Submitting...' : 'Confirm Request'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </PageShell>
  );
};

export default TeacherDashboard;
