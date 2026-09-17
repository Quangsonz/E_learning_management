import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { PageShell, Button, Card, InlineLoader } from '../components/ui';
import { selectCurrentUser, updateUser } from '../store/slices/authSlice';
import { userApi } from '../services/user.api';
import { courseApi } from '../services/course.api';
import { analyticsApi } from '../services/analytics.api';
import { enrollmentApi } from '../services/enrollment.api';
import { certificateApi } from '../services/certificate.api';
import { adminApi } from '../services/admin.api';
import { useLocalizedValue } from '../utils/localized';
import { useToast } from '../contexts/ToastContext';
import {
  GraduationCap,
  BookOpen,
  Users,
  Star,
  TrendingUp,
  Sparkles,
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Flame,
  ExternalLink,
  ArrowRight,
  LayoutDashboard,
  Plus,
  FileEdit,
  Layers
} from 'lucide-react';

// ============================================================================
// PROFILE HERO & EDITABLE FIELD
// ============================================================================

interface EditableFieldProps {
  value: string;
  onSave: (val: string) => void;
  label: string;
}

const EditableField: React.FC<EditableFieldProps> = ({ value, onSave, label }) => {
  const { t } = useTranslation();
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
          className="text-xs px-2.5 py-1 bg-sky-500 text-white rounded-md hover:bg-sky-400 transition-colors font-medium"
        >
          {saving ? '...' : t('profile.hero.save', 'Lưu')}
        </button>
        <button
          onClick={() => { setEditing(false); setDraft(value); }}
          className="text-xs px-2 py-1 bg-white/10 text-slate-300 rounded-md hover:bg-white/20 transition-colors"
        >
          {t('profile.hero.cancel', 'Hủy')}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="group flex items-center gap-2 text-white hover:text-indigo-300 transition-colors text-left"
    >
      <span>{value || label}</span>
      <span className="p-1 rounded-md bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-300">
        <FileEdit className="w-3.5 h-3.5" />
      </span>
    </button>
  );
};

