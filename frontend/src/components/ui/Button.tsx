import React from 'react';
import { motion } from 'framer-motion';
import { buttonHoverTap } from '../../animations/motionVariants';
import '../../styles/components.css';

type Variant = 'primary' | 'ghost' | 'outline' | 'pill' | 'gradient' | 'success' | 'danger';
type Size = 'xs' | 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const sizeMap: Record<Size, { height: string; px: string; text: string; spinner: string }> = {
  xs: { height: '28px', px: 'px-3',   text: 'text-xs',      spinner: 'spinner-sm' },
  sm: { height: '34px', px: 'px-4',   text: 'text-xs',      spinner: 'spinner-sm' },
  md: { height: '40px', px: 'px-5',   text: 'text-sm',      spinner: '' },
  lg: { height: '48px', px: 'px-6',   text: 'text-sm',      spinner: 'spinner-lg' }
};

const variantClass: Record<Variant, string> = {
  primary:  'btn btn-primary',
  ghost:    'btn btn-ghost',
  outline:  'btn btn-outline',
  pill:     'btn btn-pill',
  gradient: 'btn btn-gradient',
  success:  'btn btn-success',
  danger:   'btn btn-danger'
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  children,
  disabled,
  className = '',
  ...rest
}) => {
  const isDisabled = disabled || loading;
  const { height, px, text, spinner } = sizeMap[size];

  return (
    <motion.button
      className={`
        ${variantClass[variant]}
        ${px} ${text}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      style={{ height }}
      whileHover={isDisabled ? undefined : 'hover'}
      whileTap={isDisabled ? undefined : 'tap'}
      variants={buttonHoverTap}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <span className={`spinner ${spinner} spinner-white`} aria-hidden="true" />
          <span className="opacity-80">{children}</span>
        </span>
      ) : (
        <span className="inline-flex items-center gap-2">
          {leftIcon ? <span className="shrink-0" aria-hidden="true">{leftIcon}</span> : null}
          {children}
          {rightIcon ? <span className="shrink-0" aria-hidden="true">{rightIcon}</span> : null}
        </span>
      )}
    </motion.button>
  );
};

export default Button;
