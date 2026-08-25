import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { userApi } from '../services/user.api';
import { analyticsApi } from '../services/analytics.api';
import { adminApi } from '../services/admin.api';
import { courseApi } from '../services/course.api';
import { useToast } from '../contexts/ToastContext';
import { useCountUp } from '../hooks/useCountUp';
import CourseManagementTab from './CourseManagementTab';
import CategoryManagementTab from './CategoryManagementTab';
import { PlatformPulse } from '../components/admin/PlatformPulse';
import { AnalyticsTab } from '../components/admin/AnalyticsTab';
import { FinancialTab } from '../components/admin/FinancialTab';

/* ── Icons ────────────────────────────────────────────────────────── */
const Icons = {
  Pulse: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
  Users: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Content: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
  Analytics: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>,
  Finance: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  Engagement: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  Config: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  Monitor: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
  Moderation: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>,
  Logs: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
};

const navigation = [
  { id: 'pulse', label: 'Platform Pulse', icon: Icons.Pulse },
  { id: 'users', label: 'User Management', icon: Icons.Users },
  { id: 'content', label: 'Learning Content', icon: Icons.Content },
  { id: 'categories', label: 'Category Taxonomy', icon: Icons.Content },
  { id: 'moderation', label: 'Moderation Queue', icon: Icons.Moderation },
  { id: 'analytics', label: 'Analytics & Reports', icon: Icons.Analytics },
  { id: 'finance', label: 'Financial Center', icon: Icons.Finance },
  { id: 'engagement', label: 'Engagement Center', icon: Icons.Engagement },
  { id: 'config', label: 'System Configuration', icon: Icons.Config },
  { id: 'monitoring', label: 'System Monitoring', icon: Icons.Monitor },
  { id: 'logs', label: 'System Logs', icon: Icons.Logs },
];

