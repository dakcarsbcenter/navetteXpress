"use client";

import type { ReactNode } from "react";
import { m } from "framer-motion";
import { DISTANCE, DURATION, EASE, VIEWPORT } from "./variants";

type Tag = "div" | "section" | "li" | "article" | "header";

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Décalage en secondes, pour enchaîner deux blocs voisins. */
  delay?: number;
  as?: Tag;
}

// Fondu + légère montée quand le bloc entre dans l'écran. Petit wrapper client
// pour pouvoir animer depuis des composants serveur (ex. HomeClient).
// À ne pas utiliser sur le hero : il doit rester visible dès le premier rendu
// (LCP) et s'anime en CSS.
export function Reveal({ children, className, delay = 0, as = "div" }: RevealProps) {
  const Component = m[as] as typeof m.div;
  return (
    <Component
      className={className}
      initial={{ opacity: 0, y: DISTANCE }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={VIEWPORT}
      transition={{ duration: DURATION.slow, ease: EASE, delay }}
    >
      {children}
    </Component>
  );
}
