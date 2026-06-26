import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import AuthLayout from '../../components/auth/AuthLayout';
import AuthField from '../../components/auth/AuthField';
import { authApi } from '../../services/auth.api';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Vui lòng nhập địa chỉ email.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setIsSent(true);
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Đã có lỗi xảy ra. Vui lòng thử lại.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      badge="Account Recovery"
      headline="Don't worry, we've got you."
      description="Enter your email address and we'll send you a secure link to restore access to your learning space."
      bannerLabel=""
      bannerTitle=""
      bannerDescription=""
      highlights={[]}
      footer={
        <p className="text-center text-sm text-slate-400 mt-6">
          Remember your password?{' '}
          <Link className="font-semibold text-sky-400 hover:text-sky-300 transition-colors" to="/login">
            Back to sign in
          </Link>
        </p>
      }
    >
      {isSent ? (
        <motion.div
          className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-6 text-center backdrop-blur-md"
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-xl mb-4">
            ✓
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Recovery link sent</h3>
          <p className="text-sm leading-6 text-emerald-100/70">
            We've sent a secure link to <strong>{email}</strong>. Please check your inbox and follow
            the instructions.
          </p>
        </motion.div>
      ) : (
        <motion.form
          className="space-y-5"
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
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
            label="Email address"
            type="email"
            placeholder="you@school.com"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            hint="We'll send password reset instructions to this email."
          />

          <button
            type="submit"
            disabled={loading || !email}
            className="mt-6 w-full h-[52px] rounded-2xl bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-semibold text-lg shadow-[0_8px_20px_rgba(79,70,229,0.3)] transition-all duration-200 hover:-translate-y-[2px] hover:scale-[1.01] hover:shadow-[0_12px_24px_rgba(79,70,229,0.4)] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Sending link...
              </span>
            ) : (
              'Send recovery link'
            )}
          </button>

          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-6 text-slate-300">
            Tip: Use the same email you registered with to avoid delays.
          </div>
        </motion.form>
      )}
    </AuthLayout>
  );
};

export default ForgotPassword;