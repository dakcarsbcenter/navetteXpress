import type { Variants } from "framer-motion";

// Source unique des valeurs d'animation du site public : toute page ou tout
// composant qui anime quelque chose reprend ces constantes plutôt que de
// redéfinir ses propres durées et distances.

export const EASE = [0.22, 1, 0.36, 1] as const;

export const DURATION = {
  fast: 0.2,
  base: 0.4,
  slow: 0.6,
} as const;

export const DISTANCE = 16;
export const STAGGER = 0.08;

// `once` : l'animation ne rejoue pas quand on remonte la page.
// La marge négative déclenche un peu après l'entrée dans l'écran, pour que
// l'effet soit vu et non consommé hors champ.
export const VIEWPORT = { once: true, margin: "-80px" } as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: DISTANCE },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.slow, ease: EASE },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: DURATION.base, ease: EASE } },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: STAGGER } },
};
