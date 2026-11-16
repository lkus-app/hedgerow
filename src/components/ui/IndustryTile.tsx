"use client";

import React from "react";
import { motion } from "framer-motion";

interface IndustryTileProps {
  label: string;
  count?: string;
  onClick?: () => void;
}

export const IndustryTile: React.FC<IndustryTileProps> = ({
  label,
  count,
  onClick,
}) => {
  return (
    <motion.button
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      onClick={onClick}
      className="group w-full h-[75px] bg-lavender hover:bg-sky text-sky hover:text-white rounded-tile px-6 flex items-center justify-between transition-colors duration-300 ease-out shadow-soft hover:shadow-lift cursor-pointer select-none"
    >
      <div className="flex items-center gap-3">
        <span className="font-sans font-bold text-[18px] sm:text-[20px] transition-colors duration-300">
          {label}
        </span>
        {count && (
          <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-white/70 text-navy group-hover:bg-white group-hover:text-sky transition-colors">
            {count}
          </span>
        )}
      </div>

      <span className="font-sans font-bold text-2xl transition-transform duration-200 ease-out group-hover:translate-x-1.5">
        ⟶
      </span>
    </motion.button>
  );
};
