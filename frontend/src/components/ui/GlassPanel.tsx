import React from 'react';
import { motion, MotionProps } from 'framer-motion';
import { fadeUp } from '../../animations/motionVariants';

type GlassPanelProps = React.HTMLAttributes<HTMLDivElement> & {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  dark?: boolean;
  variant?: 'default' | 'sm' | 'dark';
  motionProps?: MotionProps;
};

const paddingMap = {
  none: '',
  sm: 'p-4 sm:p-5',
  md: 'p-5 sm:p-6',
  lg: 'p-6 sm:p-8'
};

const MotionDiv = motion.div as unknown as React.FC<
  React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement> & MotionProps>
>;

export const GlassPanel: React.FC<GlassPanelProps> = ({
  padding = 'md',
  hover = false,
  dark = false,
  variant,
  className = '',
  children,
  motionProps,
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
    <MotionDiv
      className={`${variantClass} ${paddingMap[padding]} ${hoverClass} ${className}`}
      variants={fadeUp}
      initial="initial"
      animate="animate"
      {...motionProps}
      {...rest}
    >
      {children}
    </MotionDiv>
  );
};

export default GlassPanel;
