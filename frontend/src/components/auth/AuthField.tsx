import React from 'react';

type AuthFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
};

export const AuthField: React.FC<AuthFieldProps> = ({ label, hint, error, id, className = '', ...props }) => {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="text-sm font-medium text-slate-300">
        {label}
      </label>
      <input
        id={inputId}
        className={`w-full h-[52px] rounded-2xl border bg-white/5 px-4 text-white placeholder-slate-500 shadow-sm outline-none transition-all duration-300 focus:border-sky-400 focus:bg-white/10 focus:ring-4 focus:ring-sky-400/20 ${
          error ? 'border-rose-500 focus:ring-rose-500/20' : 'border-white/10 hover:border-white/20'
        } ${className}`}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={hint || error ? `${inputId}-help` : undefined}
        {...props}
      />
      {hint ? (
        <p id={`${inputId}-help`} className="text-xs leading-5 text-slate-400">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${inputId}-help`} className="text-xs font-medium text-rose-400">
          {error}
        </p>
      ) : null}
    </div>
  );
};

export default AuthField;