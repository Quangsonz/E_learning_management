import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { fadeUp } from '../../animations/motionVariants';

type GlassPanelProps = HTMLMotionProps<'div'> & {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  dark?: boolean;
  variant?: 'default' | 'sm' | 'dark';
};

const paddingMap = {
  none: '',
  sm: 'p-4 sm:p-5',
  md: 'p-5 sm:p-6',
  lg: 'p-6 sm:p-8'
};

export const GlassPanel: React.FC<GlassPanelProps> = ({
  padding = 'md',
  hover = false,
  dark = false,
  variant,
  className = '',
  children,
  ...rest
}) => {
  const actualVariant = variant || (dark ? 'dark' : 'default');

  const variantClass = {
    default: 'glass-panel',
    sm: 'glass-panel-sm',
    dark: 'glass-panel-dark text-white'
  }[actualVariant];

  const hoverClass = hover
    ? 'transition duration-sm ease-standard hover:-translate-y-1 hover:shadow-elev-3'
    : '';

  return (
    <motion.div
      className={`${variantClass} ${paddingMap[padding]} ${hoverClass} ${className}`}
      variants={fadeUp}
      initial="initial"
      animate="animate"
      {...rest}
    >
      {children}
    </motion.div>
  );
};

export default GlassPanel;
