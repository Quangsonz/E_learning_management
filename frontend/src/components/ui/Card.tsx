import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { fadeUp } from '../../animations/motionVariants';
import '../../styles/components.css';

interface CardProps extends HTMLMotionProps<'div'> {
  interactive?: boolean;
}

export const Card: React.FC<CardProps> = ({ interactive = false, children, className = '', ...rest }) => {
  const combinedClass = `card ${interactive ? 'interactive' : ''} ${className}`.trim();
  return (
    <motion.div className={combinedClass} variants={fadeUp} initial="initial" animate="animate" {...rest}>
      {children}
    </motion.div>
  );
};

export default Card;