/* ── COMMAND PALETTE ───────────────────────────────────────────────── */
const CommandPalette = ({ isOpen, onClose, navigate }: { isOpen: boolean, onClose: () => void, navigate: any }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[110] flex items-start justify-center pt-[20vh] px-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <div className="flex items-center px-4 border-b border-white/10">
          <svg className="text-white/40" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <input 
            autoFocus 
            type="text" 
            placeholder="Type a command or search..." 
            className="w-full bg-transparent px-4 py-4 text-white focus:outline-none placeholder:text-white/30 text-lg" 
          />
          <button onClick={onClose} className="px-2 py-1 bg-white/10 rounded text-[10px] font-bold tracking-widest text-white/50 uppercase hover:text-white">Esc</button>
        </div>
        <div className="p-2 max-h-[40vh] overflow-y-auto">
          <div className="px-3 py-2 text-[10px] font-bold text-white/30 uppercase tracking-widest">Navigation</div>
          {navigation.map(nav => (
            <button 
              key={nav.id} 
              onClick={() => { navigate(`/admin-dashboard/${nav.id}`); onClose(); }}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-white/5 text-left transition-colors"
            >
              <div className="text-indigo-400"><nav.icon /></div>
              <span className="text-sm font-medium text-white">{nav.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

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
}) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onCancel}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          className="relative w-full max-w-sm bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 shadow-2xl"
        >
          <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
          <p className="text-sm text-white/50 mb-6">{message}</p>
          <div className="flex justify-end gap-3">
            <button onClick={onCancel} className="px-4 py-2 text-sm font-semibold text-white/60 hover:text-white transition-colors">
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${
                confirmVariant === 'danger' ? 'bg-rose-500 hover:bg-rose-400 text-white' :
                confirmVariant === 'warning' ? 'bg-amber-500 hover:bg-amber-400 text-black' :
                'bg-emerald-500 hover:bg-emerald-400 text-white'
              }`}
            >
              {confirmLabel}
            </button>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

/* ── EDIT USER MODAL ───────────────────────────────────────────────── */
interface EditUserModalProps {
  user: any | null;
  onClose: () => void;
  onSave: (id: string, data: { name: string; role: string }) => void;
  isSaving: boolean;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ user, onClose, onSave, isSaving }) => {
  const [name, setName] = useState(user?.name || '');
  const [role, setRole] = useState(user?.role || 'student');

  if (!user) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 shadow-2xl"
        >
          <button onClick={onClose} className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>

          <h3 className="text-xl font-light text-white mb-1">Edit User</h3>
          <p className="text-sm text-white/40 mb-6">{user.email}</p>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-white/40">Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-white/40">Role</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-white/10 mt-6">
            <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-white/60 hover:text-white transition-colors">
              Cancel
            </button>
            <button
              onClick={() => onSave(user.id, { name, role })}
              disabled={isSaving}
              className="px-5 py-2 text-sm font-bold bg-white text-black rounded-lg hover:bg-white/90 transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

/* ── ACTION DROPDOWN ─────────────────────────────────────────────────── */
const ActionDropdown = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="relative inline-block text-left">
      <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-32 origin-top-right rounded-lg bg-[#111] border border-white/10 shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
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
  const queryClient = useQueryClient();
  // FIX BUG-01: Tab values khớp với dữ liệu backend (role: student/teacher/admin)
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editUser, setEditUser] = useState<any | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ userId: string; action: 'suspend' | 'activate' } | null>(null);
  const [deleteUserConfirm, setDeleteUserConfirm] = useState<{ userId: string; userName: string } | null>(null);

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users', filter, search, page],
    queryFn: () => userApi.getAllUsers({
      role: filter === 'All' ? undefined : filter.toLowerCase(),
      search: search || undefined,
      page,
      limit: 15
    }),
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
    { label: 'All', value: 'All' },
    { label: 'Students', value: 'student' },
    { label: 'Teachers', value: 'teacher' },
    { label: 'Admins', value: 'admin' }
  ];

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-20 mt-4">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold uppercase tracking-[0.25em] text-white/40 pl-1">Directory</span>
          <h1 className="text-4xl font-light tracking-tight text-white">User Intelligence</h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9 pr-4 py-2 text-sm bg-white/5 border border-white/10 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors w-64 text-white placeholder:text-white/30"
            />
          </div>
        </div>
      </div>

      {/* Tabs — FIX BUG-01 */}
      <div className="flex gap-6 border-b border-white/10 pb-2">
        {tabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => { setFilter(tab.value); setPage(1); }}
            className={`text-sm font-semibold tracking-wide pb-2 relative transition-colors ${filter === tab.value ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
          >
            {tab.label}
            {filter === tab.value && (
              <motion.div layoutId="user-tab" className="absolute -bottom-[3px] left-0 right-0 h-0.5 bg-white" />
            )}
          </button>
        ))}
      </div>

      {/* Data Table */}
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              <th className="pb-4 text-xs font-bold uppercase tracking-widest text-white/30 border-b border-white/10 w-12"></th>
              <th className="pb-4 text-xs font-bold uppercase tracking-widest text-white/30 border-b border-white/10">User</th>
              <th className="pb-4 text-xs font-bold uppercase tracking-widest text-white/30 border-b border-white/10">Role</th>
              <th className="pb-4 text-xs font-bold uppercase tracking-widest text-white/30 border-b border-white/10">Status</th>
              <th className="pb-4 text-xs font-bold uppercase tracking-widest text-white/30 border-b border-white/10">Joined</th>
              <th className="pb-4 text-xs font-bold uppercase tracking-widest text-white/30 border-b border-white/10 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {usersLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-white/40 text-sm">
                    Loading users...
                  </td>
                </tr>
              ) : mappedUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-white/40 text-sm">
                    No users found matching your criteria.
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
                    className="group hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-4 border-b border-white/5">
                      <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full border border-white/10 object-cover" />
                    </td>
                    <td className="py-4 border-b border-white/5">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-white/90">{user.name}</span>
                        <span className="text-xs text-white/40">{user.email}</span>
                      </div>
                    </td>
                    <td className="py-4 border-b border-white/5">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-md ${
                        user.role === 'admin' ? 'bg-indigo-500/10 text-indigo-400' :
                        user.role === 'teacher' ? 'bg-cyan-500/10 text-cyan-400' :
                        'bg-white/5 text-white/60'
                      }`}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </td>
                    <td className="py-4 border-b border-white/5">
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        <span className="text-sm text-white/70">{user.isActive ? 'Active' : 'Suspended'}</span>
                      </div>
                    </td>
                    <td className="py-4 border-b border-white/5">
                      <span className="text-sm text-white/50">{user.createdAt}</span>
                    </td>
                    {/* FIX BUG-05: Actions với handler thật */}
                    <td className="py-4 border-b border-white/5 text-right">
                      <ActionDropdown>
                        <button
                          onClick={() => setEditUser(user)}
                          className="w-full text-left px-4 py-2 text-xs font-semibold text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                        >
                          Edit User
                        </button>
                        <button
                          onClick={() => setConfirmAction({ userId: user.id, action: user.isActive ? 'suspend' : 'activate' })}
                          className={`w-full text-left px-4 py-2 text-xs font-semibold transition-colors ${
                            user.isActive
                              ? 'text-amber-400 hover:bg-amber-500/10'
                              : 'text-emerald-400 hover:bg-emerald-500/10'
                          }`}
                        >
                          {user.isActive ? 'Suspend User' : 'Activate User'}
                        </button>
                        <button
                          onClick={() => setDeleteUserConfirm({ userId: user.id, userName: user.name })}
                          className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors"
                        >
                          Delete User
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
          <span className="text-sm text-white/30">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="px-4 py-1.5 text-xs font-semibold bg-white/5 border border-white/10 rounded-lg text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="px-4 py-1.5 text-xs font-semibold bg-white/5 border border-white/10 rounded-lg text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-colors"
            >
              Next
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
        title={confirmAction?.action === 'suspend' ? 'Suspend User?' : 'Activate User?'}
        message={
          confirmAction?.action === 'suspend'
            ? 'User sẽ không thể đăng nhập cho đến khi được kích hoạt lại.'
            : 'User sẽ có thể đăng nhập trở lại.'
        }
        confirmLabel={confirmAction?.action === 'suspend' ? 'Suspend' : 'Activate'}
        confirmVariant={confirmAction?.action === 'suspend' ? 'danger' : 'success'}
        onConfirm={() => {
          if (confirmAction) toggleActiveMutation.mutate(confirmAction.userId);
        }}
        onCancel={() => setConfirmAction(null)}
      />

      {/* Confirm Delete User */}
      <ConfirmModal
        isOpen={!!deleteUserConfirm}
        title="Delete User?"
        message={`Bạn có chắc muốn xóa người dùng "${deleteUserConfirm?.userName}"? Thao tác này sẽ xóa vĩnh viễn người dùng và dọn dẹp các dữ liệu liên quan.`}
        confirmLabel="Delete"
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
  const { data, isLoading } = useQuery({
    queryKey: ['system-health'],
    queryFn: analyticsApi.getSystemHealth,
    refetchInterval: 10000 // Refetch every 10 seconds
  });

  const health = data?.data || {};

  const metrics = [
    { label: 'API Response', value: isLoading ? '...' : health.apiLatency || 'N/A', status: 'optimal', color: 'emerald' },
    { label: 'DB Connection', value: isLoading ? '...' : health.dbConnection?.latency || 'N/A', status: health.dbConnection?.status || 'optimal', color: health.dbConnection?.status === 'error' ? 'rose' : 'emerald' },
    { label: 'Node RSS Memory', value: isLoading ? '...' : health.memory?.rss || 'N/A', status: 'optimal', color: 'emerald' },
    { label: 'Server Uptime', value: isLoading ? '...' : health.uptime || 'N/A', status: 'optimal', color: 'emerald' },
  ];

  return (
    <div className="flex flex-col gap-16 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-20 mt-4">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold uppercase tracking-[0.25em] text-white/40 pl-1">Infrastructure</span>
          <h1 className="text-4xl lg:text-5xl font-light tracking-tight text-white">System Monitor</h1>
        </div>
        <div className="flex items-center gap-3 mb-2 px-4 py-2 border border-emerald-500/20 rounded-full text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-bold tracking-widest uppercase">
            {health.dbConnection?.status === 'error' ? 'Degraded Performance' : 'All Systems Operational'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
        {metrics.map(metric => (
          <div key={metric.label} className="flex flex-col gap-2 border-l-2 border-white/10 pl-5 hover:border-white/30 transition-colors">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">{metric.label}</span>
            <div className={`text-2xl font-light tracking-tight text-${metric.color}-400`}>
              {metric.value}
            </div>
            <span className="text-xs text-emerald-500 font-semibold uppercase tracking-widest">{metric.status}</span>
          </div>
        ))}
      </div>

      <div className="w-full h-[1px] bg-gradient-to-r from-white/10 via-white/5 to-transparent" />

      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-light tracking-tight text-white/90">Stack Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: 'Backend', value: 'Node.js + Express v5', badge: health.environment || 'development' },
            { label: 'Database', value: 'MongoDB Atlas', badge: 'Mongoose ODM' },
            { label: 'Storage', value: 'Cloudinary', badge: 'CDN' },
            { label: 'Realtime', value: 'Socket.IO v4', badge: 'WebSocket' },
            { label: 'Payment', value: 'Stripe', badge: 'Webhook' },
            { label: 'Frontend', value: 'React 18 + Vite', badge: 'TypeScript' },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-xl">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-white/30 uppercase tracking-widest">{item.label}</span>
                <span className="text-sm font-medium text-white/80">{item.value}</span>
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
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: analyticsApi.getAdminDashboard,
  });

  const recentEnrollments: any[] = analyticsData?.data?.recentEnrollments || [];

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-20 mt-4">
      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold uppercase tracking-[0.25em] text-white/40 pl-1">Community</span>
        <h1 className="text-4xl font-light tracking-tight text-white">Engagement Center</h1>
        <p className="text-white/40 text-base max-w-lg">Quản lý hoạt động học tập, đăng ký khóa học, và tương tác học viên theo thời gian thực.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4">
        {/* Real-time Activity Feed */}
        <div className="lg:col-span-8 flex flex-col gap-6 bg-[#0a0a0a]/50 border border-white/5 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <h2 className="text-xl font-light tracking-tight text-white/90">Real-time Activity Feed</h2>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">Live MongoDB Feed</span>
            </div>
          </div>
          
          <div className="flex flex-col gap-4 mt-2">
            {isLoading ? (
              <div className="py-8 text-center text-white/30 text-sm">Loading activity feed...</div>
            ) : recentEnrollments.length === 0 ? (
              <div className="py-8 text-center text-white/30 text-sm">No recent activity detected.</div>
            ) : (
              recentEnrollments.map((item: any, i: number) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors cursor-pointer group"
                >
                  <img
                    src={item.student?.avatar?.startsWith('http')
                      ? item.student.avatar
                      : `https://ui-avatars.com/api/?name=${encodeURIComponent(item.student?.name || 'U')}&background=6366f1&color=fff&size=40`
                    }
                    alt={item.student?.name}
                    className="w-10 h-10 rounded-full border border-white/10 shrink-0 object-cover"
                  />
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <p className="text-sm text-white/80 group-hover:text-white transition-colors">
                      <span className="font-bold">{item.student?.name || 'Học viên'}</span> vừa đăng ký khóa học <span className="font-medium text-indigo-400">{item.course?.title || 'Khóa học'}</span>
                    </p>
                    <div className="flex items-center gap-3 text-xs text-white/30">
                      <span>{item.createdAt ? new Date(item.createdAt).toLocaleString('vi-VN') : 'Gần đây'}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${item.paymentStatus === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-white/40'}`}>
                        {item.paymentStatus === 'completed' ? 'Đã thanh toán' : 'Miễn phí / Chờ'}
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
          {[
            { label: 'Reviews', desc: 'Quản lý đánh giá khóa học', icon: '⭐', count: 'Active' },
            { label: 'Discussions', desc: 'Kiểm duyệt thảo luận', icon: '💬', count: 'Active' },
            { label: 'Notifications', desc: 'Hệ thống thông báo', icon: '📢', count: 'Socket.IO' },
          ].map((item, i) => (
            <motion.div 
              key={item.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-4 p-5 bg-[#0a0a0a]/50 border border-white/5 rounded-3xl backdrop-blur-xl shadow-xl hover:bg-white/[0.02] hover:border-white/10 transition-all cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-2xl shrink-0 group-hover:bg-white/10 transition-colors">
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-white">{item.label}</p>
                  <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400">{item.count}</span>
                </div>
                <p className="text-xs text-white/40 truncate mt-0.5">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ── SYSTEM CONFIG ─────────────────────────────────────────────────── */
const SystemConfig = () => (
  <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-20 mt-4">
    <div className="flex flex-col gap-2">
      <span className="text-sm font-semibold uppercase tracking-[0.25em] text-white/40 pl-1">Configuration</span>
      <h1 className="text-4xl font-light tracking-tight text-white">System Config</h1>
      <p className="text-white/40 text-base max-w-lg">Cấu hình hệ thống, JWT, CORS, và các biến môi trường.</p>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {[
        { key: 'NODE_ENV', value: 'development', label: 'Environment' },
        { key: 'JWT_EXPIRES_IN', value: '1d', label: 'JWT Expiry' },
        { key: 'RATE_LIMIT', value: '100 req/hour', label: 'API Rate Limit' },
        { key: 'DB', value: 'MongoDB Atlas', label: 'Database' },
        { key: 'STORAGE', value: 'Cloudinary', label: 'Cloud Storage' },
        { key: 'PAYMENT', value: 'Stripe', label: 'Payment Gateway' },
      ].map(item => (
        <div key={item.key} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-xl">
          <div>
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{item.label}</p>
            <p className="text-xs font-mono text-white/60 mt-0.5">{item.key}</p>
          </div>
          <span className="text-sm font-mono text-cyan-400">{item.value}</span>
        </div>
      ))}
    </div>
    <p className="text-xs text-white/20 italic">* Thay đổi cấu hình qua file .env và restart server.</p>
  </div>
);

/* ── MODERATION QUEUE ─────────────────────────────────────────────── */
const ModerationQueue = () => {
  const queryClient = useQueryClient();
  const { success: successToast } = useToast();
  const [subTab, setSubTab] = useState<'courses' | 'teachers'>('courses');
  const [rejectCourse, setRejectCourse] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Queries
  const { data: coursesData, isLoading: coursesLoading } = useQuery({
    queryKey: ['admin-moderation-courses'],
    queryFn: () => adminApi.getCoursesPendingReview(),
    enabled: subTab === 'courses'
  });

  const { data: applicationsData, isLoading: appsLoading } = useQuery({
    queryKey: ['admin-teacher-applications'],
    queryFn: () => adminApi.getTeacherApplications({ status: 'pending' }),
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
      successToast(vars.status === 'published' ? 'Đã phê duyệt xuất bản khóa học.' : 'Đã từ chối và trả khóa học về trạng thái nháp.');
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
      successToast(vars.action === 'approve' ? 'Đã duyệt hồ sơ giảng viên.' : 'Đã từ chối hồ sơ giảng viên.');
    }
  });

  const pendingCourses = coursesData?.data?.courses || [];
  const pendingApps = applicationsData?.data?.applications || [];

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-20 mt-4">
      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold uppercase tracking-[0.25em] text-white/40 pl-1">Compliance</span>
        <h1 className="text-4xl font-light tracking-tight text-white">Moderation Queue</h1>
      </div>

      <div className="flex gap-6 border-b border-white/10 pb-2">
        <button
          onClick={() => setSubTab('courses')}
          className={`text-sm font-semibold tracking-wide pb-2 relative transition-colors ${subTab === 'courses' ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
        >
          Pending Courses ({pendingCourses.length})
          {subTab === 'courses' && (
            <motion.div layoutId="mod-tab" className="absolute -bottom-[3px] left-0 right-0 h-0.5 bg-white" />
          )}
        </button>
        <button
          onClick={() => setSubTab('teachers')}
          className={`text-sm font-semibold tracking-wide pb-2 relative transition-colors ${subTab === 'teachers' ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
        >
          Teacher Applications ({pendingApps.length})
          {subTab === 'teachers' && (
            <motion.div layoutId="mod-tab" className="absolute -bottom-[3px] left-0 right-0 h-0.5 bg-white" />
          )}
        </button>
      </div>

      {subTab === 'courses' ? (
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-xs font-bold uppercase tracking-widest text-white/30">
                <th className="pb-4">Course Info</th>
                <th className="pb-4">Price</th>
                <th className="pb-4">Submitted At</th>
                <th className="pb-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coursesLoading ? (
                <tr><td colSpan={4} className="py-8 text-center text-white/40">Loading pending courses...</td></tr>
              ) : pendingCourses.length === 0 ? (
                <tr><td colSpan={4} className="py-8 text-center text-white/40">No courses pending moderation.</td></tr>
              ) : (
                pendingCourses.map((c: any) => (
                  <tr key={c._id} className="border-b border-white/5 hover:bg-white/[0.01]">
                    <td className="py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-white">{c.title}</span>
                        <span className="text-xs text-white/40">{c.category?.name || 'Uncategorized'}</span>
                      </div>
                    </td>
                    <td className="py-4 text-sm text-white/70">
                      <div className="flex flex-col">
                        <span>{c.price.toLocaleString('vi-VN')}đ</span>
                        {c.discountPercentage && c.discountPercentage > 0 ? (
                          <span className="text-[10px] text-white/40 line-through">
                            {Number(c.estimatedPrice || c.price).toLocaleString('vi-VN')}đ
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="py-4 text-sm text-white/40">{new Date(c.updatedAt).toLocaleDateString()}</td>
                    <td className="py-4 text-right flex justify-end gap-2">
                      <button
                        onClick={() => approveCourseMutation.mutate({ id: c._id, status: 'published' })}
                        className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 rounded text-xs font-bold uppercase transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => setRejectCourse(c)}
                        className="px-3 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 rounded text-xs font-bold uppercase transition-colors"
                      >
                        Reject
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
              <tr className="border-b border-white/10 text-xs font-bold uppercase tracking-widest text-white/30">
                <th className="pb-4">Applicant</th>
                <th className="pb-4">Specialty</th>
                <th className="pb-4">Bio Summary</th>
                <th className="pb-4">Resume / CV</th>
                <th className="pb-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {appsLoading ? (
                <tr><td colSpan={5} className="py-8 text-center text-white/40">Loading applications...</td></tr>
              ) : pendingApps.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-white/40">No applications pending.</td></tr>
              ) : (
                pendingApps.map((app: any) => (
                  <tr key={app._id} className="border-b border-white/5 hover:bg-white/[0.01]">
                    <td className="py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-white">{app.student?.name}</span>
                        <span className="text-xs text-white/40">{app.student?.email}</span>
                      </div>
                    </td>
                    <td className="py-4 text-sm text-white/75">{app.specialty}</td>
                    <td className="py-4 text-sm text-white/50 max-w-xs truncate" title={app.bio}>{app.bio}</td>
                    <td className="py-4">
                      <a
                        href={app.resumeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-indigo-400 hover:underline"
                      >
                        View CV document
                      </a>
                    </td>
                    <td className="py-4 text-right flex justify-end gap-2">
                      <button
                        onClick={() => processAppMutation.mutate({ id: app._id, action: 'approve' })}
                        className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 rounded text-xs font-bold uppercase transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => processAppMutation.mutate({ id: app._id, action: 'reject' })}
                        className="px-3 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 rounded text-xs font-bold uppercase transition-colors"
                      >
                        Reject
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
      <AnimatePresence>
        {rejectCourse && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <div onClick={() => setRejectCourse(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 shadow-2xl">
              <h3 className="text-lg font-light text-white mb-2">Reject Course</h3>
              <p className="text-xs text-white/40 mb-4">Provide reasons or feedback to the instructor for {rejectCourse.title}</p>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Write feedback..."
                rows={4}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-indigo-500 resize-none transition-colors"
              />
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setRejectCourse(null)} className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-white/50 hover:text-white transition-colors">
                  Cancel
                </button>
                <button
                  onClick={() => approveCourseMutation.mutate({ id: rejectCourse._id, status: 'draft', notes: rejectReason })}
                  className="px-4 py-2 text-xs font-bold bg-rose-500 hover:bg-rose-400 text-white rounded-lg transition-colors"
                >
                  Confirm Reject
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ── SYSTEM AUDIT LOGS ──────────────────────────────────────────────── */
const SystemLogs = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-audit-logs', page, search],
    queryFn: () => adminApi.getAuditLogs({ page, limit: 15, search: search || undefined })
  });

  const logs = data?.data?.logs || [];
  const totalPages = data?.data?.totalPages || 1;

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-20 mt-4">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold uppercase tracking-[0.25em] text-white/40 pl-1">Compliance</span>
          <h1 className="text-4xl font-light tracking-tight text-white">System Logs</h1>
        </div>
        <input
          type="text"
          placeholder="Filter by action..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="pl-4 pr-4 py-2 text-sm bg-white/5 border border-white/10 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors w-64 text-white placeholder:text-white/30"
        />
      </div>

      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-xs font-bold uppercase tracking-widest text-white/30">
              <th className="pb-4">Timestamp</th>
              <th className="pb-4">Admin Actor</th>
              <th className="pb-4">Operation</th>
              <th className="pb-4">IP Address</th>
              <th className="pb-4">API Endpoint</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="py-8 text-center text-white/40">Loading operation trail logs...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={5} className="py-8 text-center text-white/40">No logs found in this query.</td></tr>
            ) : (
              logs.map((log: any) => (
                <tr key={log._id} className="border-b border-white/5 hover:bg-white/[0.01]">
                  <td className="py-4 text-xs text-white/40">{new Date(log.createdAt).toLocaleString()}</td>
                  <td className="py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-white">{log.actor?.name || 'System'}</span>
                      <span className="text-xs text-white/40">{log.actor?.email || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="py-4">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-4 text-xs text-white/50">{log.ipAddress || '127.0.0.1'}</td>
                  <td className="py-4 text-xs font-mono text-white/30">{log.details?.method} {log.details?.url}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/30">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="px-4 py-1.5 text-xs font-semibold bg-white/5 border border-white/10 rounded-lg text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="px-4 py-1.5 text-xs font-semibold bg-white/5 border border-white/10 rounded-lg text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Main Layout ───────────────────────────────────────────────────── */
const AdminDashboard: React.FC = () => {
  const { tabId } = useParams<{ tabId: string }>();
  const navigate = useNavigate();
  const activeSection = tabId || 'pulse';
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCmdKOpen, setIsCmdKOpen] = useState(false);

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

  // FIX BUG-06: Lấy user thật từ AuthContext thay vì hardcode
  const { user } = useAuth();

  const adminInitials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'AD';

  return (
    <div className="dark flex h-[100dvh] w-full bg-[#050505] overflow-hidden text-white/90 font-sans selection:bg-indigo-500/30 relative">

      {/* ── ATMOSPHERIC BACKGROUND SYSTEM ── */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden mix-blend-screen opacity-50">
        <div className="absolute top-0 -left-[10%] w-[60%] h-[60%] rounded-full bg-indigo-500/10 blur-[150px]" />
        <div className="absolute bottom-0 right-[10%] w-[50%] h-[60%] rounded-full bg-cyan-600/5 blur-[150px]" />
      </div>

      {/* ── FLOATING NAVIGATION RAIL ── */}
      <aside className={`h-full bg-black/40 border-r border-white/5 backdrop-blur-3xl flex flex-col z-20 shrink-0 shadow-[20px_0_50px_rgba(0,0,0,0.5)] transition-all duration-300 relative ${isSidebarOpen ? 'w-[280px]' : 'w-[88px]'}`}>
        
        {/* Toggle Button */}
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3 top-[3.5rem] w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center text-white z-50 hover:bg-indigo-400 transition-colors shadow-lg"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={`transition-transform duration-300 ${isSidebarOpen ? '' : 'rotate-180'}`}>
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <div className={`h-28 flex items-center px-8 ${isSidebarOpen ? '' : 'justify-center'}`}>
          <Link to="/home" className="flex items-center gap-4 group overflow-hidden">
            <div className="w-8 h-8 shrink-0 rounded-full bg-white text-black flex items-center justify-center font-bold tracking-tighter text-sm transition-transform group-hover:scale-110">
              E
            </div>
            {isSidebarOpen && <span className="font-bold tracking-widest uppercase text-[10px] text-white/70 whitespace-nowrap animate-in fade-in duration-300">Command Center</span>}
          </Link>
        </div>

        <nav className="flex-1 py-4 px-6 flex flex-col gap-2 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => navigate(`/admin-dashboard/${item.id}`)}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors relative group ${
                  isActive ? 'text-white' : 'text-white/30 hover:text-white/70'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="rail-indicator"
                    className="absolute inset-0 bg-white/10 rounded-lg"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <div className={`relative z-10 transition-colors ${isActive ? 'text-indigo-400' : ''}`}>
                  <item.icon />
                </div>
                {isSidebarOpen && <span className="relative z-10 pt-0.5 whitespace-nowrap animate-in fade-in duration-300">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* FIX BUG-06: Admin profile từ AuthContext */}
        <div className={`p-8 ${isSidebarOpen ? '' : 'flex justify-center'}`}>
          <div className="flex items-center gap-4 group cursor-pointer overflow-hidden">
            {user?.avatar && user.avatar.startsWith('http') ? (
              <img src={user.avatar} alt={user.name} className="w-10 h-10 shrink-0 rounded-full border border-white/10 object-cover" />
            ) : (
              <div className="w-10 h-10 shrink-0 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-sm font-bold text-indigo-300">
                {adminInitials}
              </div>
            )}
            {isSidebarOpen && (
              <div className="flex flex-col text-left animate-in fade-in duration-300">
                <span className="text-[11px] font-bold text-white uppercase tracking-widest truncate max-w-[140px]">
                  {user?.name || 'Admin'}
                </span>
                <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">
                  {user?.role === 'admin' ? 'Administrator' : user?.role || 'Admin'}
                </span>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ── CONTINUOUS CANVAS WORKSPACE ── */}
      <main className="flex-1 h-full flex flex-col z-10 relative overflow-hidden">

        {/* Transparent Header */}
        <header className="h-28 flex items-center justify-end px-12 shrink-0 relative z-20">
          <div className="flex items-center gap-8">
            <button 
              onClick={() => setIsCmdKOpen(true)}
              className="relative group flex items-center"
            >
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 group-hover:text-white transition-colors" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              <div className="pl-9 pr-4 py-2 text-xs font-bold tracking-widest uppercase bg-white/5 border border-white/10 rounded-lg group-hover:border-white/30 group-hover:bg-white/10 transition-all w-64 text-left text-white/50 flex justify-between items-center">
                <span>Search index...</span>
                <span className="bg-white/10 px-1.5 py-0.5 rounded text-[10px]">⌘K</span>
              </div>
            </button>
          </div>
        </header>

        {/* Scrolling Canvas */}
        <div className="flex-1 overflow-y-auto px-12 lg:px-20 pb-24">
          <div className="max-w-[1400px] mx-auto">
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
          </div>
        </div>
        {/* Command Palette */}
        <CommandPalette isOpen={isCmdKOpen} onClose={() => setIsCmdKOpen(false)} navigate={navigate} />
      </main>
    </div>
  );
};

export default AdminDashboard;
