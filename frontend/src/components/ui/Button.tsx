import React from 'react';
import { motion } from 'framer-motion';
import { buttonHoverTap } from '../../animations/motionVariants';
import '../../styles/components.css';

type Variant = 'primary' | 'ghost' | 'outline';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const sizeMap: Record<Size, string> = {
  sm: '32px',
  md: '40px',
  lg: '48px'
};

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', size = 'md', children, ...rest }) => {
  const className = `btn ${variant === 'primary' ? 'btn-primary' : variant === 'ghost' ? 'btn-ghost' : 'btn-ghost'}`;
  return (
    <motion.button
      className={className}
      style={{ height: sizeMap[size] }}
      whileHover="hover"
      whileTap="tap"
      variants={buttonHoverTap}
      {...rest}
    >
      {children}
    </motion.button>
  );
};

export default Button;