const ProfileHero: React.FC = () => {
  const { t, i18n } = useTranslation();
  const user = useSelector(selectCurrentUser);
  const dispatch = useDispatch();

  const displayName = user?.name || t('settings.preview.defaultUser', 'User');
  const displayEmail = user?.email || '';
  const displayRole = user?.role || 'student';
  const isTeacher = displayRole === 'teacher' || displayRole === 'instructor' || displayRole === 'admin';
  const displayAvatar = user?.avatar && user.avatar !== 'default-avatar.png'
    ? user.avatar
    : `https://ui-avatars.com/api/?background=6366f1&color=fff&name=${encodeURIComponent(displayName)}&size=256`;
  const joinDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US', { month: 'short', year: 'numeric' })
    : 'Recently';
  const streak = user?.studyStreakDays || 0;

  const { success: successToast, error: errorToast } = useToast();

  const handleUpdateName = async (newName: string) => {
    try {
      const res = await userApi.updateMyProfile({ name: newName });
      if (res.data?.user) {
        dispatch(updateUser({ name: res.data.user.name }));
        successToast(t('profile.hero.nameUpdated', 'Đã cập nhật họ và tên thành công!'), t('settings.tabs.profile', 'Hồ sơ'));
      }
    } catch (err: any) {
      errorToast(err.message || t('profile.hero.nameUpdateError', 'Không thể cập nhật tên'), 'Lỗi');
    }
  };

  const roleColors: Record<string, string> = {
    admin: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    teacher: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    instructor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    student: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
  };

  return (
    <section className="relative w-full pt-12 pb-14 px-6 lg:px-12 rounded-[2.5rem] overflow-hidden group shadow-2xl border border-slate-200 dark:border-white/10 bg-slate-900 text-white">
      {/* Ambient background glows */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950/70 to-slate-950 z-0">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-indigo-600/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-cyan-600/15 blur-[100px] rounded-full mix-blend-screen pointer-events-none" />
      </div>

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 max-w-[1200px] mx-auto">
        {/* Left: Avatar & Identity */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-8">
          <div className="relative shrink-0">
            <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden border-2 border-indigo-500/40 shadow-2xl bg-slate-800 ring-4 ring-indigo-500/10">
              <img src={displayAvatar} alt={displayName} className="w-full h-full object-cover" />
            </div>
            {/* Online Status */}
            <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-emerald-500 border-2 border-slate-900 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white flex items-center gap-2">
                <EditableField
                  value={displayName}
                  label={t('profile.hero.clickToAddName', 'Nhấp để đặt tên')}
                  onSave={handleUpdateName}
                />
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-slate-300">
              <span className="text-slate-300">{displayEmail}</span>
              <span className="w-1 h-1 rounded-full bg-slate-600 hidden sm:block" />
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${roleColors[displayRole]}`}>
                {t(`enums.role.${displayRole}`, displayRole)}
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-600 hidden sm:block" />
              <span className="text-slate-400">{t('profile.hero.joined', { date: joinDate })}</span>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              {isTeacher && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {t('profile.instructorVerified', 'Giảng viên chính thức')}
                </div>
              )}
              {user?.isVerified && !isTeacher && (
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {t('profile.hero.verifiedAccount', 'Tài khoản đã xác thực')}
                </div>
              )}
              {streak > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  {t('profile.hero.dayStreak', { count: streak })}
                </div>
              )}
            </div>

            {/* Level & XP bar */}
            <div className="flex items-center gap-3 pt-2">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Level {user?.level || 1}
              </div>
              <div className="w-28 sm:w-36 h-2 bg-slate-800 rounded-full overflow-hidden border border-white/5">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-500"
                  style={{ width: `${Math.min(((user?.xp || 0) % 100), 100)}%` }}
                />
              </div>
              <span className="text-xs font-bold text-indigo-400">{user?.xp || 0} XP</span>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="shrink-0 flex flex-col items-start md:items-end gap-4 w-full md:w-auto border-t md:border-t-0 border-white/10 pt-4 md:pt-0">
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {isTeacher && (
              <Link to="/teacher-dashboard" className="w-full sm:w-auto">
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full sm:w-auto rounded-full font-bold shadow-lg shadow-indigo-500/25"
                  leftIcon={<LayoutDashboard className="w-3.5 h-3.5" />}
                >
                  {t('profile.teachingStats.manageDashboard', 'Bảng điều khiển Giảng viên')}
                </Button>
              </Link>
            )}
            <Link to="/settings" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                className="w-full sm:w-auto rounded-full bg-white/5 border-white/15 text-white hover:bg-white/10 hover:border-white/25 shadow-lg backdrop-blur-md"
              >
                {t('profile.hero.manageAccount', 'Quản lý tài khoản')}
              </Button>
            </Link>
          </div>

          <div className="text-left md:text-right hidden sm:block">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">
              {t('profile.hero.focusTime', 'Thời gian học tập')}
            </p>
            <p className="text-2xl font-black tabular-nums text-white tracking-tight flex items-center md:justify-end gap-1.5">
              <Clock className="w-4 h-4 text-indigo-400" />
              {user?.totalFocusMinutes ? `${Math.round(user.totalFocusMinutes / 60)}h` : '0h'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

// ============================================================================
// TEACHING PORTFOLIO VIEW (FOR TEACHERS & INSTRUCTORS)
// ============================================================================

interface TeachingPortfolioProps {
  courses: any[];
  isLoadingCourses: boolean;
  analyticsOverview?: any;
}

const TeachingPortfolio: React.FC<TeachingPortfolioProps> = ({ courses, isLoadingCourses, analyticsOverview }) => {
  const { t } = useTranslation();
  const lv = useLocalizedValue();

  const totalCourses = courses.length > 0 ? courses.length : (analyticsOverview?.totalCourses || 0);
  const publishedCourses = courses.filter((c: any) => c.status === 'published').length;
  const totalStudents = analyticsOverview?.totalStudents ?? courses.reduce((acc: number, c: any) => acc + (c.students || 0), 0);
  const totalRevenue = analyticsOverview?.totalRevenue || 0;

  return (
    <div className="space-y-10">
      {/* 4 Teaching KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t('profile.teachingStats.coursesTaught', 'Khóa học đã tạo')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
            {totalCourses}
          </p>
          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            {t('profile.teachingStats.coursesDelta', { count: publishedCourses })}
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t('profile.teachingStats.totalStudents', 'Tổng số học viên')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
            {totalStudents.toLocaleString('vi-VN')}
          </p>
          <p className="text-xs font-semibold text-slate-400">
            {t('profile.teachingStats.studentsDelta', 'Học viên đang theo học')}
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t('profile.teachingStats.avgRating', 'Đánh giá trung bình')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Star className="w-4 h-4 fill-amber-500" />
            </div>
          </div>
          <p className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
            5.0 ★
          </p>
          <p className="text-xs font-semibold text-slate-400">
            {t('profile.teachingStats.ratingDelta', 'Dựa trên phản hồi thực tế')}
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t('profile.teachingStats.totalRevenue', 'Doanh thu tích lũy')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 truncate">
            {totalRevenue.toLocaleString('vi-VN')}đ
          </p>
          <p className="text-xs font-semibold text-slate-400">
            {t('profile.teachingStats.revenueDelta', 'Thu nhập từ khóa học')}
          </p>
        </div>
      </div>

      {/* Teacher Quick Studio Action Banner */}
      <section className="p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-indigo-900/90 via-indigo-950 to-slate-900 text-white shadow-xl border border-indigo-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-1.5 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            Studio Giảng Viên
          </div>
          <h2 className="text-xl font-bold tracking-tight">
            Quản lý và phát triển học liệu của bạn
          </h2>
          <p className="text-xs sm:text-sm text-indigo-200/80">
            Tạo khóa học mới, chỉnh sửa bài giảng video, biên soạn đề thi trắc nghiệm và theo dõi học viên.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0 w-full sm:w-auto">
          <Link to="/teacher/courses/new" state={{ from: '/profile' }} className="w-full sm:w-auto">
            <Button
              variant="primary"
              size="md"
              className="w-full sm:w-auto rounded-xl font-bold shadow-lg shadow-indigo-500/30"
              leftIcon={<Plus className="w-4 h-4" />}
            >
              {t('profile.teachingStats.createNewCourse', '+ Tạo khóa học mới')}
            </Button>
          </Link>
          <Link to="/teacher-courses" className="w-full sm:w-auto">
            <Button
              variant="outline"
              size="md"
              className="w-full sm:w-auto rounded-xl bg-white/10 text-white border-white/20 hover:bg-white/20 font-bold"
              leftIcon={<Layers className="w-4 h-4" />}
            >
              {t('profile.teachingStats.manageCourses', 'Quản lý khóa học')}
            </Button>
          </Link>
        </div>
      </section>

      {/* Teaching Courses Showcase Grid */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-white/10 pb-4">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
              <BookOpen className="w-6 h-6 text-indigo-500" />
              {t('profile.teachingCourses.title', 'Khóa học đang phụ trách')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {t('profile.teachingCourses.subtitle', 'Danh sách các khóa học do bạn biên soạn và giảng dạy trên hệ thống.')}
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 w-fit">
            {courses.length} {t('common.courses', 'khóa học')}
          </span>
        </div>

        {isLoadingCourses ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-64 bg-slate-200 dark:bg-white/5 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : courses.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course: any) => {
              const price = Number(course.price || 0);
              return (
                <div
                  key={course._id}
                  className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    {/* Thumbnail */}
                    <div className="aspect-video w-full bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
                      {course.thumbnailUrl ? (
                        <img
                          src={course.thumbnailUrl}
                          alt={lv(course.title)}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-400">
                          <BookOpen className="w-10 h-10 opacity-50" />
                        </div>
                      )}
                      <div className="absolute top-3 right-3">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider backdrop-blur-md shadow-sm ${
                          course.status === 'published'
                            ? 'bg-emerald-500/90 text-white'
                            : 'bg-amber-500/90 text-white'
                        }`}>
                          {course.status === 'published' ? 'Đã xuất bản' : 'Bản nháp'}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-3">
                      <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                        <span className="text-indigo-500 font-bold">{lv(course.category?.name) || 'Chung'}</span>
                        <span>{t('profile.teachingCourses.studentsCount', { count: course.students || 0 })}</span>
                      </div>

                      <h3 className="font-bold text-lg text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {lv(course.title)}
                      </h3>

                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {lv(course.description)}
                      </p>

                      <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-white/5">
                        <span className="text-base font-black text-slate-900 dark:text-white">
                          {price === 0 ? t('profile.teachingCourses.free', 'Miễn phí') : `${price.toLocaleString('vi-VN')}đ`}
                        </span>
                        <div className="flex items-center gap-1 text-xs font-semibold text-amber-500">
                          <Star className="w-3.5 h-3.5 fill-amber-500" />
                          <span>{course.averageRating ? Number(course.averageRating).toFixed(1) : '5.0'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-6 pt-0 flex gap-2.5">
                    <Link to={`/teacher/courses/${course._id}/curriculum`} state={{ from: '/profile' }} className="flex-1">
                      <Button variant="primary" size="sm" fullWidth className="font-semibold" leftIcon={<FileEdit className="w-3.5 h-3.5" />}>
                        {t('profile.teachingCourses.editCurriculum', 'Soạn giáo án')}
                      </Button>
                    </Link>
                    <Link to={`/courses/${course._id}`}>
                      <Button variant="outline" size="sm" className="font-semibold" title={t('profile.teachingCourses.viewDetails', 'Xem chi tiết')}>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 px-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-sm space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
              <BookOpen className="w-8 h-8" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {t('profile.teachingCourses.noCourses', 'Bạn chưa có khóa học nào')}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                {t('profile.teachingCourses.noCoursesDesc', 'Hãy bắt đầu hành trình giảng dạy bằng cách xuất bản khóa học đầu tiên của bạn!')}
              </p>
            </div>
            <Link to="/teacher/courses/new" state={{ from: '/profile' }} className="inline-block pt-2">
              <Button variant="primary" className="rounded-xl font-bold px-6 shadow-lg shadow-indigo-500/25">
                {t('profile.teachingCourses.createFirstCourse', 'Tạo khóa học ngay →')}
              </Button>
            </Link>
          </div>
        )}
      </section>
    </div>
  );
};

