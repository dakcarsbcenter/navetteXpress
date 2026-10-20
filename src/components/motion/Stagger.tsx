"use client";

import type { ReactNode } from "react";
import { m } from "framer-motion";
import { VIEWPORT, fadeUp, staggerContainer } from "./variants";

interface StaggerProps {
  children: ReactNode;
  className?: string;
}

// Conteneur : déclenche l'apparition échelonnée de ses <StaggerItem> quand il
// entre dans l'écran.
export function Stagger({ children, className }: StaggerProps) {
  return (
    <m.div
      className={className}
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
    >
      {children}
    </m.div>
  );
}

export function StaggerItem({ children, className }: StaggerProps) {
  return (
    <m.div className={className} variants={fadeUp}>
      {children}
    </m.div>
  );
}
