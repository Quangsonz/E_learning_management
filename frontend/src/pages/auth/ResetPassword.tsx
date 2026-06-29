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
      setToast({ message: 'Invalid or missing reset token.', type: 'error' });
      return;
    }
    if (password !== confirmPassword) {
      setToast({ message: 'Passwords do not match.', type: 'error' });
      return;
    }

    setIsLoading(true);
    try {
      const res = await authApi.resetPassword(token, password);
      setToast({ message: 'Password reset successfully! Redirecting...', type: 'success' });
      setTimeout(() => navigate('/auth'), 2000);
    } catch (err: any) {
      setToast({
        message: err.response?.data?.message || 'An error occurred. The token may be expired.',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-slate-50 dark:bg-[#080808]">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Invalid Link</h2>
          <p className="text-slate-500 mb-6">The password reset link is missing or invalid.</p>
          <Link to="/auth">
            <Button>Return to Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-slate-50 dark:bg-[#080808] p-4 font-sans selection:bg-indigo-500/30">
      <div className="w-full max-w-md">
        
        {/* Header */}
        <div className="text-center mb-10">
          <Link to="/home" className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 text-white font-bold tracking-tighter text-lg shadow-lg shadow-indigo-500/20 mb-6">
            E
          </Link>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white mb-3">
            Set New Password
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Please enter your new password below.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200/60 dark:border-white/10 rounded-[2rem] p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="space-y-2">
              <label htmlFor="password" className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">
                New Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">
                Confirm Password
              </label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-sm uppercase tracking-widest"
              disabled={isLoading || !password || !confirmPassword}
            >
              {isLoading ? 'Saving...' : 'Reset Password'}
            </Button>
          </form>
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
