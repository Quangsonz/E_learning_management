import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentUser, updateUser } from '../store/slices/authSlice';
import { useMutation } from '@tanstack/react-query';
import { userApi } from '../services/user.api';
import { uploadApi } from '../services/upload.api';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { PageShell, Input } from '../components/ui';

// ============================================================================
// TYPES
// ============================================================================

type TabId = 'general' | 'security';

// ============================================================================
// MAIN PAGE
// ============================================================================

const Settings: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabId>('general');

  const SETTINGS_TABS: { id: TabId; label: string; icon: string }[] = [
    { id: 'general', label: t('settings.tabs.general'), icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
    { id: 'security', label: t('settings.tabs.security'), icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
  ];

  return (
    <PageShell>
      <div className="max-w-6xl mx-auto py-12 px-6 relative z-10">
        
        {/* Header */}
        <div className="mb-10 border-b border-slate-200 dark:border-slate-800 pb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
            {t('settings.title')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            {t('settings.subtitle')}
          </p>
        </div>

        {/* Layout: Sidebar + Main Content */}
        <div className="flex flex-col lg:flex-row gap-10">
          
          {/* Sidebar */}
          <aside className="w-full lg:w-64 shrink-0 space-y-1">
            {SETTINGS_TABS.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium text-sm transition-all text-left ${isActive ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-white'}`}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={tab.icon} />
                  </svg>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              {activeTab === 'general' && (
                <motion.div
                  key="general"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-12"
                >
                  <AccountOverview />
                  <LanguageSettings />
                  <AppearanceSettings />
                </motion.div>
              )}

              {activeTab === 'security' && (
                <motion.div
                  key="security"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-12"
                >
                  <SecurityCenter />
                </motion.div>
              )}
            </AnimatePresence>
          </main>

        </div>
      </div>
    </PageShell>
  );
};

// ============================================================================
// COMPONENTS: GENERAL TAB
// ============================================================================

const AccountOverview: React.FC = () => {
  const { t } = useTranslation();
  const user = useSelector(selectCurrentUser);
  const dispatch = useDispatch();
  const [name, setName] = useState(user?.name || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsUploading(true);
      setErrorMsg('');
      try {
        const res = await uploadApi.uploadImage(file);
        // Backend returns URL (check Swagger: it usually returns { url: '...' })
        if (res.data?.url) {
          setAvatar(res.data.url);
        } else if (res.data?.data?.url) {
          setAvatar(res.data.data.url); // In case it's nested
        } else if (typeof res.data === 'string') {
          setAvatar(res.data);
        }
      } catch (err: any) {
        setErrorMsg('Lỗi tải ảnh lên. Vui lòng thử lại.');
      } finally {
        setIsUploading(false);
      }
    }
  };

  const updateProfileMutation = useMutation({
    mutationFn: userApi.updateMyProfile,
    onSuccess: (res) => {
      setSuccessMsg(t('settings.profile.success'));
      setErrorMsg('');
      if (res.data?.user) {
         dispatch(updateUser(res.data.user));
      }
      setTimeout(() => setSuccessMsg(''), 3000);
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || 'Failed to update profile.');
      setSuccessMsg('');
    }
  });

  return (
    <section>
      <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">{t('settings.profile.title')}</h2>
      <div className="flex flex-col md:flex-row items-start gap-8">
        <div className="shrink-0 relative group">
          <img 
            src={avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256&h=256'} 
            alt="Avatar" 
            className={`w-24 h-24 rounded-full object-cover border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 transition-opacity ${isUploading ? 'opacity-50' : 'opacity-100'}`} 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Đổi ảnh đại diện"
          >
            <span className="text-white text-xs font-medium">Thay đổi</span>
          </button>
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleAvatarChange} 
          />
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full">
              <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            </div>
          )}
        </div>
        <div className="flex-1 w-full max-w-md space-y-4">
          <Input 
            label={t('settings.profile.fullName')}
            value={name} 
            onChange={(e) => setName(e.target.value)} 
          />
          <div className="pt-2">
            <button 
              onClick={() => updateProfileMutation.mutate({ name, avatar })} 
              disabled={updateProfileMutation.isPending || !name}
              className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100 disabled:opacity-50 transition-colors"
            >
              {updateProfileMutation.isPending ? t('settings.profile.saving') : t('settings.profile.saveBtn')}
            </button>
            {successMsg && <p className="text-emerald-600 dark:text-emerald-400 text-sm mt-2 font-medium">{successMsg}</p>}
            {errorMsg && <p className="text-rose-600 dark:text-rose-400 text-sm mt-2 font-medium">{errorMsg}</p>}
          </div>
        </div>
      </div>
    </section>
  );
};

