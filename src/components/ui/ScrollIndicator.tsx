"use client";

import React, { useEffect, useState } from "react";
import { motion, useScroll, useSpring } from "framer-motion";

export const ScrollIndicator: React.FC = () => {
  const { scrollYProgress } = useScroll();
  const scaleY = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  const [topPercent, setTopPercent] = useState(0);

  useEffect(() => {
    return scrollYProgress.on("change", (latest) => {
      // Map 0 -> 1 to percentage along viewport height (excluding 40px top/bottom margin)
      setTopPercent(latest * 85);
    });
  }, [scrollYProgress]);

  return (
    <div className="fixed right-2 top-0 bottom-0 w-[6px] z-40 pointer-events-none hidden md:block">
      <motion.div
        className="w-[6px] h-[36px] bg-coral rounded-full shadow-sm"
        style={{
          position: "absolute",
          top: `calc(5% + ${topPercent}%)`,
          right: 0,
        }}
      />
    </div>
  );
};
