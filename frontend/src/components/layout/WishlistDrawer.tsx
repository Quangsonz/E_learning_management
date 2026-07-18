import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '../../services/user.api';

interface WishlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WishlistDrawer: React.FC<WishlistDrawerProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: wishlistData, isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => userApi.getWishlist(),
    enabled: isOpen
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => userApi.toggleWishlist(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    }
  });

  const wishlist = wishlistData?.data?.wishlist || [];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Drawer Window */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white dark:bg-[#111111] shadow-2xl border-l border-slate-200 dark:border-white/5 flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-indigo-500">
                    <circle cx="9" cy="21" r="1"></circle>
                    <circle cx="20" cy="21" r="1"></circle>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                  </svg>
                  Khóa học đã lưu ({wishlist.length})
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Danh sách yêu thích của bạn</p>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Content List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="flex gap-4 items-center animate-pulse">
                      <div className="w-20 h-14 bg-slate-200 dark:bg-slate-800 rounded-lg shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                        <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : wishlist.length > 0 ? (
                wishlist.map((course: any) => {
                  const hasDiscount = course.discountPercentage && course.discountPercentage > 0;
                  return (
                    <div key={course._id} className="group relative flex gap-4 p-3 bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-2xl hover:bg-slate-100/50 dark:hover:bg-white/[0.04] transition-all">
                      {/* Image */}
                      <div className="w-20 h-14 bg-slate-800 rounded-lg overflow-hidden shrink-0 relative">
                        {course.thumbnailUrl ? (
                          <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-indigo-900/50 flex items-center justify-center text-[10px] font-black text-white">Course</div>
                        )}
                        {hasDiscount && (
                          <div className="absolute top-1 left-1 bg-rose-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase">
                            -{course.discountPercentage}%
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-grow min-w-0 pr-6">
                        <h4
                          onClick={() => { onClose(); navigate(`/courses/${course._id}`); }}
                          className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-1 hover:text-indigo-500 cursor-pointer transition-colors"
                        >
                          {course.title}
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-0.5 truncate">{course.instructor?.name || 'Giảng viên'}</p>
                        
                        {/* Price */}
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="text-xs font-black text-slate-900 dark:text-white">
                            {course.price === 0 ? 'Free' : `${Number(course.price || 0).toLocaleString('vi-VN')}đ`}
                          </span>
                          {hasDiscount && (
                            <span className="text-[10px] text-slate-400 line-through">
                              {Number(course.estimatedPrice || 0).toLocaleString('vi-VN')}đ
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeMutation.mutate(course._id)}
                        className="absolute right-3 top-3 w-7 h-7 rounded-full bg-slate-200/50 dark:bg-white/5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center justify-center transition-colors"
                        title="Xóa"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>

                      {/* Quick Checkout Button */}
                      <button
                        onClick={() => { onClose(); navigate(`/checkout/${course._id}`); }}
                        className="absolute right-3 bottom-3 text-[10px] font-black text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        Đăng ký →
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-300 mb-4 border border-slate-100 dark:border-white/5">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="9" cy="21" r="1"></circle>
                      <circle cx="20" cy="21" r="1"></circle>
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                    </svg>
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Danh sách trống</h4>
                  <p className="text-xs text-slate-400 max-w-[200px] mt-1.5 leading-relaxed">Bạn chưa lưu bất kỳ khóa học nào vào danh sách yêu thích.</p>
                </div>
              )}
            </div>

            {/* Footer actions */}
            {wishlist.length > 0 && (
              <div className="p-6 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-black/10">
                <button
                  onClick={() => { onClose(); navigate('/'); }}
                  className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-2xl shadow-lg shadow-indigo-500/10 transition-all flex items-center justify-center gap-2 active:scale-98"
                >
                  Tiếp tục khám phá khóa học
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
