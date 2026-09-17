import React, { useMemo, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, MotionProps } from 'framer-motion';
import {
  Button,
  EmptyState,
  FilterBar,
  MetricsSurface,
  Modal,
  SectionLead,
  SkeletonTable,
  Toast,
  ActionDropdown
} from '../components/ui';
import { Input } from '../components/ui/Input';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { courseApi } from '../services/course.api';
import { categoryApi } from '../services/category.api';
import { userApi } from '../services/user.api';
import { uploadApi } from '../services/upload.api';
import { analyticsApi } from '../services/analytics.api';
import { adminApi } from '../services/admin.api';
import { LessonManager } from '../components/admin/LessonManager';
import { QuizManager } from '../components/admin/QuizManager';
import { useNavigate } from 'react-router-dom';
import { useLocalizedValue } from '../utils/localized';
import { Upload, Image as ImageIcon, Trash2, Loader2 } from 'lucide-react';

type CourseStatus = 'draft' | 'published';

type Course = {
  id: string;
  title: string;
  categoryId: string;
  categoryName: string;
  lessons: number;
  price: number;
  estimatedPrice?: number;
  discountPercentage?: number;
  students: number;
  status: CourseStatus;
  updatedAt: string;
  instructorId?: string;
  thumbnailUrl?: string;
};

type CourseFormState = {
  title: string;
  description: string;
  categoryId: string;
  instructorId: string;
  price: string;
  estimatedPrice: string;
  discountPercentage: string;
  status: CourseStatus;
  thumbnailUrl: string;
};

const MotionTr = motion.tr as unknown as React.FC<
  React.PropsWithChildren<React.HTMLAttributes<HTMLTableRowElement> & MotionProps>
>;

const emptyForm: CourseFormState = {
  title: '',
  description: '',
  categoryId: '',
  instructorId: '',
  price: '0',
  estimatedPrice: '0',
  discountPercentage: '0',
  status: 'draft',
  thumbnailUrl: ''
};

const statusTone: Record<string, string> = {
  draft: 'status-badge-neutral',
  published: 'status-badge-success'
};

interface CourseManagementTabProps {
  teacherMode?: boolean;
}

