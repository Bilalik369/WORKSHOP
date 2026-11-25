"use client";

import type { ReactNode } from "react";
import { LazyMotion, MotionConfig, domAnimation, m } from "framer-motion";
import { cn } from "@/lib/utils";

/** Charge le moteur d'animation à la demande et respecte prefers-reduced-motion. */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Délai en secondes (pour échelonner plusieurs éléments). */
  delay?: number;
  /** Décalage vertical de départ, en pixels. */
  y?: number;
};

/** Apparition douce (fondu + léger glissement) à l'entrée dans l'écran. */
export function Reveal({ children, className, delay = 0, y = 22 }: RevealProps) {
  return (
    <m.div
      className={cn(className)}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -60px 0px" }}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </m.div>
  );
}
