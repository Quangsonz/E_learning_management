import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { PageShell, Button } from '../components/ui';
import { selectCurrentUser, updateUser } from '../store/slices/authSlice';
import { userApi } from '../services/user.api';
import { enrollmentApi } from '../services/enrollment.api';
import { certificateApi } from '../services/certificate.api';
import { adminApi } from '../services/admin.api';

// ============================================================================
// FALLBACK MOCK DATA (Hiển thị khi chưa có real data)
// ============================================================================

const DEFAULT_AVATAR = 'https://ui-avatars.com/api/?background=6366f1&color=fff&name=User&size=256';

// ============================================================================
// PROFILE HERO
// ============================================================================

interface EditableFieldProps {
  value: string;
  onSave: (val: string) => void;
  label: string;
}

const EditableField: React.FC<EditableFieldProps> = ({ value, onSave, label }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!draft.trim() || draft === value) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onSave(draft);
    } finally {
      setSaving(false);
      setEditing(false);
    }
  };

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          className="bg-white/10 border border-sky-400/50 rounded-lg px-3 py-1 text-white text-sm outline-none focus:ring-2 focus:ring-sky-400/30"
          autoFocus
        />
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-xs px-2 py-1 bg-sky-500 text-white rounded-md hover:bg-sky-400 transition-colors"
        >
          {saving ? '...' : 'Save'}
        </button>
        <button
          onClick={() => { setEditing(false); setDraft(value); }}
          className="text-xs px-2 py-1 bg-white/10 text-slate-300 rounded-md hover:bg-white/20 transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="group flex items-center gap-1.5 text-sm text-slate-300 hover:text-white transition-colors"
    >
      <span>{value || label}</span>
      <svg
        className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-sky-400"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    </button>
  );
};

