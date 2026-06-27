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
  Toast
} from '../components/ui';
import { Input } from '../components/ui/Input';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { courseApi } from '../services/course.api';
import { categoryApi } from '../services/category.api';
import { userApi } from '../services/user.api';
import { LessonManager } from '../components/admin/LessonManager';
import { QuizManager } from '../components/admin/QuizManager';

type CourseStatus = 'draft' | 'published';

type Course = {
  id: string;
  title: string;
  categoryId: string;
  categoryName: string;
  lessons: number;
  price: number;
  students: number;
  status: CourseStatus;
  updatedAt: string;
  instructorId?: string;
};

type CourseFormState = {
  title: string;
  categoryId: string;
  instructorId: string;
  lessons: string;
  price: string;
  students: string;
  status: CourseStatus;
};

const MotionTr = motion.tr as unknown as React.FC<
  React.PropsWithChildren<React.HTMLAttributes<HTMLTableRowElement> & MotionProps>
>;

const emptyForm: CourseFormState = {
  title: '',
  categoryId: '',
  instructorId: '',
  lessons: '8',
  price: '49',
  students: '0',
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
      lessons: 0,
      price: course.price,
      students: 0,
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

  const filteredCourses = courses;

  const handleNextPage = () => setPage(p => Math.min(p + 1, totalPages));
  const handlePrevPage = () => setPage(p => Math.max(p - 1, 1));

  const summary = useMemo(() => {
    const published = courses.filter((course) => course.status === 'published').length;
    const review = 0;
    const draft = courses.filter((course) => course.status === 'draft').length;
    const revenue = courses.reduce((sum, course) => sum + course.price * course.students, 0);
    return { published, review, draft, revenue };
  }, [courses]);

  const categoryNames = ['All', ...new Set(courses.map((course) => course.categoryName))];

  const metrics = [
    { label: 'Total Revenue', value: `$${(summary.revenue / 1000).toFixed(1)}k`, delta: '+12.4%' },
    { label: 'Published', value: summary.published.toString(), delta: 'Live courses' },
    { label: 'In Review', value: summary.review.toString(), delta: 'Needs approval' },
    { label: 'Drafts', value: summary.draft.toString(), delta: 'Ready to publish' }
  ];

  const openCreate = () => {
    setForm(emptyForm);
    setCreateOpen(true);
  };

  const openEdit = (course: Course) => {
    setEditingCourse(course);
    setForm({
      title: course.title,
      categoryId: course.categoryId,
      instructorId: course.instructorId || '',
      lessons: course.lessons.toString(),
      price: course.price.toString(),
      students: course.students.toString(),
      status: course.status
    });
    setEditOpen(true);
  };

  const createMutation = useMutation({
    mutationFn: (data: any) => courseApi.createCourse(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [teacherMode ? 'teacher-courses' : 'admin-courses'] });
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
      setToast('Course updated successfully.');
      setEditOpen(false);
      setEditingCourse(null);
    },
    onError: (error: any) => {
      setToast(error.response?.data?.message || 'Failed to update course. Please check all fields.');
    }
  });

  const saveCourse = () => {
    if (!form.title.trim()) {
      setToast('Title is required');
      return;
    }
    if (!form.categoryId) {
      setToast('Category is required');
      return;
    }

    const payload = {
      title: form.title,
      category: form.categoryId,
      instructor: form.instructorId,
      description: 'Default description',
      price: Number(form.price),
      status: form.status,
    };

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
           <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Create, edit, and publish platform courses.</p>
         </div>
         <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => setToast('Courses synced successfully.')}>
              Sync data
            </Button>
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
            {categoryNames.map((category) => {
              const isActive = selectedCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => {
                    const categoryId = categoriesData.find(c => c.name === category)?._id || 'All';
                    setSelectedCategory(categoryId === 'All' ? 'All' : categoryId);
                    setPage(1);
                  }}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition duration-sm focus:outline-none focus:ring-4 focus:ring-primary-500/10 ${
                    isActive ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                  }`}
                >
                  {category}
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
                      <th className="px-5 py-4">Course</th>
                      <th className="px-5 py-4">Category</th>
                      <th className="px-5 py-4">Lessons</th>
                      <th className="px-5 py-4">Price</th>
                      <th className="px-5 py-4">Students</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4">Updated</th>
                      <th className="px-5 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/60">
                    <AnimatePresence initial={false}>
                      {filteredCourses.map((course, index) => (
                        <MotionTr
                          key={course.id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.24, delay: index * 0.03 }}
                          className="text-sm text-slate-700 dark:text-slate-200 transition duration-sm hover:bg-white/50 dark:hover:bg-slate-800/50"
                        >
                          <td className="px-5 py-4">
                            <div className="font-semibold text-slate-950 dark:text-white">{course.title}</div>
                          </td>
                          <td className="px-5 py-4">{course.categoryName}</td>
                          <td className="px-5 py-4">{course.lessons}</td>
                          <td className="px-5 py-4">${course.price}</td>
                          <td className="px-5 py-4">{course.students.toLocaleString()}</td>
                          <td className="px-5 py-4">
                            <span className={`status-badge ${statusTone[course.status]}`}>{course.status}</span>
                          </td>
                          <td className="px-5 py-4 text-slate-400">{course.updatedAt}</td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                className="rounded-full px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 transition hover:bg-slate-100 dark:hover:bg-slate-800/50"
                                onClick={() => setManagingLessonsCourse(course)}
                              >
                                Lessons
                              </button>
                              <button
                                type="button"
                                className="rounded-full px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 transition hover:bg-slate-100 dark:hover:bg-slate-800/50"
                                onClick={() => setManagingQuizzesCourse(course)}
                              >
                                Quizzes
                              </button>
                              <button
                                type="button"
                                className="rounded-full px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 transition hover:bg-slate-100 dark:hover:bg-slate-800/50"
                                onClick={() => openEdit(course)}
                              >
                                Edit
                              </button>
                              <Button variant="pill" size="sm" className="!h-8 !px-3 !text-xs" onClick={() => openPublish(course)}>
                                Publish
                              </Button>
                            </div>
                          </td>
                        </MotionTr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>

              {filteredCourses.length === 0 ? (
                <div className="px-5 py-10">
                  <EmptyState
                    title="No courses match your filters"
                    message="Try changing the search term or category filter. This state keeps the admin workflow clear without changing any data."
                  />
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
        title={toast.includes('successfully') || toast.includes('synced') ? "Success" : "Error"} 
        variant={toast.includes('successfully') || toast.includes('synced') ? "success" : "error"} 
        onClose={() => setToast('')} 
      />
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
    setForm((current) => ({ ...current, [field]: value }));
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Course title" value={form.title} onChange={(value) => update('title', value)} placeholder="Enter course title" />
      <label className="block space-y-2">
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Category</span>
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

      <Field label="Lessons" value={form.lessons} onChange={(value) => update('lessons', value)} type="number" />
      <Field label="Price" value={form.price} onChange={(value) => update('price', value)} type="number" />
      <Field label="Students" value={form.students} onChange={(value) => update('students', value)} type="number" />
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
}> = ({ label, value, onChange, type = 'text', placeholder }) => (
  <label className="block space-y-2">
    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</span>
    <Input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
  </label>
);

export default CourseManagementTab;
