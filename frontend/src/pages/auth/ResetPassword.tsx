import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import AuthLayout from '../../components/auth/AuthLayout';
import AuthField from '../../components/auth/AuthField';

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

        <motion.button
          type="submit"
          whileHover={{ y: -1, scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="w-full rounded-2xl bg-gradient-to-r from-indigo-600 via-sky-600 to-cyan-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition focus:outline-none focus:ring-4 focus:ring-sky-200"
        >
          Update password
        </motion.button>
      </form>
    </AuthLayout>
  );
};

export default ResetPassword;