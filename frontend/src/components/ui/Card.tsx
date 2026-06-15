import React from 'react';
import { motion } from 'framer-motion';
import { fadeUp } from '../../animations/motionVariants';
import '../../styles/components.css';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
}

export const Card: React.FC<CardProps> = ({ interactive = false, children, ...rest }) => {
  const className = `card ${interactive ? 'interactive' : ''}`;
  return (
    <motion.div className={className} variants={fadeUp} initial="initial" animate="animate" {...rest}>
      {children}
    </motion.div>
  );
};

export default Card;
