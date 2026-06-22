import React from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../../components/auth/AuthLayout';
import AuthField from '../../components/auth/AuthField';
import { Button } from '../../components/ui';

const ForgotPassword: React.FC = () => {
  return (
    <AuthLayout
      badge="Account recovery"
      headline="Reset access in minutes"
      description="We will send a secure recovery link to your email so you can get back into your workspace without friction."
      bannerLabel="Recovery made simple"
      bannerTitle="Support Banner"
      bannerDescription="A clear recovery flow reduces abandonment and gives users confidence that their account is protected."
      highlights={['Fast recovery link', 'Secure email flow', 'Low-friction UX']}
      footer={
        <p className="text-center text-sm text-slate-500">
          Remember your password?{' '}
          <Link className="font-semibold text-sky-600 hover:text-sky-700" to="/login">
            Back to sign in
          </Link>
        </p>
      }
    >
      <form className="space-y-5" onSubmit={(event) => event.preventDefault()}>
        <AuthField
          label="Email address"
          type="email"
          placeholder="you@school.com"
          autoComplete="email"
          hint="We'll send password reset instructions to this email."
        />

        <Button type="submit" variant="gradient" fullWidth size="lg">
          Send recovery link
        </Button>

        <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
          Tip: Use the same email you registered with to avoid delays.
        </div>
      </form>
    </AuthLayout>
  );
};

export default ForgotPassword;