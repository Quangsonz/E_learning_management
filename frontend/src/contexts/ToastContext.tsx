import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Toast } from '../components/ui';

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
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

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

  return (
    <ToastContext.Provider value={{ showToast, success, error }}>
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
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};
