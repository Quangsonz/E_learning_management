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
import { 
  User, 
  ShieldCheck, 
  Bell, 
  Palette, 
  Camera, 
  Check, 
  Globe, 
  Lock, 
  Sparkles,
  Smartphone,
  CheckCircle2,
  Moon,
  Sun
} from 'lucide-react';

type TabId = 'profile' | 'security' | 'notifications' | 'appearance';

const Settings: React.FC = () => {
  const { t, i18n } = useTranslation();
  const user = useSelector(selectCurrentUser);
  const dispatch = useDispatch();

  const [activeTab, setActiveTab] = useState<TabId>('profile');

  // Form states for profile tab
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || 'Học viên đam mê học tập và phát triển bản thân.');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');

  // Form states for notification tab
  const [emailNotif, setEmailNotif] = useState(true);
  const [courseNotif, setCourseNotif] = useState(true);

  // Form states for 2FA security
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);

  const SETTINGS_TABS = [
    { id: 'profile' as TabId, label: 'Hồ sơ cá nhân', icon: User, desc: 'Tên, Tiểu sử & Ảnh đại diện' },
    { id: 'security' as TabId, label: 'Bảo mật & Mật khẩu', icon: ShieldCheck, desc: 'Đổi mật khẩu & 2FA' },
    { id: 'notifications' as TabId, label: 'Cài đặt Thông báo', icon: Bell, desc: 'Email & Cảnh báo ứng dụng' },
    { id: 'appearance' as TabId, label: 'Giao diện & Ngôn ngữ', icon: Palette, desc: 'Dark Mode & Ngôn ngữ' },
  ];

  return (
    <PageShell wide>
      <div className="flex flex-col gap-8 pb-16">
        
        {/* Header */}
        <div className="border-b border-slate-200 dark:border-white/10 pb-6">
          <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-slate-900 dark:text-white mb-2">
            Cài đặt Tài khoản
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Quản lý thông tin cá nhân, quyền riêng tư, tùy chọn thông báo và giao diện người dùng.
          </p>
        </div>

        {/* Layout: Vertical Sidebar Tabs + Content Area + Live Profile Preview */}
        <div className="grid gap-8 lg:grid-cols-[240px_1fr_300px] items-start">
          
          {/* ================= 1. VERTICAL SIDEBAR TABS ================= */}
          <aside className="flex flex-col gap-1.5 w-full">
            {SETTINGS_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-xs transition-all text-left ${
                    isActive 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon size={18} className="shrink-0" />
                  <div className="min-w-0">
                    <span className="block font-bold">{tab.label}</span>
                  </div>
                </button>
              );
            })}
          </aside>

          {/* ================= 2. MAIN TAB CONTENT AREA ================= */}
          <main className="min-w-0 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-sm">
            <AnimatePresence mode="wait">
              
              {/* TAB 1: PROFILE */}
              {activeTab === 'profile' && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Thông tin cá nhân</h2>
                    <p className="text-xs text-slate-500 mt-1">Cập nhật hình ảnh đại diện và thông tin hiển thị của bạn trên hệ thống.</p>
                  </div>

                  <ProfileForm 
                    name={name} 
                    setName={setName} 
                    avatar={avatar} 
                    setAvatar={setAvatar} 
                    bio={bio} 
                    setBio={setBio}
                    linkedinUrl={linkedinUrl}
                    setLinkedinUrl={setLinkedinUrl}
                    githubUrl={githubUrl}
                    setGithubUrl={setGithubUrl}
                  />
                </motion.div>
              )}

              {/* TAB 2: SECURITY */}
              {activeTab === 'security' && (
                <motion.div
                  key="security"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-8"
                >
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Bảo mật tài khoản</h2>
                    <p className="text-xs text-slate-500 mt-1">Thay đổi mật khẩu đăng nhập và cài đặt xác thực 2 lớp (2FA).</p>
                  </div>

                  <SecurityForm is2FA={is2FAEnabled} setIs2FA={setIs2FAEnabled} />
                </motion.div>
              )}

              {/* TAB 3: NOTIFICATIONS */}
              {activeTab === 'notifications' && (
                <motion.div
                  key="notifications"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Tùy chọn thông báo</h2>
                    <p className="text-xs text-slate-500 mt-1">Quản lý cách thức bạn nhận thông báo về bài học mới và ưu đãi.</p>
                  </div>

                  <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 rounded-2xl">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">Thông báo qua Email</h4>
                        <p className="text-xs text-slate-500">Nhận email nhắc nhở bài học tuần và chứng chỉ khi hoàn thành.</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={emailNotif} 
                        onChange={(e) => setEmailNotif(e.target.checked)} 
                        className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 rounded-2xl">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">Cảnh báo khóa học Realtime</h4>
                        <p className="text-xs text-slate-500">Nhận chuông thông báo khi giảng viên đăng bài giảng hoặc chấm điểm.</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={courseNotif} 
                        onChange={(e) => setCourseNotif(e.target.checked)} 
                        className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB 4: APPEARANCE & LANGUAGE */}
              {activeTab === 'appearance' && (
                <motion.div
                  key="appearance"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-8"
                >
                  <LanguageSection />
                  <AppearanceSection />
                </motion.div>
              )}

            </AnimatePresence>
          </main>

          {/* ================= 3. LIVE PROFILE PREVIEW CARD ================= */}
          <aside className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-xl space-y-5 sticky top-6">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
              <Sparkles size={14} /> Live Profile Preview
            </div>

            <div className="flex flex-col items-center text-center space-y-3 pt-2">
              <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-indigo-500 shadow-lg">
                <img 
                  src={avatar || user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256&h=256'} 
                  alt="Live Avatar Preview" 
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <h3 className="font-bold text-lg text-white leading-snug">{name || user?.name || 'Tên người dùng'}</h3>
                <p className="text-xs text-slate-400">{user?.email || 'user@example.com'}</p>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold capitalize">
                <ShieldCheck size={13} /> {user?.role || 'Học viên'}
              </div>
            </div>

            <div className="p-3 bg-white/5 rounded-2xl text-xs text-slate-300 space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400">Tiểu sử (Bio)</span>
              <p className="line-clamp-3 text-slate-300 italic">{bio || 'Chưa cập nhật tiểu sử'}</p>
            </div>

            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
              <span>Trạng thái tài khoản</span>
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Đang hoạt động
              </span>
            </div>
          </aside>

        </div>
      </div>
    </PageShell>
  );
};

