"use client";

import type { ReactNode } from "react";
import { LazyMotion, MotionConfig, domAnimation } from "framer-motion";

// LazyMotion charge uniquement les fonctions d'animation de base (tap, hover,
// inView, variants, exit) au lieu de tout framer-motion. Les composants
// `motion.*` existants continuent de fonctionner (mode non strict).
// reducedMotion="user" : si l'utilisateur a demandé moins de mouvement dans son
// système, les déplacements et échelles sont coupés, seuls les fondus restent.
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation}>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
