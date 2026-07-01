import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageShell, SectionHeader, Input, Button, Card, Toast } from '../../components/ui';
import { courseApi } from '../../services/course.api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const CourseBuilder = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '', // Would normally be a dropdown of fetched categories
  });

  const createCourseMutation = useMutation({
    mutationFn: (data: any) => courseApi.createCourse(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['teacher-courses'] });
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setToast({ message: 'Course created successfully!', type: 'success' });
      // Redirect to the detailed curriculum editor
      const newCourseId = res?.data?.course?._id;
      setTimeout(() => navigate(newCourseId ? `/teacher/courses/${newCourseId}/curriculum` : '/teacher-courses'), 1500);
    },
    onError: (error: any) => {
      setToast({ message: error.response?.data?.message || 'Failed to create course.', type: 'error' });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCourseMutation.mutate({
      title: formData.title,
      description: formData.description,
      price: Number(formData.price),
      category: formData.category || 'Development', // hardcoded default for MVP
      level: 'Beginner', // default for MVP
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <PageShell wide>
      <div className="max-w-3xl mx-auto py-12 px-4">
        <SectionHeader 
          title="Course Builder" 
          description="Start crafting your new course. Fill in the essential details below."
        />

        <Card className="mt-8 p-8 border border-slate-200 dark:border-white/10">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="space-y-2">
              <label htmlFor="title" className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                Course Title
              </label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Advanced System Design"
                required
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                placeholder="What will students learn in this course?"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="price" className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                  Price ($)
                </label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="49.99"
                  required
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="category" className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                  Category
                </label>
                <Input
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  placeholder="e.g. Development"
                  className="w-full"
                />
              </div>
            </div>

            <div className="pt-6 flex justify-end border-t border-slate-100 dark:border-white/5">
              <Button type="submit" disabled={createCourseMutation.isLoading}>
                {createCourseMutation.isLoading ? 'Creating...' : 'Create Course Draft'}
              </Button>
            </div>
          </form>
        </Card>
      </div>

      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </PageShell>
  );
};

export default CourseBuilder;
