import React from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../../components/auth/AuthLayout';
import AuthField from '../../components/auth/AuthField';
import { Button } from '../../components/ui';

const Login: React.FC = () => {
  return (
    <AuthLayout
      badge="Mini Social Learning"
      headline="Welcome back"
      description="Sign in to continue building courses, tracking learners, and managing your learning experience in one polished workspace."
      bannerLabel="Fresh content, real momentum"
      bannerTitle="Learning Banner"
      bannerDescription="Ship structured learning journeys with a premium onboarding flow that feels modern, fast, and trustworthy."
      highlights={['Seamless course access', 'Fast sign-in experience', 'Built for conversion']} 
      footer={
        <p className="text-center text-sm text-slate-500">
          New here?{' '}
          <Link className="font-semibold text-primary-500 hover:text-primary-700" to="/register">
            Create an account
          </Link>
        </p>
      }
    >
      <form className="space-y-5" onSubmit={(event) => event.preventDefault()}>
        <AuthField label="Email address" type="email" placeholder="you@school.com" autoComplete="email" />
        <AuthField label="Password" type="password" placeholder="Enter your password" autoComplete="current-password" />

        <div className="flex items-center justify-between gap-4">
          <label className="flex items-center gap-3 text-sm text-slate-600">
            <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500" />
            Remember me
          </label>
          <Link className="text-sm font-semibold text-primary-500 hover:text-primary-700" to="/forgot-password">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" variant="gradient" fullWidth size="lg">
          Sign in
        </Button>

        <div className="flex items-center gap-4 text-xs uppercase tracking-[0.25em] text-slate-400">
          <span className="h-px flex-1 bg-slate-200" />
          or continue with
          <span className="h-px flex-1 bg-slate-200" />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <button type="button" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
            Google
          </button>
          <button type="button" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
            Microsoft
          </button>
        </div>
      </form>
    </AuthLayout>
  );
};

export default Login;