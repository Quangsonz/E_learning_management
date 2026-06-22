import React from 'react';
import { motion } from 'framer-motion';
import { pageEnter } from '../../animations/motionVariants';

type PageShellProps = {
  children: React.ReactNode;
  className?: string;
  animate?: boolean;
};

export const PageShell: React.FC<PageShellProps> = ({ children, className = '', animate = true }) => {
  if (!animate) {
    return (
      <div className={`page-shell ${className}`}>
        <div className="page-container">{children}</div>
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
      <div className="page-container">{children}</div>
    </motion.div>
  );
};

export default PageShell;
