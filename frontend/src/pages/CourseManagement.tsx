import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion, MotionProps } from 'framer-motion';
import {
  Button,
  CanvasHero,
  EmptyState,
  FilterBar,
  MetricsSurface,
  Modal,
  PageShell,
  SectionLead,
  SkeletonTable,
  Toast
} from '../components/ui';
import { Input } from '../components/ui/Input';
import useSimulatedLoading from '../hooks/useSimulatedLoading';

type CourseStatus = 'Draft' | 'In Review' | 'Published';

type Course = {
  id: number;
  title: string;
  category: string;
  lessons: number;
  price: number;
  students: number;
  status: CourseStatus;
  updatedAt: string;
};

type CourseFormState = {
  title: string;
  category: string;
  lessons: string;
  price: string;
  students: string;
  status: CourseStatus;
};

const MotionTr = motion.tr as unknown as React.FC<
  React.PropsWithChildren<React.HTMLAttributes<HTMLTableRowElement> & MotionProps>
>;

const seedCourses: Course[] = [
  { id: 1, title: 'Product Design Masterclass', category: 'Design', lessons: 12, price: 49, students: 1240, status: 'Published', updatedAt: '2h ago' },
  { id: 2, title: 'React System Architecture', category: 'Development', lessons: 16, price: 59, students: 980, status: 'In Review', updatedAt: '6h ago' },
  { id: 3, title: 'Learning Analytics Strategy', category: 'Data', lessons: 9, price: 39, students: 710, status: 'Draft', updatedAt: '1d ago' },
  { id: 4, title: 'Growth Marketing Sprint', category: 'Marketing', lessons: 11, price: 45, students: 540, status: 'Published', updatedAt: '3d ago' }
];

const emptyForm: CourseFormState = {
  title: '',
  category: 'Design',
  lessons: '8',
  price: '49',
  students: '0',
  status: 'Draft'
};

const statusTone: Record<CourseStatus, string> = {
  Draft: 'status-badge-neutral',
  'In Review': 'status-badge-warning',
  Published: 'status-badge-success'
};

const stepList = ['Draft', 'Review', 'Publish'];

