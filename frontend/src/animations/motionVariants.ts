import { Variants } from 'framer-motion';

export const fadeUp: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.4,0,0.2,1] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.22 } }
};

export const buttonHoverTap: Variants = {
  hover: { scale: 1.02, transition: { duration: 0.12 } },
  tap: { scale: 0.98, transition: { duration: 0.08 } }
};

export const modalVariants: Variants = {
  initial: { opacity: 0, scale: 0.98 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.32, ease: [0.4,0,0.2,1] } },
  exit: { opacity: 0, scale: 0.98, transition: { duration: 0.24 } }
};
