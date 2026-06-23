import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import AuthLayout from '../../components/auth/AuthLayout';
import AuthField from '../../components/auth/AuthField';
import { Button } from '../../components/ui';
import { authApi } from '../../services/auth.api';
import { setAuth } from '../../store/slices/authSlice';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await authApi.login({ email, password });
      if (response.status === 'success') {
        dispatch(setAuth({
          accessToken: response.token,
          user: response.data.user
        }));
        setTimeout(() => {
        navigate('/home');
      }, 1200);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
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
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        {error && <div className="p-3 text-sm font-medium text-rose-200 bg-rose-500/20 border border-rose-500/30 rounded-xl backdrop-blur-md">{error}</div>}
        
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
              <svg className="absolute w-3 h-3 text-sky-400 opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 14 10" fill="none">
                <path d="M1 5L5 9L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            Remember me
          </label>
          <Link className="text-sm font-semibold text-sky-400 hover:text-sky-300 transition-colors" to="/forgot-password">
            Forgot password?
          </Link>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="mt-6 w-full h-[52px] rounded-2xl bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-semibold text-lg shadow-[0_8px_20px_rgba(79,70,229,0.3)] transition-all duration-200 hover:-translate-y-[2px] hover:scale-[1.01] hover:shadow-[0_12px_24px_rgba(79,70,229,0.4)] disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>

        <div className="flex items-center gap-4 text-xs uppercase tracking-[0.2em] text-slate-500 mt-8 mb-4">
          <span className="h-px flex-1 bg-white/10" />
          or continue with
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <button type="button" className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 h-[52px] text-sm font-medium text-slate-300 transition-all hover:bg-white/10 hover:border-white/20">
            Google
          </button>
          <button type="button" className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 h-[52px] text-sm font-medium text-slate-300 transition-all hover:bg-white/10 hover:border-white/20">
            GitHub
          </button>
        </div>
      </motion.form>
    </AuthLayout>
  );
};

export default Login;