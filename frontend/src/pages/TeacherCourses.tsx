import React from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '../components/ui';
import CourseManagementTab from './CourseManagementTab';

const TeacherCourses: React.FC = () => {
  return (
    <PageShell wide>
      <div className="flex flex-col gap-8 pb-16">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">My Courses</h1>
            <p className="mt-2 text-slate-500 dark:text-slate-400">Manage your published and draft courses, add lessons, and track enrollments.</p>
          </div>
          <Link to="/teacher-dashboard" className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors dark:text-white dark:bg-white/10 dark:hover:bg-white/20">
            &larr; Back to Statistics
          </Link>
        </div>

        <CourseManagementTab teacherMode={true} />
      </div>
    </PageShell>
  );
};

export default TeacherCourses;
