import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { PageShell, Button } from '../components/ui';
import { selectCurrentUser, updateUser } from '../store/slices/authSlice';
import { userApi } from '../services/user.api';

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
  return (
    <section className="py-12 border-b border-slate-200 dark:border-white/5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-12 md:gap-8">
        <div>
          <p className="text-6xl font-black tracking-tighter text-slate-900 dark:text-white">0</p>
          <p className="text-sm font-bold uppercase tracking-widest text-slate-500 mt-2">Hours Learned</p>
        </div>
        <div>
          <p className="text-6xl font-black tracking-tighter text-slate-900 dark:text-white">0</p>
          <p className="text-sm font-bold uppercase tracking-widest text-slate-500 mt-2">Courses Done</p>
        </div>
        <div>
          <p className="text-6xl font-black tracking-tighter text-slate-900 dark:text-white">
            0<span className="text-3xl text-indigo-500">%</span>
          </p>
          <p className="text-sm font-bold uppercase tracking-widest text-slate-500 mt-2">Avg Score</p>
        </div>
        <div>
          <p className="text-6xl font-black tracking-tighter text-slate-900 dark:text-white">0</p>
          <p className="text-sm font-bold uppercase tracking-widest text-slate-500 mt-2">Certificates</p>
        </div>
      </div>
    </section>
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

        {/* Active Courses Placeholder */}
        <section className="space-y-8">
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Active Workspace</h2>
          <EmptyState
            title="No active courses yet"
            description="Enroll in a course to start your learning journey."
          />
        </section>

        {/* Certificates Placeholder */}
        <section className="space-y-8">
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Verified Skills</h2>
          <EmptyState
            title="No certificates yet"
            description="Complete a course to earn your first certificate."
          />
        </section>

      </div>
    </PageShell>
  );
};

export default Profile;
