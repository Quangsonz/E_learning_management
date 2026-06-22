import React, { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

type ToastVariant = 'success' | 'error' | 'info' | 'warning';

type ToastProps = {
  message: string;
  title?: string;
  variant?: ToastVariant;
  visible: boolean;
  onClose?: () => void;
  position?: 'bottom-right' | 'top-right' | 'bottom-center' | 'top-center';
  duration?: number; // ms, 0 = no auto-close
};

const variantConfig: Record<ToastVariant, {
  bg: string;
  border: string;
  icon: React.ReactNode;
  iconBg: string;
}> = {
  success: {
    bg: 'bg-white',
    border: 'border-emerald-200',
    iconBg: 'bg-emerald-500',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  },
  error: {
    bg: 'bg-white',
    border: 'border-red-200',
    iconBg: 'bg-red-500',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    )
  },
  warning: {
    bg: 'bg-white',
    border: 'border-amber-200',
    iconBg: 'bg-amber-500',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M12 9v4m0 4h.01" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  },
  info: {
    bg: 'bg-white',
    border: 'border-primary-200',
    iconBg: 'bg-primary-500',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M12 16v-4m0-4h.01" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
};

const positionClass: Record<string, string> = {
  'top-right':     'fixed right-4 top-4 z-[1100] sm:right-5 sm:top-5',
  'bottom-right':  'fixed bottom-4 right-4 z-[1100] sm:bottom-5 sm:right-5',
  'top-center':    'fixed left-1/2 top-4 z-[1100] -translate-x-1/2 sm:top-5',
  'bottom-center': 'fixed bottom-4 left-1/2 z-[1100] -translate-x-1/2 sm:bottom-5'
};

export const Toast: React.FC<ToastProps> = ({
  message,
  title,
  variant = 'success',
  visible,
  onClose,
  position = 'top-right',
  duration = 4000
}) => {
  const config = variantConfig[variant];
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-close
  useEffect(() => {
    if (visible && duration > 0 && onClose) {
      timerRef.current = setTimeout(onClose, duration);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [visible, duration, onClose]);

  const isTop = position.startsWith('top');

  return (
    <div className={positionClass[position]}>
      <AnimatePresence>
        {visible ? (
          <motion.div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className={`
              w-[min(100vw-2rem,22rem)] rounded-2xl border shadow-[0_16px_48px_rgba(0,0,0,0.12)]
              backdrop-blur-xl overflow-hidden
              ${config.bg} ${config.border}
            `}
            initial={{ opacity: 0, y: isTop ? -16 : 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: isTop ? -10 : 10, scale: 0.97 }}
            transition={{ duration: 0.24, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="flex items-start gap-3 p-4">
              {/* Icon */}
              <span
                className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${config.iconBg} shadow-sm`}
                aria-hidden="true"
              >
                {config.icon}
              </span>

              {/* Content */}
              <div className="min-w-0 flex-1">
                {title ? (
                  <p className="text-sm font-semibold text-slate-900">{title}</p>
                ) : null}
                <p className={`text-sm leading-5 text-slate-600 ${title ? 'mt-1' : 'font-medium text-slate-800'}`}>
                  {message}
                </p>
              </div>

              {/* Close button */}
              {onClose ? (
                <button
                  type="button"
                  onClick={onClose}
                  className="ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                  aria-label="Dismiss notification"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                </button>
              ) : null}
            </div>

            {/* Progress bar (auto-close indicator) */}
            {duration > 0 && onClose ? (
              <motion.div
                className={`h-0.5 w-full origin-left ${config.iconBg} opacity-30`}
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: duration / 1000, ease: 'linear' }}
              />
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

export default Toast;
