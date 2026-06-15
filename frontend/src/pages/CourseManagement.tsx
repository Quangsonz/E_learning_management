import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion, MotionProps } from 'framer-motion';
import Modal from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/StateViews';

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

const MotionTr = motion.tr as unknown as React.FC<React.PropsWithChildren<React.HTMLAttributes<HTMLTableRowElement> & MotionProps>>;
const MotionDiv = motion.div as unknown as React.FC<React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement> & MotionProps>>;

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
  Draft: 'bg-slate-100 text-slate-700',
  'In Review': 'bg-amber-50 text-amber-700',
  Published: 'bg-emerald-50 text-emerald-700'
};

const stepList = ['Draft', 'Review', 'Publish'];

const CourseManagement: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>(seedCourses);
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
      const matchesSearch = course.title.toLowerCase().includes(search.toLowerCase()) || course.category.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || course.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [courses, search, selectedCategory]);

  const metrics = useMemo(() => {
    const published = courses.filter((course) => course.status === 'Published').length;
    const review = courses.filter((course) => course.status === 'In Review').length;
    const draft = courses.filter((course) => course.status === 'Draft').length;
    const revenue = courses.reduce((sum, course) => sum + course.price * course.students, 0);
    return { published, review, draft, revenue };
  }, [courses]);

  const categories = ['All', ...new Set(courses.map((course) => course.category))];

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
    window.setTimeout(() => setToast(''), 2500);
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

    setCourses((current) => current.map((course) => (course.id === publishingCourse.id ? { ...course, status: 'Published', updatedAt: 'just now' } : course)));
    setPublishOpen(false);
    setToast('Publish workflow completed successfully.');
    window.setTimeout(() => setToast(''), 2500);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.14),transparent_24%),radial-gradient(circle_at_top_right,_rgba(168,85,247,0.12),transparent_26%),linear-gradient(180deg,#f7fbff_0%,#eef4fb_100%)] text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <MotionDiv
          className="rounded-[34px] border border-white/70 bg-white/75 p-6 shadow-[0_24px_90px_rgba(15,23,42,0.08)] backdrop-blur-2xl sm:p-8"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
        >
          <div className="flex flex-col gap-4 border-b border-slate-200/70 pb-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Course Management</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                Manage courses like a premium LMS admin workspace.
              </h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
                Data table, create/edit modals, and a publish workflow with smooth motion and success notifications.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button onClick={openCreate}>Create course</Button>
              <Button variant="ghost" onClick={() => setToast('Courses synced successfully.')}>Sync data</Button>
            </div>
          </div>

          <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'Total revenue', value: `$${(metrics.revenue / 1000).toFixed(1)}k`, delta: '+12.4%' },
              { label: 'Published', value: metrics.published.toString(), delta: 'Live courses' },
              { label: 'In review', value: metrics.review.toString(), delta: 'Needs approval' },
              { label: 'Drafts', value: metrics.draft.toString(), delta: 'Ready to publish' }
            ].map((item, index) => (
              <MotionDiv
                key={item.label}
                className="rounded-[28px] border border-white/70 bg-white/85 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)]"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">KPI Counter</p>
                <h2 className="mt-3 text-3xl font-semibold text-slate-950">{item.value}</h2>
                <p className="mt-2 text-sm text-slate-500">{item.label}</p>
                <p className="mt-2 text-sm font-medium text-emerald-600">{item.delta}</p>
              </MotionDiv>
            ))}
          </section>

          <section className="mt-8 rounded-[30px] border border-white/70 bg-white/85 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <label className="flex min-h-[54px] flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-slate-500 focus-within:border-sky-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-sky-100">
                <span className="text-lg">⌕</span>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  type="search"
                  placeholder="Search courses or categories"
                  className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />
              </label>

              <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-wrap lg:justify-end">
                {categories.map((category) => {
                  const isActive = selectedCategory === category;
                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setSelectedCategory(category)}
                      className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-4 focus:ring-sky-200 ${
                        isActive ? 'bg-slate-950 text-white shadow-lg shadow-slate-950/20' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {category}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-[26px] border border-slate-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr className="text-left text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
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
                  <tbody className="divide-y divide-slate-200 bg-white">
                    <AnimatePresence initial={false}>
                      {filteredCourses.map((course, index) => (
                        <MotionTr
                          key={course.id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.24, delay: index * 0.03 }}
                          className="text-sm text-slate-700"
                        >
                          <td className="px-5 py-4">
                            <div className="font-semibold text-slate-950">{course.title}</div>
                            <div className="mt-1 text-xs uppercase tracking-[0.24em] text-slate-400">Course row animation</div>
                          </td>
                          <td className="px-5 py-4">{course.category}</td>
                          <td className="px-5 py-4">{course.lessons}</td>
                          <td className="px-5 py-4">${course.price}</td>
                          <td className="px-5 py-4">{course.students.toLocaleString()}</td>
                          <td className="px-5 py-4">
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone[course.status]}`}>
                              {course.status}
                            </span>
                          </td>
                          <td className="px-5 py-4">{course.updatedAt}</td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button type="button" className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50" onClick={() => openEdit(course)}>
                                Edit
                              </button>
                              <button type="button" className="rounded-full bg-slate-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800" onClick={() => openPublish(course)}>
                                Publish
                              </button>
                            </div>
                          </td>
                        </MotionTr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>

              {filteredCourses.length === 0 ? (
                <div className="border-t border-slate-200 bg-slate-50 px-5 py-10">
                  <EmptyState
                    title="No courses match your filters"
                    message="Try changing the search term or category filter. This state keeps the admin workflow clear without changing any data." 
                  />
                </div>
              ) : null}
            </div>
          </section>
        </MotionDiv>
      </div>

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)}>
        <div className="space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Create Course Modal</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">Create a new course</h2>
          </div>
          <CourseForm form={form} setForm={setForm} />
          <div className="flex flex-wrap justify-end gap-3">
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={saveCourse}>Create course</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)}>
        <div className="space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Edit Course Modal</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">Edit course details</h2>
          </div>
          <CourseForm form={form} setForm={setForm} />
          <div className="flex flex-wrap justify-end gap-3">
            <Button variant="ghost" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={saveCourse}>Save changes</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={publishOpen} onClose={() => setPublishOpen(false)}>
        <div className="space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Publish Workflow</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">{publishingCourse?.title}</h2>
            <p className="mt-2 text-sm text-slate-500">Move the course through Draft → Review → Publish.</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {stepList.map((step, index) => {
              const isActive = index <= workflowStep;
              return (
                <div key={step} className={`rounded-2xl border px-4 py-4 text-center text-sm font-semibold transition ${isActive ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>
                  {step}
                </div>
              );
            })}
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-600">
            {workflowStep === 0 && 'Review the course draft, confirm the content structure, and send it to review.'}
            {workflowStep === 1 && 'The course is in review. Check quality, verify assets, and prepare for publication.'}
            {workflowStep === 2 && 'The course is ready to publish. Confirm to make it visible to students.'}
          </div>

          <div className="flex flex-wrap justify-end gap-3">
            <Button variant="ghost" onClick={() => setPublishOpen(false)}>Cancel</Button>
            {workflowStep < 2 ? (
              <Button onClick={advancePublish}>Next step</Button>
            ) : (
              <Button onClick={confirmPublish}>Publish now</Button>
            )}
          </div>
        </div>
      </Modal>

      <AnimatePresence>
        {toast ? (
          <motion.div
            className="fixed bottom-5 right-5 z-50 rounded-[22px] border border-emerald-200 bg-white/90 px-4 py-3 text-sm font-semibold text-emerald-700 shadow-[0_20px_60px_rgba(15,23,42,0.15)] backdrop-blur-xl"
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.96 }}
            transition={{ duration: 0.22 }}
          >
            Success Notification: {toast}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
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
      <label className="space-y-2">
        <span className="text-sm font-medium text-slate-700">Status</span>
        <select
          value={form.status}
          onChange={(event) => update('status', event.target.value as CourseStatus)}
          className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
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
}> = ({ label, value, onChange, type = 'text', placeholder }) => {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
      />
    </label>
  );
};

export default CourseManagement;