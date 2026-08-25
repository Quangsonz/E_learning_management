import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', error, icon, ...props }, ref) => {
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
            className={`w-full h-12 px-4 ${icon ? 'pl-11' : ''} bg-white dark:bg-[#18181B] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-300 dark:border-white/20 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all ${className}`}
            {...props}
          />
        </div>
        {error && <p className="mt-1.5 text-xs text-rose-500 font-medium ml-1">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
