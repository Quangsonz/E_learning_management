import React from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../../components/auth/AuthLayout';
import AuthField from '../../components/auth/AuthField';
import { Button } from '../../components/ui';

const ResetPassword: React.FC = () => {
  return (
    <AuthLayout
      badge="Secure reset"
      headline="Set a new password"
      description="Choose a strong new password and return to your learning dashboard with a seamless recovery experience."
      bannerLabel="Security without friction"
      bannerTitle="Recovery Banner"
      bannerDescription="Make password recovery feel calm and professional while keeping the flow explicit and accessible."
      highlights={['Strong-password guidance', 'Clear confirmation states', 'Mobile-friendly form']}
      footer={
        <p className="text-center text-sm text-slate-500">
          Need another link?{' '}
          <Link className="font-semibold text-sky-600 hover:text-sky-700" to="/forgot-password">
            Request again
          </Link>
        </p>
      }
    >
      <form className="space-y-5" onSubmit={(event) => event.preventDefault()}>
        <AuthField
          label="New password"
          type="password"
          placeholder="Enter a strong password"
          autoComplete="new-password"
          hint="Use 8+ characters with a mix of letters and numbers."
        />
        <AuthField
          label="Confirm new password"
          type="password"
          placeholder="Repeat the new password"
          autoComplete="new-password"
        />

        <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          <div className="flex items-center justify-between gap-4">
            <span>Minimum 8 characters</span>
            <span className="font-semibold text-emerald-600">Strong</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span>Includes numbers</span>
            <span className="font-semibold text-emerald-600">Ready</span>
          </div>
        </div>

        <Button type="submit" variant="gradient" fullWidth size="lg">
          Update password
        </Button>
      </form>
    </AuthLayout>
  );
};

export default ResetPassword;