const ProfileHero: React.FC = () => {
  const user = useSelector(selectCurrentUser);
  const dispatch = useDispatch();

  const displayName = user?.name || 'User';
  const displayEmail = user?.email || '';
  const displayRole = user?.role || 'student';
  const displayAvatar = user?.avatar && user.avatar !== 'default-avatar.png'
    ? user.avatar
    : `https://ui-avatars.com/api/?background=6366f1&color=fff&name=${encodeURIComponent(displayName)}&size=256`;
  const joinDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : 'Recently';
  const streak = user?.studyStreakDays || 0;

  const handleUpdateName = async (newName: string) => {
    try {
      const res = await userApi.updateMyProfile({ name: newName });
      if (res.data?.user) {
        dispatch(updateUser({ name: res.data.user.name }));
      }
    } catch (err) {
      console.error('Update name failed:', err);
    }
  };

  const roleColors: Record<string, string> = {
    admin: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    teacher: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    student: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
  };
  const roleLabels: Record<string, string> = {
    admin: 'Administrator',
    teacher: 'Instructor',
    student: 'Student',
  };

  return (
    <section className="relative w-full pt-16 pb-20 px-6 lg:px-12 rounded-[3rem] overflow-hidden group">
      {/* Background Glows */}
      <div className="absolute inset-0 bg-slate-900 dark:bg-black/40 z-0">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-indigo-600/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none transform group-hover:scale-105 transition-transform duration-1000" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-600/10 blur-[100px] rounded-full mix-blend-screen pointer-events-none" />
      </div>

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-12 max-w-[1200px] mx-auto">

        {/* Left: Avatar & Identity */}
        <div className="flex items-center gap-8">
          <div className="relative">
            <div className="relative w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden border-2 border-indigo-500/40 shadow-2xl bg-slate-800">
              <img src={displayAvatar} alt={displayName} className="w-full h-full object-cover" />
            </div>
            {/* Online Status */}
            <div className="absolute top-2 right-2 w-4 h-4 bg-emerald-500 border-2 border-slate-900 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.6)]" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white">
                <EditableField
                  value={displayName}
                  label="Click to add name"
                  onSave={handleUpdateName}
                />
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-slate-400">
              <span className="text-slate-400">{displayEmail}</span>
              <span className="w-1 h-1 rounded-full bg-slate-600 hidden sm:block" />
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${roleColors[displayRole]}`}>
                {roleLabels[displayRole]}
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-600 hidden sm:block" />
              <span>Joined {joinDate}</span>
            </div>
            {streak > 0 && (
              <div className="flex items-center gap-2 mt-4 text-sm font-semibold text-amber-500 bg-amber-500/10 w-fit px-3 py-1 rounded-full border border-amber-500/20">
                🔥 {streak} Day Streak
              </div>
            )}
            {/* Verified Badge */}
            {user?.isVerified && (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 mt-1">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Verified Account
              </div>
            )}
            
            {/* XP & Level Badge */}
            <div className="flex items-center gap-3 mt-4">
              <div className="flex flex-col">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Level {user?.level || 1}</div>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-slate-800 rounded-full overflow-hidden border border-white/5">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400" 
                      style={{ width: `${Math.min(((user?.xp || 0) % 100), 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-indigo-400">{user?.xp || 0} XP</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="shrink-0 flex flex-col items-end gap-6 w-full md:w-auto">
          <Link to="/settings" className="w-full md:w-auto">
            <Button
              variant="outline"
              className="w-full md:w-auto rounded-full bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20 shadow-lg backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5"
            >
              Manage Account
            </Button>
          </Link>
          <div className="text-right hidden md:block">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Focus Time</p>
            <p className="text-2xl font-black tabular-nums text-white tracking-tight">
              {user?.totalFocusMinutes ? `${Math.round(user.totalFocusMinutes / 60)}h` : '0h'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

// ============================================================================
// STATIC SECTIONS (preserved, can be connected to real data later)
// ============================================================================

const LearningStory: React.FC = () => {
  const user = useSelector(selectCurrentUser);
  const totalFocusHours = user?.totalFocusMinutes ? Math.round(user.totalFocusMinutes / 60) : 0;
  const lessonsCompleted = user?.studyHistory?.reduce((acc: number, curr: any) => acc + (curr.lessonsCompleted || 0), 0) || 0;

  // Heatmap generation
  const today = new Date();
  const getDaysArray = function(start: Date, end: Date) {
      for(var arr=[],dt=new Date(start); dt<=new Date(end); dt.setDate(dt.getDate()+1)){
          arr.push(new Date(dt).toISOString().split('T')[0]);
      }
      return arr;
  };
  
  const past30Days = new Date(today);
  past30Days.setDate(past30Days.getDate() - 29);
  const dayLabels = getDaysArray(past30Days, today);

  const historyMap = new Map();
  if (user?.studyHistory) {
    user.studyHistory.forEach((h: any) => historyMap.set(h.date, h));
  }

  return (
    <div className="space-y-12">
      <section className="py-8 border-b border-slate-200 dark:border-white/5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 md:gap-8 mb-12">
          <div>
            <p className="text-6xl font-black tracking-tighter text-slate-900 dark:text-white">{totalFocusHours}</p>
            <p className="text-sm font-bold uppercase tracking-widest text-slate-500 mt-2">Hours Learned</p>
          </div>
          <div>
            <p className="text-6xl font-black tracking-tighter text-slate-900 dark:text-white">{lessonsCompleted}</p>
            <p className="text-sm font-bold uppercase tracking-widest text-slate-500 mt-2">Lessons Done</p>
          </div>
          <div>
            <p className="text-6xl font-black tracking-tighter text-slate-900 dark:text-white">
              {user?.xp || 0}
            </p>
            <p className="text-sm font-bold uppercase tracking-widest text-slate-500 mt-2">Total XP</p>
          </div>
          <div>
            <p className="text-6xl font-black tracking-tighter text-slate-900 dark:text-white">{user?.studyStreakDays || 0}</p>
            <p className="text-sm font-bold uppercase tracking-widest text-slate-500 mt-2">Day Streak</p>
          </div>
        </div>
        
        {/* Achievements Section */}
        <div className="space-y-8">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-sm">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white mb-6">Achievements</h3>
            {(!user?.badges || user.badges.length === 0) ? (
              <div className="text-center py-6">
                <span className="text-3xl mb-2 block opacity-50">🏆</span>
                <p className="text-xs font-medium text-slate-500">No badges earned yet.</p>
                <p className="text-[10px] text-slate-400 mt-1">Keep learning to unlock achievements!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {user.badges.map((badge, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 rounded-2xl relative group">
                    <span className="text-2xl">{badge.icon}</span>
                    <span className="text-[10px] font-bold text-center text-slate-600 dark:text-slate-300 line-clamp-2">{badge.name}</span>
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-10">
                      {badge.description}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="p-8 rounded-3xl border border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Learning Activity (Last 30 Days)</h3>
        <div className="flex flex-wrap gap-2">
          {dayLabels.map(dateStr => {
            const record = historyMap.get(dateStr);
            const intensity = record ? Math.min(record.lessonsCompleted, 4) : 0;
            const colors = [
              'bg-slate-200 dark:bg-slate-800',
              'bg-indigo-300 dark:bg-indigo-900/40',
              'bg-indigo-400 dark:bg-indigo-800/60',
              'bg-indigo-500 dark:bg-indigo-600',
              'bg-indigo-600 dark:bg-indigo-500'
            ];
            return (
              <div 
                key={dateStr}
                title={`${dateStr}: ${record?.lessonsCompleted || 0} lessons`}
                className={`w-4 h-4 rounded-sm ${colors[intensity]} transition-colors duration-300 hover:ring-2 hover:ring-indigo-400 hover:ring-offset-1 hover:ring-offset-transparent cursor-pointer`}
              />
            )
          })}
        </div>
        <div className="flex items-center gap-2 mt-4 text-xs font-medium text-slate-500">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-sm bg-slate-200 dark:bg-slate-800"></div>
            <div className="w-3 h-3 rounded-sm bg-indigo-300 dark:bg-indigo-900/40"></div>
            <div className="w-3 h-3 rounded-sm bg-indigo-400 dark:bg-indigo-800/60"></div>
            <div className="w-3 h-3 rounded-sm bg-indigo-500 dark:bg-indigo-600"></div>
            <div className="w-3 h-3 rounded-sm bg-indigo-600 dark:bg-indigo-500"></div>
          </div>
          <span>More</span>
        </div>
      </section>
    </div>
  );
};

const EmptyState: React.FC<{ title: string; description: string }> = ({ title, description }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-4">
      <svg className="w-8 h-8 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"/>
      </svg>
    </div>
    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
    <p className="text-sm text-slate-500 mt-1">{description}</p>
    <Link to="/courses" className="mt-4 px-4 py-2 text-sm font-semibold text-indigo-400 bg-indigo-500/10 rounded-xl border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors">
      Browse Courses →
    </Link>
  </div>
);

// ============================================================================
// MAIN PROFILE PAGE
// ============================================================================

const Profile: React.FC = () => {
  const user = useSelector(selectCurrentUser);

  const [showApplyModal, setShowApplyModal] = useState(false);
  const [specialty, setSpecialty] = useState('');
  const [bio, setBio] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [applySuccessMessage, setApplySuccessMessage] = useState('');

  const { data: enrollmentsData, isLoading: isLoadingEnrollments } = useQuery({
    queryKey: ['my-enrollments'],
    queryFn: () => enrollmentApi.getMyEnrollments(),
    enabled: !!user
  });
  const enrollments = enrollmentsData?.data?.enrollments || [];

  const { data: certificates, isLoading: isLoadingCertificates } = useQuery({
    queryKey: ['my-certificates'],
    queryFn: () => certificateApi.getMyCertificates(),
    enabled: !!user
  });

  const queryClient = useQueryClient();

  const { data: appStatusData, refetch: refetchAppStatus } = useQuery({
    queryKey: ['my-application-status'],
    queryFn: () => adminApi.getMyApplicationStatus(),
    enabled: !!user && user.role === 'student'
  });

  const latestApp = appStatusData?.data?.application;

  const { mutate: submitApplication, isPending: isApplyPending } = useMutation({
    mutationFn: (data: { specialty: string; bio: string; resumeUrl: string }) => adminApi.applyToTeach(data),
    onSuccess: () => {
      setApplySuccessMessage('Đơn ứng tuyển đã được gửi thành công! Hãy đợi Admin xét duyệt nhé.');
      queryClient.invalidateQueries({ queryKey: ['my-application-status'] });
      setTimeout(() => {
        setShowApplyModal(false);
        setApplySuccessMessage('');
        setSpecialty('');
        setBio('');
        setResumeUrl('');
      }, 2500);
    }
  });


  if (!user) {
    return (
      <PageShell wide>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-3">
            <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto" />
            <p className="text-slate-400 text-sm">Loading profile...</p>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell wide>
      <div className="max-w-[1200px] mx-auto w-full pt-8 pb-16 px-4 sm:px-6 lg:px-0 flex flex-col gap-12 lg:gap-16">

        {/* Core Identity */}
        <div className="flex flex-col gap-8">
          <ProfileHero />
          <LearningStory />
        </div>

        {/* Instructor Application Banner / Tracker (Student only) */}
        {user?.role === 'student' && (
          latestApp ? (
            <section className="bg-gradient-to-r from-slate-900 to-slate-950 rounded-3xl p-8 text-white relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl border border-white/5">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[80px] rounded-full pointer-events-none" />
              <div className="relative z-10 space-y-3 max-w-xl">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold tracking-tight">Teacher Application Status</h2>
                  {latestApp.status === 'pending' && (
                    <span className="px-3 py-1 text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full uppercase tracking-wider">
                      Pending Review
                    </span>
                  )}
                  {latestApp.status === 'approved' && (
                    <span className="px-3 py-1 text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full uppercase tracking-wider">
                      Approved
                    </span>
                  )}
                  {latestApp.status === 'rejected' && (
                    <span className="px-3 py-1 text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full uppercase tracking-wider">
                      Rejected
                    </span>
                  )}
                </div>
                
                <p className="text-sm text-slate-300">
                  Specialty: <strong className="text-slate-100">{latestApp.specialty}</strong>
                </p>

                {latestApp.status === 'pending' && (
                  <p className="text-sm text-slate-400 italic">"Chúng tôi đã tiếp nhận hồ sơ ứng tuyển của bạn và đang tiến hành kiểm duyệt. Vui lòng chờ phản hồi trong thời gian sớm nhất."</p>
                )}

                {latestApp.status === 'approved' && (
                  <p className="text-sm text-emerald-400 font-medium">"Hồ sơ của bạn đã được duyệt thành công! Bạn hiện có quyền hạn của Giảng viên. Nếu vai trò chưa thay đổi, vui lòng đăng nhập lại."</p>
                )}

                {latestApp.status === 'rejected' && (
                  <div className="space-y-2">
                    <p className="text-sm text-rose-400 font-medium">"Hồ sơ ứng tuyển giảng viên không được duyệt."</p>
                    {latestApp.adminNotes && (
                      <p className="text-xs text-slate-400 bg-black/30 p-3 rounded-xl border border-white/5 font-mono italic">
                        Phản hồi từ Admin: {latestApp.adminNotes}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {latestApp.status === 'rejected' && (
                <div className="relative z-10 shrink-0">
                  <Button 
                    variant="pill" 
                    className="bg-white text-indigo-900 hover:bg-slate-100 hover:text-indigo-950 font-bold px-6"
                    onClick={() => setShowApplyModal(true)}
                  >
                    Re-apply Now
                  </Button>
                </div>
              )}
            </section>
          ) : (
            <section className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 rounded-3xl p-8 text-white relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl border border-indigo-500/20">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />
              <div className="relative z-10 space-y-2 max-w-xl">
                <h2 className="text-2xl font-bold tracking-tight">Become an Instructor</h2>
                <p className="text-sm text-indigo-200">Share your expertise with thousands of students and build your brand. Get paid directly into your bank account.</p>
              </div>
              <div className="relative z-10">
                <Button 
                  variant="pill" 
                  className="bg-white text-indigo-900 hover:bg-slate-100 hover:text-indigo-950 font-bold px-6 shrink-0"
                  onClick={() => setShowApplyModal(true)}
                >
                  Apply to Teach Now
                </Button>
              </div>
            </section>
          )
        )}


        {/* Active Courses */}
        <section className="space-y-8">
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Active Workspace</h2>
          {isLoadingEnrollments ? (
            <div className="animate-pulse grid sm:grid-cols-2 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-48 bg-slate-200 dark:bg-white/5 rounded-3xl" />
              ))}
            </div>
          ) : enrollments && enrollments.length > 0 ? (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
              {enrollments.map((enrollment: any) => {
                const c = enrollment.course;
                if (!c) return null;
                return (
                  <div key={enrollment._id} className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col justify-between h-full">
                    <div>
                      <div className="aspect-video w-full bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
                        {c.thumbnailUrl ? (
                          <img src={c.thumbnailUrl} alt={c.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-400">No Image</div>
                        )}
                      </div>
                      <div className="p-6 space-y-2">
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white line-clamp-1">{c.title}</h3>
                        <p className="text-xs text-slate-500 line-clamp-2">{c.description}</p>
                      </div>
                    </div>
                    <div className="p-6 pt-0">
                      <Link to={`/courses/${c._id}/learn`}>
                        <Button className="w-full" variant="pill">Continue Learning</Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="No active courses yet"
              description="Enroll in a course to start your learning journey."
            />
          )}
        </section>

        {/* Certificates */}
        <section className="space-y-8">
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Verified Skills</h2>
          {isLoadingCertificates ? (
            <div className="animate-pulse grid sm:grid-cols-2 md:grid-cols-3 gap-6">
              {[1, 2].map((n) => (
                <div key={n} className="h-32 bg-slate-200 dark:bg-white/5 rounded-3xl" />
              ))}
            </div>
          ) : certificates && certificates.length > 0 ? (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
              {certificates.map((cert: any) => {
                const c = typeof cert.course === 'object' ? cert.course : { title: 'Completed Course' };
                return (
                  <div key={cert._id} className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl p-6 flex flex-col justify-between h-full gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Certificate</span>
                        <span className="text-[10px] font-mono text-slate-400">{cert.certificateId}</span>
                      </div>
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white line-clamp-1">{c.title}</h3>
                      <p className="text-xs text-slate-500">Issued on {new Date(cert.issueDate).toLocaleDateString()}</p>
                    </div>
                    {cert.pdfUrl && (
                      <a href={cert.pdfUrl} target="_blank" rel="noopener noreferrer" className="w-full">
                        <Button className="w-full" variant="outline">View Certificate PDF</Button>
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="No certificates yet"
              description="Complete a course to earn your first certificate."
            />
          )}
        </section>

      </div>

      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 w-full max-w-md rounded-2xl p-6 shadow-xl space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Apply to Teach</h3>
              <p className="text-sm text-slate-500 mt-1">Submit your specialty and resume details.</p>
            </div>

            {applySuccessMessage ? (
              <div className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 p-4 rounded-xl text-sm text-center font-medium">
                {applySuccessMessage}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Specialty (Chuyên môn)</label>
                  <input 
                    type="text"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    placeholder="e.g. Frontend Architecture, UX Design"
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Bio (Mô tả bản thân)</label>
                  <textarea 
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Describe your teaching experience and credentials..."
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none min-h-[100px]"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Resume / Portfolio Link</label>
                  <input 
                    type="text"
                    value={resumeUrl}
                    onChange={(e) => setResumeUrl(e.target.value)}
                    placeholder="e.g. Link to LinkedIn or drive CV file"
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={() => setShowApplyModal(false)}>Cancel</Button>
                  <Button 
                    onClick={() => {
                      submitApplication({ specialty, bio, resumeUrl });
                    }}
                    disabled={isApplyPending || !specialty.trim() || !bio.trim() || !resumeUrl.trim()}
                  >
                    {isApplyPending ? 'Submitting...' : 'Submit Application'}
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

export default Profile;
