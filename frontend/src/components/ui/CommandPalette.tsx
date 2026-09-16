import React, { useEffect, useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { useLocalizedValue } from '../../utils/localized';
import {
  searchApi,
  SearchCategoryType,
  SearchCourseItem,
  SearchLessonItem,
  SearchCategoryItem,
  SearchInstructorItem,
  SearchUserItem,
  SearchOrderItem,
  SearchApplicationItem
} from '../../services/search.api';

const RECENT_SEARCHES_KEY = 'elearning_recent_searches';
const MAX_RECENT_SEARCHES = 6;

interface CommandPaletteProps {
  isOpen?: boolean;
  onClose?: () => void;
  navigate?: any;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen: externalIsOpen,
  onClose: externalOnClose,
  navigate: externalNavigate
}) => {
  const { t } = useTranslation();
  const lv = useLocalizedValue();
  const internalNavigate = useNavigate();
  const navigate = externalNavigate || internalNavigate;
  const { user } = useAuth();

  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = externalIsOpen !== undefined;
  const isOpen = isControlled ? externalIsOpen : internalOpen;

  const handleClose = () => {
    if (isControlled && externalOnClose) {
      externalOnClose();
    } else {
      setInternalOpen(false);
    }
  };

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeTab, setActiveTab] = useState<SearchCategoryType>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Debounce query (250ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  // Reset selected index when results or query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [debouncedQuery, activeTab]);

  // Global ⌘K / Ctrl+K and Esc listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          handleClose();
        } else {
          if (!isControlled) setInternalOpen(true);
        }
      }
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isControlled]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setDebouncedQuery('');
    }
  }, [isOpen]);

  // Save to recent searches
  const saveRecentSearch = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    try {
      const updated = [trimmed, ...recentSearches.filter(s => s.toLowerCase() !== trimmed.toLowerCase())].slice(0, MAX_RECENT_SEARCHES);
      setRecentSearches(updated);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch {}
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  // React Query fetch for search results
  const { data: searchData, isLoading, isFetching } = useQuery({
    queryKey: ['global-search', debouncedQuery, activeTab, user?.role],
    queryFn: () => searchApi.globalSearch({
      q: debouncedQuery,
      type: activeTab,
      limit: activeTab === 'all' ? 5 : 12
    }),
    enabled: isOpen && debouncedQuery.length > 0,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  const searchResults = searchData?.data?.results;

  // Build navigation items based on current role
  const navigationItems = useMemo(() => {
    const base = [
      { id: 'nav-home', label: t('layout.nav.home', 'Trang chủ'), path: '/home', icon: 'home' },
      { id: 'nav-courses', label: t('layout.nav.courses', 'Khóa học'), path: '/courses', icon: 'book' },
      { id: 'nav-learning', label: t('layout.nav.learning', 'Vào học'), path: '/learning', icon: 'play' },
      { id: 'nav-leaderboard', label: t('layout.nav.leaderboard', 'Xếp hạng'), path: '/leaderboard', icon: 'award' },
      { id: 'nav-wishlist', label: t('layout.profileMenu.wishlist', 'Yêu thích'), path: '/wishlist', icon: 'heart' },
      { id: 'nav-profile', label: t('layout.profileMenu.settings', 'Cài đặt'), path: '/settings', icon: 'user' },
    ];

    if (user?.role === 'teacher' || user?.role === 'admin') {
      base.push(
        { id: 'nav-teacher-dash', label: t('layout.nav.dashboard', 'Giảng viên'), path: '/teacher-dashboard', icon: 'grid' },
        { id: 'nav-teacher-courses', label: 'Quản lý khóa học của tôi', path: '/teacher-courses', icon: 'folder' },
        { id: 'nav-teacher-builder', label: 'Tạo khóa học mới', path: '/teacher/courses/new', icon: 'plus' }
      );
    }

    if (user?.role === 'admin') {
      base.push(
        { id: 'nav-admin-pulse', label: 'Admin — Tổng quan hệ thống', path: '/admin-dashboard/pulse', icon: 'shield' },
        { id: 'nav-admin-users', label: 'Admin — Quản lý người dùng', path: '/admin-dashboard/users', icon: 'users' },
        { id: 'nav-admin-content', label: 'Admin — Quản lý nội dung khóa học', path: '/admin-dashboard/content', icon: 'book' },
        { id: 'nav-admin-categories', label: 'Admin — Quản lý danh mục', path: '/admin-dashboard/categories', icon: 'tag' },
        { id: 'nav-admin-analytics', label: 'Admin — Thống kê & Phân tích', path: '/admin-dashboard/analytics', icon: 'bar-chart' },
        { id: 'nav-admin-finance', label: 'Admin — Tài chính & Rút tiền', path: '/admin-dashboard/finance', icon: 'dollar-sign' },
        { id: 'nav-admin-moderation', label: 'Admin — Hàng đợi kiểm duyệt', path: '/admin-dashboard/moderation', icon: 'check-circle' },
        { id: 'nav-admin-logs', label: 'Admin — Nhật ký thao tác (Logs)', path: '/admin-dashboard/logs', icon: 'file-text' }
      );
    }

    if (!debouncedQuery) return [];
    const q = debouncedQuery.toLowerCase();
    return base.filter(item => item.label.toLowerCase().includes(q));
  }, [user?.role, debouncedQuery, t]);

  // Flattened actionable list for keyboard navigation
  interface NavigableItem {
    id: string;
    group: string;
    label: string;
    sublabel?: string;
    onSelect: () => void;
  }

  const navigableItems = useMemo<NavigableItem[]>(() => {
    const list: NavigableItem[] = [];

    // If query is empty, allow keyboard navigating recent searches
    if (!debouncedQuery) {
      recentSearches.forEach(term => {
        list.push({
          id: `recent-${term}`,
          group: 'recent',
          label: term,
          onSelect: () => {
            setQuery(term);
            setDebouncedQuery(term);
          }
        });
      });
      return list;
    }

    if (searchResults) {
      if (searchResults.courses?.length > 0) {
        searchResults.courses.forEach(c => {
          list.push({
            id: `course-${c._id}`,
            group: 'courses',
            label: lv(c.title),
            sublabel: c.instructor?.name || '',
            onSelect: () => {
              saveRecentSearch(query);
              handleClose();
              navigate(`/courses/${c._id}`);
            }
          });
        });
      }

      if (searchResults.lessons?.length > 0) {
        searchResults.lessons.forEach(l => {
          list.push({
            id: `lesson-${l._id}`,
            group: 'lessons',
            label: lv(l.title),
            sublabel: l.course ? lv(l.course.title) : '',
            onSelect: () => {
              saveRecentSearch(query);
              handleClose();
              navigate(`/courses/${l.course._id}/learn`);
            }
          });
        });
      }

      if (searchResults.categories?.length > 0) {
        searchResults.categories.forEach(cat => {
          list.push({
            id: `cat-${cat._id}`,
            group: 'categories',
            label: lv(cat.name),
            onSelect: () => {
              saveRecentSearch(query);
              handleClose();
              navigate(`/courses?category=${cat._id}`);
            }
          });
        });
      }

      if (searchResults.instructors?.length > 0) {
        searchResults.instructors.forEach(inst => {
          list.push({
            id: `inst-${inst._id}`,
            group: 'instructors',
            label: inst.name,
            sublabel: t('admin.users.teacher', 'Giảng viên'),
            onSelect: () => {
              saveRecentSearch(query);
              handleClose();
              navigate(`/courses?instructor=${inst._id}`);
            }
          });
        });
      }

      if (searchResults.users?.length > 0) {
        searchResults.users.forEach(u => {
          list.push({
            id: `user-${u._id}`,
            group: 'users',
            label: u.name,
            sublabel: `${u.email} • ${u.role}`,
            onSelect: () => {
              saveRecentSearch(query);
              handleClose();
              navigate('/admin-dashboard/users');
            }
          });
        });
      }

      if (searchResults.orders?.length > 0) {
        searchResults.orders.forEach(o => {
          list.push({
            id: `order-${o._id}`,
            group: 'orders',
            label: `${o.amount?.toLocaleString('vi-VN')} ${o.currency?.toUpperCase() || 'VND'} — ${o.user?.name || 'Khách hàng'}`,
            sublabel: o.course ? lv(o.course.title) : o.stripePaymentIntentId || '',
            onSelect: () => {
              saveRecentSearch(query);
              handleClose();
              navigate('/admin-dashboard/finance');
            }
          });
        });
      }

      if (searchResults.applications?.length > 0) {
        searchResults.applications.forEach(a => {
          list.push({
            id: `app-${a._id}`,
            group: 'applications',
            label: a.student?.name || 'Ứng viên',
            sublabel: a.specialty || '',
            onSelect: () => {
              saveRecentSearch(query);
              handleClose();
              navigate('/admin-dashboard/moderation');
            }
          });
        });
      }
    }

    if (navigationItems.length > 0) {
      navigationItems.forEach(n => {
        list.push({
          id: n.id,
          group: 'navigation',
          label: n.label,
          onSelect: () => {
            saveRecentSearch(query);
            handleClose();
            navigate(n.path);
          }
        });
      });
    }

    return list;
  }, [searchResults, navigationItems, recentSearches, debouncedQuery, query, lv, t, navigate]);

  // Arrow key navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (navigableItems.length > 0) {
        setSelectedIndex(prev => (prev + 1) % navigableItems.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (navigableItems.length > 0) {
        setSelectedIndex(prev => (prev - 1 + navigableItems.length) % navigableItems.length);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (navigableItems.length > 0 && navigableItems[selectedIndex]) {
        navigableItems[selectedIndex].onSelect();
      }
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector('[data-selected="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  // Available tabs based on user role
  const tabs: { id: SearchCategoryType; label: string }[] = [
    { id: 'all', label: t('globalSearch.tabs.all', 'Tất cả') },
    { id: 'courses', label: t('globalSearch.tabs.courses', 'Khóa học') },
    { id: 'lessons', label: t('globalSearch.tabs.lessons', 'Bài học') },
    { id: 'categories', label: t('globalSearch.tabs.categories', 'Danh mục') },
    { id: 'instructors', label: t('globalSearch.tabs.instructors', 'Giảng viên') }
  ];

  if (user?.role === 'admin' || user?.role === 'teacher') {
    tabs.push({ id: 'users', label: t('globalSearch.tabs.users', 'Người dùng') });
  }

  if (user?.role === 'admin') {
    tabs.push(
      { id: 'orders', label: t('globalSearch.tabs.orders', 'Đơn hàng') },
      { id: 'applications', label: t('globalSearch.tabs.applications', 'Đơn ứng tuyển') }
    );
  }

  const hasAnyResults = searchResults && (
    (searchResults.courses?.length || 0) > 0 ||
    (searchResults.lessons?.length || 0) > 0 ||
    (searchResults.categories?.length || 0) > 0 ||
    (searchResults.instructors?.length || 0) > 0 ||
    (searchResults.users?.length || 0) > 0 ||
    (searchResults.orders?.length || 0) > 0 ||
    (searchResults.applications?.length || 0) > 0 ||
    navigationItems.length > 0
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-start justify-center pt-10 sm:pt-[10vh] px-3 sm:px-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md transition-opacity"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -16 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-3xl bg-white dark:bg-slate-900/95 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] z-10 backdrop-blur-2xl ring-1 ring-black/5 dark:ring-white/10"
        >
          {/* Header Input Area */}
          <div className="relative flex items-center px-4 sm:px-6 py-3 border-b border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
            <svg
              className="w-5 h-5 text-slate-400 dark:text-slate-500 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2.2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>

            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('globalSearch.placeholder', 'Tìm kiếm khóa học, bài giảng, danh mục, người dùng...')}
              className="w-full bg-transparent px-3.5 py-2.5 text-base sm:text-lg font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
            />

            <div className="flex items-center gap-2 shrink-0">
              {(isLoading || isFetching) && (
                <div className="w-4 h-4 border-2 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin mr-1" />
              )}

              {query && (
                <button
                  onClick={() => { setQuery(''); setDebouncedQuery(''); inputRef.current?.focus(); }}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors"
                  title="Clear"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              )}

              <button
                onClick={handleClose}
                className="hidden sm:flex items-center px-2 py-1 bg-slate-100 dark:bg-white/10 text-[10px] font-mono font-bold uppercase rounded-md text-slate-500 dark:text-white/60 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                ESC
              </button>
            </div>
          </div>

          {/* Category Filter Tabs */}
          {debouncedQuery.length > 0 && (
            <div className="flex items-center gap-1.5 px-4 sm:px-6 py-2 border-b border-slate-100 dark:border-white/5 overflow-x-auto no-scrollbar bg-slate-50/30 dark:bg-white/[0.01]">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {/* Content Area */}
          <div ref={listRef} className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 max-h-[60vh]">
            {/* 1. Empty Query State — Show Recent Searches & Quick Suggestions */}
            {!debouncedQuery && (
              <div className="py-4 px-2 space-y-6">
                {recentSearches.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3 px-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        {t('globalSearch.recent', 'Tìm kiếm gần đây')}
                      </span>
                      <button
                        onClick={clearRecentSearches}
                        className="text-xs font-semibold text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
                      >
                        {t('globalSearch.clearRecent', 'Xóa lịch sử')}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recentSearches.map((term, index) => {
                        const isSelected = navigableItems[selectedIndex]?.id === `recent-${term}`;
                        return (
                          <button
                            key={index}
                            data-selected={isSelected}
                            onClick={() => {
                              setQuery(term);
                              setDebouncedQuery(term);
                            }}
                            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                              isSelected
                                ? 'bg-indigo-50 dark:bg-indigo-500/20 border-indigo-300 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-indigo-500/50'
                            }`}
                          >
                            <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <span>{term}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Role Quick Links */}
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-3 px-1">
                    {t('globalSearch.quickNav', 'Chuyển nhanh')}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      onClick={() => { handleClose(); navigate('/courses'); }}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-left transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {t('layout.nav.courses', 'Khám phá khóa học')}
                        </div>
                        <div className="text-xs text-slate-400 dark:text-slate-500">Xem tất cả khóa học mới nhất</div>
                      </div>
                    </button>

                    <button
                      onClick={() => { handleClose(); navigate('/learning'); }}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-left transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {t('layout.nav.learning', 'Tiến độ học tập')}
                        </div>
                        <div className="text-xs text-slate-400 dark:text-slate-500">Tiếp tục các bài học đang dang dở</div>
                      </div>
                    </button>

                    {user?.role === 'admin' && (
                      <button
                        onClick={() => { handleClose(); navigate('/admin-dashboard/pulse'); }}
                        className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-left transition-colors group sm:col-span-2"
                      >
                        <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                            Admin Command Center
                          </div>
                          <div className="text-xs text-slate-400 dark:text-slate-500">Bảng điều khiển toàn diện hệ thống</div>
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 2. Loading State */}
            {debouncedQuery && isLoading && !searchResults && (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-slate-500 dark:text-slate-400">{t('globalSearch.loading', 'Đang tìm kiếm...')}</span>
              </div>
            )}

            {/* 3. No Results State */}
            {debouncedQuery && !isLoading && !hasAnyResults && (
              <div className="py-12 flex flex-col items-center justify-center text-center px-4 space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 mb-1">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {t('globalSearch.noResults', 'Không tìm thấy kết quả nào cho')} "{debouncedQuery}"
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                  {t('globalSearch.noResultsDesc', 'Thử tìm kiếm với từ khóa khác hoặc chuyển danh mục lọc.')}
                </p>
              </div>
            )}

            {/* 4. Search Results Grouped by Entity */}
            {debouncedQuery && searchResults && (
              <div className="space-y-4">
                {/* Courses */}
                {searchResults.courses?.length > 0 && (
                  <div>
                    <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-white/40 flex items-center justify-between">
                      <span>{t('globalSearch.tabs.courses', 'Khóa học')}</span>
                      <span className="font-mono">{searchResults.courses.length}</span>
                    </div>
                    <div className="space-y-1">
                      {searchResults.courses.map(course => {
                        const isSelected = navigableItems[selectedIndex]?.id === `course-${course._id}`;
                        return (
                          <div
                            key={course._id}
                            data-selected={isSelected}
                            onClick={() => {
                              saveRecentSearch(query);
                              handleClose();
                              navigate(`/courses/${course._id}`);
                            }}
                            className={`flex items-center gap-3.5 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-indigo-50 dark:bg-white/10 text-indigo-600 dark:text-white font-semibold'
                                : 'hover:bg-slate-100/80 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-white/10 overflow-hidden shrink-0 flex items-center justify-center border border-slate-200 dark:border-white/10">
                              {course.thumbnailUrl ? (
                                <img src={course.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold truncate text-slate-900 dark:text-white">
                                  {lv(course.title)}
                                </span>
                                {course.status === 'draft' && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                    DRAFT
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                {course.instructor?.name && <span>{course.instructor.name}</span>}
                                {course.category && <span>• {lv(course.category.name)}</span>}
                                {course.price === 0 ? (
                                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">{t('globalSearch.free', 'Miễn phí')}</span>
                                ) : (
                                  <span className="font-semibold">{course.price.toLocaleString('vi-VN')}đ</span>
                                )}
                              </div>
                            </div>
                            <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Lessons */}
                {searchResults.lessons?.length > 0 && (
                  <div>
                    <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-white/40 flex items-center justify-between">
                      <span>{t('globalSearch.tabs.lessons', 'Bài học')}</span>
                      <span className="font-mono">{searchResults.lessons.length}</span>
                    </div>
                    <div className="space-y-1">
                      {searchResults.lessons.map(lesson => {
                        const isSelected = navigableItems[selectedIndex]?.id === `lesson-${lesson._id}`;
                        const minutes = Math.floor((lesson.duration || 0) / 60);
                        const seconds = (lesson.duration || 0) % 60;
                        const durationStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

                        return (
                          <div
                            key={lesson._id}
                            data-selected={isSelected}
                            onClick={() => {
                              saveRecentSearch(query);
                              handleClose();
                              navigate(`/courses/${lesson.course?._id}/learn`);
                            }}
                            className={`flex items-center gap-3.5 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-indigo-50 dark:bg-white/10 text-indigo-600 dark:text-white font-semibold'
                                : 'hover:bg-slate-100/80 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold truncate text-slate-900 dark:text-white">
                                {lv(lesson.title)}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                {lesson.course && <span className="truncate">{lv(lesson.course.title)}</span>}
                                {lesson.duration > 0 && <span>• {durationStr}</span>}
                              </div>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 shrink-0">
                              {t('globalSearch.open', 'Mở')}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Categories */}
                {searchResults.categories?.length > 0 && (
                  <div>
                    <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-white/40 flex items-center justify-between">
                      <span>{t('globalSearch.tabs.categories', 'Danh mục')}</span>
                      <span className="font-mono">{searchResults.categories.length}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {searchResults.categories.map(category => {
                        const isSelected = navigableItems[selectedIndex]?.id === `cat-${category._id}`;
                        return (
                          <div
                            key={category._id}
                            data-selected={isSelected}
                            onClick={() => {
                              saveRecentSearch(query);
                              handleClose();
                              navigate(`/courses?category=${category._id}`);
                            }}
                            className={`flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-indigo-50 dark:bg-white/10 text-indigo-600 dark:text-white font-semibold'
                                : 'hover:bg-slate-100/80 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                            </div>
                            <span className="text-sm font-semibold truncate text-slate-900 dark:text-white">
                              {lv(category.name)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Instructors */}
                {searchResults.instructors?.length > 0 && (
                  <div>
                    <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-white/40 flex items-center justify-between">
                      <span>{t('globalSearch.tabs.instructors', 'Giảng viên')}</span>
                      <span className="font-mono">{searchResults.instructors.length}</span>
                    </div>
                    <div className="space-y-1">
                      {searchResults.instructors.map(instructor => {
                        const isSelected = navigableItems[selectedIndex]?.id === `inst-${instructor._id}`;
                        return (
                          <div
                            key={instructor._id}
                            data-selected={isSelected}
                            onClick={() => {
                              saveRecentSearch(query);
                              handleClose();
                              navigate(`/courses?instructor=${instructor._id}`);
                            }}
                            className={`flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-indigo-50 dark:bg-white/10 text-indigo-600 dark:text-white font-semibold'
                                : 'hover:bg-slate-100/80 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {instructor.avatar && instructor.avatar.startsWith('http') ? (
                              <img src={instructor.avatar} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 font-bold flex items-center justify-center text-xs shrink-0">
                                {instructor.name ? instructor.name[0].toUpperCase() : 'GV'}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-semibold text-slate-900 dark:text-white block truncate">
                                {instructor.name}
                              </span>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                {t('admin.users.teacher', 'Giảng viên')}
                              </span>
                            </div>
                            <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold shrink-0">
                              Xem khóa học →
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Users (Admin / Teacher) */}
                {searchResults.users?.length > 0 && (
                  <div>
                    <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-white/40 flex items-center justify-between">
                      <span>{t('globalSearch.tabs.users', 'Người dùng')}</span>
                      <span className="font-mono">{searchResults.users.length}</span>
                    </div>
                    <div className="space-y-1">
                      {searchResults.users.map(u => {
                        const isSelected = navigableItems[selectedIndex]?.id === `user-${u._id}`;
                        return (
                          <div
                            key={u._id}
                            data-selected={isSelected}
                            onClick={() => {
                              saveRecentSearch(query);
                              handleClose();
                              navigate('/admin-dashboard/users');
                            }}
                            className={`flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-indigo-50 dark:bg-white/10 text-indigo-600 dark:text-white font-semibold'
                                : 'hover:bg-slate-100/80 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-white font-bold flex items-center justify-center text-xs shrink-0">
                              {u.name ? u.name[0].toUpperCase() : 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                  {u.name}
                                </span>
                                <span className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded ${
                                  u.role === 'admin' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20' :
                                  u.role === 'teacher' ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20' :
                                  'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-400'
                                }`}>
                                  {u.role}
                                </span>
                              </div>
                              <span className="text-xs text-slate-500 dark:text-slate-400 truncate block">
                                {u.email}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Orders (Admin) */}
                {searchResults.orders?.length > 0 && (
                  <div>
                    <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-white/40 flex items-center justify-between">
                      <span>{t('globalSearch.tabs.orders', 'Đơn hàng')}</span>
                      <span className="font-mono">{searchResults.orders.length}</span>
                    </div>
                    <div className="space-y-1">
                      {searchResults.orders.map(order => {
                        const isSelected = navigableItems[selectedIndex]?.id === `order-${order._id}`;
                        return (
                          <div
                            key={order._id}
                            data-selected={isSelected}
                            onClick={() => {
                              saveRecentSearch(query);
                              handleClose();
                              navigate('/admin-dashboard/finance');
                            }}
                            className={`flex items-center justify-between gap-3 px-3 py-2 rounded-xl cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-indigo-50 dark:bg-white/10 text-indigo-600 dark:text-white font-semibold'
                                : 'hover:bg-slate-100/80 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <div>
                              <div className="text-sm font-semibold text-slate-900 dark:text-white">
                                {order.user?.name || 'Khách'} • {order.amount?.toLocaleString('vi-VN')} {order.currency?.toUpperCase()}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">
                                {order.course ? lv(order.course.title) : order.stripePaymentIntentId || ''}
                              </div>
                            </div>
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                              order.status === 'paid' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/10 text-amber-600'
                            }`}>
                              {order.status}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Applications (Admin) */}
                {searchResults.applications?.length > 0 && (
                  <div>
                    <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-white/40 flex items-center justify-between">
                      <span>{t('globalSearch.tabs.applications', 'Đơn ứng tuyển')}</span>
                      <span className="font-mono">{searchResults.applications.length}</span>
                    </div>
                    <div className="space-y-1">
                      {searchResults.applications.map(app => {
                        const isSelected = navigableItems[selectedIndex]?.id === `app-${app._id}`;
                        return (
                          <div
                            key={app._id}
                            data-selected={isSelected}
                            onClick={() => {
                              saveRecentSearch(query);
                              handleClose();
                              navigate('/admin-dashboard/moderation');
                            }}
                            className={`flex items-center justify-between gap-3 px-3 py-2 rounded-xl cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-indigo-50 dark:bg-white/10 text-indigo-600 dark:text-white font-semibold'
                                : 'hover:bg-slate-100/80 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <div>
                              <div className="text-sm font-semibold text-slate-900 dark:text-white">
                                {app.student?.name || 'Ứng viên'}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">
                                Chuyên môn: {app.specialty}
                              </div>
                            </div>
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                              app.status === 'approved' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                              app.status === 'rejected' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' :
                              'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            }`}>
                              {app.status}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Navigation Items Matching Query */}
                {navigationItems.length > 0 && (
                  <div>
                    <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-white/40 flex items-center justify-between">
                      <span>{t('globalSearch.tabs.navigation', 'Trang & Lối tắt')}</span>
                      <span className="font-mono">{navigationItems.length}</span>
                    </div>
                    <div className="space-y-1">
                      {navigationItems.map(nav => {
                        const isSelected = navigableItems[selectedIndex]?.id === nav.id;
                        return (
                          <div
                            key={nav.id}
                            data-selected={isSelected}
                            onClick={() => {
                              saveRecentSearch(query);
                              handleClose();
                              navigate(nav.path);
                            }}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors group ${
                              isSelected
                                ? 'bg-indigo-50 dark:bg-white/10 text-indigo-600 dark:text-white font-semibold'
                                : 'hover:bg-slate-100/80 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                            </div>
                            <span className="text-sm font-semibold truncate flex-1">
                              {nav.label}
                            </span>
                            <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                              {nav.path}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Shortcuts */}
          <div className="px-4 sm:px-6 py-2.5 bg-slate-50/80 dark:bg-white/[0.02] border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-white/10 font-mono text-[10px]">↑</kbd>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-white/10 font-mono text-[10px]">↓</kbd>
                <span>{t('globalSearch.navigate', 'Điều hướng')}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-white/10 font-mono text-[10px]">↵</kbd>
                <span>{t('globalSearch.select', 'Chọn')}</span>
              </span>
            </div>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-white/10 font-mono text-[10px]">ESC</kbd>
              <span>{t('common.close', 'Đóng')}</span>
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
