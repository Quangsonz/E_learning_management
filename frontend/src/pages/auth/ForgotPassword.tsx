import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Input, Toast } from '../../components/ui';
import { authApi } from '../../services/auth.api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    try {
      const res = await authApi.forgotPassword(email);
      setToast({ message: res.data.message || 'If an account exists, a reset link was sent.', type: 'success' });
      setEmail('');
    } catch (err: any) {
      setToast({
        message: err.response?.data?.message || 'An error occurred. Please try again.',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-slate-50 dark:bg-[#080808] p-4 font-sans selection:bg-indigo-500/30">
      <div className="w-full max-w-md">
        
        {/* Header */}
        <div className="text-center mb-10">
          <Link to="/home" className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 text-white font-bold tracking-tighter text-lg shadow-lg shadow-indigo-500/20 mb-6">
            E
          </Link>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white mb-3">
            Reset Password
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200/60 dark:border-white/10 rounded-[2rem] p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="space-y-2">
              <label htmlFor="email" className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hello@example.com"
                required
                className="w-full"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-sm uppercase tracking-widest"
              disabled={isLoading || !email}
            >
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </Button>

            <div className="text-center pt-2">
              <Link to="/auth" className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">
                Back to login
              </Link>
            </div>
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

export default ForgotPassword;
