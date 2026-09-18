import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import { Toast } from '../components/ui/Toast';

type ToastVariant = 'success' | 'error' | 'info' | 'warning';

interface ToastOptions {
  message: string;
  variant?: ToastVariant;
  title?: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (options: ToastOptions) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
}

const defaultToastContext: ToastContextType = {
  showToast: () => {},
  success: () => {},
  error: () => {},
  info: () => {},
  warning: () => {},
};

const ToastContext = createContext<ToastContextType>(defaultToastContext);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<ToastOptions | null>(null);

  const showToast = useCallback((options: ToastOptions) => {
    setToast(options);
  }, []);

  const success = useCallback((message: string, title?: string) => {
    showToast({ message, variant: 'success', title });
  }, [showToast]);

  const error = useCallback((message: string, title?: string) => {
    showToast({ message, variant: 'error', title });
  }, [showToast]);

  const info = useCallback((message: string, title?: string) => {
    showToast({ message, variant: 'info', title });
  }, [showToast]);

  const warning = useCallback((message: string, title?: string) => {
    showToast({ message, variant: 'warning', title });
  }, [showToast]);

  const value = useMemo(
    () => ({ showToast, success, error, info, warning }),
    [showToast, success, error, info, warning]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toast
        visible={!!toast}
        message={toast?.message || ''}
        title={toast?.title}
        variant={toast?.variant || 'info'}
        duration={toast?.duration || 4000}
        onClose={() => setToast(null)}
        position="top-right"
      />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  return context || defaultToastContext;
};
