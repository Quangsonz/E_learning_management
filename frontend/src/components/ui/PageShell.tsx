import React from 'react';
import { motion } from 'framer-motion';
import { pageEnter } from '../../animations/motionVariants';

type PageShellProps = {
  children: React.ReactNode;
  className?: string;
  animate?: boolean;
  wide?: boolean;
};

export const PageShell: React.FC<PageShellProps> = ({
  children,
  className = '',
  animate = true,
  wide = false
}) => {
  const containerClass = wide ? 'page-container page-container-wide' : 'page-container';

  if (!animate) {
    return (
      <div className={`page-shell ${className}`}>
        <div className={containerClass}>{children}</div>
      </div>
    );
  }

  return (
    <motion.div
      className={`page-shell ${className}`}
      variants={pageEnter}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className={containerClass}>{children}</div>
    </motion.div>
  );
};

export default PageShell;
