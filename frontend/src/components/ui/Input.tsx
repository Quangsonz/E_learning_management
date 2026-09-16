import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  icon?: React.ReactNode;
  onClear?: () => void;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', error, icon, onClear, value, ...props }, ref) => {
    const hasValue = value !== undefined && value !== null && String(value).length > 0;
    return (
      <div className="w-full">
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-4 text-slate-400 pointer-events-none flex items-center justify-center">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            {...(value !== undefined ? { value } : {})}
            className={`w-full h-12 px-4 ${icon ? 'pl-11' : ''} ${onClear && hasValue ? 'pr-10' : ''} [&::-webkit-search-cancel-button]:appearance-none bg-white dark:bg-[#18181B] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-300 dark:border-white/20 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all ${className}`}
            {...props}
          />
          {onClear && hasValue && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClear();
              }}
              className="absolute right-3.5 p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors focus:outline-none cursor-pointer"
              aria-label="Clear input"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          )}
        </div>
        {error && <p className="mt-1.5 text-xs text-rose-500 font-medium ml-1">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
