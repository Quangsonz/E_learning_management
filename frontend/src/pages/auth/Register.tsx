import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import AuthLayout from '../../components/auth/AuthLayout';
import AuthField from '../../components/auth/AuthField';
import { useToast } from '../../contexts/ToastContext';

const Register: React.FC = () => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [errorState, setErrorState] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const passwordStrength =
    password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const strengthColors = ['bg-white/10', 'bg-rose-400', 'bg-amber-400', 'bg-emerald-400'];
  const strengthLabels = ['', t('auth.register.weak'), t('auth.register.good'), t('auth.register.strong')];

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!name.trim()) { 
      const msg = t('auth.validation.nameRequired');
      setErrorState(msg); 
      error(msg); 
      return; 
    }
    if (!email.trim()) { 
      const msg = t('auth.validation.emailRequired');
      setErrorState(msg); 
      error(msg); 
      return; 
    }
    if (password.length < 6) { 
      const msg = t('auth.validation.passwordMin');
      setErrorState(msg); 
      error(msg); 
      return; 
    }
    if (password !== passwordConfirm) { 
      const msg = t('auth.validation.passwordMismatch');
      setErrorState(msg); 
      error(msg); 
      return; 
    }

    setErrorState('');
    setLoading(true);
    try {
      await register({ name, email, password, passwordConfirm, role });
      success(t('auth.toast.registerSuccess'), t('common.success'));
      navigate('/home', { replace: true });
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        t('auth.register.failed');
      setErrorState(msg);
      error(msg, t('auth.register.failedTitle'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      badge={t('auth.register.badge')}
      headline={t('auth.register.headline')}
      description={t('auth.register.desc')}
      bannerLabel=""
      bannerTitle=""
      bannerDescription=""
      highlights={[]}
      footer={
        <p className="text-center text-sm text-slate-400 mt-6">
          {t('auth.register.alreadyHave')}{' '}
          <Link className="font-semibold text-sky-400 hover:text-sky-300 transition-colors" to="/login">
            {t('auth.register.signIn')}
          </Link>
        </p>
      }
    >
      <motion.form
        className="space-y-5"
        onSubmit={handleRegister}
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
          label={t('auth.register.nameLabel')}
          type="text"
          placeholder="Alex Johnson"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <AuthField
          label={t('auth.register.emailLabel')}
          type="email"
          placeholder="alex@school.com"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-300">{t('auth.register.role')}</span>
          <select
            value={role}
            onChange={(event) => setRole(event.target.value as 'student' | 'teacher')}
            className="w-full h-[52px] rounded-2xl border bg-white/5 px-4 text-white shadow-sm outline-none transition-all duration-300 border-white/10 hover:border-white/20 focus:border-sky-400 focus:bg-white/10 focus:ring-4 focus:ring-sky-400/20 appearance-none cursor-pointer"
          >
            <option value="student" className="text-slate-900">{t('auth.register.student')}</option>
            <option value="teacher" className="text-slate-900">{t('auth.register.teacher')}</option>
          </select>
        </label>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <AuthField
              label={t('auth.register.passwordLabel')}
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {password.length > 0 && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex flex-1 gap-1 h-1.5">
                  <div
                    className={`flex-1 rounded-full ${
                      passwordStrength >= 1 ? strengthColors[passwordStrength] : 'bg-white/10'
                    } transition-colors duration-300`}
                  />
                  <div
                    className={`flex-1 rounded-full ${
                      passwordStrength >= 2 ? strengthColors[passwordStrength] : 'bg-white/10'
                    } transition-colors duration-300`}
                  />
                  <div
                    className={`flex-1 rounded-full ${
                      passwordStrength >= 3 ? strengthColors[passwordStrength] : 'bg-white/10'
                    } transition-colors duration-300`}
                  />
                </div>
                <span
                  className={`text-[10px] uppercase tracking-wider font-bold ${strengthColors[passwordStrength].replace(
                    'bg-',
                    'text-'
                  )}`}
                >
                  {strengthLabels[passwordStrength]}
                </span>
              </div>
            )}
          </div>
          <AuthField
            label={t('auth.register.confirmPasswordLabel')}
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
          />
        </div>

        <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-300 transition-colors hover:bg-white/10 group cursor-pointer mt-4">
          <div className="relative flex items-center justify-center mt-0.5">
            <input type="checkbox" required className="peer sr-only" />
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
          <span>
            {t('auth.register.agreeTerms')}{' '}
            <a className="font-semibold text-sky-400 hover:text-sky-300 transition-colors" href="#">
              {t('auth.register.terms')}
            </a>{' '}
            {t('auth.register.and')}{' '}
            <a className="font-semibold text-sky-400 hover:text-sky-300 transition-colors" href="#">
              {t('auth.register.privacy')}
            </a>
            .
          </span>
        </label>

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
              {t('auth.register.submitting')}
            </span>
          ) : (
            t('auth.register.submit')
          )}
        </button>
      </motion.form>
    </AuthLayout>
  );
};

export default Register;