import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageShell, SectionHeader, Input, Button, Card, Toast, InlineLoader } from '../../components/ui';
import { courseApi } from '../../services/course.api';
import { categoryApi, Category } from '../../services/category.api';

const CourseBuilder = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '', // Stores the category _id selected from dropdown
  });

  // Fetch danh sách categories từ API để điền vào dropdown
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryApi.getAllCategories(),
    staleTime: 5 * 60 * 1000, // Cache 5 phút
  });

  const categories: Category[] = categoriesData?.data?.categories || [];

  const createCourseMutation = useMutation({
    mutationFn: (data: any) => courseApi.createCourse(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['teacher-courses'] });
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setToast({ message: 'Khóa học đã được tạo thành công!', type: 'success' });
      // Redirect sang curriculum editor
      const newCourseId = res?.data?.course?._id;
      setTimeout(() => navigate(newCourseId ? `/teacher/courses/${newCourseId}/curriculum` : '/teacher-courses'), 1500);
    },
    onError: (error: any) => {
      setToast({ message: error.response?.data?.message || 'Tạo khóa học thất bại.', type: 'error' });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.category) {
      setToast({ message: 'Vui lòng chọn danh mục cho khóa học.', type: 'error' });
      return;
    }

    createCourseMutation.mutate({
      title: formData.title,
      description: formData.description,
      price: Number(formData.price),
      category: formData.category, // gửi _id đã chọn từ dropdown
      level: 'Beginner',
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
                  Price (đ)
                </label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  step="1000"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="500000"
                  required
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="category" className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                  Category <span className="text-red-500">*</span>
                </label>
                {categoriesLoading ? (
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-white/10 px-4 py-3 min-h-[46px]">
                    <InlineLoader />
                    <span className="text-sm text-slate-400">Loading categories...</span>
                  </div>
                ) : (
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-white/10 dark:bg-slate-800 dark:text-white appearance-none cursor-pointer min-h-[46px]"
                  >
                    <option value="" disabled>Select a category...</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div className="pt-6 flex justify-end border-t border-slate-100 dark:border-white/5">
              <Button type="submit" disabled={createCourseMutation.isLoading || categoriesLoading}>
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
