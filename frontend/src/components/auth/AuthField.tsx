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
      <label htmlFor={inputId} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={inputId}
        className={`w-full rounded-xl border bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition duration-sm ease-standard focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 ${
          error ? 'border-error-500 focus:ring-error-500/10' : 'border-slate-200'
        } ${className}`}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={hint || error ? `${inputId}-help` : undefined}
        {...props}
      />
      {hint ? (
        <p id={`${inputId}-help`} className="text-xs leading-5 text-slate-500">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${inputId}-help`} className="text-xs font-medium text-rose-500">
          {error}
        </p>
      ) : null}
    </div>
  );
};

export default AuthField;