import { Variants } from 'framer-motion';

export const fadeUp: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.4, 0, 0.2, 1] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.22 } }
};

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.28, ease: [0.4, 0, 0.2, 1] } },
  exit: { opacity: 0, transition: { duration: 0.2 } }
};

export const buttonHoverTap: Variants = {
  hover: { scale: 1.02, y: -1, transition: { duration: 0.12 } },
  tap: { scale: 0.98, transition: { duration: 0.08 } }
};

export const modalVariants: Variants = {
  initial: { opacity: 0, scale: 0.98 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.32, ease: [0.4, 0, 0.2, 1] } },
  exit: { opacity: 0, scale: 0.98, transition: { duration: 0.24 } }
};

export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: { staggerChildren: 0.08, delayChildren: 0.04 }
  }
};

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.4, 0, 0.2, 1] } }
};

export const floatY = (distance = 6, duration = 5.5) => ({
  y: [0, -distance, 0],
  transition: { duration, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' as const }
});

export const pageEnter: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.24 } }
};
