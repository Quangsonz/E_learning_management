import React from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../../components/auth/AuthLayout';
import AuthField from '../../components/auth/AuthField';
import { Button } from '../../components/ui';

const Register: React.FC = () => {
  return (
    <AuthLayout
      badge="Create your workspace"
      headline="Start teaching faster"
      description="Create your account and set up a refined learning platform that looks credible from the very first click."
      bannerLabel="Convert interest into enrollment"
      bannerTitle="Marketing Message"
      bannerDescription="A clean, premium registration experience helps reduce friction and improves the perceived quality of your platform."
      highlights={['Quick account setup', 'Team-friendly structure', 'Accessible by default']}
      footer={
        <p className="text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link className="font-semibold text-sky-600 hover:text-sky-700" to="/login">
            Sign in
          </Link>
        </p>
      }
    >
      <form className="space-y-5" onSubmit={(event) => event.preventDefault()}>
        <div className="grid gap-5 sm:grid-cols-2">
          <AuthField label="First name" type="text" placeholder="Alex" autoComplete="given-name" />
          <AuthField label="Last name" type="text" placeholder="Johnson" autoComplete="family-name" />
        </div>
        <AuthField label="Email address" type="email" placeholder="alex@school.com" autoComplete="email" />
        <AuthField label="Organization" type="text" placeholder="Your academy or company" autoComplete="organization" />
        <div className="grid gap-5 sm:grid-cols-2">
          <AuthField label="Password" type="password" placeholder="Create a password" autoComplete="new-password" hint="Use at least 8 characters." />
          <AuthField label="Confirm password" type="password" placeholder="Repeat password" autoComplete="new-password" />
        </div>

        <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
          <input type="checkbox" className="mt-1 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500" />
          <span>
            I agree to the <a className="font-semibold text-sky-600 hover:text-sky-700" href="#">Terms</a> and{' '}
            <a className="font-semibold text-sky-600 hover:text-sky-700" href="#">Privacy Policy</a>.
          </span>
        </label>

        <Button type="submit" variant="gradient" fullWidth size="lg">
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
};

export default Register;