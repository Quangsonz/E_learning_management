import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { userApi } from '../services/user.api';
import { analyticsApi } from '../services/analytics.api';
import { adminApi } from '../services/admin.api';
import { courseApi } from '../services/course.api';
import { useToast } from '../contexts/ToastContext';
import { PlatformPulse } from '../components/admin/PlatformPulse';

const CommandPalette = React.lazy(() => 
  import('../components/ui/CommandPalette').then(m => ({ default: m.CommandPalette }))
);

// Code-split heavy secondary tabs to reduce initial Admin bundle size
const CourseManagementTab = React.lazy(() => import('./CourseManagementTab'));
const CategoryManagementTab = React.lazy(() => import('./CategoryManagementTab'));
const AnalyticsTab = React.lazy(() => import('../components/admin/AnalyticsTab').then(m => ({ default: m.AnalyticsTab })));
const FinancialTab = React.lazy(() => import('../components/admin/FinancialTab').then(m => ({ default: m.FinancialTab })));

const prefetchTab = (tabId: string) => {
  switch (tabId) {
    case 'content':
      import('./CourseManagementTab');
      break;
    case 'categories':
      import('./CategoryManagementTab');
      break;
    case 'analytics':
      import('../components/admin/AnalyticsTab');
      break;
    case 'finance':
      import('../components/admin/FinancialTab');
      break;
    default:
      break;
  }
};



/* ── Icons ────────────────────────────────────────────────────────── */
const Icons = {
  Pulse: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
  Users: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Content: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
  Categories: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg>,
  Analytics: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>,
  Finance: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  Engagement: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  Config: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  Monitor: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
  Moderation: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>,
  Logs: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
};

interface NavItem {
  id: string;
  labelKey: string;
  icon: () => JSX.Element;
}

interface NavGroup {
  groupKey: string;
  items: NavItem[];
}

const navigationGroups: NavGroup[] = [
  {
    groupKey: 'admin.nav.groups.overview',
    items: [
      { id: 'pulse', labelKey: 'admin.nav.pulse', icon: Icons.Pulse },
    ],
  },
  {
    groupKey: 'admin.nav.groups.people',
    items: [
      { id: 'users', labelKey: 'admin.nav.users', icon: Icons.Users },
    ],
  },
  {
    groupKey: 'admin.nav.groups.learning',
    items: [
      { id: 'content', labelKey: 'admin.nav.content', icon: Icons.Content },
      { id: 'categories', labelKey: 'admin.nav.categories', icon: Icons.Categories },
      { id: 'moderation', labelKey: 'admin.nav.moderation', icon: Icons.Moderation },
    ],
  },
  {
    groupKey: 'admin.nav.groups.business',
    items: [
      { id: 'analytics', labelKey: 'admin.nav.analytics', icon: Icons.Analytics },
      { id: 'finance', labelKey: 'admin.nav.finance', icon: Icons.Finance },
    ],
  },
  {
    groupKey: 'admin.nav.groups.engagement',
    items: [
      { id: 'engagement', labelKey: 'admin.nav.engagement', icon: Icons.Engagement },
    ],
  },
  {
    groupKey: 'admin.nav.groups.system',
    items: [
      { id: 'config', labelKey: 'admin.nav.config', icon: Icons.Config },
      { id: 'monitoring', labelKey: 'admin.nav.monitoring', icon: Icons.Monitor },
      { id: 'logs', labelKey: 'admin.nav.logs', icon: Icons.Logs },
    ],
  },
];

const navigation: NavItem[] = navigationGroups.flatMap(g => g.items);

