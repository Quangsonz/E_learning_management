import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Button, Input, Toast } from '../../components/ui';
import { authApi } from '../../services/auth.api';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setToast({ message: 'Đường dẫn đặt lại mật khẩu không hợp lệ.', type: 'error' });
      return;
    }
    if (password !== confirmPassword) {
      setToast({ message: 'Mật khẩu nhập lại không khớp.', type: 'error' });
      return;
    }

    setIsLoading(true);
    try {
      await authApi.resetPassword(token, password);
      setToast({ message: 'Đặt lại mật khẩu thành công! Đang chuyển hướng...', type: 'success' });
      setTimeout(() => navigate('/auth'), 1800);
    } catch (err: any) {
      setToast({
        message: err.response?.data?.message || 'Đã có lỗi xảy ra. Đường dẫn có thể đã hết hạn (quá 10 phút).',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-slate-950 text-white p-4 font-sans">
        <div className="text-center p-8 bg-[#0D0D11]/80 border border-white/10 rounded-3xl max-w-md backdrop-blur-xl">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Đường dẫn không hợp lệ</h2>
          <p className="text-sm text-slate-400 mb-6">Đường dẫn đặt lại mật khẩu không tồn tại hoặc đã bị hết hạn sử dụng.</p>
          <Link to="/auth">
            <Button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl">Quay lại Đăng nhập</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] relative flex items-center justify-center bg-slate-950 text-white p-4 sm:p-6 lg:p-12 font-sans selection:bg-indigo-500/30 overflow-hidden">
      
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/6 w-96 h-96 bg-indigo-600/15 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/6 w-96 h-96 bg-cyan-500/10 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      <div className="w-full max-w-5xl mx-auto relative z-10">
        
        {/* Top Navbar */}
        <div className="flex items-center justify-between mb-8 sm:mb-12">
          <Link to="/home" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-300">
                E
              </div>
            </div>
            <span className="font-bold text-lg tracking-tight text-white/90 group-hover:text-white transition-colors">
              E-Learning
            </span>
          </Link>

          <Link to="/auth" className="text-xs font-semibold text-white/60 hover:text-white flex items-center gap-1.5 transition-colors bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full border border-white/10">
            Quay lại Đăng nhập
          </Link>
        </div>

        {/* Main Content Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column */}
          <div className="lg:col-span-6 space-y-6 text-left pr-0 lg:pr-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Token hợp lệ • Tạo mật khẩu mới
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.15] text-white">
              Tạo mật khẩu mới <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400">
                bảo vệ tài khoản học tập.
              </span>
            </h1>

            <p className="text-slate-400 text-base leading-relaxed max-w-lg">
              Vui lòng nhập mật khẩu mới tối thiểu 6 ký tự. Hãy sử dụng kết hợp chữ cái và số để tăng cường độ an toàn cho tài khoản.
            </p>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-xl space-y-2 max-w-lg">
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Khuyên dùng bảo mật:</h4>
              <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
                <li>Mật khẩu dài ít nhất 6-12 ký tự</li>
                <li>Không sử dụng lại mật khẩu của các trang web khác</li>
                <li>Hệ thống mã hóa bằng bcrypt cost 12 an toàn tuyệt đối</li>
              </ul>
            </div>
          </div>

          {/* Right Column: Form Card */}
          <div className="lg:col-span-6">
            <div className="bg-[#0D0D11]/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 sm:p-10 shadow-2xl shadow-indigo-950/50 relative overflow-hidden">
              
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400" />

              <form onSubmit={handleSubmit} className="space-y-6">
                
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Đặt lại mật khẩu</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Nhập mật khẩu mới cho tài khoản của bạn</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="block text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">
                    Mật khẩu mới
                  </label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full h-13 px-4 !bg-slate-900 !text-white font-semibold placeholder:text-slate-500 border border-white/20 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 rounded-2xl shadow-inner"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="block text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">
                    Xác nhận mật khẩu mới
                  </label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full h-13 px-4 !bg-slate-900 !text-white font-semibold placeholder:text-slate-500 border border-white/20 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 rounded-2xl shadow-inner"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-13 text-sm font-bold tracking-wide uppercase bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-2xl shadow-xl shadow-indigo-600/25 transition-all hover:shadow-indigo-600/40"
                  disabled={isLoading || !password || !confirmPassword}
                >
                  {isLoading ? 'Đang lưu mật khẩu...' : 'Cập nhật mật khẩu mới'}
                </Button>
              </form>

            </div>
          </div>

        </div>

      </div>
      
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
};

export default ResetPassword;
