import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import AuthLayout from '../../components/auth/AuthLayout';
import AuthField from '../../components/auth/AuthField';

const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const hasLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const isMatch = password === passwordConfirm && password.length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasLength || !hasNumber || !isMatch) return;
    
    setLoading(true);
    // Simulate API Call
    setTimeout(() => {
      setLoading(false);
      setIsSuccess(true);
    }, 1000);
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
            <Link className="font-semibold text-sky-400 hover:text-sky-300 transition-colors" to="/forgot-password">
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
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-2xl mb-4 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            ✓
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Password Updated</h3>
          <p className="text-sm leading-6 text-emerald-100/70 mb-6">
            Your password has been successfully reset. You can now use your new password to sign in.
          </p>
          <Link to="/login" className="flex w-full items-center justify-center h-[52px] rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold text-lg shadow-[0_8px_20px_rgba(16,185,129,0.3)] transition-all hover:-translate-y-[2px] hover:scale-[1.01]">
            Go to Sign In
          </Link>
        </motion.div>
      ) : (
        <motion.form 
          className="space-y-5" 
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
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
                <div className={`h-1.5 w-1.5 rounded-full transition-colors ${hasLength ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                Minimum 8 characters
              </span>
              <span className={`text-xs font-bold uppercase tracking-wider transition-colors ${hasLength ? 'text-emerald-400' : 'text-slate-500'}`}>
                {hasLength ? 'Ready' : 'Waiting'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-2">
                <div className={`h-1.5 w-1.5 rounded-full transition-colors ${hasNumber ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                Includes numbers
              </span>
              <span className={`text-xs font-bold uppercase tracking-wider transition-colors ${hasNumber ? 'text-emerald-400' : 'text-slate-500'}`}>
                {hasNumber ? 'Ready' : 'Waiting'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-2">
                <div className={`h-1.5 w-1.5 rounded-full transition-colors ${isMatch && password.length > 0 ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                Passwords match
              </span>
              <span className={`text-xs font-bold uppercase tracking-wider transition-colors ${isMatch && password.length > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                {isMatch && password.length > 0 ? 'Ready' : 'Waiting'}
              </span>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading || !hasLength || !hasNumber || !isMatch}
            className="mt-6 w-full h-[52px] rounded-2xl bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-semibold text-lg shadow-[0_8px_20px_rgba(79,70,229,0.3)] transition-all duration-200 hover:-translate-y-[2px] hover:scale-[1.01] hover:shadow-[0_12px_24px_rgba(79,70,229,0.4)] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Updating...' : 'Update password'}
          </button>
        </motion.form>
      )}
    </AuthLayout>
  );
};

export default ResetPassword;