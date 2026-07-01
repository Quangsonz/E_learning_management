import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryApi, Category, CategoryRequest } from '../services/category.api';

const CategoryManagementTab: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  // FIX ISSUE-04: State cho confirm modal (thay window.confirm)
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  
  // Form State
  const [formData, setFormData] = useState<CategoryRequest>({ name: '', slug: '', description: '' });
  const [formError, setFormError] = useState('');

  // Fetch Categories
  const { data, isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: categoryApi.getAllCategories,
  });

  const categories: Category[] = data?.data?.categories || [];
  
  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.slug.toLowerCase().includes(search.toLowerCase())
  );

  // Mutations
  const createMutation = useMutation({
    mutationFn: categoryApi.createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      closeModal();
    },
    onError: (error: any) => {
      setFormError(error.response?.data?.message || 'Failed to create category');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CategoryRequest> }) => 
      categoryApi.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      closeModal();
    },
    onError: (error: any) => {
      setFormError(error.response?.data?.message || 'Failed to update category');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: categoryApi.deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
    }
  });

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormData({ name: '', slug: '', description: '' });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setFormData({ name: category.name, slug: category.slug, description: category.description || '' });
    setFormError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Category name is required');
      return;
    }

    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory._id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  // FIX ISSUE-04: Thay window.confirm bằng ConfirmModal state
  const handleDelete = (id: string, name: string) => {
    setDeleteConfirm({ id, name });
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
      deleteMutation.mutate(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-20 mt-4 relative">
      
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold uppercase tracking-[0.25em] text-white/40 pl-1">Taxonomy</span>
          <h1 className="text-4xl font-light tracking-tight text-white">Category Management</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative group">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input 
              type="text" 
              placeholder="Search categories..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm bg-white/5 border border-white/10 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors w-64 text-white placeholder:text-white/30"
            />
          </div>
          <button 
            onClick={openCreateModal}
            className="px-4 py-2 bg-indigo-500 text-white text-sm font-bold rounded-lg hover:bg-indigo-400 transition-colors shadow-[0_0_15px_rgba(99,102,241,0.3)]"
          >
            + New Category
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              <th className="pb-4 text-xs font-bold uppercase tracking-widest text-white/30 border-b border-white/10">Category Name</th>
              <th className="pb-4 text-xs font-bold uppercase tracking-widest text-white/30 border-b border-white/10">Slug</th>
              <th className="pb-4 text-xs font-bold uppercase tracking-widest text-white/30 border-b border-white/10">Description</th>
              <th className="pb-4 text-xs font-bold uppercase tracking-widest text-white/30 border-b border-white/10 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {filteredCategories.map((category, idx) => (
                <motion.tr 
                  key={category._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group hover:bg-white/[0.02] transition-colors"
                >
                  <td className="py-4 border-b border-white/5">
                    <span className="text-sm font-medium text-white/90">{category.name}</span>
                  </td>
                  <td className="py-4 border-b border-white/5">
                    <span className="text-xs font-mono text-cyan-400 bg-cyan-400/10 px-2 py-1 rounded">
                      {category.slug}
                    </span>
                  </td>
                  <td className="py-4 border-b border-white/5">
                    <span className="text-sm text-white/50 truncate max-w-xs block">
                      {category.description || 'No description'}
                    </span>
                  </td>
                  <td className="py-4 border-b border-white/5 text-right">
                    <button 
                      onClick={() => openEditModal(category)}
                      className="text-xs font-semibold text-white/40 hover:text-white transition-colors"
                    >
                      Edit
                    </button>
                    <span className="text-white/20 mx-3">•</span>
                    <button 
                      onClick={() => handleDelete(category._id, category.name)}
                      className="text-xs font-semibold text-rose-400/50 hover:text-rose-400 transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </motion.tr>
              ))}
              
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-white/40 text-sm">
                    Loading taxonomy data...
                  </td>
                </tr>
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-white/40 text-sm">
                    No categories found.
                  </td>
                </tr>
              ) : null}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl"
            >
              <button 
                onClick={closeModal}
                className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>

              <div className="mb-6">
                <h3 className="text-2xl font-light text-white">
                  {editingCategory ? 'Edit Category' : 'Create Category'}
                </h3>
                <p className="text-sm text-white/40 mt-1">
                  {editingCategory ? 'Modify existing taxonomy terms.' : 'Define a new taxonomy term for courses.'}
                </p>
              </div>

              {formError && (
                <div className="mb-6 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-white/40">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    placeholder="e.g. Web Development"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-white/40">Slug (Optional)</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors font-mono text-sm"
                    placeholder="e.g. web-development (auto-generated if empty)"
                  />
                  <p className="text-[10px] text-white/30">Leave empty to auto-generate from name.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-white/40">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                    placeholder="Brief description of this category..."
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-white/10 mt-6">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-5 py-2.5 text-sm font-semibold text-white/60 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="px-5 py-2.5 text-sm font-semibold bg-indigo-500 text-white rounded-lg hover:bg-indigo-400 transition-colors shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                  >
                    {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Category'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FIX ISSUE-04: ConfirmModal thay window.confirm */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirm(null)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="relative w-full max-w-sm bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 shadow-2xl"
            >
              <h3 className="text-lg font-semibold text-white mb-2">Delete Category?</h3>
              <p className="text-sm text-white/50 mb-1">
                Bạn có chắc muốn xóa category <span className="font-bold text-white">"{deleteConfirm.name}"</span>?
              </p>
              <p className="text-xs text-amber-400/70 mb-6">
                ⚠️ Các khóa học thuộc category này sẽ bị mất liên kết.
              </p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm font-semibold text-white/60 hover:text-white transition-colors">
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleteMutation.isPending}
                  className="px-4 py-2 text-sm font-bold bg-rose-500 hover:bg-rose-400 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CategoryManagementTab;
