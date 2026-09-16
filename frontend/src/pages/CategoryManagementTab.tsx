import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { categoryApi, Category, CategoryRequest } from '../services/category.api';
import { useLocalizedValue } from '../utils/localized';

const CategoryManagementTab: React.FC = () => {
  const { t } = useTranslation();
  const lv = useLocalizedValue();
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
    staleTime: 60000,
  });

  const categories: Category[] = data?.data?.categories || [];
  
  const filteredCategories = categories.filter((c) => {
    const nameStr = lv(c.name).toLowerCase();
    const slugStr = (c.slug || '').toLowerCase();
    const q = search.toLowerCase();
    return nameStr.includes(q) || slugStr.includes(q);
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: categoryApi.createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
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
      queryClient.invalidateQueries({ queryKey: ['categories'] });
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
      queryClient.invalidateQueries({ queryKey: ['categories'] });
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
    setFormData({ name: lv(category.name), slug: category.slug, description: lv(category.description) || '' });
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
      setFormError(t('admin.category.nameRequired'));
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
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-2 duration-200 pb-20 mt-4 relative">
      
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400 dark:text-white/40 pl-1">{t('admin.category.taxonomy')}</span>
          <h1 className="text-4xl font-light tracking-tight text-slate-900 dark:text-white">{t('admin.category.title')}</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative group">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/30" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input 
              type="text" 
              placeholder={t('admin.category.searchPlaceholder')} 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors w-64 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 shadow-sm"
            />
          </div>
          <button 
            onClick={openCreateModal}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-lg transition-colors shadow-sm"
          >
            {t('admin.category.newBtn')}
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              <th className="pb-4 text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-white/30 border-b border-slate-200 dark:border-white/10">{t('admin.category.thName')}</th>
              <th className="pb-4 text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-white/30 border-b border-slate-200 dark:border-white/10">{t('admin.category.thSlug')}</th>
              <th className="pb-4 text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-white/30 border-b border-slate-200 dark:border-white/10">{t('admin.category.thDesc')}</th>
              <th className="pb-4 text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-white/30 border-b border-slate-200 dark:border-white/10 text-right">{t('admin.category.thActions')}</th>
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
                  className="group hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors border-b border-slate-100 dark:border-white/5"
                >
                  <td className="py-4">
                    <span className="text-sm font-medium text-slate-900 dark:text-white/90">{lv(category.name)}</span>
                  </td>
                  <td className="py-4">
                    <span className="text-xs font-mono text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-400/10 border border-cyan-200 dark:border-transparent px-2 py-1 rounded">
                      {category.slug}
                    </span>
                  </td>
                  <td className="py-4">
                    <span className="text-sm text-slate-600 dark:text-white/50 truncate max-w-xs block">
                      {lv(category.description) || t('admin.category.noDesc')}
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    <button 
                      onClick={() => openEditModal(category)}
                      className="text-xs font-semibold text-indigo-600 dark:text-white/50 hover:text-indigo-700 dark:hover:text-white transition-colors"
                    >
                      {t('admin.category.edit')}
                    </button>
                    <span className="text-slate-300 dark:text-white/20 mx-3">•</span>
                    <button 
                      onClick={() => handleDelete(category._id, lv(category.name))}
                      className="text-xs font-semibold text-rose-600 dark:text-rose-400/70 hover:text-rose-700 dark:hover:text-rose-400 transition-colors"
                    >
                      {t('admin.category.delete')}
                    </button>
                  </td>
                </motion.tr>
              ))}
              
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400 dark:text-white/40 text-sm">
                    {t('admin.category.loading')}
                  </td>
                </tr>
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400 dark:text-white/40 text-sm">
                    {t('admin.category.notFound')}
                  </td>
                </tr>
              ) : null}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {createPortal(
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center px-4 overflow-y-auto">
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                onClick={closeModal}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative my-auto w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl overflow-y-auto max-h-[90vh]"
              >
                <button 
                  onClick={closeModal}
                  className="absolute top-4 right-4 text-slate-400 dark:text-white/40 hover:text-slate-700 dark:hover:text-white transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>

                <div className="mb-6">
                  <h3 className="text-2xl font-light text-slate-900 dark:text-white">
                    {editingCategory ? t('admin.category.editTitle') : t('admin.category.createTitle')}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-white/40 mt-1">
                    {editingCategory ? t('admin.category.editSubtitle') : t('admin.category.createSubtitle')}
                  </p>
                </div>

                {formError && (
                  <div className="mb-6 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm">
                    {formError}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-white/40">{t('admin.category.nameLabel')}</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:outline-none focus:border-indigo-500 transition-colors shadow-sm"
                      placeholder={t('admin.category.namePlaceholder')}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-white/40">{t('admin.category.slugLabel')}</label>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:outline-none focus:border-indigo-500 transition-colors font-mono text-sm shadow-sm"
                      placeholder={t('admin.category.slugPlaceholder')}
                    />
                    <p className="text-[10px] text-slate-400 dark:text-white/30">{t('admin.category.slugHint')}</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-white/40">{t('admin.category.descLabel')}</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:outline-none focus:border-indigo-500 transition-colors resize-none shadow-sm"
                      placeholder={t('admin.category.descPlaceholder')}
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-white/10 mt-6">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                      {t('admin.category.cancel')}
                    </button>
                    <button
                      type="submit"
                      disabled={createMutation.isPending || updateMutation.isPending}
                      className="px-5 py-2.5 text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors shadow-sm disabled:opacity-50"
                    >
                      {createMutation.isPending || updateMutation.isPending ? t('admin.category.saving') : t('admin.category.save')}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* FIX ISSUE-04: ConfirmModal thay window.confirm */}
      {createPortal(
        <AnimatePresence>
          {deleteConfirm && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center px-4 overflow-y-auto">
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setDeleteConfirm(null)}
                className="fixed inset-0 bg-black/70 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 16 }}
                className="relative my-auto w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-2xl"
              >
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{t('admin.category.deleteTitle')}</h3>
                <p className="text-sm text-slate-600 dark:text-white/50 mb-1">
                  {t('admin.category.deleteMessage', { name: deleteConfirm.name })}
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400/70 mb-6">
                  {t('admin.category.deleteWarning')}
                </p>
                <div className="flex justify-end gap-3">
                  <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white transition-colors">
                    {t('admin.category.cancel')}
                  </button>
                  <button
                    onClick={confirmDelete}
                    disabled={deleteMutation.isPending}
                    className="px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-colors shadow-sm disabled:opacity-50"
                  >
                    {deleteMutation.isPending ? t('admin.category.deleting') : t('admin.category.delete')}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

export default CategoryManagementTab;
