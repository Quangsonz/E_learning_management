import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Input, Toast } from '../../components/ui';
import { authApi } from '../../services/auth.api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    try {
      const res = await authApi.forgotPassword(email);
      setIsSuccess(true);
      setToast({ message: res.message || 'Link đặt lại mật khẩu đã được gửi thành công!', type: 'success' });
    } catch (err: any) {
      setToast({
        message: err.response?.data?.message || err.message || 'Có lỗi xảy ra. Vui lòng thử lại sau.',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] relative flex items-center justify-center bg-slate-950 text-white p-4 sm:p-6 lg:p-12 font-sans selection:bg-indigo-500/30 overflow-hidden">
      
      {/* Background Decorative Glow Effects */}
      <div className="absolute top-1/4 left-1/6 w-96 h-96 bg-indigo-600/15 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/6 w-96 h-96 bg-cyan-500/10 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      <div className="w-full max-w-5xl mx-auto relative z-10">
        
        {/* Top Navbar Brand */}
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
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            Quay lại Đăng nhập
          </Link>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Value Proposition & Security Details */}
          <div className="lg:col-span-6 space-y-6 text-left pr-0 lg:pr-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
              Bảo mật tài khoản 256-bit
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.15] text-white">
              Khôi phục mật khẩu <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400">
                nhanh chóng & an toàn.
              </span>
            </h1>

            <p className="text-slate-400 text-base leading-relaxed max-w-lg">
              Nhập email chính chủ của bạn. Hệ thống sẽ tự tạo mã xác thực SHA-256 1 lần và gửi link hướng dẫn đặt lại mật khẩu mới trực tiếp vào hòm thư.
            </p>

            {/* Feature Bento Grid Items */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-xl">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                </div>
                <h4 className="text-sm font-bold text-white mb-1">Mã hóa SHA-256</h4>
                <p className="text-xs text-slate-400 leading-normal">Mã token ngẫu nhiên bảo mật 1 lần dùng duy nhất.</p>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-xl">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                </div>
                <h4 className="text-sm font-bold text-white mb-1">Hạn dùng 10 phút</h4>
                <p className="text-xs text-slate-400 leading-normal">Tự động vô hiệu hóa token nếu quá thời gian yêu cầu.</p>
              </div>
            </div>

            {/* Trust Quote */}
            <div className="pt-2 flex items-center gap-3 text-xs text-slate-500">
              <div className="flex -space-x-2 overflow-hidden">
                <img className="inline-block h-7 w-7 rounded-full ring-2 ring-slate-950" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" alt="" />
                <img className="inline-block h-7 w-7 rounded-full ring-2 ring-slate-950" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80" alt="" />
                <img className="inline-block h-7 w-7 rounded-full ring-2 ring-slate-950" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80" alt="" />
              </div>
              <span>Được tin tưởng bởi hơn 50.000+ học viên trên toàn quốc</span>
            </div>

          </div>

          {/* Right Column: Form Card */}
          <div className="lg:col-span-6">
            <div className="bg-[#0D0D11]/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 sm:p-10 shadow-2xl shadow-indigo-950/50 relative overflow-hidden">
              
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400" />

              {!isSuccess ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  
                  <div className="flex items-center gap-4 mb-2">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.778-7.778zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path></svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Quên mật khẩu?</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Nhập email đăng ký để nhận link đặt lại</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">
                      Địa chỉ Email đăng ký
                    </label>
                    <div className="relative">
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tenban@gmail.com"
                        required
                        className="w-full h-13 pl-11 !bg-slate-900 !text-white font-semibold placeholder:text-slate-500 border border-white/20 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 rounded-2xl shadow-inner"
                      />
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-13 text-sm font-bold tracking-wide uppercase bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-2xl shadow-xl shadow-indigo-600/25 transition-all hover:shadow-indigo-600/40"
                    disabled={isLoading || !email}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Đang gửi link khôi phục...</span>
                      </div>
                    ) : (
                      'Gửi link khôi phục qua Email'
                    )}
                  </Button>

                  <div className="text-center pt-2 border-t border-white/5">
                    <Link to="/auth" className="text-xs font-semibold text-slate-400 hover:text-white transition-colors inline-flex items-center gap-1">
                      <span>Nhớ lại mật khẩu?</span>
                      <span className="text-indigo-400 underline underline-offset-4 font-bold">Đăng nhập ngay</span>
                    </Link>
                  </div>
                </form>
              ) : (
                /* Success View State */
                <div className="text-center py-6 space-y-6 animate-in fade-in zoom-in-95 duration-300">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/10">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>

                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">Đã gửi link khôi phục!</h3>
                    <p className="text-sm text-slate-400 leading-relaxed max-w-sm mx-auto">
                      Chúng tôi đã gửi email chứa đường dẫn đặt lại mật khẩu đến <span className="font-bold text-indigo-400">{email}</span>.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 text-left text-xs text-slate-400 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-white">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-400"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                      <span>Hướng dẫn tiếp theo:</span>
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
                      <li>Kiểm tra Hộp thư đến (hoặc thư mục Spam/Thư rác).</li>
                      <li>Nhấp vào đường dẫn trong email để tạo mật khẩu mới.</li>
                      <li>Đường dẫn sẽ tự hết hạn sau 10 phút.</li>
                    </ul>
                  </div>

                  <div className="flex flex-col gap-3 pt-2">
                    <Button 
                      onClick={() => setIsSuccess(false)}
                      variant="outline"
                      className="w-full h-11 text-xs uppercase tracking-wider border-white/10 hover:bg-white/10 text-white rounded-xl"
                    >
                      Gửi lại email khác
                    </Button>

                    <Link to="/auth" className="text-xs font-semibold text-slate-400 hover:text-white transition-colors">
                      Quay lại trang Đăng nhập
                    </Link>
                  </div>
                </div>
              )}

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

export default ForgotPassword;
