import React, { useMemo, useState } from 'react';
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
import { courseApi } from '../services/course.api';
import { categoryApi } from '../services/category.api';
import { userApi } from '../services/user.api';
import { LessonManager } from '../components/admin/LessonManager';
import { QuizManager } from '../components/admin/QuizManager';
import { useNavigate } from 'react-router-dom';

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
  status: 'draft'
};

const statusTone: Record<string, string> = {
  draft: 'status-badge-neutral',
  published: 'status-badge-success'
};

const stepList = ['Draft', 'Publish'];

interface CourseManagementTabProps {
  teacherMode?: boolean;
}

const CourseManagementTab: React.FC<CourseManagementTabProps> = ({ teacherMode = false }) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

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

  const categoriesData = useMemo(() => categoryData?.data?.categories || [], [categoryData]);
  const teachers = useMemo(() => teacherData?.data?.users || [], [teacherData]);

  const courses: Course[] = useMemo(() => {
    if (!responseData?.data?.courses) return [];
    return responseData.data.courses.map((course: any) => ({
      id: course._id,
      title: course.title,
      categoryId: course.category?._id || '',
      categoryName: course.category?.name || 'Uncategorized',
      lessons: course.lessonsCount || 0,
      price: Number(course.price) || 0,
      estimatedPrice: Number(course.estimatedPrice || course.price) || 0,
      discountPercentage: Number(course.discountPercentage) || 0,
      students: course.studentsCount || 0,
      status: course.status,
      updatedAt: new Date(course.updatedAt).toLocaleDateString(),
      instructorId: course.instructor?._id
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
    const published = courses.filter((course) => course.status === 'published').length;
    const review = 0;
    const draft = courses.filter((course) => course.status === 'draft').length;
    const revenue = courses.reduce((sum, course) => sum + course.price * course.students, 0);
    return { published, review, draft, revenue };
  }, [courses]);

  const metrics = [
    { label: 'Total Revenue', value: `${summary.revenue.toLocaleString('vi-VN')}đ`, delta: '+12.4%' },
    { label: 'Published', value: summary.published.toString(), delta: 'Live courses' },
    { label: 'In Review', value: summary.review.toString(), delta: 'Needs approval' },
    { label: 'Drafts', value: summary.draft.toString(), delta: 'Ready to publish' }
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
      status: course.status
    });
    setEditOpen(true);
  };

  const createMutation = useMutation({
    mutationFn: (data: any) => courseApi.createCourse(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [teacherMode ? 'teacher-courses' : 'admin-courses'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setToast('Course created successfully.');
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
      setToast('Course updated successfully.');
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
      setToast(vars.status === 'published' ? 'Khóa học đã được xuất bản.' : 'Khóa học đã thu hồi về Draft.');
    },
    onError: (error: any) => {
      setToast(error.response?.data?.message || 'Không thể thay đổi trạng thái khóa học.');
    }
  });

  const [approveConfirm, setApproveConfirm] = useState<{ id: string; currentStatus: CourseStatus } | null>(null);

  const saveCourse = () => {
    if (!form.title.trim()) {
      setToast('Title is required');
      return;
    }
    if (!form.categoryId) {
      setToast('Category is required');
      return;
    }
    if (!form.description.trim()) {
      setToast('Description is required');
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
         <div>
           <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Course Management</h2>
           <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Create, edit, publish and approve platform courses.</p>
         </div>
         <div className="flex items-center gap-3">
            <Button onClick={openCreate}>Create course</Button>
         </div>
      </div>

      <MetricsSurface metrics={metrics} />

      <FilterBar>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <Input
            type="search"
            value={search}
            onChange={(event) => { setSearch(event.target.value); setPage(1); }}
            placeholder="Search courses..."
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
            {[{ _id: 'All', name: 'All' }, ...categoriesData].map((category) => {
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
                  {category.name}
                </button>
              );
            })}
          </div>
        </div>
      </FilterBar>

      <section>
        <SectionLead
          label="Course catalog"
          title="All courses"
          meta={<span className="text-sm tabular-nums text-slate-400">Page {page} of {totalPages}</span>}
        />

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
                        Course {sortConfig?.key === 'title' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : <span className="opacity-0 group-hover:opacity-30">↕</span>}
                      </th>
                      <th className="px-5 py-4 cursor-pointer group hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors" onClick={() => handleSort('lessons')}>
                        Lessons {sortConfig?.key === 'lessons' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : <span className="opacity-0 group-hover:opacity-30">↕</span>}
                      </th>
                      <th className="px-5 py-4 cursor-pointer group hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors" onClick={() => handleSort('price')}>
                        Price {sortConfig?.key === 'price' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : <span className="opacity-0 group-hover:opacity-30">↕</span>}
                      </th>
                      <th className="px-5 py-4 cursor-pointer group hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors" onClick={() => handleSort('students')}>
                        Students {sortConfig?.key === 'students' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : <span className="opacity-0 group-hover:opacity-30">↕</span>}
                      </th>
                      <th className="px-5 py-4 cursor-pointer group hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors" onClick={() => handleSort('status')}>
                        Status {sortConfig?.key === 'status' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : <span className="opacity-0 group-hover:opacity-30">↕</span>}
                      </th>
                      <th className="px-5 py-4 text-right">Actions</th>
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
                            <div className="font-semibold text-slate-950 dark:text-white line-clamp-1">{course.title}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{course.categoryName}</div>
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
                              <span className={`status-badge ${statusTone[course.status]}`}>{course.status}</span>
                              <span className="text-[10px] text-slate-400">{course.updatedAt}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end">
                              <ActionDropdown>
                                <button
                                  type="button"
                                  className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                  onClick={() => navigate(`/teacher/courses/${course.id}/curriculum`)}
                                >
                                  Manage Lessons
                                </button>
                                <button
                                  type="button"
                                  className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                  onClick={() => setManagingQuizzesCourse(course)}
                                >
                                  Manage Quizzes
                                </button>
                                <button
                                  type="button"
                                  className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                  onClick={() => openEdit(course)}
                                >
                                  Edit Details
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
                                    {course.status === 'published' ? 'Unpublish Course' : 'Approve Course'}
                                  </button>
                                )}
                                {teacherMode && (
                                  <button 
                                    type="button"
                                    className="w-full text-left px-4 py-2 text-xs font-semibold text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
                                    onClick={() => openPublish(course)}
                                  >
                                    Publish Course
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
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Bạn chưa tạo khóa học nào</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Hãy bắt đầu hành trình giảng dạy của bạn qua 3 bước đơn giản bên dưới:
                        </p>
                      </div>

                      <div className="grid sm:grid-cols-3 gap-4 w-full text-left pt-2">
                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 space-y-2">
                          <span className="w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-black flex items-center justify-center">1</span>
                          <h4 className="font-bold text-xs text-slate-900 dark:text-white">Tạo thông tin cơ bản</h4>
                          <p className="text-[11px] text-slate-500">Nhập tiêu đề, mô tả, chọn danh mục và thiết lập giá bán.</p>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 space-y-2">
                          <span className="w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-black flex items-center justify-center">2</span>
                          <h4 className="font-bold text-xs text-slate-900 dark:text-white">Tải bài giảng & Quiz</h4>
                          <p className="text-[11px] text-slate-500">Đăng tải video bài giảng, soạn bộ câu hỏi Quiz & Bài tập.</p>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 space-y-2">
                          <span className="w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-black flex items-center justify-center">3</span>
                          <h4 className="font-bold text-xs text-slate-900 dark:text-white">Xuất bản ra cộng đồng</h4>
                          <p className="text-[11px] text-slate-500">Phê duyệt và xuất bản khóa học để chào đón những học viên đầu tiên.</p>
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          onClick={() => navigate('/teacher/courses/new')}
                          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all active:scale-95"
                        >
                          + Tạo khóa học đầu tiên ngay
                        </button>
                      </div>
                    </div>
                  ) : (
                    <EmptyState
                      title="No courses match your filters"
                      message="Try changing the search term or category filter. This state keeps the admin workflow clear without changing any data."
                    />
                  )}
                </div>
              ) : null}

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-4 border-t border-slate-200/60 dark:border-slate-800">
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    Showing page {page} of {totalPages}
                  </span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handlePrevPage} disabled={page === 1}>Previous</Button>
                    <Button variant="outline" size="sm" onClick={handleNextPage} disabled={page === totalPages}>Next</Button>
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
                <span className="text-sm font-semibold whitespace-nowrap">Courses Selected</span>
              </div>
              <div className="h-6 w-px bg-white/20"></div>
              <div className="flex items-center gap-2">
                <button className="px-4 py-2 bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase tracking-wider rounded-full hover:bg-emerald-500/20 transition-colors">Approve All</button>
                <button className="px-4 py-2 bg-rose-500/10 text-rose-400 text-xs font-bold uppercase tracking-wider rounded-full hover:bg-rose-500/20 transition-colors">Delete</button>
                <button 
                  onClick={() => setSelectedCourseIds(new Set())}
                  className="px-4 py-2 bg-white/5 text-white/50 text-xs font-bold uppercase tracking-wider rounded-full hover:bg-white/10 hover:text-white transition-colors ml-2"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)}>
        <div className="space-y-5">
          <div>
            <p className="section-label">Create Course Modal</p>
            <h2 className="mt-2 section-title">Create a new course</h2>
          </div>
          <CourseForm form={form} setForm={setForm} categories={categoriesData} teachers={teachers} teacherMode={teacherMode} />
          <div className="mt-4 flex flex-wrap justify-end gap-3">
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveCourse}>Create course</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)}>
        <div className="space-y-5">
          <div>
            <p className="section-label">Edit Course Modal</p>
            <h2 className="mt-2 section-title">Edit course details</h2>
          </div>
          <CourseForm form={form} setForm={setForm} categories={categoriesData} teachers={teachers} teacherMode={teacherMode} />
          <div className="mt-4 flex flex-wrap justify-end gap-3">
            <Button variant="ghost" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveCourse}>Save changes</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={publishOpen} onClose={() => setPublishOpen(false)}>
        <div className="space-y-5">
          <div>
            <p className="section-label">Publish Workflow</p>
            <h2 className="mt-2 section-title">{publishingCourse?.title}</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Move the course through Draft → Review → Publish.</p>
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
            {workflowStep === 0 && 'Review the course draft, confirm the content structure, and prepare for publication.'}
            {workflowStep === 1 && 'The course is ready to publish. Confirm to make it visible to students.'}
          </p>

          <div className="mt-2 flex flex-wrap justify-end gap-3">
            <Button variant="ghost" onClick={() => setPublishOpen(false)}>
              Cancel
            </Button>
            {workflowStep < 1 ? (
              <Button onClick={advancePublish}>Next step</Button>
            ) : (
              <Button onClick={confirmPublish}>Publish now</Button>
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
        title={toast.includes('xuất bản') || toast.includes('thành công') || toast.includes('thu hồi') ? "Success" : "Error"} 
        variant={toast.includes('xuất bản') || toast.includes('thành công') || toast.includes('thu hồi') ? "success" : "error"} 
        onClose={() => setToast('')} 
      />

      {/* Approve/Unpublish Confirm */}
      {approveConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div onClick={() => setApproveConfirm(null)} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              {approveConfirm.currentStatus === 'draft' ? 'Approve & Publish Course?' : 'Unpublish Course?'}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              {approveConfirm.currentStatus === 'draft'
                ? 'Khóa học sẽ được xuất bản và hiển thị cho học viên.'
                : 'Khóa học sẽ bị ẩn khỏi danh sách công khai.'}
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setApproveConfirm(null)}>Cancel</Button>
              <Button
                onClick={() => {
                  const newStatus = approveConfirm.currentStatus === 'draft' ? 'published' : 'draft';
                  approveMutation.mutate({ id: approveConfirm.id, status: newStatus });
                  setApproveConfirm(null);
                }}
              >
                {approveConfirm.currentStatus === 'draft' ? 'Approve' : 'Unpublish'}
              </Button>
            </div>
          </div>
        </div>
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
}> = ({ form, setForm, categories, teachers, teacherMode }) => {
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

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {/* Title - full width */}
      <div className="sm:col-span-2">
        <Field label="Course title *" value={form.title} onChange={(value) => update('title', value)} placeholder="e.g. Complete JavaScript Course" />
      </div>

      {/* Description - full width */}
      <div className="sm:col-span-2">
        <label className="block space-y-2">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Description *</span>
          <textarea
            value={form.description}
            onChange={(event) => update('description', event.target.value)}
            rows={3}
            placeholder="Mô tả ngắn về khóa học, nội dung và mục tiêu học tập..."
            className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 px-4 py-3 text-sm font-medium text-slate-900 dark:text-white outline-none transition focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10 resize-none"
          />
        </label>
      </div>

      <label className="block space-y-2">
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Category *</span>
        <select
          value={form.categoryId}
          onChange={(event) => update('categoryId', event.target.value)}
          className="h-[46px] w-full rounded-2xl border border-slate-200 bg-white dark:bg-slate-900/50 px-4 text-sm font-medium text-slate-900 dark:text-white outline-none transition duration-sm ease-standard focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10"
        >
          <option value="">Select a category</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat._id}>{cat.name}</option>
          ))}
        </select>
      </label>

      <Field label="Original Price (đ) *" value={form.estimatedPrice} onChange={(value) => update('estimatedPrice', value)} type="number" placeholder="0" />

      <Field label="Discount (%)" value={form.discountPercentage} onChange={(value) => update('discountPercentage', value)} type="number" placeholder="0" />

      <Field label="Selling Price (đ)" value={form.price} onChange={(value) => update('price', value)} type="number" placeholder="0" className="bg-slate-50 dark:bg-slate-800/50 cursor-not-allowed opacity-80" disabled />

      {!teacherMode && (
        <label className="block space-y-2">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Instructor</span>
          <select
            value={form.instructorId}
            onChange={(event) => update('instructorId', event.target.value)}
            className="h-[46px] w-full rounded-2xl border border-slate-200 bg-white dark:bg-slate-900/50 px-4 text-sm font-medium text-slate-900 dark:text-white outline-none transition duration-sm ease-standard focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10"
          >
            <option value="">Select an instructor</option>
            {teachers.map((t) => (
              <option key={t._id} value={t._id}>{t.name} ({t.email})</option>
            ))}
          </select>
        </label>
      )}

      <label className="block space-y-2">
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Status</span>
        <select
          value={form.status}
          onChange={(event) => update('status', event.target.value as CourseStatus)}
          className="h-[46px] w-full rounded-2xl border border-slate-200 bg-white dark:bg-slate-900/50 px-4 text-sm font-medium text-slate-900 dark:text-white outline-none transition duration-sm ease-standard focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10"
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </label>
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
