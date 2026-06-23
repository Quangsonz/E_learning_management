import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import AuthLayout from '../../components/auth/AuthLayout';
import AuthField from '../../components/auth/AuthField';
import { Button } from '../../components/ui';
import { authApi } from '../../services/auth.api';
import { setAuth } from '../../store/slices/authSlice';

const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [role, setRole] = useState('student'); // Allow choosing role for demo purposes or default to student
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== passwordConfirm) {
      return setError('Passwords do not match');
    }
    setError('');
    setLoading(true);
    try {
      const response = await authApi.register({ name, email, password, passwordConfirm, role });
      if (response.status === 'success') {
        dispatch(setAuth({
          accessToken: response.token,
          user: response.data.user
        }));
        setTimeout(() => {
          navigate('/home');
        }, 1500);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const strengthColors = ['bg-white/10', 'bg-rose-400', 'bg-amber-400', 'bg-emerald-400'];
  const strengthLabels = ['', 'Weak', 'Good', 'Strong'];

  return (
    <AuthLayout
      badge="Create Your Space"
      headline="Create your learning space."
      description="Join our community of learners and start building your skills today in a beautiful, distraction-free environment."
      bannerLabel=""
      bannerTitle=""
      bannerDescription=""
      highlights={[]}
      footer={
        <p className="text-center text-sm text-slate-400 mt-6">
          Already have an account?{' '}
          <Link className="font-semibold text-sky-400 hover:text-sky-300 transition-colors" to="/login">
            Sign in
          </Link>
        </p>
      }
    >
      <motion.form 
        className="space-y-5" 
        onSubmit={handleRegister}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        {error && <div className="p-3 text-sm font-medium text-rose-200 bg-rose-500/20 border border-rose-500/30 rounded-xl backdrop-blur-md">{error}</div>}
        
        <AuthField 
          label="Full name" 
          type="text" 
          placeholder="Alex Johnson" 
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <AuthField 
          label="Email address" 
          type="email" 
          placeholder="alex@school.com" 
          autoComplete="email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-300">Role</span>
          <select
            value={role}
            onChange={(event) => setRole(event.target.value)}
            className="w-full h-[52px] rounded-2xl border bg-white/5 px-4 text-white shadow-sm outline-none transition-all duration-300 border-white/10 hover:border-white/20 focus:border-sky-400 focus:bg-white/10 focus:ring-4 focus:ring-sky-400/20 appearance-none cursor-pointer"
          >
            <option value="student" className="text-slate-900">Student</option>
            <option value="teacher" className="text-slate-900">Teacher</option>
          </select>
        </label>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <AuthField 
              label="Password" 
              type="password" 
              placeholder="Create a password" 
              autoComplete="new-password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {password.length > 0 && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex flex-1 gap-1 h-1.5">
                  <div className={`flex-1 rounded-full ${passwordStrength >= 1 ? strengthColors[passwordStrength] : 'bg-white/10'} transition-colors duration-300`} />
                  <div className={`flex-1 rounded-full ${passwordStrength >= 2 ? strengthColors[passwordStrength] : 'bg-white/10'} transition-colors duration-300`} />
                  <div className={`flex-1 rounded-full ${passwordStrength >= 3 ? strengthColors[passwordStrength] : 'bg-white/10'} transition-colors duration-300`} />
                </div>
                <span className={`text-[10px] uppercase tracking-wider font-bold ${strengthColors[passwordStrength].replace('bg-', 'text-')}`}>
                  {strengthLabels[passwordStrength]}
                </span>
              </div>
            )}
          </div>
          <AuthField 
            label="Confirm password" 
            type="password" 
            placeholder="Repeat password" 
            autoComplete="new-password" 
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
          />
        </div>

        <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-300 transition-colors hover:bg-white/10 group cursor-pointer mt-4">
          <div className="relative flex items-center justify-center mt-0.5">
            <input type="checkbox" required className="peer sr-only" />
            <div className="h-5 w-5 rounded border border-white/20 bg-white/5 transition-all peer-focus:ring-2 peer-focus:ring-sky-500/50 group-hover:border-white/40" />
            <svg className="absolute w-3 h-3 text-sky-400 opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 14 10" fill="none">
              <path d="M1 5L5 9L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span>
            I agree to the <a className="font-semibold text-sky-400 hover:text-sky-300 transition-colors" href="#">Terms</a> and{' '}
            <a className="font-semibold text-sky-400 hover:text-sky-300 transition-colors" href="#">Privacy Policy</a>.
          </span>
        </label>

        <button 
          type="submit" 
          disabled={loading}
          className="mt-6 w-full h-[52px] rounded-2xl bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-semibold text-lg shadow-[0_8px_20px_rgba(79,70,229,0.3)] transition-all duration-200 hover:-translate-y-[2px] hover:scale-[1.01] hover:shadow-[0_12px_24px_rgba(79,70,229,0.4)] disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </motion.form>
    </AuthLayout>
  );
};

export default Register;