/* ── CONFIRM MODAL ─────────────────────────────────────────────────── */
interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmVariant?: 'danger' | 'warning' | 'success';
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen, title, message, confirmLabel = 'Confirm', confirmVariant = 'danger', onConfirm, onCancel
}) => {
  const { t } = useTranslation();
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center px-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            className="relative w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-2xl my-auto"
          >
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">{message}</p>
            <div className="flex justify-end gap-3">
              <button onClick={onCancel} className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                {t('common.cancel')}
              </button>
              <button
                onClick={onConfirm}
                className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${
                  confirmVariant === 'danger' ? 'bg-rose-500 hover:bg-rose-600 text-white' :
                  confirmVariant === 'warning' ? 'bg-amber-500 hover:bg-amber-600 text-white' :
                  'bg-emerald-500 hover:bg-emerald-600 text-white'
                }`}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

/* ── EDIT USER MODAL ───────────────────────────────────────────────── */
interface EditUserModalProps {
  user: any | null;
  onClose: () => void;
  onSave: (id: string, data: { name: string; role: string }) => void;
  isSaving: boolean;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ user, onClose, onSave, isSaving }) => {
  const { t } = useTranslation();
  const [name, setName] = useState(user?.name || '');
  const [role, setRole] = useState(user?.role || 'student');

  if (!user) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center px-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/50 dark:bg-black/70 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-2xl my-auto max-h-[90vh] overflow-y-auto"
        >
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:text-white/40 dark:hover:text-white transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>

          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{t('admin.users.editModalTitle')}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{user.email}</p>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-white/40">{t('admin.users.nameLabel')}</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-white/40">{t('admin.users.roleLabel')}</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value)}
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="student">{t('admin.users.student')}</option>
                <option value="teacher">{t('admin.users.teacher')}</option>
                <option value="admin">{t('admin.users.admin')}</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-white/10 mt-6">
            <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white transition-colors">
              {t('common.cancel')}
            </button>
            <button
              onClick={() => onSave(user.id, { name, role })}
              disabled={isSaving}
              className="px-5 py-2 text-sm font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-colors disabled:opacity-50 shadow-md shadow-indigo-500/20"
            >
              {isSaving ? t('admin.users.saving') : t('admin.users.saveChanges')}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};

/* ── ACTION DROPDOWN ─────────────────────────────────────────────────── */
const ActionDropdown = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="relative inline-block text-left">
      <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-slate-400 hover:text-slate-900 dark:text-white/40 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-36 origin-top-right rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-xl z-50 overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-100">
            {React.Children.map(children, child => 
              React.isValidElement(child) ? React.cloneElement(child as React.ReactElement<any>, { 
                onClick: (e: any) => { 
                  if (child.props.onClick) child.props.onClick(e); 
                  setIsOpen(false); 
                }
              }) : child
            )}
          </div>
        </>
      )}
    </div>
  );
};

/* ── USER MANAGEMENT COMPONENT ─────────────────────────────────────── */
const UserIntelligence = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  // FIX BUG-01: Tab values khớp với dữ liệu backend (role: student/teacher/admin)
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editUser, setEditUser] = useState<any | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ userId: string; action: 'suspend' | 'activate' } | null>(null);
  const [deleteUserConfirm, setDeleteUserConfirm] = useState<{ userId: string; userName: string } | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users', filter, debouncedSearch, page],
    queryFn: () => userApi.getAllUsers({
      role: filter === 'All' ? undefined : filter.toLowerCase(),
      search: debouncedSearch || undefined,
      page,
      limit: 15
    }),
    staleTime: 60000,
    keepPreviousData: true,
  });

  // FIX: Lấy users + pagination từ response mới (có total, page, totalPages)
  const rawData = (usersData as any)?.data;
  const realUsers: any[] = rawData?.users || [];
  const totalPages: number = rawData?.totalPages || 1;

  const mappedUsers = realUsers.map((u: any) => ({
    id: u._id,
    name: u.name || 'Unknown',
    email: u.email || '',
    role: u.role || 'student',
    isActive: u.isActive !== false,
    avatar: u.avatar?.startsWith('http')
      ? u.avatar
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'U')}&background=6366f1&color=fff`,
    createdAt: u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A',
  }));

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => userApi.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
      setEditUser(null);
    }
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (userId: string) => userApi.toggleUserActive(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
      setConfirmAction(null);
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => userApi.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
      setDeleteUserConfirm(null);
    }
  });

  // FIX BUG-01: Tab labels hiển thị friendly, value map sang role backend
  const tabs = [
    { label: t('admin.users.tabAll'), value: 'All' },
    { label: t('admin.users.tabStudents'), value: 'student' },
    { label: t('admin.users.tabTeachers'), value: 'teacher' },
    { label: t('admin.users.tabAdmins'), value: 'admin' }
  ];

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-2 duration-200 pb-20 mt-4">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500 dark:text-white/40 pl-1">{t('admin.users.directory')}</span>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">{t('admin.users.title')}</h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/30" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input
              type="text"
              placeholder={t('admin.users.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:border-indigo-500 focus:outline-none transition-colors w-64 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Tabs — FIX BUG-01 */}
      <div className="flex gap-6 border-b border-slate-200 dark:border-white/10 pb-2">
        {tabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => { setFilter(tab.value); setPage(1); }}
            className={`text-sm font-semibold tracking-wide pb-2 relative transition-colors ${filter === tab.value ? 'text-indigo-600 dark:text-white font-bold' : 'text-slate-500 dark:text-white/40 hover:text-slate-900 dark:hover:text-white/70'}`}
          >
            {tab.label}
            {filter === tab.value && (
              <motion.div layoutId="user-tab" className="absolute -bottom-[3px] left-0 right-0 h-0.5 bg-indigo-600 dark:bg-white" />
            )}
          </button>
        ))}
      </div>

      {/* Data Table */}
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              <th className="pb-4 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-white/30 border-b border-slate-200 dark:border-white/10 w-12"></th>
              <th className="pb-4 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-white/30 border-b border-slate-200 dark:border-white/10">{t('admin.users.thUser')}</th>
              <th className="pb-4 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-white/30 border-b border-slate-200 dark:border-white/10">{t('admin.users.thRole')}</th>
              <th className="pb-4 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-white/30 border-b border-slate-200 dark:border-white/10">{t('admin.users.thStatus')}</th>
              <th className="pb-4 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-white/30 border-b border-slate-200 dark:border-white/10">{t('admin.users.thJoined')}</th>
              <th className="pb-4 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-white/30 border-b border-slate-200 dark:border-white/10 text-right">{t('admin.users.thActions')}</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {usersLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 dark:text-white/40 text-sm">
                    {t('admin.users.loading')}
                  </td>
                </tr>
              ) : mappedUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 dark:text-white/40 text-sm">
                    {t('admin.users.noUsers')}
                  </td>
                </tr>
              ) : (
                mappedUsers.map((user, idx) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.04 }}
                    className="group hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-4 border-b border-slate-200/80 dark:border-white/5">
                      <img src={user.avatar} alt={user.name} loading="lazy" decoding="async" className="w-8 h-8 rounded-full border border-slate-200 dark:border-white/10 object-cover" />
                    </td>
                    <td className="py-4 border-b border-slate-200/80 dark:border-white/5">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-900 dark:text-white/90 capitalize">{user.name}</span>
                        <span className="text-xs text-slate-500 dark:text-white/40">{user.email?.replace(/^\.+/, '')}</span>
                      </div>
                    </td>
                    <td className="py-4 border-b border-slate-200/80 dark:border-white/5">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-md ${
                        user.role === 'admin' ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' :
                        user.role === 'teacher' ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400' :
                        'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/60'
                      }`}>
                        {user.role === 'admin' ? t('admin.users.admin') : user.role === 'teacher' ? t('admin.users.teacher') : t('admin.users.student')}
                      </span>
                    </td>
                    <td className="py-4 border-b border-slate-200/80 dark:border-white/5">
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        <span className="text-sm text-slate-700 dark:text-white/70">{user.isActive ? t('admin.users.active') : t('admin.users.suspended')}</span>
                      </div>
                    </td>
                    <td className="py-4 border-b border-slate-200/80 dark:border-white/5">
                      <span className="text-sm text-slate-500 dark:text-white/50">{user.createdAt}</span>
                    </td>
                    {/* FIX BUG-05: Actions với handler thật */}
                    <td className="py-4 border-b border-slate-200/80 dark:border-white/5 text-right">
                      <ActionDropdown>
                        <button
                          onClick={() => setEditUser(user)}
                          className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 dark:text-white/70 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition-colors"
                        >
                          {t('admin.users.edit')}
                        </button>
                        <button
                          onClick={() => setConfirmAction({ userId: user.id, action: user.isActive ? 'suspend' : 'activate' })}
                          className={`w-full text-left px-4 py-2 text-xs font-semibold transition-colors ${
                            user.isActive
                              ? 'text-amber-600 dark:text-amber-400 hover:bg-amber-500/10'
                              : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10'
                          }`}
                        >
                          {user.isActive ? t('admin.users.suspendUser') : t('admin.users.activateUser')}
                        </button>
                        <button
                          onClick={() => setDeleteUserConfirm({ userId: user.id, userName: user.name })}
                          className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        >
                          {t('admin.users.deleteUser')}
                        </button>
                      </ActionDropdown>
                    </td>
                  </motion.tr>
                ))
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-500 dark:text-white/30">{t('admin.users.pageOf', { page, total: totalPages })}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="px-4 py-1.5 text-xs font-semibold bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-700 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/10 disabled:opacity-30 transition-colors shadow-sm"
            >
              {t('admin.users.previous')}
            </button>
            <button
              onClick={() => setPage(p => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="px-4 py-1.5 text-xs font-semibold bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-700 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/10 disabled:opacity-30 transition-colors shadow-sm"
            >
              {t('admin.users.next')}
            </button>
          </div>
        </div>
      )}

      {/* Edit User Modal — FIX BUG-05 */}
      {editUser && (
        <EditUserModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSave={(id, data) => updateUserMutation.mutate({ id, data })}
          isSaving={updateUserMutation.isPending}
        />
      )}

      {/* Confirm Suspend/Activate — thay window.confirm */}
      <ConfirmModal
        isOpen={!!confirmAction}
        title={confirmAction?.action === 'suspend' ? t('admin.users.suspendModalTitle') : t('admin.users.activateModalTitle')}
        message={
          confirmAction?.action === 'suspend'
            ? t('admin.users.suspendModalDesc')
            : t('admin.users.activateModalDesc')
        }
        confirmLabel={confirmAction?.action === 'suspend' ? t('admin.users.suspendConfirm') : t('admin.users.activateConfirm')}
        confirmVariant={confirmAction?.action === 'suspend' ? 'danger' : 'success'}
        onConfirm={() => {
          if (confirmAction) toggleActiveMutation.mutate(confirmAction.userId);
        }}
        onCancel={() => setConfirmAction(null)}
      />

      {/* Confirm Delete User */}
      <ConfirmModal
        isOpen={!!deleteUserConfirm}
        title={t('admin.users.deleteModalTitle')}
        message={t('admin.users.deleteModalDesc', { name: deleteUserConfirm?.userName })}
        confirmLabel={t('admin.users.deleteConfirm')}
        confirmVariant="danger"
        onConfirm={() => {
          if (deleteUserConfirm) deleteUserMutation.mutate(deleteUserConfirm.userId);
        }}
        onCancel={() => setDeleteUserConfirm(null)}
      />
    </div>
  );
};

/* ── SYSTEM MONITORING ─────────────────────────────────────────────── */
const SystemMonitoring = () => {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ['system-health'],
    queryFn: analyticsApi.getSystemHealth,
    refetchInterval: 10000, // Refetch every 10 seconds
    staleTime: 10000,
  });

  const health = data?.data || {};

  const metrics = [
    { label: t('admin.monitoring.apiResponse'), value: isLoading ? '...' : health.apiLatency || 'N/A', status: t('admin.health.optimal'), color: 'emerald' },
    { label: t('admin.monitoring.dbConnection'), value: isLoading ? '...' : health.dbConnection?.latency || 'N/A', status: health.dbConnection?.status || t('admin.health.optimal'), color: health.dbConnection?.status === 'error' ? 'rose' : 'emerald' },
    { label: t('admin.monitoring.memory'), value: isLoading ? '...' : health.memory?.rss || 'N/A', status: t('admin.health.optimal'), color: 'emerald' },
    { label: t('admin.monitoring.uptime'), value: isLoading ? '...' : health.uptime || 'N/A', status: t('admin.health.optimal'), color: 'emerald' },
  ];

  const stackItems = [
    { label: t('admin.config.backend'), value: 'Node.js + Express v5', badge: health.environment || 'development' },
    { label: t('admin.config.database'), value: 'MongoDB Atlas', badge: 'Mongoose ODM' },
    { label: t('admin.config.storage'), value: 'Cloudinary', badge: 'CDN' },
    { label: t('admin.config.realtime'), value: 'Socket.IO v4', badge: 'WebSocket' },
    { label: t('admin.config.payment'), value: 'Stripe', badge: 'Webhook' },
    { label: t('admin.config.frontend'), value: 'React 18 + Vite', badge: 'TypeScript' },
  ];

  return (
    <div className="flex flex-col gap-16 animate-in fade-in slide-in-from-bottom-2 duration-200 pb-20 mt-4">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--color-text-muted)] pl-1">{t('admin.monitoring.infrastructure')}</span>
          <h1 className="text-4xl lg:text-5xl font-light tracking-tight text-[var(--color-text)]">{t('admin.monitoring.title')}</h1>
        </div>
        <div className="flex items-center gap-3 mb-2 px-4 py-2 border border-emerald-500/20 rounded-full text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-bold tracking-widest uppercase">
            {health.dbConnection?.status === 'error' ? t('admin.monitoring.degraded') : t('admin.monitoring.operational')}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
        {metrics.map(metric => (
          <div key={metric.label} className="flex flex-col gap-2 border-l-2 border-[var(--color-border)] pl-5 hover:border-white/30 transition-colors">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">{metric.label}</span>
            <div className={`text-2xl font-light tracking-tight text-${metric.color}-400`}>
              {metric.value}
            </div>
            <span className="text-xs text-emerald-500 font-semibold uppercase tracking-widest">{metric.status}</span>
          </div>
        ))}
      </div>

      <div className="w-full h-[1px] bg-gradient-to-r from-[var(--color-border)] via-transparent to-transparent" />

      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-light tracking-tight text-[var(--color-text)]">{t('admin.monitoring.stackOverview')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {stackItems.map(item => (
            <div key={item.label} className="flex items-center justify-between p-4 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest">{item.label}</span>
                <span className="text-sm font-medium text-[var(--color-text)]">{item.value}</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 bg-indigo-500/10 text-indigo-400 rounded">{item.badge}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ── ENGAGEMENT CENTER ─────────────────────────────────────────────── */
const EngagementCenter = () => {
  const { t, i18n } = useTranslation();
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: analyticsApi.getAdminDashboard,
    staleTime: 60000,
  });

  const recentEnrollments: any[] = analyticsData?.data?.recentEnrollments || [];
  const locale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';

  const formatTimeAgo = (dateStr?: string) => {
    if (!dateStr) return '';
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffSec = Math.max(0, Math.floor(diffMs / 1000));
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);
    if (diffSec < 60) return i18n.language === 'vi' ? 'Vừa xong' : 'Just now';
    if (diffMin < 60) return i18n.language === 'vi' ? `${diffMin} phút trước` : `${diffMin}m ago`;
    if (diffHr < 24) return i18n.language === 'vi' ? `${diffHr} giờ trước` : `${diffHr}h ago`;
    if (diffDay < 7) return i18n.language === 'vi' ? `${diffDay} ngày trước` : `${diffDay}d ago`;
    return new Date(dateStr).toLocaleDateString(locale);
  };

  const modules = [
    { labelKey: 'admin.engagement.reviews', descKey: 'admin.engagement.reviewsDesc', icon: '⭐', count: 'Active' },
    { labelKey: 'admin.engagement.discussions', descKey: 'admin.engagement.discussionsDesc', icon: '💬', count: 'Active' },
    { labelKey: 'admin.engagement.notifications', descKey: 'admin.engagement.notificationsDesc', icon: '📢', count: 'Socket.IO' },
  ];

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-2 duration-200 pb-20 mt-4">
      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--color-text-muted)] pl-1">{t('admin.engagement.community')}</span>
        <h1 className="text-4xl font-light tracking-tight text-[var(--color-text)]">{t('admin.engagement.title')}</h1>
        <p className="text-[var(--color-text-muted)] text-base max-w-lg">{t('admin.engagement.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4">
        {/* Real-time Activity Feed */}
        <div className="lg:col-span-8 flex flex-col gap-6 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-4">
            <h2 className="text-xl font-light tracking-tight text-[var(--color-text)]">{t('admin.engagement.activityFeed')}</h2>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">{t('admin.engagement.liveMongoDB')}</span>
            </div>
          </div>
          
          <div className="flex flex-col gap-4 mt-2">
            {isLoading ? (
              <div className="py-8 text-center text-[var(--color-text-muted)] text-sm">{t('admin.engagement.loadingActivity')}</div>
            ) : recentEnrollments.length === 0 ? (
              <div className="py-8 text-center text-[var(--color-text-muted)] text-sm">{t('admin.engagement.noActivity')}</div>
            ) : (
              recentEnrollments.map((item: any, i: number) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-start gap-4 p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:opacity-80 transition-colors cursor-pointer group"
                >
                  <img
                    src={item.student?.avatar?.startsWith('http')
                      ? item.student.avatar
                      : `https://ui-avatars.com/api/?name=${encodeURIComponent(item.student?.name || 'U')}&background=6366f1&color=fff&size=40`
                    }
                    alt={item.student?.name}
                    loading="lazy"
                    decoding="async"
                    className="w-10 h-10 rounded-full border border-[var(--color-border)] shrink-0 object-cover"
                  />
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <p className="text-sm text-[var(--color-text)] group-hover:opacity-100 transition-colors">
                      <span className="font-bold">{item.student?.name || t('admin.engagement.enrolledCourse')}</span> {t('admin.engagement.enrolledCourse')} <span className="font-medium text-indigo-400">{item.course?.title || ''}</span>
                    </p>
                    <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
                      <span>{formatTimeAgo(item.createdAt)}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${item.paymentStatus === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-[var(--color-text-muted)]'}`}>
                        {item.paymentStatus === 'completed' ? t('admin.engagement.paid') : t('admin.engagement.freePending')}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Modules */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {modules.map((item, i) => (
            <motion.div 
              key={item.labelKey}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-4 p-5 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-3xl backdrop-blur-xl shadow-xl hover:opacity-80 transition-all cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-2xl bg-[var(--color-surface)] flex items-center justify-center text-2xl shrink-0 group-hover:opacity-80 transition-colors">
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-[var(--color-text)]">{t(item.labelKey)}</p>
                  <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400">{item.count}</span>
                </div>
                <p className="text-xs text-[var(--color-text-muted)] leading-relaxed mt-1">{t(item.descKey)}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ── SYSTEM CONFIG ─────────────────────────────────────────────────── */
const SystemConfig = () => {
  const { t } = useTranslation();
  const configItems = [
    { key: 'NODE_ENV', value: 'development', label: 'Environment' },
    { key: 'JWT_EXPIRES_IN', value: '1d', label: 'JWT Expiry' },
    { key: 'RATE_LIMIT', value: '100 req/hour', label: 'API Rate Limit' },
    { key: 'DB', value: 'MongoDB Atlas', label: t('admin.config.database') },
    { key: 'STORAGE', value: 'Cloudinary', label: t('admin.config.storage') },
    { key: 'PAYMENT', value: 'Stripe', label: t('admin.config.payment') },
  ];

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-2 duration-200 pb-20 mt-4">
      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--color-text-muted)] pl-1">{t('admin.config.configuration')}</span>
        <h1 className="text-4xl font-light tracking-tight text-[var(--color-text)]">{t('admin.config.title')}</h1>
        <p className="text-[var(--color-text-muted)] text-base max-w-lg">{t('admin.config.subtitle')}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {configItems.map(item => (
          <div key={item.key} className="flex items-center justify-between p-4 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl">
            <div>
              <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest">{item.label}</p>
              <p className="text-xs font-mono text-[var(--color-text-muted)] mt-0.5">{item.key}</p>
            </div>
            <span className="text-sm font-mono text-cyan-400">{item.value}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-[var(--color-text-muted)] italic">{t('admin.config.envNote')}</p>
    </div>
  );
};

/* ── MODERATION QUEUE ─────────────────────────────────────────────── */
const ModerationQueue = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { success: successToast } = useToast();
  const [subTab, setSubTab] = useState<'courses' | 'teachers'>('courses');
  const [rejectCourse, setRejectCourse] = useState<any | null>(null);
  const [previewCourse, setPreviewCourse] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Queries
  const { data: coursesData, isLoading: coursesLoading } = useQuery({
    queryKey: ['admin-moderation-courses'],
    queryFn: () => adminApi.getCoursesPendingReview({ limit: 50 }),
    staleTime: 60000,
    enabled: subTab === 'courses'
  });

  const { data: applicationsData, isLoading: appsLoading } = useQuery({
    queryKey: ['admin-teacher-applications'],
    queryFn: () => adminApi.getTeacherApplications({ status: 'pending', limit: 50 }),
    staleTime: 60000,
    enabled: subTab === 'teachers'
  });

  // Mutations
  const approveCourseMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: 'published' | 'draft'; notes?: string }) => 
      courseApi.approveCourse(id, status, notes),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin-moderation-courses'] });
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
      successToast(vars.status === 'published' ? t('admin.moderation.approve') : t('admin.moderation.reject'));
      setRejectCourse(null);
      setRejectReason('');
    }
  });

  const processAppMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'approve' | 'reject' }) => 
      adminApi.processTeacherApplication(id, { action }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin-teacher-applications'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
      successToast(vars.action === 'approve' ? t('admin.moderation.approve') : t('admin.moderation.reject'));
    }
  });

  const pendingCourses = coursesData?.data?.courses || [];
  const pendingApps = applicationsData?.data?.applications || [];

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-2 duration-200 pb-20 mt-4">
      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--color-text-muted)] pl-1">{t('admin.moderation.compliance', 'Tuân thủ & Kiểm duyệt')}</span>
        <h1 className="text-4xl font-light tracking-tight text-[var(--color-text)]">{t('admin.moderation.title', 'Hàng chờ Kiểm duyệt')}</h1>
      </div>

      <div className="flex gap-6 border-b border-[var(--color-border)] pb-2">
        <button
          onClick={() => setSubTab('courses')}
          className={`text-sm font-semibold tracking-wide pb-2 relative transition-colors ${subTab === 'courses' ? 'text-[var(--color-text)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'}`}
        >
          {t('admin.moderation.pendingCoursesTab', { count: pendingCourses.length, defaultValue: `Khóa học chờ duyệt (${pendingCourses.length})` })}
          {subTab === 'courses' && (
            <motion.div layoutId="mod-tab" className="absolute -bottom-[3px] left-0 right-0 h-0.5 bg-indigo-500" />
          )}
        </button>
        <button
          onClick={() => setSubTab('teachers')}
          className={`text-sm font-semibold tracking-wide pb-2 relative transition-colors ${subTab === 'teachers' ? 'text-[var(--color-text)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'}`}
        >
          {t('admin.moderation.teacherAppsTab', { count: pendingApps.length, defaultValue: `Đơn giảng viên (${pendingApps.length})` })}
          {subTab === 'teachers' && (
            <motion.div layoutId="mod-tab" className="absolute -bottom-[3px] left-0 right-0 h-0.5 bg-indigo-500" />
          )}
        </button>
      </div>

      {subTab === 'courses' ? (
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
                <th className="pb-4">{t('admin.moderation.thCourseInfo', 'Thông tin khóa học')}</th>
                <th className="pb-4">{t('admin.moderation.thPrice', 'Học phí')}</th>
                <th className="pb-4">{t('admin.moderation.thSubmittedAt', 'Thời gian gửi')}</th>
                <th className="pb-4 text-right">{t('admin.moderation.thActions', 'Thao tác')}</th>
              </tr>
            </thead>
            <tbody>
              {coursesLoading ? (
                <tr><td colSpan={4} className="py-8 text-center text-[var(--color-text-muted)]">{t('admin.moderation.loadingCourses', 'Đang tải danh sách khóa học chờ duyệt...')}</td></tr>
              ) : pendingCourses.length === 0 ? (
                <tr><td colSpan={4} className="py-8 text-center text-[var(--color-text-muted)]">{t('admin.moderation.noCoursePending', 'Không có khóa học nào đang chờ kiểm duyệt.')}</td></tr>
              ) : (
                pendingCourses.map((c: any) => (
                  <tr key={c._id} className="border-b border-[var(--color-border)] hover:bg-[var(--color-surface)]">
                    <td className="py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-[var(--color-text)]">{c.title}</span>
                        <span className="text-xs text-[var(--color-text-muted)]">{c.category?.name || 'Uncategorized'}</span>
                      </div>
                    </td>
                    <td className="py-4 text-sm text-[var(--color-text)]">
                      <div className="flex flex-col">
                        <span>{c.price.toLocaleString('vi-VN')}đ</span>
                        {c.discountPercentage && c.discountPercentage > 0 ? (
                          <span className="text-[10px] text-[var(--color-text-muted)] line-through">
                            {Number(c.estimatedPrice || c.price).toLocaleString('vi-VN')}đ
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="py-4 text-sm text-[var(--color-text-muted)]">{new Date(c.updatedAt).toLocaleDateString()}</td>
                    <td className="py-4 text-right flex justify-end items-center gap-2">
                      <button
                        onClick={() => setPreviewCourse(c)}
                        className="px-2.5 py-1.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        title={t('admin.moderation.inspect', 'Xem chi tiết')}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                        <span>{t('admin.moderation.inspect', 'Xem trước')}</span>
                      </button>
                      <button
                        onClick={() => approveCourseMutation.mutate({ id: c._id, status: 'published' })}
                        className="px-2.5 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        <span>{t('admin.moderation.approve', 'Phê duyệt')}</span>
                      </button>
                      <button
                        onClick={() => setRejectCourse(c)}
                        className="px-2.5 py-1.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        <span>{t('admin.moderation.reject', 'Từ chối')}</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
                <th className="pb-4">{t('admin.moderation.thApplicant', 'Ứng viên')}</th>
                <th className="pb-4">{t('admin.moderation.thSpecialty', 'Chuyên môn')}</th>
                <th className="pb-4">{t('admin.moderation.thBio', 'Tiểu sử')}</th>
                <th className="pb-4">{t('admin.moderation.thResume', 'Hồ sơ / CV')}</th>
                <th className="pb-4 text-right">{t('admin.moderation.thActions', 'Thao tác')}</th>
              </tr>
            </thead>
            <tbody>
              {appsLoading ? (
                <tr><td colSpan={5} className="py-8 text-center text-[var(--color-text-muted)]">{t('admin.moderation.loadingApps', 'Đang tải danh sách đơn đăng ký giảng viên...')}</td></tr>
              ) : pendingApps.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-[var(--color-text-muted)]">{t('admin.moderation.noAppPending', 'Không có đơn đăng ký giảng viên nào đang chờ xét duyệt.')}</td></tr>
              ) : (
                pendingApps.map((app: any) => (
                  <tr key={app._id} className="border-b border-[var(--color-border)] hover:bg-[var(--color-surface)]">
                    <td className="py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-[var(--color-text)]">{app.student?.name}</span>
                        <span className="text-xs text-[var(--color-text-muted)]">{app.student?.email}</span>
                      </div>
                    </td>
                    <td className="py-4 text-sm text-[var(--color-text)]">{app.specialty}</td>
                    <td className="py-4 text-sm text-[var(--color-text-muted)] max-w-xs truncate" title={app.bio}>{app.bio}</td>
                    <td className="py-4">
                      <a
                        href={app.resumeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-indigo-400 hover:underline"
                      >
                        {t('admin.moderation.viewCV', 'Xem CV')}
                      </a>
                    </td>
                    <td className="py-4 text-right flex justify-end gap-2">
                      <button
                        onClick={() => processAppMutation.mutate({ id: app._id, action: 'approve' })}
                        className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 rounded text-xs font-bold uppercase transition-colors"
                      >
                        {t('admin.moderation.approve', 'Phê duyệt')}
                      </button>
                      <button
                        onClick={() => processAppMutation.mutate({ id: app._id, action: 'reject' })}
                        className="px-3 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 rounded text-xs font-bold uppercase transition-colors"
                      >
                        {t('admin.moderation.reject', 'Từ chối')}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Reject Course Modal */}
      {createPortal(
        <AnimatePresence>
          {rejectCourse && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center px-4 overflow-y-auto">
              <div onClick={() => setRejectCourse(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
              <div className="relative w-full max-w-md bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-2xl p-6 shadow-2xl my-auto max-h-[90vh] overflow-y-auto">
                <h3 className="text-lg font-light text-[var(--color-text)] mb-2">{t('admin.moderation.rejectCourseTitle', 'Từ chối khóa học')}</h3>
                <p className="text-xs text-[var(--color-text-muted)] mb-4">{t('admin.moderation.rejectCourseDesc', { title: rejectCourse.title, defaultValue: `Vui lòng nhập lý do từ chối khóa học "${rejectCourse.title}" để thông báo cho giảng viên:` })}</p>
                <textarea
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder={t('admin.moderation.rejectReasonPlaceholder', 'Nhập lý do từ chối chi tiết...')}
                  rows={4}
                  className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-3 text-sm text-[var(--color-text)] focus:outline-none focus:border-indigo-500 resize-none transition-colors"
                />
                <div className="flex justify-end gap-3 mt-6">
                  <button onClick={() => setRejectCourse(null)} className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">
                    {t('admin.moderation.cancel', 'Hủy')}
                  </button>
                  <button
                    onClick={() => approveCourseMutation.mutate({ id: rejectCourse._id, status: 'draft', notes: rejectReason })}
                    className="px-4 py-2 text-xs font-bold bg-rose-500 hover:bg-rose-400 text-white rounded-lg transition-colors"
                  >
                    {t('admin.moderation.confirmReject', 'Xác nhận từ chối')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Course Preview Modal */}
          {previewCourse && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 overflow-y-auto">
              <div onClick={() => setPreviewCourse(null)} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
              <div className="relative w-full max-w-2xl bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-2xl p-6 sm:p-8 shadow-2xl my-auto max-h-[90vh] overflow-y-auto space-y-6">
                <div className="flex items-start justify-between gap-4 border-b border-[var(--color-border)] pb-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded">
                      {previewCourse.category?.name || 'Uncategorized'}
                    </span>
                    <h3 className="text-xl font-bold text-[var(--color-text)] mt-2">{previewCourse.title}</h3>
                    {previewCourse.instructor && (
                      <p className="text-xs text-[var(--color-text-muted)] mt-1">
                        {t('admin.moderation.instructor', 'Giảng viên')}: <span className="font-semibold text-[var(--color-text)]">{previewCourse.instructor.name || previewCourse.instructor} {previewCourse.instructor.email ? `(${previewCourse.instructor.email})` : ''}</span>
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setPreviewCourse(null)}
                    className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)]">{t('admin.moderation.thPrice', 'Học phí')}</span>
                    <p className="text-base font-bold text-emerald-400 mt-0.5">{Number(previewCourse.price || 0).toLocaleString('vi-VN')}đ</p>
                  </div>
                  <div className="p-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)]">{t('admin.courseManagement.thLessons', 'Bài giảng')}</span>
                    <p className="text-base font-bold text-[var(--color-text)] mt-0.5">{previewCourse.lessonsCount || 0}</p>
                  </div>
                  <div className="p-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)]">{t('admin.courseManagement.thStatus', 'Trạng thái')}</span>
                    <p className="text-base font-bold text-amber-400 mt-0.5 capitalize">{previewCourse.status}</p>
                  </div>
                  <div className="p-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)]">{t('admin.moderation.thSubmittedAt', 'Thời gian gửi')}</span>
                    <p className="text-xs font-semibold text-[var(--color-text)] mt-1">{new Date(previewCourse.updatedAt).toLocaleDateString()}</p>
                  </div>
                </div>

                {previewCourse.description && (
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">{t('admin.moderation.description', 'Mô tả khóa học')}</h4>
                    <div className="p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text)] leading-relaxed max-h-44 overflow-y-auto">
                      {previewCourse.description}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[var(--color-border)]">
                  <a
                    href={`/courses/${previewCourse._id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 hover:underline inline-flex items-center gap-1.5"
                  >
                    <span>{t('admin.moderation.viewLivePage', 'Mở trang chi tiết')}</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  </a>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const target = previewCourse;
                        setPreviewCourse(null);
                        setRejectCourse(target);
                      }}
                      className="px-4 py-2 text-xs font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl transition-colors cursor-pointer"
                    >
                      {t('admin.moderation.reject', 'Từ chối')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        approveCourseMutation.mutate({ id: previewCourse._id, status: 'published' });
                        setPreviewCourse(null);
                      }}
                      className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md transition-colors cursor-pointer"
                    >
                      {t('admin.moderation.approve', 'Phê duyệt xuất bản')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

/* ── SYSTEM AUDIT LOGS ──────────────────────────────────────────────── */
const SystemLogs = () => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-audit-logs', page, search],
    queryFn: () => adminApi.getAuditLogs({ page, limit: 15, search: search || undefined }),
    staleTime: 60000,
  });

  const logs = data?.data?.logs || [];
  const totalPages = data?.data?.totalPages || 1;

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-2 duration-200 pb-20 mt-4">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--color-text-muted)] pl-1">{t('admin.logs.compliance')}</span>
          <h1 className="text-4xl font-light tracking-tight text-[var(--color-text)]">{t('admin.logs.title')}</h1>
        </div>
        <input
          type="text"
          placeholder={t('admin.logs.filterPlaceholder')}
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="pl-4 pr-4 py-2 text-sm bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg focus:border-indigo-500 focus:outline-none transition-colors w-64 text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]"
        />
      </div>

      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--color-border)] text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
              <th className="pb-4">{t('admin.logs.thTimestamp')}</th>
              <th className="pb-4">{t('admin.logs.thActor')}</th>
              <th className="pb-4">{t('admin.logs.thOperation')}</th>
              <th className="pb-4">{t('admin.logs.thIP')}</th>
              <th className="pb-4">{t('admin.logs.thEndpoint')}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="py-8 text-center text-[var(--color-text-muted)]">{t('admin.logs.loading')}</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={5} className="py-8 text-center text-[var(--color-text-muted)]">{t('admin.logs.noLogs')}</td></tr>
            ) : (
              logs.map((log: any) => (
                <tr key={log._id} className="border-b border-[var(--color-border)] hover:bg-[var(--color-surface)]">
                  <td className="py-4 text-xs text-[var(--color-text-muted)]">{new Date(log.createdAt).toLocaleString()}</td>
                  <td className="py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-[var(--color-text)]">{log.actor?.name || 'System'}</span>
                      <span className="text-xs text-[var(--color-text-muted)]">{log.actor?.email || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="py-4">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-4 text-xs text-[var(--color-text-muted)]">{log.ipAddress || '127.0.0.1'}</td>
                  <td className="py-4 text-xs font-mono text-[var(--color-text-muted)]">{log.details?.method} {log.details?.url}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--color-text-muted)]">{t('admin.logs.pageOf', { page, total: totalPages })}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="px-4 py-1.5 text-xs font-semibold bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)] disabled:opacity-30 transition-colors"
            >
              {t('admin.logs.previous')}
            </button>
            <button
              onClick={() => setPage(p => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="px-4 py-1.5 text-xs font-semibold bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)] disabled:opacity-30 transition-colors"
            >
              {t('admin.logs.next')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Main Layout ───────────────────────────────────────────────────── */
const AdminDashboard: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { tabId } = useParams<{ tabId: string }>();
  const navigate = useNavigate();
  const activeSection = tabId || 'pulse';
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCmdKOpen, setIsCmdKOpen] = useState(false);

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'vi' ? 'en' : 'vi';
    i18n.changeLanguage(nextLang);
    localStorage.setItem('language', nextLang);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCmdKOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const adminInitials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'AD';

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden font-sans selection:bg-indigo-500/30 relative bg-[var(--color-bg)] text-[var(--color-text)]">

      {/* ── ATMOSPHERIC MULTI-LAYERED BACKGROUND SYSTEM ── */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden select-none">
        {/* Layer 1: Ambient Aurora Mesh Glowing Orbs */}
        <div className="absolute -top-[20%] -left-[10%] w-[800px] h-[800px] rounded-full bg-gradient-to-br from-indigo-500/12 via-purple-500/8 to-transparent blur-[64px] transform-gpu will-change-transform dark:from-indigo-600/20 dark:via-purple-600/15" />
        <div className="absolute top-[20%] right-[-5%] w-[700px] h-[700px] rounded-full bg-gradient-to-bl from-cyan-500/10 via-indigo-500/8 to-transparent blur-[64px] transform-gpu will-change-transform dark:from-cyan-500/18 dark:via-indigo-500/12" />
        <div className="absolute -bottom-[20%] left-[25%] w-[850px] h-[650px] rounded-full bg-gradient-to-t from-violet-500/8 via-indigo-500/5 to-transparent blur-[70px] transform-gpu will-change-transform dark:from-violet-600/15 dark:via-indigo-600/10" />

        {/* Layer 2: Precision Micro-Dot Matrix Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.45] dark:opacity-[0.25]"
          style={{
            backgroundImage: `radial-gradient(circle at center, var(--color-primary-500) 1px, transparent 1px)`,
            backgroundSize: '28px 28px',
            maskImage: 'radial-gradient(ellipse 90% 90% at 50% 40%, black 40%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(ellipse 90% 90% at 50% 40%, black 40%, transparent 100%)',
          }}
        />

        {/* Layer 3: Tech Concentric Radar Orbit Rings (Fills empty areas with subtle geometry) */}
        <div className="absolute top-[40%] right-[3%] -translate-y-1/2 w-[850px] h-[850px] rounded-full border border-indigo-500/[0.02] dark:border-indigo-400/[0.03] opacity-40 pointer-events-none" />
        <div className="absolute top-[40%] right-[3%] -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-indigo-500/[0.015] dark:border-indigo-400/[0.025] opacity-40 pointer-events-none" />
        <div className="absolute top-[40%] right-[3%] -translate-y-1/2 w-[380px] h-[380px] rounded-full border border-dashed border-indigo-500/[0.02] dark:border-indigo-400/[0.03] opacity-40 pointer-events-none" />
      </div>

      {/* ── FLOATING NAVIGATION RAIL ── */}
      <aside className={`h-full bg-[var(--color-surface)] border-r border-[var(--color-border)] backdrop-blur-3xl flex flex-col z-20 shrink-0 shadow-[var(--shadow-elev-2)] transition-all duration-300 relative ${isSidebarOpen ? 'w-[280px]' : 'w-[88px]'}`}>
        
        {/* Toggle Button */}
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          title={isSidebarOpen ? 'Thu gọn thanh điều hướng' : 'Mở rộng thanh điều hướng'}
          className="absolute -right-3 top-[3.5rem] w-6 h-6 bg-indigo-600 hover:bg-indigo-500 rounded-full flex items-center justify-center text-white z-50 border border-white dark:border-slate-800 hover:scale-110 active:scale-95 transition-all shadow-md"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={`transition-transform duration-300 ${isSidebarOpen ? '' : 'rotate-180'}`}>
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <div className={`h-28 flex items-center ${isSidebarOpen ? 'px-8' : 'px-0 justify-center'}`}>
          <Link 
            to="/home" 
            title={!isSidebarOpen ? "E-LEARNING Command Center" : undefined}
            className={`flex items-center group ${isSidebarOpen ? 'gap-4 overflow-hidden' : 'justify-center'}`}
          >
            <div className="w-10 h-10 shrink-0 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black tracking-tighter text-base transition-transform group-hover:scale-105 shadow-md shadow-indigo-500/20">
              E
            </div>
            {isSidebarOpen && (
              <div className="flex flex-col animate-in fade-in duration-300">
                <span className="font-extrabold tracking-wider uppercase text-xs text-slate-900 dark:text-white whitespace-nowrap">
                  E-LEARNING
                </span>
                <span className="text-[10px] font-bold text-slate-500 dark:text-white/50 tracking-widest uppercase">
                  {t('admin.nav.commandCenter')}
                </span>
              </div>
            )}
          </Link>
        </div>

        <nav className={`flex-1 py-4 flex flex-col gap-4 overflow-y-auto ${isSidebarOpen ? 'px-4 admin-scrollbar' : 'px-3 hide-scrollbar'}`}>
          {navigationGroups.map((group) => (
            <div key={group.groupKey} className="flex flex-col gap-1">
              {isSidebarOpen ? (
                <div className="px-3 pt-2 pb-1 text-[10px] font-extrabold tracking-wider text-[var(--color-text-muted)] uppercase opacity-60 truncate">
                  {t(group.groupKey)}
                </div>
              ) : (
                <div className="my-1 mx-auto w-6 h-[1px] bg-[var(--color-border)] opacity-60" />
              )}

              {group.items.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(`/admin-dashboard/${item.id}`)}
                    onMouseEnter={() => prefetchTab(item.id)}
                    title={!isSidebarOpen ? t(item.labelKey) : undefined}
                    className={`w-full flex items-center rounded-xl text-xs font-semibold tracking-wide transition-all relative group ${
                      isSidebarOpen ? 'gap-3.5 px-3 py-2.5' : 'justify-center py-3 px-0'
                    } ${
                      isActive
                        ? 'text-indigo-600 dark:text-white bg-indigo-50/80 dark:bg-white/10 font-bold shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-white/5'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="rail-indicator"
                        className="absolute inset-0 bg-indigo-500/10 dark:bg-white/10 rounded-xl border border-indigo-500/20 dark:border-white/10"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    <div className={`relative z-10 transition-colors ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'}`}>
                      <item.icon />
                    </div>
                    {isSidebarOpen && (
                      <span className="relative z-10 truncate whitespace-nowrap">
                        {t(item.labelKey)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* FIX BUG-06: Admin profile từ AuthContext */}
        <div className={isSidebarOpen ? 'p-6' : 'py-4 px-0 flex justify-center'}>
          <div 
            title={!isSidebarOpen ? `${user?.name || 'Admin'} (${user?.role === 'admin' ? t('admin.users.admin') : user?.role || 'Admin'})` : undefined}
            className={`flex items-center group cursor-pointer overflow-hidden rounded-xl hover:bg-slate-100/70 dark:hover:bg-white/5 transition-colors ${
              isSidebarOpen ? 'gap-3.5 p-2' : 'justify-center p-1.5'
            }`}
          >
            {user?.avatar && user.avatar.startsWith('http') ? (
              <img src={user.avatar} alt={user.name} loading="lazy" decoding="async" className="w-10 h-10 shrink-0 rounded-full border border-slate-200 dark:border-white/10 object-cover" />
            ) : (
              <div className="w-10 h-10 shrink-0 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/20 dark:border-indigo-500/30 flex items-center justify-center text-sm font-extrabold text-indigo-600 dark:text-indigo-300">
                {adminInitials}
              </div>
            )}
            {isSidebarOpen && (
              <div className="flex flex-col text-left animate-in fade-in duration-300 min-w-0">
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider truncate max-w-[140px]">
                  {user?.name || 'Admin'}
                </span>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                  {user?.role === 'admin' ? t('admin.users.admin') : user?.role || 'Admin'}
                </span>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ── CONTINUOUS CANVAS WORKSPACE ── */}
      <main className="flex-1 h-full flex flex-col z-10 relative overflow-hidden">

        {/* Ambient Workspace Depth Layer */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden select-none">
          {/* Subtle Horizon divider beam */}
          <div className="absolute top-28 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-slate-200/90 dark:via-indigo-500/25 to-transparent" />
          {/* Subtle vertical alignment beams */}
          <div className="absolute top-0 right-16 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-slate-200/40 dark:via-white/[0.02] to-transparent hidden xl:block" />
          <div className="absolute top-0 left-16 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-slate-200/40 dark:via-white/[0.02] to-transparent hidden xl:block" />
        </div>

        {/* Transparent Header */}
        <header className="h-28 flex items-center justify-end px-12 shrink-0 relative z-20">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsCmdKOpen(true)}
              className="relative group flex items-center"
            >
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/40 group-hover:text-slate-700 dark:group-hover:text-white transition-colors" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              <div className="pl-9 pr-3.5 py-2 text-xs font-bold tracking-widest uppercase bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl group-hover:border-indigo-500/40 dark:group-hover:border-white/30 hover:shadow-sm transition-all w-60 text-left text-slate-500 dark:text-white/50 flex justify-between items-center shadow-sm">
                <span>{t('admin.nav.searchIndex')}</span>
                <span className="bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-white/60 px-1.5 py-0.5 rounded text-[10px] font-mono">⌘K</span>
              </div>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="h-9 w-9 flex items-center justify-center rounded-xl bg-white dark:bg-white/5 text-slate-700 dark:text-white/70 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/10 transition-colors border border-slate-200 dark:border-white/10 shadow-sm"
              title={theme === 'dark' ? t('layout.theme.light') : t('layout.theme.dark')}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400">
                  <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              )}
            </button>

            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="h-9 px-3 flex items-center justify-center gap-1 rounded-xl bg-white dark:bg-white/5 text-xs font-bold text-slate-700 dark:text-white/70 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors border border-slate-200 dark:border-white/10 shadow-sm"
              title={i18n.language === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
              aria-label="Toggle language"
            >
              <span className={i18n.language === 'vi' ? 'text-indigo-600 dark:text-indigo-400 font-extrabold' : 'text-slate-400 dark:text-white/40'}>VI</span>
              <span className="text-slate-300 dark:text-white/20 text-[10px]">/</span>
              <span className={i18n.language === 'en' ? 'text-indigo-600 dark:text-indigo-400 font-extrabold' : 'text-slate-400 dark:text-white/40'}>EN</span>
            </button>
          </div>
        </header>

        {/* Scrolling Canvas */}
        <div className="flex-1 overflow-y-auto px-12 lg:px-20 pb-24 admin-scrollbar">
          <div className="max-w-[1400px] mx-auto">
            <React.Suspense fallback={
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-8 h-8 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
              </div>
            }>
              {activeSection === 'pulse'      && <PlatformPulse />}
              {activeSection === 'users'      && <UserIntelligence />}
              {activeSection === 'content'    && <CourseManagementTab />}
              {activeSection === 'categories' && <CategoryManagementTab />}
              {activeSection === 'analytics'  && <AnalyticsTab />}
              {activeSection === 'finance'    && <FinancialTab />}
              {activeSection === 'engagement' && <EngagementCenter />}
              {activeSection === 'config'     && <SystemConfig />}
              {activeSection === 'monitoring' && <SystemMonitoring />}
              {activeSection === 'moderation' && <ModerationQueue />}
              {activeSection === 'logs'       && <SystemLogs />}
            </React.Suspense>
          </div>
        </div>
        {/* Command Palette */}
        {isCmdKOpen && (
          <React.Suspense fallback={null}>
            <CommandPalette isOpen={isCmdKOpen} onClose={() => setIsCmdKOpen(false)} navigate={navigate} />
          </React.Suspense>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