// ============================================================================
// PROFILE FORM COMPONENT
// ============================================================================

const ProfileForm: React.FC<{
  name: string;
  setName: (v: string) => void;
  avatar: string;
  setAvatar: (v: string) => void;
  bio: string;
  setBio: (v: string) => void;
  linkedinUrl: string;
  setLinkedinUrl: (v: string) => void;
  githubUrl: string;
  setGithubUrl: (v: string) => void;
}> = ({ name, setName, avatar, setAvatar, bio, setBio, linkedinUrl, setLinkedinUrl, githubUrl, setGithubUrl }) => {
  const dispatch = useDispatch();
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsUploading(true);
      setErrorMsg('');
      try {
        const res = await uploadApi.uploadImage(file);
        if (res.data?.url) setAvatar(res.data.url);
        else if (res.data?.data?.url) setAvatar(res.data.data.url);
      } catch (err) {
        setErrorMsg('Tải ảnh lên thất bại. Vui lòng thử lại.');
      } finally {
        setIsUploading(false);
      }
    }
  };

  const updateProfileMutation = useMutation({
    mutationFn: userApi.updateMyProfile,
    onSuccess: (res) => {
      setSuccessMsg('Cập nhật hồ sơ thành công!');
      setErrorMsg('');
      if (res.data?.user) dispatch(updateUser(res.data.user));
      setTimeout(() => setSuccessMsg(''), 3000);
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || 'Không thể lưu hồ sơ.');
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-6 p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200/60 dark:border-white/5">
        <div className="relative group shrink-0">
          <img 
            src={avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256&h=256'} 
            alt="Avatar" 
            className="w-16 h-16 rounded-full object-cover border-2 border-indigo-500" 
          />
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity"
          >
            <Camera size={18} />
          </button>
          <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleAvatarUpload} />
        </div>

        <div>
          <h4 className="font-bold text-sm text-slate-900 dark:text-white">Ảnh đại diện</h4>
          <p className="text-xs text-slate-500 mb-2">Hỗ trợ JPG, PNG hoặc GIF dưới 5MB.</p>
          <button 
            type="button" 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors"
          >
            {isUploading ? 'Đang tải...' : 'Tải ảnh mới'}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <Input 
          label="Họ và tên *"
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          placeholder="Nhập họ và tên đầy đủ"
        />

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">Tiểu sử (Bio)</label>
          <textarea 
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Mô tả ngắn gọn về kinh nghiệm hoặc sở thích học tập..."
            className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 resize-none"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Input 
            label="Liên kết LinkedIn"
            value={linkedinUrl}
            onChange={(e) => setLinkedinUrl(e.target.value)}
            placeholder="https://linkedin.com/in/username"
          />
          <Input 
            label="Liên kết GitHub"
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
            placeholder="https://github.com/username"
          />
        </div>
      </div>

      <div className="pt-2 flex items-center gap-4">
        <button 
          type="button"
          onClick={() => updateProfileMutation.mutate({ name, avatar, bio })} 
          disabled={updateProfileMutation.isPending || !name}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
        >
          {updateProfileMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi hồ sơ'}
        </button>
        {successMsg && <span className="text-xs font-bold text-emerald-500">{successMsg}</span>}
        {errorMsg && <span className="text-xs font-bold text-rose-500">{errorMsg}</span>}
      </div>
    </div>
  );
};

// ============================================================================
// SECURITY FORM COMPONENT
// ============================================================================

const SecurityForm: React.FC<{ is2FA: boolean; setIs2FA: (v: boolean) => void }> = ({ is2FA, setIs2FA }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const changePasswordMutation = useMutation({
    mutationFn: userApi.changePassword,
    onSuccess: () => {
      setSuccessMsg('Đổi mật khẩu thành công!');
      setErrorMsg('');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccessMsg(''), 3000);
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || 'Không thể đổi mật khẩu.');
    }
  });

  const handleSavePassword = () => {
    if (newPassword !== confirmPassword) {
      setErrorMsg('Mật khẩu mới không trùng khớp.');
      return;
    }
    changePasswordMutation.mutate({ currentPassword, newPassword, confirmPassword });
  };

  return (
    <div className="space-y-8">
      {/* Change Password */}
      <div className="space-y-4 max-w-lg">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <Lock size={16} className="text-indigo-500" /> Đổi mật khẩu
        </h3>
        <Input 
          type="password"
          label="Mật khẩu hiện tại *"
          value={currentPassword} 
          onChange={(e) => setCurrentPassword(e.target.value)} 
        />
        <Input 
          type="password"
          label="Mật khẩu mới *"
          value={newPassword} 
          onChange={(e) => setNewPassword(e.target.value)} 
        />
        <Input 
          type="password"
          label="Xác nhận mật khẩu mới *"
          value={confirmPassword} 
          onChange={(e) => setConfirmPassword(e.target.value)} 
        />
        <div className="pt-2">
          <button 
            type="button"
            onClick={handleSavePassword} 
            disabled={changePasswordMutation.isPending || !currentPassword || !newPassword || !confirmPassword}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
          >
            {changePasswordMutation.isPending ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
          </button>
          {successMsg && <p className="text-xs font-bold text-emerald-500 mt-2">{successMsg}</p>}
          {errorMsg && <p className="text-xs font-bold text-rose-500 mt-2">{errorMsg}</p>}
        </div>
      </div>

      {/* Two-Factor Authentication */}
      <div className="pt-6 border-t border-slate-200/60 dark:border-white/10 space-y-4">
        <div className="flex items-center justify-between p-4 bg-indigo-50/50 dark:bg-indigo-500/10 rounded-2xl border border-indigo-100 dark:border-indigo-500/20">
          <div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Smartphone size={16} className="text-indigo-500" /> Xác minh 2 yếu tố (2FA)
            </h4>
            <p className="text-xs text-slate-500 mt-1">Yêu cầu mã xác minh OTP qua email/điện thoại khi đăng nhập từ thiết bị lạ.</p>
          </div>
          <button 
            onClick={() => setIs2FA(!is2FA)}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors ${
              is2FA 
                ? 'bg-emerald-500 text-white' 
                : 'bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300'
            }`}
          >
            {is2FA ? 'Đã bật 2FA ✓' : 'Bật 2FA'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// LANGUAGE SECTION
// ============================================================================

const LanguageSection: React.FC = () => {
  const { i18n } = useTranslation();

  const handleLanguageChange = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Ngôn ngữ hiển thị</h2>
        <p className="text-xs text-slate-500 mt-1">Chọn ngôn ngữ bạn muốn áp dụng cho toàn bộ giao diện hệ thống.</p>
      </div>

      <div className="flex gap-4">
        <button 
          onClick={() => handleLanguageChange('vi')}
          className={`px-5 py-3 rounded-2xl text-xs font-bold border transition-all flex items-center gap-2 ${
            i18n.language === 'vi' 
              ? 'border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-black ring-2 ring-indigo-500/20' 
              : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-slate-300'
          }`}
        >
          <Globe size={16} /> Tiếng Việt (Vietnamese)
        </button>

        <button 
          onClick={() => handleLanguageChange('en')}
          className={`px-5 py-3 rounded-2xl text-xs font-bold border transition-all flex items-center gap-2 ${
            i18n.language === 'en' 
              ? 'border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-black ring-2 ring-indigo-500/20' 
              : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-slate-300'
          }`}
        >
          <Globe size={16} /> English (English)
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// APPEARANCE SECTION
// ============================================================================

const AppearanceSection: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="pt-6 border-t border-slate-200/60 dark:border-white/10 space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Chế độ Giao diện</h2>
        <p className="text-xs text-slate-500 mt-1">Tùy chọn tông màu giao diện Sáng (Light) hoặc Tối (Dark Mode).</p>
      </div>

      <div className="grid grid-cols-2 gap-4 max-w-md">
        {/* Light */}
        <button 
          onClick={() => { if (theme === 'dark') toggleTheme() }}
          className={`rounded-2xl border p-4 text-left transition-all ${
            theme === 'light' 
              ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/50' 
              : 'border-slate-200 dark:border-white/10 hover:border-slate-300'
          }`}
        >
          <div className="h-16 w-full rounded-xl bg-white border border-slate-200 mb-3 p-2 space-y-1.5 shadow-sm">
            <div className="w-1/2 h-1.5 bg-slate-200 rounded-full" />
            <div className="w-3/4 h-1.5 bg-slate-100 rounded-full" />
          </div>
          <span className="text-xs font-bold flex items-center gap-1.5 text-slate-900">
            <Sun size={14} className="text-amber-500" /> Sáng (Light) {theme === 'light' && '✓'}
          </span>
        </button>

        {/* Dark */}
        <button 
          onClick={() => { if (theme === 'light') toggleTheme() }}
          className={`rounded-2xl border p-4 text-left transition-all ${
            theme === 'dark' 
              ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-500/10' 
              : 'border-slate-200 dark:border-white/10 hover:border-slate-300'
          }`}
        >
          <div className="h-16 w-full rounded-xl bg-slate-900 border border-slate-700 mb-3 p-2 space-y-1.5">
            <div className="w-1/2 h-1.5 bg-slate-700 rounded-full" />
            <div className="w-3/4 h-1.5 bg-slate-800 rounded-full" />
          </div>
          <span className="text-xs font-bold flex items-center gap-1.5 text-white">
            <Moon size={14} className="text-indigo-400" /> Tối (Dark Mode) {theme === 'dark' && '✓'}
          </span>
        </button>
      </div>
    </div>
  );
};

export default Settings;
