import { Variants } from 'framer-motion';

const spring = {
  type: 'spring',
  stiffness: 400,
  damping: 30,
  mass: 0.8
};

const bounceSpring = {
  type: 'spring',
  stiffness: 450,
  damping: 25,
  mass: 1
};

export const fadeUp: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: spring },
  exit: { opacity: 0, y: -8, transition: { duration: 0.22 } }
};

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: spring },
  exit: { opacity: 0, transition: { duration: 0.2 } }
};

export const buttonHoverTap: Variants = {
  hover: { scale: 1.03, y: -2, transition: bounceSpring },
  tap: { scale: 0.96, transition: bounceSpring }
};

export const modalVariants: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1, transition: bounceSpring },
  exit: { opacity: 0, scale: 0.98, transition: { duration: 0.24 } }
};

export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: { staggerChildren: 0.08, delayChildren: 0.04 }
  }
};

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: spring }
};

export const floatY = (distance = 8, duration = 5.5) => ({
  y: [0, -distance, 0],
  transition: { duration, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' as const }
});

export const pageEnter: Variants = {
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.15, ease: 'easeOut' } },
  exit: { opacity: 0, y: -4, transition: { duration: 0.1 } }
};