const CourseManagementTab: React.FC<CourseManagementTabProps> = ({ teacherMode = false }) => {
  const { t } = useTranslation();
  const lv = useLocalizedValue();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const stepList = [t('admin.courseManagement.draftStep'), t('admin.courseManagement.publishStep')];

  const { data: responseData, isLoading } = useQuery({
    queryKey: [teacherMode ? 'teacher-courses' : 'admin-courses', page, search, selectedCategory],
    queryFn: () => {
      const params = { page, limit: 10, search: search || undefined, category: selectedCategory === 'All' ? undefined : selectedCategory };
      return teacherMode ? courseApi.getMyCourses(params) : courseApi.getAllCourses(params);
    }
  });
  
  const totalPages = responseData?.data?.totalPages || 1;

  const { data: categoryData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryApi.getAllCategories()
  });

  const { data: teacherData } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => userApi.getAllUsers({ role: 'teacher' }),
    enabled: !teacherMode
  });

  const { data: analyticsData } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: analyticsApi.getAdminDashboard,
    enabled: !teacherMode,
    staleTime: 60000
  });

  const { data: pendingCountsData } = useQuery({
    queryKey: ['admin-pending-counts'],
    queryFn: adminApi.getPendingCounts,
    enabled: !teacherMode,
    staleTime: 60000
  });

  const categoriesData = useMemo(() => categoryData?.data?.categories || [], [categoryData]);
  const teachers = useMemo(() => teacherData?.data?.users || [], [teacherData]);

  const courses: Course[] = useMemo(() => {
    if (!responseData?.data?.courses) return [];
    return responseData.data.courses.map((course: any) => ({
      id: course._id,
      title: lv(course.title),
      categoryId: course.category?._id || '',
      categoryName: lv(course.category?.name) || 'Uncategorized',
      lessons: course.lessonsCount || 0,
      price: Number(course.price) || 0,
      estimatedPrice: Number(course.estimatedPrice || course.price) || 0,
      discountPercentage: Number(course.discountPercentage) || 0,
      students: course.studentsCount || 0,
      status: course.status,
      updatedAt: new Date(course.updatedAt).toLocaleDateString(),
      instructorId: course.instructor?._id,
      thumbnailUrl: course.thumbnailUrl || course.thumbnail?.url || course.thumbnail || ''
    }));
  }, [responseData]);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [publishingCourse, setPublishingCourse] = useState<Course | null>(null);
  const [managingLessonsCourse, setManagingLessonsCourse] = useState<Course | null>(null);
  const [managingQuizzesCourse, setManagingQuizzesCourse] = useState<Course | null>(null);
  const [workflowStep, setWorkflowStep] = useState(0);
  const [form, setForm] = useState<CourseFormState>(emptyForm);
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const [selectedCourseIds, setSelectedCourseIds] = useState<Set<string>>(new Set());

  const filteredCourses = courses;

  const sortedCourses = useMemo(() => {
    let sortableItems = [...filteredCourses];
    if (sortConfig !== null) {
      sortableItems.sort((a: any, b: any) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (sortConfig.key === 'updatedAt') {
          const parseDate = (dStr: string) => {
            const parts = dStr.split('/');
            if (parts.length === 3) return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`).getTime();
            return new Date(dStr).getTime();
          };
          aValue = parseDate(aValue);
          bValue = parseDate(bValue);
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [filteredCourses, sortConfig]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const handleNextPage = () => setPage(p => Math.min(p + 1, totalPages));
  const handlePrevPage = () => setPage(p => Math.max(p - 1, 1));

  const toggleSelectAll = () => {
    if (selectedCourseIds.size === sortedCourses.length) {
      setSelectedCourseIds(new Set());
    } else {
      setSelectedCourseIds(new Set(sortedCourses.map(c => c.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedCourseIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedCourseIds(newSet);
  };

  const summary = useMemo(() => {
    if (!teacherMode && analyticsData?.data?.overview) {
      const ov = analyticsData.data.overview;
      const pc = pendingCountsData?.data || {};
      const totalCoursesDb = responseData?.data?.total || ov.totalCourses || 0;
      const publishedCount = ov.totalCourses || 0;
      const reviewCount = pc.pendingCourses || 0;
      const draftCount = Math.max(0, totalCoursesDb - publishedCount);
      return {
        published: publishedCount,
        review: reviewCount,
        draft: draftCount,
        revenue: ov.totalRevenue || 0
      };
    }
    const published = courses.filter((course) => course.status === 'published').length;
    const review = 0;
    const draft = courses.filter((course) => course.status === 'draft').length;
    const revenue = courses.reduce((sum, course) => sum + course.price * course.students, 0);
    return { published, review, draft, revenue };
  }, [courses, teacherMode, analyticsData, pendingCountsData, responseData]);

  const metrics = [
    { label: t('admin.courseManagement.metrics.totalRevenue'), value: `${summary.revenue.toLocaleString('vi-VN')}đ`, delta: '+12.4%' },
    { label: t('admin.courseManagement.metrics.published'), value: summary.published.toString(), delta: t('admin.courseManagement.metrics.liveCourses') },
    { label: t('admin.courseManagement.metrics.inReview'), value: summary.review.toString(), delta: t('admin.courseManagement.metrics.needsApproval') },
    { label: t('admin.courseManagement.metrics.drafts'), value: summary.draft.toString(), delta: t('admin.courseManagement.metrics.readyToPublish') }
  ];

  const openCreate = () => {
    setForm(emptyForm);
    setCreateOpen(true);
  };

  const openEdit = (course: Course) => {
    const rawCourse = responseData?.data?.courses.find((c: any) => c._id === course.id);
    setEditingCourse(course);
    setForm({
      title: course.title,
      description: rawCourse?.description || '',
      categoryId: course.categoryId,
      instructorId: course.instructorId || '',
      price: course.price.toString(),
      estimatedPrice: (rawCourse?.estimatedPrice !== undefined ? rawCourse.estimatedPrice : course.price).toString(),
      discountPercentage: (rawCourse?.discountPercentage || 0).toString(),
      status: course.status,
      thumbnailUrl: rawCourse?.thumbnailUrl || rawCourse?.thumbnail || course.thumbnailUrl || ''
    });
    setEditOpen(true);
  };

  const createMutation = useMutation({
    mutationFn: (data: any) => courseApi.createCourse(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [teacherMode ? 'teacher-courses' : 'admin-courses'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setToast(t('admin.courseManagement.createdSuccess'));
      setCreateOpen(false);
    },
    onError: (error: any) => {
      setToast(error.response?.data?.message || 'Failed to create course. Please check all fields.');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => courseApi.updateCourse(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [teacherMode ? 'teacher-courses' : 'admin-courses'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setToast(t('admin.courseManagement.updatedSuccess'));
      setEditOpen(false);
      setEditingCourse(null);
    },
    onError: (error: any) => {
      setToast(error.response?.data?.message || 'Failed to update course. Please check all fields.');
    }
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'published' | 'draft' }) =>
      courseApi.approveCourse(id, status),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: [teacherMode ? 'teacher-courses' : 'admin-courses'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['admin-moderation-courses'] });
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
      setToast(vars.status === 'published' ? t('admin.courseManagement.publishedSuccess') : t('admin.courseManagement.withdrawnDraft'));
    },
    onError: (error: any) => {
      setToast(error.response?.data?.message || t('admin.courseManagement.statusChangeFailed'));
    }
  });

  const [approveConfirm, setApproveConfirm] = useState<{ id: string; currentStatus: CourseStatus } | null>(null);

  const saveCourse = () => {
    if (!form.title.trim()) {
      setToast(t('admin.courseManagement.titleRequired'));
      return;
    }
    if (!form.categoryId) {
      setToast(t('admin.courseManagement.categoryRequired'));
      return;
    }
    if (!form.description.trim()) {
      setToast(t('admin.courseManagement.descriptionRequired'));
      return;
    }

    const payload: Record<string, any> = {
      title: form.title,
      description: form.description,
      category: form.categoryId,
      price: Number(form.price),
      estimatedPrice: Number(form.estimatedPrice || form.price),
      discountPercentage: Number(form.discountPercentage || 0),
      status: form.status,
      thumbnailUrl: form.thumbnailUrl.trim() || undefined,
    };

    if (!teacherMode && form.instructorId) {
      payload.instructor = form.instructorId;
    }

    if (editingCourse) {
      updateMutation.mutate({ id: editingCourse.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const openPublish = (course: Course) => {
    setPublishingCourse(course);
    setWorkflowStep(course.status === 'draft' ? 0 : 1);
    setPublishOpen(true);
  };

  const advancePublish = () => {
    setWorkflowStep((current) => Math.min(current + 1, 1));
  };

  const confirmPublish = () => {
    if (!publishingCourse) return;
    updateMutation.mutate({ id: publishingCourse.id, data: { status: 'published' } });
    setPublishOpen(false);
  };

  return (
    <div className="flex flex-col gap-8">
      {!teacherMode && (
        <>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">{t('admin.courseManagement.title')}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('admin.courseManagement.subtitle')}</p>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={openCreate}>{t('admin.courseManagement.createBtn')}</Button>
            </div>
          </div>

          <MetricsSurface metrics={metrics} />
        </>
      )}

      {teacherMode && (
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t('teacher.courses.myCoursesTitle', 'Danh sách khóa học của bạn')}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {t('teacher.courses.myCoursesSubtitle', 'Quản lý bài giảng, biên tập giáo trình và theo dõi học viên đăng ký.')}
            </p>
          </div>
        </div>
      )}

      <FilterBar>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <Input
            type="search"
            value={search}
            onChange={(event) => { setSearch(event.target.value); setPage(1); }}
            placeholder={t('admin.courseManagement.searchPlaceholder')}
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            }
            onClear={() => { setSearch(''); setPage(1); }}
            className="max-w-lg flex-1"
          />

          <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-wrap lg:justify-end hide-scrollbar">
            {[{ _id: 'All', name: t('admin.users.tabAll') }, ...categoriesData].map((category) => {
              const isActive = selectedCategory === category._id;
              return (
                <button
                  key={category._id}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(category._id);
                    setPage(1);
                  }}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition duration-sm focus:outline-none focus:ring-4 focus:ring-primary-500/10 ${
                    isActive ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                  }`}
                >
                  {lv(category.name)}
                </button>
              );
            })}
          </div>
        </div>
      </FilterBar>

      <section>
        <SectionLead
          label={t('admin.courseManagement.catalogLabel')}
          title={t('admin.courseManagement.allCoursesTitle')}
          meta={<span className="text-sm tabular-nums text-slate-400">{t('admin.courseManagement.pageOf', { page, total: totalPages })}</span>}
        />

        {selectedCourseIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mt-4 px-4 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/50 flex flex-wrap items-center justify-between gap-3 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
                {t('admin.courseManagement.selectedItems', { count: selectedCourseIds.size, defaultValue: `Đã chọn ${selectedCourseIds.size} khóa học` })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  Array.from(selectedCourseIds).forEach(id => approveMutation.mutate({ id, status: 'published' }));
                  setSelectedCourseIds(new Set());
                }}
                className="px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors shadow-sm cursor-pointer"
              >
                {t('admin.courseManagement.bulkPublish', 'Duyệt xuất bản')}
              </button>
              <button
                type="button"
                onClick={() => {
                  Array.from(selectedCourseIds).forEach(id => approveMutation.mutate({ id, status: 'draft' }));
                  setSelectedCourseIds(new Set());
                }}
                className="px-3 py-1.5 text-xs font-bold bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-700 dark:text-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                {t('admin.courseManagement.bulkDraft', 'Chuyển về Draft')}
              </button>
              <button
                type="button"
                onClick={() => setSelectedCourseIds(new Set())}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 px-2 py-1 cursor-pointer"
              >
                {t('admin.courseManagement.clearSelection', 'Bỏ chọn')}
              </button>
            </div>
          </motion.div>
        )}

        <div className="canvas-surface mt-5 overflow-hidden">
          {isLoading ? (
            <SkeletonTable rows={4} />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-slate-200/60 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                      <th className="px-5 py-4 w-12">
                        <input 
                          type="checkbox" 
                          className="rounded border-slate-300 dark:border-slate-700 bg-transparent text-indigo-500 focus:ring-indigo-500/30 cursor-pointer"
                          checked={sortedCourses.length > 0 && selectedCourseIds.size === sortedCourses.length}
                          onChange={toggleSelectAll}
                        />
                      </th>
                      <th className="px-5 py-4 cursor-pointer group hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors" onClick={() => handleSort('title')}>
                        {t('admin.courseManagement.thCourse')} {sortConfig?.key === 'title' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : <span className="opacity-0 group-hover:opacity-30">↕</span>}
                      </th>
                      <th className="px-5 py-4 cursor-pointer group hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors" onClick={() => handleSort('lessons')}>
                        {t('admin.courseManagement.thLessons')} {sortConfig?.key === 'lessons' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : <span className="opacity-0 group-hover:opacity-30">↕</span>}
                      </th>
                      <th className="px-5 py-4 cursor-pointer group hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors" onClick={() => handleSort('price')}>
                        {t('admin.courseManagement.thPrice')} {sortConfig?.key === 'price' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : <span className="opacity-0 group-hover:opacity-30">↕</span>}
                      </th>
                      <th className="px-5 py-4 cursor-pointer group hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors" onClick={() => handleSort('students')}>
                        {t('admin.courseManagement.thStudents')} {sortConfig?.key === 'students' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : <span className="opacity-0 group-hover:opacity-30">↕</span>}
                      </th>
                      <th className="px-5 py-4 cursor-pointer group hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors" onClick={() => handleSort('status')}>
                        {t('admin.courseManagement.thStatus')} {sortConfig?.key === 'status' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : <span className="opacity-0 group-hover:opacity-30">↕</span>}
                      </th>
                      <th className="px-5 py-4 text-right">{t('admin.courseManagement.thActions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/60">
                    <AnimatePresence initial={false}>
                      {sortedCourses.map((course, index) => (
                        <MotionTr
                          key={course.id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.24, delay: index * 0.03 }}
                          className={`text-sm text-slate-700 dark:text-slate-200 transition duration-sm hover:bg-white/50 dark:hover:bg-slate-800/50 ${selectedCourseIds.has(course.id) ? 'bg-indigo-50 dark:bg-indigo-500/10' : ''}`}
                        >
                          <td className="px-5 py-4">
                            <input 
                              type="checkbox" 
                              className="rounded border-slate-300 dark:border-slate-700 bg-transparent text-indigo-500 focus:ring-indigo-500/30 cursor-pointer"
                              checked={selectedCourseIds.has(course.id)}
                              onChange={() => toggleSelect(course.id)}
                            />
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              {course.thumbnailUrl ? (
                                <img
                                  src={course.thumbnailUrl}
                                  alt=""
                                  className="w-12 h-8 rounded-lg object-cover bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200/80 dark:border-white/10 shadow-xs"
                                  loading="lazy"
                                  onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                                />
                              ) : (
                                <div className="w-12 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-500/20">
                                  <ImageIcon className="w-4 h-4 opacity-70" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="font-semibold text-slate-950 dark:text-white line-clamp-1" title={course.title}>{course.title}</div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{course.categoryName}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">{course.lessons}</td>
                          <td className="px-5 py-4">
                             <div className="flex flex-col">
                               <span className="font-semibold text-slate-900 dark:text-white">
                                 {Number(course.price || 0).toLocaleString('vi-VN')}đ
                               </span>
                               {course.discountPercentage && course.discountPercentage > 0 ? (
                                 <div className="flex items-center gap-1.5 mt-0.5">
                                   <span className="text-[10px] text-slate-400 line-through">
                                     {Number(course.estimatedPrice || 0).toLocaleString('vi-VN')}đ
                                   </span>
                                   <span className="text-[9px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/30 px-1 rounded">
                                     -{course.discountPercentage}%
                                   </span>
                                 </div>
                               ) : null}
                             </div>
                           </td>
                          <td className="px-5 py-4">{course.students.toLocaleString('vi-VN')}</td>
                          <td className="px-5 py-4">
                            <div className="flex flex-col items-start gap-1">
                              <span className={`status-badge ${statusTone[course.status]} capitalize font-medium`}>{course.status}</span>
                              <span className="text-[10px] text-slate-400">{course.updatedAt}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end">
                              <ActionDropdown>
                                <button
                                  type="button"
                                  className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                  onClick={() => navigate(`/teacher/courses/${course.id}/curriculum`, { state: { from: teacherMode ? '/teacher-courses' : '/admin-dashboard/content' } })}
                                >
                                  {t('admin.courseManagement.manageLessons')}
                                </button>
                                <button
                                  type="button"
                                  className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                  onClick={() => setManagingQuizzesCourse(course)}
                                >
                                  {t('admin.courseManagement.manageQuizzes')}
                                </button>
                                <button
                                  type="button"
                                  className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                  onClick={() => openEdit(course)}
                                >
                                  {t('admin.courseManagement.editDetails')}
                                </button>
                                {/* Approve/Reject — chỉ admin */}
                                {!teacherMode && (
                                  <button
                                    type="button"
                                    className={`w-full text-left px-4 py-2 text-xs font-semibold transition-colors ${
                                      course.status === 'published' 
                                        ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10' 
                                        : 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10'
                                    }`}
                                    onClick={() => setApproveConfirm({ id: course.id, currentStatus: course.status })}
                                  >
                                    {course.status === 'published' ? t('admin.courseManagement.unpublishCourse') : t('admin.courseManagement.approveCourse')}
                                  </button>
                                )}
                                {teacherMode && (
                                  <button 
                                    type="button"
                                    className="w-full text-left px-4 py-2 text-xs font-semibold text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
                                    onClick={() => openPublish(course)}
                                  >
                                    {t('admin.courseManagement.publishCourse')}
                                  </button>
                                )}
                              </ActionDropdown>
                            </div>
                          </td>
                        </MotionTr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>

              {sortedCourses.length === 0 ? (
                <div className="px-5 py-12">
                  {teacherMode ? (
                    <div className="flex flex-col items-center justify-center text-center space-y-6 max-w-xl mx-auto py-6">
                      <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 dark:text-indigo-400 text-3xl shadow-lg">
                        🚀
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t('admin.courseManagement.teacherEmptyTitle')}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {t('admin.courseManagement.teacherEmptySubtitle')}
                        </p>
                      </div>

                      <div className="grid sm:grid-cols-3 gap-4 w-full text-left pt-2">
                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 space-y-2">
                          <span className="w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-black flex items-center justify-center">1</span>
                          <h4 className="font-bold text-xs text-slate-900 dark:text-white">{t('admin.courseManagement.teacherStep1Title')}</h4>
                          <p className="text-[11px] text-slate-500">{t('admin.courseManagement.teacherStep1Desc')}</p>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 space-y-2">
                          <span className="w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-black flex items-center justify-center">2</span>
                          <h4 className="font-bold text-xs text-slate-900 dark:text-white">{t('admin.courseManagement.teacherStep2Title')}</h4>
                          <p className="text-[11px] text-slate-500">{t('admin.courseManagement.teacherStep2Desc')}</p>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 space-y-2">
                          <span className="w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-black flex items-center justify-center">3</span>
                          <h4 className="font-bold text-xs text-slate-900 dark:text-white">{t('admin.courseManagement.teacherStep3Title')}</h4>
                          <p className="text-[11px] text-slate-500">{t('admin.courseManagement.teacherStep3Desc')}</p>
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          onClick={() => navigate('/teacher/courses/new', { state: { from: teacherMode ? '/teacher-courses' : '/admin-dashboard/content' } })}
                          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all active:scale-95"
                        >
                          {t('admin.courseManagement.createFirstCourse')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <EmptyState
                      title={t('admin.courseManagement.emptyFilterTitle')}
                      message={t('admin.courseManagement.emptyFilterMessage')}
                    />
                  )}
                </div>
              ) : null}

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-4 border-t border-slate-200/60 dark:border-slate-800">
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    {t('admin.courseManagement.showingPage', { page, total: totalPages })}
                  </span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handlePrevPage} disabled={page === 1}>{t('admin.courseManagement.previous')}</Button>
                    <Button variant="outline" size="sm" onClick={handleNextPage} disabled={page === totalPages}>{t('admin.courseManagement.next')}</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Floating Bulk Action Bar */}
        <AnimatePresence>
          {selectedCourseIds.size > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 dark:bg-[#0a0a0a] border border-slate-700 dark:border-white/10 shadow-2xl rounded-full px-6 py-4 flex items-center gap-6 text-white"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500 text-xs font-bold text-white">
                  {selectedCourseIds.size}
                </div>
                <span className="text-sm font-semibold whitespace-nowrap">{t('admin.courseManagement.selectedCourses', { count: selectedCourseIds.size })}</span>
              </div>
              <div className="h-6 w-px bg-white/20"></div>
              <div className="flex items-center gap-2">
                <button className="px-4 py-2 bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase tracking-wider rounded-full hover:bg-emerald-500/20 transition-colors">{t('admin.courseManagement.approveAll')}</button>
                <button className="px-4 py-2 bg-rose-500/10 text-rose-400 text-xs font-bold uppercase tracking-wider rounded-full hover:bg-rose-500/20 transition-colors">{t('admin.courseManagement.delete')}</button>
                <button 
                  onClick={() => setSelectedCourseIds(new Set())}
                  className="px-4 py-2 bg-white/5 text-white/50 text-xs font-bold uppercase tracking-wider rounded-full hover:bg-white/10 hover:text-white transition-colors ml-2"
                >
                  {t('admin.courseManagement.cancel')}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} size="lg">
        <div className="space-y-5">
          <div>
            <p className="section-label">{t('admin.courseManagement.createModalLabel')}</p>
            <h2 className="mt-2 section-title">{t('admin.courseManagement.createCourse')}</h2>
          </div>
          <CourseForm form={form} setForm={setForm} categories={categoriesData} teachers={teachers} teacherMode={teacherMode} onToast={setToast} />
          <div className="mt-4 flex flex-wrap justify-end gap-3">
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              {t('admin.courseManagement.cancel')}
            </Button>
            <Button onClick={saveCourse}>{t('admin.courseManagement.createBtn')}</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} size="lg">
        <div className="space-y-5">
          <div>
            <p className="section-label">{t('admin.courseManagement.editModalLabel')}</p>
            <h2 className="mt-2 section-title">{t('admin.courseManagement.editCourse')}</h2>
          </div>
          <CourseForm form={form} setForm={setForm} categories={categoriesData} teachers={teachers} teacherMode={teacherMode} onToast={setToast} />
          <div className="mt-4 flex flex-wrap justify-end gap-3">
            <Button variant="ghost" onClick={() => setEditOpen(false)}>
              {t('admin.courseManagement.cancel')}
            </Button>
            <Button onClick={saveCourse}>{t('admin.courseManagement.saveChanges')}</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={publishOpen} onClose={() => setPublishOpen(false)}>
        <div className="space-y-5">
          <div>
            <p className="section-label">{t('admin.courseManagement.publishWorkflowLabel')}</p>
            <h2 className="mt-2 section-title">{publishingCourse?.title}</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t('admin.courseManagement.publishWorkflowDesc')}</p>
          </div>

          <div className="flex gap-3">
            {stepList.map((step, index) => {
              const isActive = index <= workflowStep;
              return (
                <div
                  key={step}
                  className={`flex-1 rounded-2xl px-4 py-3 text-center text-sm font-semibold transition ${
                    isActive ? 'bg-primary-500 text-white' : 'bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {step}
                </div>
              );
            })}
          </div>

          <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
            {workflowStep === 0 && t('admin.courseManagement.draftStepDesc')}
            {workflowStep === 1 && t('admin.courseManagement.publishStepDesc')}
          </p>

          <div className="mt-2 flex flex-wrap justify-end gap-3">
            <Button variant="ghost" onClick={() => setPublishOpen(false)}>
              {t('admin.courseManagement.cancel')}
            </Button>
            {workflowStep < 1 ? (
              <Button onClick={advancePublish}>{t('admin.courseManagement.nextStep')}</Button>
            ) : (
              <Button onClick={confirmPublish}>{t('admin.courseManagement.publishNow')}</Button>
            )}
          </div>
        </div>
      </Modal>

      {managingLessonsCourse && (
        <LessonManager 
          courseId={managingLessonsCourse.id} 
          courseTitle={managingLessonsCourse.title} 
          onClose={() => setManagingLessonsCourse(null)} 
        />
      )}

      {managingQuizzesCourse && (
        <QuizManager
          courseId={managingQuizzesCourse.id}
          courseTitle={managingQuizzesCourse.title}
          onClose={() => setManagingQuizzesCourse(null)}
        />
      )}

      <Toast 
        visible={Boolean(toast)} 
        message={toast} 
        title={toast.includes('xuất bản') || toast.includes('thành công') || toast.includes('thu hồi') || toast.includes('success') ? "Success" : "Error"} 
        variant={toast.includes('xuất bản') || toast.includes('thành công') || toast.includes('thu hồi') || toast.includes('success') ? "success" : "error"} 
        onClose={() => setToast('')} 
      />

      {/* Approve/Unpublish Confirm */}
      {approveConfirm && createPortal(
        <div className="fixed inset-0 z-[1000] flex items-center justify-center px-4 overflow-y-auto">
          <div onClick={() => setApproveConfirm(null)} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-2xl my-auto">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              {approveConfirm.currentStatus === 'draft' ? t('admin.courseManagement.approveModalDraftTitle') : t('admin.courseManagement.approveModalPublishTitle')}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              {approveConfirm.currentStatus === 'draft'
                ? t('admin.courseManagement.approveModalDraftDesc')
                : t('admin.courseManagement.approveModalPublishDesc')}
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setApproveConfirm(null)}>{t('admin.courseManagement.cancel')}</Button>
              <Button
                onClick={() => {
                  const newStatus = approveConfirm.currentStatus === 'draft' ? 'published' : 'draft';
                  approveMutation.mutate({ id: approveConfirm.id, status: newStatus });
                  setApproveConfirm(null);
                }}
              >
                {approveConfirm.currentStatus === 'draft' ? t('admin.courseManagement.approveBtn') : t('admin.courseManagement.unpublishBtn')}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

const CourseForm: React.FC<{
  form: CourseFormState;
  setForm: React.Dispatch<React.SetStateAction<CourseFormState>>;
  categories: any[];
  teachers: any[];
  teacherMode: boolean;
  onToast?: (message: string) => void;
}> = ({ form, setForm, categories, teachers, teacherMode, onToast }) => {
  const { t } = useTranslation();
  const lv = useLocalizedValue();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const update = (field: keyof CourseFormState, value: string) => {
    setForm((current) => {
      const next = { ...current, [field]: value };
      if (field === 'estimatedPrice' || field === 'discountPercentage') {
        const orig = Number(next.estimatedPrice) || 0;
        const pct = Number(next.discountPercentage) || 0;
        next.price = Math.round(orig * (1 - pct / 100)).toString();
      }
      return next;
    });
  };

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      if (onToast) {
        onToast(t('admin.courseManagement.form.imageTooLarge', 'Kích thước tệp vượt quá 5MB. Vui lòng chọn ảnh nhỏ hơn.'));
      }
      return;
    }

    setIsUploadingImage(true);
    try {
      const res = await uploadApi.uploadImage(file);
      const uploadedUrl = res.data?.url || res.data?.data?.url;
      if (uploadedUrl) {
        update('thumbnailUrl', uploadedUrl);
        if (onToast) {
          onToast(t('admin.courseManagement.form.uploadSuccess', 'Tải ảnh bìa lên thành công!'));
        }
      }
    } catch (err: any) {
      if (onToast) {
        onToast(err.response?.data?.message || t('admin.courseManagement.form.uploadFailed', 'Tải ảnh lên thất bại, vui lòng thử lại.'));
      }
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Course Thumbnail Media Section */}
      <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                {t('admin.courseManagement.form.thumbnailLabel', 'Ảnh bìa khóa học')}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('admin.courseManagement.form.thumbnailDesc', 'Khuyến nghị tỷ lệ 16:9 (1280x720px), định dạng JPG, PNG hoặc WebP dưới 5MB.')}
              </p>
            </div>
          </div>
          {form.thumbnailUrl && (
            <button
              type="button"
              onClick={() => update('thumbnailUrl', '')}
              className="text-xs font-semibold text-rose-500 hover:text-rose-600 dark:text-rose-400 flex items-center gap-1 transition-colors px-2.5 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t('admin.courseManagement.form.removeThumbnail', 'Gỡ ảnh')}</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
          {/* Thumbnail preview / upload box (5 cols) */}
          <div className="sm:col-span-5">
            <div className="relative aspect-video rounded-xl border-2 border-dashed border-slate-200 dark:border-white/10 overflow-hidden bg-white dark:bg-slate-900 flex flex-col items-center justify-center group shadow-sm">
              {form.thumbnailUrl ? (
                <>
                  <img
                    src={form.thumbnailUrl}
                    alt="Course Thumbnail"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingImage}
                      className="px-3 py-1.5 rounded-lg bg-white/95 hover:bg-white text-slate-900 text-xs font-semibold shadow-lg transition-transform hover:scale-105 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{t('admin.courseManagement.form.changeThumbnail', 'Đổi ảnh')}</span>
                    </button>
                  </div>
                </>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="p-4 text-center flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-50/50 dark:hover:bg-indigo-500/5 transition-colors w-full h-full"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-2">
                    {isUploadingImage ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                  </div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {isUploadingImage ? t('admin.courseManagement.form.uploading', 'Đang tải ảnh lên...') : t('admin.courseManagement.form.uploadThumbnail', 'Tải ảnh từ máy')}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    JPG, PNG, WebP (Tối đa 5MB)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Direct URL input & Upload button action (7 cols) */}
          <div className="sm:col-span-7 space-y-3">
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {t('admin.courseManagement.form.thumbnailPlaceholder', 'Đường dẫn ảnh bìa (URL hoặc tải tệp)')}
              </span>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={form.thumbnailUrl}
                  onChange={(e) => update('thumbnailUrl', e.target.value)}
                  placeholder="https://images.unsplash.com/... hoặc tải ảnh"
                  className="w-full text-xs"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingImage}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title={t('admin.courseManagement.form.uploadThumbnail', 'Tải ảnh từ máy')}
                >
                  {isUploadingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">{t('admin.courseManagement.form.uploadThumbnail', 'Tải tệp')}</span>
                </button>
              </div>
            </label>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              💡 Ảnh bìa chất lượng cao sẽ hiển thị trên Danh sách khóa học, Chi tiết khóa học và Trang chủ để thu hút người học.
            </p>
          </div>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageFileUpload}
        />
      </div>

      {/* Other Course Details Form */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Title - full width */}
        <div className="sm:col-span-2">
          <Field label={t('admin.courseManagement.form.titleLabel')} value={form.title} onChange={(value) => update('title', value)} placeholder={t('admin.courseManagement.form.titlePlaceholder')} />
        </div>

        {/* Description - full width */}
        <div className="sm:col-span-2">
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t('admin.courseManagement.form.descLabel')}</span>
            <textarea
              value={form.description}
              onChange={(event) => update('description', event.target.value)}
              rows={3}
              placeholder={t('admin.courseManagement.form.descPlaceholder')}
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 px-4 py-3 text-sm font-medium text-slate-900 dark:text-white outline-none transition focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10 resize-none"
            />
          </label>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t('admin.courseManagement.form.categoryLabel')}</span>
          <select
            value={form.categoryId}
            onChange={(event) => update('categoryId', event.target.value)}
            className="h-[46px] w-full rounded-2xl border border-slate-200 bg-white dark:bg-slate-900/50 px-4 text-sm font-medium text-slate-900 dark:text-white outline-none transition duration-sm ease-standard focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10"
          >
            <option value="">{t('admin.courseManagement.form.selectCategory')}</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>{lv(cat.name)}</option>
            ))}
          </select>
        </label>

        <Field label={t('admin.courseManagement.form.origPriceLabel')} value={form.estimatedPrice} onChange={(value) => update('estimatedPrice', value)} type="number" placeholder="0" />

        <Field label={t('admin.courseManagement.form.discountLabel')} value={form.discountPercentage} onChange={(value) => update('discountPercentage', value)} type="number" placeholder="0" />

        <Field label={t('admin.courseManagement.form.sellingPriceLabel')} value={form.price} onChange={(value) => update('price', value)} type="number" placeholder="0" className="bg-slate-50 dark:bg-slate-800/50 cursor-not-allowed opacity-80" disabled />

        {!teacherMode && (
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t('admin.courseManagement.form.instructorLabel')}</span>
            <select
              value={form.instructorId}
              onChange={(event) => update('instructorId', event.target.value)}
              className="h-[46px] w-full rounded-2xl border border-slate-200 bg-white dark:bg-slate-900/50 px-4 text-sm font-medium text-slate-900 dark:text-white outline-none transition duration-sm ease-standard focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10"
            >
              <option value="">{t('admin.courseManagement.form.selectInstructor')}</option>
              {teachers.map((t) => (
                <option key={t._id} value={t._id}>{t.name} ({t.email})</option>
              ))}
            </select>
          </label>
        )}

        <label className="block space-y-2">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t('admin.courseManagement.form.statusLabel')}</span>
          <select
            value={form.status}
            onChange={(event) => update('status', event.target.value as CourseStatus)}
            className="h-[46px] w-full rounded-2xl border border-slate-200 bg-white dark:bg-slate-900/50 px-4 text-sm font-medium text-slate-900 dark:text-white outline-none transition duration-sm ease-standard focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10"
          >
            <option value="draft">{t('admin.courseManagement.form.statusDraft')}</option>
            <option value="published">{t('admin.courseManagement.form.statusPublished')}</option>
          </select>
        </label>
      </div>
    </div>
  );
};

const Field: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}> = ({ label, value, onChange, type = 'text', placeholder, disabled, className }) => (
  <label className="block space-y-2">
    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</span>
    <Input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} disabled={disabled} className={className} />
  </label>
);

export default CourseManagementTab;