const CourseManagement: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>(seedCourses);
  const isLoading = useSimulatedLoading(850);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [publishingCourse, setPublishingCourse] = useState<Course | null>(null);
  const [workflowStep, setWorkflowStep] = useState(0);
  const [form, setForm] = useState<CourseFormState>(emptyForm);

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchesSearch =
        course.title.toLowerCase().includes(search.toLowerCase()) ||
        course.category.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || course.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [courses, search, selectedCategory]);

  const summary = useMemo(() => {
    const published = courses.filter((course) => course.status === 'Published').length;
    const review = courses.filter((course) => course.status === 'In Review').length;
    const draft = courses.filter((course) => course.status === 'Draft').length;
    const revenue = courses.reduce((sum, course) => sum + course.price * course.students, 0);
    return { published, review, draft, revenue };
  }, [courses]);

  const categories = ['All', ...new Set(courses.map((course) => course.category))];

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
      category: course.category,
      lessons: course.lessons.toString(),
      price: course.price.toString(),
      students: course.students.toString(),
      status: course.status
    });
    setEditOpen(true);
  };

  const saveCourse = () => {
    const nextCourse: Course = {
      id: editingCourse?.id ?? Date.now(),
      title: form.title,
      category: form.category,
      lessons: Number(form.lessons),
      price: Number(form.price),
      students: Number(form.students),
      status: form.status,
      updatedAt: 'just now'
    };

    setCourses((current) => {
      if (editingCourse) {
        return current.map((course) => (course.id === editingCourse.id ? nextCourse : course));
      }
      return [nextCourse, ...current];
    });

    setCreateOpen(false);
    setEditOpen(false);
    setEditingCourse(null);
    setToast(editingCourse ? 'Course updated successfully.' : 'Course created successfully.');
  };

  const openPublish = (course: Course) => {
    setPublishingCourse(course);
    setWorkflowStep(course.status === 'Draft' ? 0 : course.status === 'In Review' ? 1 : 2);
    setPublishOpen(true);
  };

  const advancePublish = () => {
    setWorkflowStep((current) => Math.min(current + 1, 2));
  };

  const confirmPublish = () => {
    if (!publishingCourse) return;

    setCourses((current) =>
      current.map((course) =>
        course.id === publishingCourse.id ? { ...course, status: 'Published', updatedAt: 'just now' } : course
      )
    );
    setPublishOpen(false);
    setToast('Publish workflow completed successfully.');
  };

  return (
    <PageShell wide>
      <CanvasHero
        badge={<div className="badge">Course Management</div>}
        title="Manage courses like a premium LMS admin workspace."
        description="Data table, create/edit modals, and a publish workflow with smooth motion and success notifications."
        glow="warm"
        actions={
          <>
            <Button onClick={openCreate}>Create course</Button>
            <Button variant="ghost" onClick={() => setToast('Courses synced successfully.')}>
              Sync data
            </Button>
          </>
        }
      />

      <MetricsSurface metrics={metrics} />

      <FilterBar>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <Input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search courses or categories"
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
            onClear={() => setSearch('')}
            className="max-w-lg flex-1"
          />

          <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-wrap lg:justify-end">
            {categories.map((category) => {
              const isActive = selectedCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition duration-sm focus:outline-none focus:ring-4 focus:ring-primary-500/10 ${
                    isActive ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>
      </FilterBar>

      <section className="mt-8">
        <SectionLead
          label="Course catalog"
          title="All courses"
          meta={<span className="text-sm tabular-nums text-slate-400">{filteredCourses.length} courses</span>}
        />

        <div className="canvas-surface mt-5 overflow-hidden">
          {isLoading ? (
            <SkeletonTable rows={4} />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-slate-200/60 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
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
                          className="text-sm text-slate-700 transition duration-sm hover:bg-white/50"
                        >
                          <td className="px-5 py-4">
                            <div className="font-semibold text-slate-950">{course.title}</div>
                          </td>
                          <td className="px-5 py-4">{course.category}</td>
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
                                className="rounded-full px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
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
          <CourseForm form={form} setForm={setForm} />
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
          <CourseForm form={form} setForm={setForm} />
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
            <p className="mt-2 text-sm text-slate-500">Move the course through Draft → Review → Publish.</p>
          </div>

          <div className="flex gap-3">
            {stepList.map((step, index) => {
              const isActive = index <= workflowStep;
              return (
                <div
                  key={step}
                  className={`flex-1 rounded-2xl px-4 py-3 text-center text-sm font-semibold transition ${
                    isActive ? 'bg-primary-500 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {step}
                </div>
              );
            })}
          </div>

          <p className="text-sm leading-7 text-slate-600">
            {workflowStep === 0 && 'Review the course draft, confirm the content structure, and send it to review.'}
            {workflowStep === 1 && 'The course is in review. Check quality, verify assets, and prepare for publication.'}
            {workflowStep === 2 && 'The course is ready to publish. Confirm to make it visible to students.'}
          </p>

          <div className="mt-2 flex flex-wrap justify-end gap-3">
            <Button variant="ghost" onClick={() => setPublishOpen(false)}>
              Cancel
            </Button>
            {workflowStep < 2 ? (
              <Button onClick={advancePublish}>Next step</Button>
            ) : (
              <Button onClick={confirmPublish}>Publish now</Button>
            )}
          </div>
        </div>
      </Modal>

      <Toast visible={Boolean(toast)} message={toast} title="Success" variant="success" onClose={() => setToast('')} />
    </PageShell>
  );
};

const CourseForm: React.FC<{
  form: CourseFormState;
  setForm: React.Dispatch<React.SetStateAction<CourseFormState>>;
}> = ({ form, setForm }) => {
  const update = (field: keyof CourseFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Course title" value={form.title} onChange={(value) => update('title', value)} placeholder="Enter course title" />
      <Field label="Category" value={form.category} onChange={(value) => update('category', value)} placeholder="Design, Development..." />
      <Field label="Lessons" value={form.lessons} onChange={(value) => update('lessons', value)} type="number" />
      <Field label="Price" value={form.price} onChange={(value) => update('price', value)} type="number" />
      <Field label="Students" value={form.students} onChange={(value) => update('students', value)} type="number" />
      <label className="block space-y-2">
        <span className="text-sm font-semibold text-slate-700">Status</span>
        <select
          value={form.status}
          onChange={(event) => update('status', event.target.value as CourseStatus)}
          className="h-[46px] w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition duration-sm ease-standard focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10"
        >
          <option>Draft</option>
          <option>In Review</option>
          <option>Published</option>
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
    <span className="text-sm font-semibold text-slate-700">{label}</span>
    <Input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
  </label>
);

export default CourseManagement;
