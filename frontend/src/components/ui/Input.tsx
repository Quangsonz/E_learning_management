import React, { useId } from 'react';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onClear?: () => void;
  labelClassName?: string;
};

export const Input: React.FC<InputProps> = ({
  label,
  hint,
  error,
  icon,
  rightIcon,
  onClear,
  id,
  className = '',
  value,
  labelClassName = '',
  ...props
}) => {
  const autoId = useId();
  const inputId = id ?? autoId;
  const hasValue = value !== undefined && value !== '';
  const descId = hint || error ? `${inputId}-desc` : undefined;

  const field = (
    <div
      className={`
        group relative flex min-h-[44px] items-center gap-2.5 rounded-xl border
        bg-white px-3.5 transition-all duration-150
        focus-within:ring-4
        ${error
          ? 'border-red-400 focus-within:border-red-400 focus-within:ring-red-500/10'
          : 'border-slate-200 hover:border-slate-300 focus-within:border-primary-500 focus-within:ring-primary-500/10'
        }
        ${className}
      `}
    >
      {/* Left icon */}
      {icon ? (
        <span className="shrink-0 text-slate-400 transition-colors group-focus-within:text-primary-500" aria-hidden="true">
          {icon}
        </span>
      ) : null}

      {/* Input */}
      <input
        id={inputId}
        className="w-full bg-transparent py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400"
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={descId}
        value={value}
        {...props}
      />

      {/* Clear button (for search inputs) */}
      {onClear && hasValue ? (
        <button
          type="button"
          onClick={onClear}
          className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-slate-500 transition hover:bg-slate-300 hover:text-slate-700"
          aria-label="Clear input"
          tabIndex={-1}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </button>
      ) : null}

      {/* Right icon */}
      {rightIcon && !onClear ? (
        <span className="shrink-0 text-slate-400" aria-hidden="true">
          {rightIcon}
        </span>
      ) : null}
    </div>
  );

  if (!label) return field;

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={inputId}
        className={`block text-sm font-medium text-slate-700 ${labelClassName}`}
      >
        {label}
      </label>

      {field}

      {/* Hint / Error */}
      {hint && !error ? (
        <p id={descId} className="text-xs leading-5 text-slate-400">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={descId} className="flex items-center gap-1.5 text-xs font-medium text-red-500">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {error}
        </p>
      ) : null}
    </div>
  );
};

export default Input;
