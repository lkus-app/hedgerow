"use client";

import React from "react";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";

export const ScrollIndicator: React.FC = () => {
  const { scrollYProgress } = useScroll();
  // Spring-smoothed progress drives the pill directly as a motion value,
  // so scrolling no longer triggers a React re-render on every frame.
  const smooth = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });
  const top = useTransform(smooth, (v) => `calc(5% + ${v * 85}%)`);

  return (
    <div className="fixed right-2 top-0 bottom-0 w-[6px] z-40 pointer-events-none hidden md:block">
      <motion.div className="absolute right-0 w-[6px] h-[36px] bg-coral rounded-full shadow-sm" style={{ top }} />
    </div>
  );
};