// ============================================================================
// LEARNING STORY & 30-DAY ACTIVITY MATRIX (FOR STUDENTS & PERSONAL LEARNING)
// ============================================================================

const LearningStory: React.FC = () => {
  const { t } = useTranslation();
  const user = useSelector(selectCurrentUser);
  const totalFocusHours = user?.totalFocusMinutes ? Math.round(user.totalFocusMinutes / 60) : 0;
  const lessonsCompleted = user?.studyHistory?.reduce((acc: number, curr: any) => acc + (curr.lessonsCompleted || 0), 0) || 0;

  // Heatmap generation: last 30 days
  const today = new Date();
  const getDaysArray = function(start: Date, end: Date) {
    for (var arr = [], dt = new Date(start); dt <= new Date(end); dt.setDate(dt.getDate() + 1)) {
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

  const activeDaysCount = dayLabels.filter(d => (historyMap.get(d)?.lessonsCompleted || 0) > 0).length;

  return (
    <div className="space-y-10">
      {/* 4 Personal KPI Stats Cards */}
      <section className="p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-sm">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
            <p className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white">{totalFocusHours}</p>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-500" />
              {t('profile.stats.hoursLearned', 'Giờ đã học')}
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
            <p className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white">{lessonsCompleted}</p>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              {t('profile.stats.lessonsDone', 'Bài hoàn thành')}
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
            <p className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white">{user?.xp || 0}</p>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              {t('profile.stats.totalXp', 'Tổng điểm XP')}
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
            <p className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white">{user?.studyStreakDays || 0}</p>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-rose-500" />
              {t('profile.stats.dayStreak', 'Chuỗi ngày')}
            </p>
          </div>
        </div>
      </section>

      {/* Achievements Card */}
      <section className="p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            {t('profile.stats.achievements', 'Thành tích')}
          </h3>
          <span className="text-xs font-semibold text-slate-400">
            {user?.badges?.length || 0} {t('profile.stats.achievements', 'Huy hiệu')}
          </span>
        </div>

        {(!user?.badges || user.badges.length === 0) ? (
          <div className="text-center py-8 px-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-dashed border-slate-200 dark:border-white/10">
            <span className="text-4xl mb-3 block">🏆</span>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('profile.stats.noBadges', 'Chưa đạt huy hiệu nào.')}</p>
            <p className="text-xs text-slate-400 mt-1">{t('profile.stats.keepLearning', 'Hãy tiếp tục học để mở khóa huy hiệu!')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3.5">
            {user.badges.map((badge: any, idx: number) => (
              <div key={idx} className="flex flex-col items-center gap-2 p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-white/10 rounded-2xl relative group hover:shadow-md transition-all">
                <span className="text-3xl group-hover:scale-110 transition-transform">{badge.icon || '🏅'}</span>
                <span className="text-xs font-bold text-center text-slate-700 dark:text-slate-300 line-clamp-2">{badge.name}</span>
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[11px] py-1 px-2.5 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-20 shadow-xl">
                  {badge.description}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Structured 30-Day Activity Matrix */}
      <section className="p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-white/5 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-500" />
              {t('profile.activityMatrix.title', 'Nhật ký chuyên cần (30 ngày qua)')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {t('profile.activityMatrix.streakTip', 'Duy trì học tập mỗi ngày để giữ vững chuỗi và thăng hạng!')}
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold border border-indigo-200/60 dark:border-indigo-500/20">
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            {t('profile.activityMatrix.activeDays', { count: activeDaysCount })}
          </div>
        </div>

        {/* 30 Day Tiles Grid */}
        <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-10 gap-2.5">
          {dayLabels.map(dateStr => {
            const record = historyMap.get(dateStr);
            const count = record?.lessonsCompleted || 0;
            const intensity = count > 0 ? Math.min(count, 4) : 0;
            const dayNumber = new Date(dateStr).getDate();
            const monthNumber = new Date(dateStr).getMonth() + 1;

            const intensityStyles = [
              'bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-slate-400 dark:text-slate-500',
              'bg-indigo-100 dark:bg-indigo-950/70 border border-indigo-300 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold',
              'bg-indigo-300 dark:bg-indigo-800 border border-indigo-400 dark:border-indigo-700 text-indigo-900 dark:text-indigo-100 font-bold',
              'bg-indigo-500 border border-indigo-600 text-white font-bold shadow-sm',
              'bg-indigo-600 border border-indigo-700 text-white font-black shadow-[0_0_10px_rgba(99,102,241,0.5)]'
            ];

            return (
              <div
                key={dateStr}
                title={`${dateStr}: ${count} ${t('profile.stats.lessons', 'bài học')}`}
                className={`h-11 rounded-xl ${intensityStyles[intensity]} flex flex-col items-center justify-center p-1 cursor-pointer transition-all duration-200 hover:scale-105 hover:ring-2 hover:ring-indigo-400 relative group`}
              >
                <span className="text-[11px] leading-none">{dayNumber}</span>
                <span className="text-[9px] opacity-70 leading-none mt-0.5">T{monthNumber}</span>
                {count > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-2">
            <span>{t('profile.activityMatrix.less', 'Ít')}</span>
            <div className="flex gap-1.5">
              <div className="w-3.5 h-3.5 rounded-md bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10" />
              <div className="w-3.5 h-3.5 rounded-md bg-indigo-100 dark:bg-indigo-950/70 border border-indigo-300 dark:border-indigo-800" />
              <div className="w-3.5 h-3.5 rounded-md bg-indigo-300 dark:bg-indigo-800" />
              <div className="w-3.5 h-3.5 rounded-md bg-indigo-500" />
              <div className="w-3.5 h-3.5 rounded-md bg-indigo-600" />
            </div>
            <span>{t('profile.activityMatrix.more', 'Nhiều')}</span>
          </div>

          <span className="text-[11px] text-slate-400 italic">
            * Mỗi ô biểu thị một ngày trong tháng với số lượng bài học hoàn thành
          </span>
        </div>
      </section>
    </div>
  );
};

const EmptyState: React.FC<{ title: string; description: string }> = ({ title, description }) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-sm">
      <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-4">
        <BookOpen className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mt-1">{description}</p>
      <Link to="/courses" className="mt-5">
        <Button variant="primary" className="rounded-xl font-bold px-6">
          {t('myLearning.exploreCatalog', 'Khám phá danh mục khóa học →')}
        </Button>
      </Link>
    </div>
  );
};

// ============================================================================
// MAIN PROFILE COMPONENT
// ============================================================================

const Profile: React.FC = () => {
  const { t } = useTranslation();
  const lv = useLocalizedValue();
  const user = useSelector(selectCurrentUser);
  const isTeacherOrAdmin = user?.role === 'teacher' || user?.role === 'instructor' || user?.role === 'admin';

  const [activeTab, setActiveTab] = useState<'teaching' | 'learning'>(isTeacherOrAdmin ? 'teaching' : 'learning');
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [specialty, setSpecialty] = useState('');
  const [bio, setBio] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [applySuccessMessage, setApplySuccessMessage] = useState('');

  // Fetch teacher's created courses
  const { data: teacherCoursesData, isLoading: isLoadingTeacherCourses } = useQuery({
    queryKey: ['teacher-courses-profile'],
    queryFn: () => courseApi.getMyCourses({ limit: 100 }),
    enabled: !!user && isTeacherOrAdmin
  });
  const teacherCourses = teacherCoursesData?.data?.courses || [];

  // Fetch teacher analytics overview
  const { data: analyticsData } = useQuery({
    queryKey: ['teacher-analytics-profile'],
    queryFn: () => analyticsApi.getTeacherDashboard(),
    enabled: !!user && isTeacherOrAdmin
  });
  const analyticsOverview = analyticsData?.data?.overview;

  // Fetch student enrollments
  const { data: enrollmentsData, isLoading: isLoadingEnrollments } = useQuery({
    queryKey: ['my-enrollments'],
    queryFn: () => enrollmentApi.getMyEnrollments(),
    enabled: !!user
  });
  const enrollments = enrollmentsData?.data?.enrollments || [];

  // Fetch student certificates
  const { data: certificates, isLoading: isLoadingCertificates } = useQuery({
    queryKey: ['my-certificates'],
    queryFn: () => certificateApi.getMyCertificates(),
    enabled: !!user
  });

  const queryClient = useQueryClient();

  // Fetch teacher application status (student only)
  const { data: appStatusData } = useQuery({
    queryKey: ['my-application-status'],
    queryFn: () => adminApi.getMyApplicationStatus(),
    enabled: !!user && user.role === 'student'
  });

  const latestApp = appStatusData?.data?.application;

  const { mutate: submitApplication, isPending: isApplyPending } = useMutation({
    mutationFn: (data: { specialty: string; bio: string; resumeUrl: string }) => adminApi.applyToTeach(data),
    onSuccess: () => {
      setApplySuccessMessage(t('profile.applyModal.successMsg', 'Hồ sơ đăng ký giảng viên đã được gửi thành công! Vui lòng chờ Admin phê duyệt.'));
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
          <InlineLoader />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell wide>
      <div className="max-w-[1200px] mx-auto w-full pt-8 pb-16 px-4 sm:px-6 lg:px-0 flex flex-col gap-10">

        {/* Profile Hero */}
        <ProfileHero />

        {/* Role-Aware Tab Switcher (For Teachers / Admins) */}
        {isTeacherOrAdmin && (
          <div className="flex items-center gap-3 p-1.5 bg-slate-100 dark:bg-white/5 rounded-2xl w-fit border border-slate-200 dark:border-white/10 shadow-sm">
            <button
              onClick={() => setActiveTab('teaching')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'teaching'
                  ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <GraduationCap className="w-4 h-4 text-indigo-500 dark:text-indigo-200" />
              {t('profile.teachingTab', 'Hồ sơ Giảng dạy')}
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-50 dark:bg-white/20 text-indigo-600 dark:text-white">
                {teacherCourses.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('learning')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'learning'
                  ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <BookOpen className="w-4 h-4 text-cyan-500 dark:text-cyan-200" />
              {t('profile.learningTab', 'Học tập Cá nhân')}
            </button>
          </div>
        )}

        {/* Main Body Content based on Role and Active Tab */}
        {isTeacherOrAdmin && activeTab === 'teaching' ? (
          <TeachingPortfolio
            courses={teacherCourses}
            isLoadingCourses={isLoadingTeacherCourses}
            analyticsOverview={analyticsOverview}
          />
        ) : (
          <div className="space-y-12">
            {/* Student Learning Metrics & 30-Day Activity Matrix */}
            <LearningStory />

            {/* Instructor Application Banner / Tracker (Student only) */}
            {user?.role === 'student' && (
              latestApp ? (
                <section className="bg-gradient-to-r from-slate-900 to-slate-950 rounded-3xl p-8 text-white relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl border border-white/5">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[80px] rounded-full pointer-events-none" />
                  <div className="relative z-10 space-y-3 max-w-xl">
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-bold tracking-tight">{t('profile.instructorBanner.title')}</h2>
                      {latestApp.status === 'pending' && (
                        <span className="px-3 py-1 text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full uppercase tracking-wider">
                          {t('profile.instructorBanner.pending')}
                        </span>
                      )}
                      {latestApp.status === 'approved' && (
                        <span className="px-3 py-1 text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full uppercase tracking-wider">
                          {t('profile.instructorBanner.approved')}
                        </span>
                      )}
                      {latestApp.status === 'rejected' && (
                        <span className="px-3 py-1 text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full uppercase tracking-wider">
                          {t('profile.instructorBanner.rejected')}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-slate-300">
                      {t('profile.instructorBanner.specialty')} <strong className="text-slate-100">{latestApp.specialty}</strong>
                    </p>

                    {latestApp.status === 'pending' && (
                      <p className="text-sm text-slate-400 italic">{t('profile.instructorBanner.pendingMsg')}</p>
                    )}

                    {latestApp.status === 'approved' && (
                      <p className="text-sm text-emerald-400 font-medium">{t('profile.instructorBanner.approvedMsg')}</p>
                    )}

                    {latestApp.status === 'rejected' && (
                      <div className="space-y-2">
                        <p className="text-sm text-rose-400 font-medium">{t('profile.instructorBanner.rejectedMsg')}</p>
                        {latestApp.adminNotes && (
                          <p className="text-xs text-slate-400 bg-black/30 p-3 rounded-xl border border-white/5 font-mono italic">
                            {t('profile.instructorBanner.adminFeedback')} {latestApp.adminNotes}
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
                        {t('profile.instructorBanner.reapplyBtn')}
                      </Button>
                    </div>
                  )}
                </section>
              ) : (
                <section className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 rounded-3xl p-8 text-white relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl border border-indigo-500/20">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />
                  <div className="relative z-10 space-y-2 max-w-xl">
                    <h2 className="text-2xl font-bold tracking-tight">{t('profile.instructorBanner.becomeTeacher')}</h2>
                    <p className="text-sm text-indigo-200">{t('profile.instructorBanner.becomeTeacherDesc')}</p>
                  </div>
                  <div className="relative z-10">
                    <Button 
                      variant="pill" 
                      className="bg-white text-indigo-900 hover:bg-slate-100 hover:text-indigo-950 font-bold px-6 shrink-0"
                      onClick={() => setShowApplyModal(true)}
                    >
                      {t('profile.instructorBanner.applyToTeachBtn')}
                    </Button>
                  </div>
                </section>
              )
            )}

            {/* Active Enrolled Courses */}
            <section className="space-y-6">
              <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
                <BookOpen className="w-6 h-6 text-indigo-500" />
                {t('profile.activeWorkspace', 'Khóa học đang học')}
              </h2>
              {isLoadingEnrollments ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="h-48 bg-slate-200 dark:bg-white/5 rounded-3xl animate-pulse" />
                  ))}
                </div>
              ) : enrollments && enrollments.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {enrollments.map((enrollment: any) => {
                    const c = enrollment.course;
                    if (!c) return null;
                    return (
                      <div key={enrollment._id} className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col justify-between h-full">
                        <div>
                          <div className="aspect-video w-full bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
                            {c.thumbnailUrl ? (
                              <img src={c.thumbnailUrl} alt={lv(c.title)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            ) : (
                              <div className="w-full h-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-400">No Image</div>
                            )}
                          </div>
                          <div className="p-6 space-y-2">
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white line-clamp-1">{lv(c.title)}</h3>
                            <p className="text-xs text-slate-500 line-clamp-2">{lv(c.description)}</p>
                          </div>
                        </div>
                        <div className="p-6 pt-0">
                          <Link to={`/courses/${c._id}/learn`}>
                            <Button className="w-full font-semibold" variant="pill">{t('profile.continueLearning')}</Button>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState
                  title={t('profile.noActiveCourses', 'Chưa có khóa học nào')}
                  description={t('profile.noActiveCoursesDesc', 'Đăng ký khóa học để bắt đầu lộ trình học tập của bạn.')}
                />
              )}
            </section>

            {/* Certificates */}
            <section className="space-y-6">
              <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
                <Award className="w-6 h-6 text-amber-500" />
                {t('profile.verifiedSkills', 'Kỹ năng & Chứng chỉ đã xác thực')}
              </h2>
              {isLoadingCertificates ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2].map((n) => (
                    <div key={n} className="h-32 bg-slate-200 dark:bg-white/5 rounded-3xl animate-pulse" />
                  ))}
                </div>
              ) : certificates && certificates.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {certificates.map((cert: any) => {
                    const c = typeof cert.course === 'object' ? cert.course : { title: 'Completed Course' };
                    return (
                      <div key={cert._id} className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl p-6 flex flex-col justify-between h-full gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">{t('profile.certificate')}</span>
                            <span className="text-[10px] font-mono text-slate-400">{cert.certificateId}</span>
                          </div>
                          <h3 className="font-bold text-lg text-slate-900 dark:text-white line-clamp-1">{lv(c.title)}</h3>
                          <p className="text-xs text-slate-500">{t('profile.issuedOn')} {new Date(cert.issueDate).toLocaleDateString()}</p>
                        </div>
                        {cert.pdfUrl && (
                          <a href={cert.pdfUrl} target="_blank" rel="noopener noreferrer" className="w-full">
                            <Button className="w-full" variant="outline">{t('profile.viewPdf')}</Button>
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState
                  title={t('profile.noCertificates', 'Chưa có chứng chỉ nào')}
                  description={t('profile.noCertificatesDesc', 'Hoàn thành 100% khóa học để nhận chứng chỉ đầu tiên của bạn.')}
                />
              )}
            </section>
          </div>
        )}

      </div>

      {showApplyModal && createPortal(
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 w-full max-w-md rounded-2xl p-6 shadow-xl space-y-6 my-auto max-h-[90vh] overflow-y-auto">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('profile.applyModal.title')}</h3>
              <p className="text-sm text-slate-500 mt-1">{t('profile.applyModal.subtitle')}</p>
            </div>

            {applySuccessMessage ? (
              <div className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 p-4 rounded-xl text-sm text-center font-medium">
                {applySuccessMessage}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">{t('profile.applyModal.specialtyLabel')}</label>
                  <input 
                    type="text"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    placeholder={t('profile.applyModal.specialtyPlaceholder')}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">{t('profile.applyModal.bioLabel')}</label>
                  <textarea 
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder={t('profile.applyModal.bioPlaceholder')}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none min-h-[100px]"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">{t('profile.applyModal.resumeLabel')}</label>
                  <input 
                    type="text"
                    value={resumeUrl}
                    onChange={(e) => setResumeUrl(e.target.value)}
                    placeholder={t('profile.applyModal.resumePlaceholder')}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={() => setShowApplyModal(false)}>{t('profile.applyModal.cancel')}</Button>
                  <Button 
                    onClick={() => {
                      submitApplication({ specialty, bio, resumeUrl });
                    }}
                    disabled={isApplyPending || !specialty.trim() || !bio.trim() || !resumeUrl.trim()}
                  >
                    {isApplyPending ? t('profile.applyModal.submitting') : t('profile.applyModal.submit')}
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

export default Profile;
