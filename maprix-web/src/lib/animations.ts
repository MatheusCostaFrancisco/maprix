import type { Variants } from 'framer-motion';

// Curva expo-out custom — rápida no início, desacelera elegante no fim.
// Usada como `ease` em qualquer transition.
export const EXPO_OUT = [0.16, 1, 0.3, 1] as const;

/** Fade + leve subida — entrada de card, seção, empty state. */
export const fadeUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25, ease: EXPO_OUT },
} as const;

/** Container que escalona entrada dos filhos. */
export const staggerContainer: Variants = {
  animate: { transition: { staggerChildren: 0.04 } },
};

/** Item usado com staggerContainer. */
export const staggerItem: Variants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2, ease: EXPO_OUT } },
};

/** Entrada/saída de modal/dialog. */
export const modal = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.96 },
  transition: { duration: 0.18, ease: 'easeOut' },
} as const;
