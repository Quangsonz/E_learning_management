import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AuthLayout from '../../components/auth/AuthLayout';
import AuthField from '../../components/auth/AuthField';

import { useToast } from '../../contexts/ToastContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorState, setErrorState] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect về trang trước khi bị chuyển về login (nếu có)
  const from = (location.state as any)?.from?.pathname || '/home';

  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('expired') === 'true') {
      // Đợi component mount hoàn toàn rồi hiển thị thông báo
      setTimeout(() => {
        error('Phiên làm việc của bạn đã hết hạn. Vui lòng đăng nhập lại.', 'Phiên hết hạn');
      }, 100);
      navigate(location.pathname, { replace: true });
    }
  }, [location, error, navigate]);


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorState('Vui lòng nhập email và mật khẩu.');
      error('Vui lòng nhập email và mật khẩu.', 'Đăng nhập thất bại');
      return;
    }
    setErrorState('');
    setLoading(true);
    try {
      await login({ email, password });
      success('Đăng nhập thành công! Đang chuyển hướng...', 'Chào mừng trở lại');
      navigate(from, { replace: true });
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.';
      setErrorState(msg);
      error(msg, 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      badge="Welcome Back"
      headline="Welcome back, let's keep the momentum going."
      description="Sign in to access your learning space, track your progress, and continue your courses."
      bannerLabel=""
      bannerTitle=""
      bannerDescription=""
      highlights={[]}
      footer={
        <p className="text-center text-sm text-slate-400 mt-6">
          New here?{' '}
          <Link className="font-semibold text-sky-400 hover:text-sky-300 transition-colors" to="/register">
            Create an account
          </Link>
        </p>
      }
    >
      <motion.form
        className="space-y-5"
        onSubmit={handleLogin}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        {errorState && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 text-sm font-medium text-rose-200 bg-rose-500/20 border border-rose-500/30 rounded-xl backdrop-blur-md"
          >
            {errorState}
          </motion.div>
        )}

        <AuthField
          label="Email address"
          type="email"
          placeholder="you@school.com"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <AuthField
          label="Password"
          type="password"
          placeholder="Enter your password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="flex items-center justify-between gap-4 mt-2">
          <label className="flex items-center gap-3 text-sm text-slate-300 cursor-pointer group">
            <div className="relative flex items-center justify-center">
              <input type="checkbox" className="peer sr-only" />
              <div className="h-5 w-5 rounded border border-white/20 bg-white/5 transition-all peer-focus:ring-2 peer-focus:ring-sky-500/50 group-hover:border-white/40" />
              <svg
                className="absolute w-3 h-3 text-sky-400 opacity-0 peer-checked:opacity-100 transition-opacity"
                viewBox="0 0 14 10"
                fill="none"
              >
                <path
                  d="M1 5L5 9L13 1"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            Remember me
          </label>
          <Link
            className="text-sm font-semibold text-sky-400 hover:text-sky-300 transition-colors"
            to="/forgot-password"
          >
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full h-[52px] rounded-2xl bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-semibold text-lg shadow-[0_8px_20px_rgba(79,70,229,0.3)] transition-all duration-200 hover:-translate-y-[2px] hover:scale-[1.01] hover:shadow-[0_12px_24px_rgba(79,70,229,0.4)] disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Signing in...
            </span>
          ) : (
            'Sign in'
          )}
        </button>

        <div className="flex items-center gap-4 text-xs uppercase tracking-[0.2em] text-slate-500 mt-8 mb-4">
          <span className="h-px flex-1 bg-white/10" />
          or continue with
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 h-[52px] text-sm font-medium text-slate-300 transition-all hover:bg-white/10 hover:border-white/20"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google
          </button>
          <button
            type="button"
            className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 h-[52px] text-sm font-medium text-slate-300 transition-all hover:bg-white/10 hover:border-white/20"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            GitHub
          </button>
        </div>
      </motion.form>
    </AuthLayout>
  );
};

export default Login;