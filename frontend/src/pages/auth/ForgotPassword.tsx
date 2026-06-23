import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import AuthLayout from '../../components/auth/AuthLayout';
import AuthField from '../../components/auth/AuthField';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setIsSent(true);
    }, 1000);
  };

  return (
    <AuthLayout
      badge="Account Recovery"
      headline="Don't worry, we've got you."
      description="Enter your email address and we'll send you a secure link to restore access to your learning space."
      bannerLabel=""
      bannerTitle=""
      bannerDescription=""
      highlights={[]}
      footer={
        <p className="text-center text-sm text-slate-400 mt-6">
          Remember your password?{' '}
          <Link className="font-semibold text-sky-400 hover:text-sky-300 transition-colors" to="/login">
            Back to sign in
          </Link>
        </p>
      }
    >
      {isSent ? (
        <motion.div 
          className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-6 text-center backdrop-blur-md"
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-xl mb-4">
            ✓
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Recovery link sent</h3>
          <p className="text-sm leading-6 text-emerald-100/70">
            We've sent a secure link to <strong>{email}</strong>. Please check your inbox and follow the instructions.
          </p>
        </motion.div>
      ) : (
        <motion.form 
          className="space-y-5" 
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <AuthField
            label="Email address"
            type="email"
            placeholder="you@school.com"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            hint="We'll send password reset instructions to this email."
          />

          <button 
            type="submit" 
            disabled={loading || !email}
            className="mt-6 w-full h-[52px] rounded-2xl bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-semibold text-lg shadow-[0_8px_20px_rgba(79,70,229,0.3)] transition-all duration-200 hover:-translate-y-[2px] hover:scale-[1.01] hover:shadow-[0_12px_24px_rgba(79,70,229,0.4)] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending link...' : 'Send recovery link'}
          </button>

          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-6 text-slate-300">
            Tip: Use the same email you registered with to avoid delays.
          </div>
        </motion.form>
      )}
    </AuthLayout>
  );
};

export default ForgotPassword;