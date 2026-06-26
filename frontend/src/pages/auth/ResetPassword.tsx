import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AuthLayout from '../../components/auth/AuthLayout';
import AuthField from '../../components/auth/AuthField';
import { authApi } from '../../services/auth.api';

const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Token được gửi qua URL: /reset-password?token=xxx
  const token = searchParams.get('token') || '';

  const hasLength = password.length >= 6;
  const hasNumber = /\d/.test(password);
  const isMatch = password === passwordConfirm && password.length > 0;
  const canSubmit = hasLength && isMatch && token && !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    if (!token) {
      setError('Token đặt lại mật khẩu không tìm thấy trong URL. Vui lòng yêu cầu lại link.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      setIsSuccess(true);
      // Tự động redirect về login sau 3 giây
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Token không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu lại link đặt lại mật khẩu.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      badge="Secure Reset"
      headline="Set a new password."
      description="Choose a strong new password to secure your learning space and resume your progress."
      bannerLabel=""
      bannerTitle=""
      bannerDescription=""
      highlights={[]}
      footer={
        !isSuccess && (
          <p className="text-center text-sm text-slate-400 mt-6">
            Need another link?{' '}
            <Link
              className="font-semibold text-sky-400 hover:text-sky-300 transition-colors"
              to="/forgot-password"
            >
              Request again
            </Link>
          </p>
        )
      }
    >
      {isSuccess ? (
        <motion.div
          className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-6 text-center backdrop-blur-md"
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-2xl mb-4 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            ✓
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Password Updated</h3>
          <p className="text-sm leading-6 text-emerald-100/70 mb-6">
            Your password has been successfully reset. Redirecting to sign in...
          </p>
          <Link
            to="/login"
            className="flex w-full items-center justify-center h-[52px] rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold text-lg shadow-[0_8px_20px_rgba(16,185,129,0.3)] transition-all hover:-translate-y-[2px] hover:scale-[1.01]"
          >
            Go to Sign In
          </Link>
        </motion.div>
      ) : (
        <motion.form
          className="space-y-5"
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          {!token && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 text-sm font-medium text-amber-200 bg-amber-500/20 border border-amber-500/30 rounded-xl"
            >
              ⚠️ Không tìm thấy token trong URL. Hãy click lại vào link trong email.
            </motion.div>
          )}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 text-sm font-medium text-rose-200 bg-rose-500/20 border border-rose-500/30 rounded-xl backdrop-blur-md"
            >
              {error}
            </motion.div>
          )}

          <AuthField
            label="New password"
            type="password"
            placeholder="Enter a strong password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <AuthField
            label="Confirm new password"
            type="password"
            placeholder="Repeat the new password"
            autoComplete="new-password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
          />

          <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-2">
                <div
                  className={`h-1.5 w-1.5 rounded-full transition-colors ${
                    hasLength ? 'bg-emerald-400' : 'bg-slate-600'
                  }`}
                />
                Minimum 6 characters
              </span>
              <span
                className={`text-xs font-bold uppercase tracking-wider transition-colors ${
                  hasLength ? 'text-emerald-400' : 'text-slate-500'
                }`}
              >
                {hasLength ? 'Ready' : 'Waiting'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-2">
                <div
                  className={`h-1.5 w-1.5 rounded-full transition-colors ${
                    hasNumber ? 'bg-emerald-400' : 'bg-slate-600'
                  }`}
                />
                Includes numbers
              </span>
              <span
                className={`text-xs font-bold uppercase tracking-wider transition-colors ${
                  hasNumber ? 'text-emerald-400' : 'text-slate-500'
                }`}
              >
                {hasNumber ? 'Ready' : 'Waiting'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-2">
                <div
                  className={`h-1.5 w-1.5 rounded-full transition-colors ${
                    isMatch && password.length > 0 ? 'bg-emerald-400' : 'bg-slate-600'
                  }`}
                />
                Passwords match
              </span>
              <span
                className={`text-xs font-bold uppercase tracking-wider transition-colors ${
                  isMatch && password.length > 0 ? 'text-emerald-400' : 'text-slate-500'
                }`}
              >
                {isMatch && password.length > 0 ? 'Ready' : 'Waiting'}
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="mt-6 w-full h-[52px] rounded-2xl bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-semibold text-lg shadow-[0_8px_20px_rgba(79,70,229,0.3)] transition-all duration-200 hover:-translate-y-[2px] hover:scale-[1.01] hover:shadow-[0_12px_24px_rgba(79,70,229,0.4)] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Updating...
              </span>
            ) : (
              'Update password'
            )}
          </button>
        </motion.form>
      )}
    </AuthLayout>
  );
};

export default ResetPassword;