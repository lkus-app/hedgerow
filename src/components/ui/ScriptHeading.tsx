"use client";

import React from "react";
import { motion } from "framer-motion";

interface ScriptHeadingProps {
  lines: string[];
  color?: "sky" | "navy" | "coral" | "white" | "pink";
  className?: string;
  size?: "normal" | "large";
}

export const ScriptHeading: React.FC<ScriptHeadingProps> = ({
  lines,
  color = "sky",
  className = "",
  size = "normal",
}) => {
  const colorMap = {
    sky: "text-sky",
    navy: "text-navy",
    coral: "text-coral",
    white: "text-white",
    pink: "text-pink",
  };

  const sizeMap = {
    normal: "text-[38px] sm:text-[54px] md:text-[68px] lg:text-[76px]",
    large: "text-[46px] sm:text-[64px] md:text-[84px] lg:text-[98px]",
  };

  return (
    <div className={`font-script uppercase leading-[0.95] tracking-wide select-none ${colorMap[color]} ${className}`}>
      {lines.map((line, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 24, rotate: -1.5 }}
          whileInView={{ opacity: 1, y: 0, rotate: -0.5 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{
            duration: 0.5,
            delay: index * 0.12,
            ease: [0, 0, 0.2, 1],
          }}
          className={`${sizeMap[size]} block transform-gpu`}
        >
          {line}
        </motion.div>
      ))}
    </div>
  );
};