const LanguageSettings: React.FC = () => {
  const { t, i18n } = useTranslation();

  const handleLanguageChange = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  };

  return (
    <section className="pt-8 border-t border-slate-200 dark:border-slate-800">
      <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">{t('settings.profile.language')}</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{t('settings.profile.languageDesc')}</p>
      
      <div className="flex gap-4">
        <button 
          onClick={() => handleLanguageChange('en')}
          className={`px-5 py-2.5 rounded-lg text-sm font-medium border transition-colors ${i18n.language === 'en' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'}`}
        >
          {t('settings.profile.languageEn')}
        </button>
        <button 
          onClick={() => handleLanguageChange('vi')}
          className={`px-5 py-2.5 rounded-lg text-sm font-medium border transition-colors ${i18n.language === 'vi' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'}`}
        >
          {t('settings.profile.languageVi')}
        </button>
      </div>
    </section>
  );
};

const AppearanceSettings: React.FC = () => {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();

  return (
    <section className="pt-8 border-t border-slate-200 dark:border-slate-800">
      <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">{t('settings.appearance.title')}</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-lg">
        {/* Light */}
        <button 
          onClick={() => { if (theme === 'dark') toggleTheme() }}
          className={`group rounded-xl border p-4 text-left transition-all ${theme === 'light' ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}
        >
          <div className="h-20 w-full rounded-md bg-white border border-slate-200 mb-3 p-2 space-y-1.5 shadow-sm">
            <div className="w-1/2 h-1.5 bg-slate-200 rounded-full" />
            <div className="w-3/4 h-1.5 bg-slate-100 rounded-full" />
            <div className="w-1/4 h-3 bg-indigo-500 rounded-full mt-auto" />
          </div>
          <span className={`text-sm font-medium block ${theme === 'light' ? 'text-indigo-600' : 'text-slate-900 dark:text-slate-300'}`}>
            {t('settings.appearance.light')} {theme === 'light' && t('settings.appearance.active')}
          </span>
        </button>

        {/* Dark */}
        <button 
          onClick={() => { if (theme === 'light') toggleTheme() }}
          className={`group rounded-xl border p-4 text-left transition-all ${theme === 'dark' ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}
        >
          <div className="h-20 w-full rounded-md bg-slate-900 border border-slate-700 mb-3 p-2 space-y-1.5">
            <div className="w-1/2 h-1.5 bg-slate-700 rounded-full" />
            <div className="w-3/4 h-1.5 bg-slate-800 rounded-full" />
            <div className="w-1/4 h-3 bg-indigo-500 rounded-full mt-auto" />
          </div>
          <span className={`text-sm font-medium block ${theme === 'dark' ? 'text-indigo-400' : 'text-slate-900 dark:text-slate-300'}`}>
            {t('settings.appearance.dark')} {theme === 'dark' && t('settings.appearance.active')}
          </span>
        </button>
      </div>
    </section>
  );
};

// ============================================================================
// COMPONENTS: SECURITY TAB
// ============================================================================

const SecurityCenter: React.FC = () => {
  const { t } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const changePasswordMutation = useMutation({
    mutationFn: userApi.changePassword,
    onSuccess: () => {
      setSuccessMsg(t('settings.security.success'));
      setErrorMsg('');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccessMsg(''), 3000);
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || 'Failed to change password.');
      setSuccessMsg('');
    }
  });

  const handleSave = () => {
    if (newPassword !== confirmPassword) {
      setErrorMsg(t('settings.security.errorMismatch'));
      return;
    }
    changePasswordMutation.mutate({ currentPassword, newPassword });
  };

  return (
    <section>
      <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">{t('settings.security.changePassword')}</h2>
      <div className="max-w-md space-y-4">
        <Input 
          type="password"
          label={t('settings.security.currentPass')}
          value={currentPassword} 
          onChange={(e) => setCurrentPassword(e.target.value)} 
        />
        <Input 
          type="password"
          label={t('settings.security.newPass')}
          value={newPassword} 
          onChange={(e) => setNewPassword(e.target.value)} 
        />
        <Input 
          type="password"
          label={t('settings.security.confirmPass')}
          value={confirmPassword} 
          onChange={(e) => setConfirmPassword(e.target.value)} 
        />
        <div className="pt-2">
          <button 
            onClick={handleSave} 
            disabled={changePasswordMutation.isPending || !currentPassword || !newPassword || !confirmPassword}
            className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100 disabled:opacity-50 transition-colors"
          >
            {changePasswordMutation.isPending ? t('settings.security.updating') : t('settings.security.updateBtn')}
          </button>
          {successMsg && <p className="text-emerald-600 dark:text-emerald-400 text-sm mt-2 font-medium">{successMsg}</p>}
          {errorMsg && <p className="text-rose-600 dark:text-rose-400 text-sm mt-2 font-medium">{errorMsg}</p>}
        </div>
      </div>
    </section>
  );
};

export default Settings;
