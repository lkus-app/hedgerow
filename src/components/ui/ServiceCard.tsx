"use client";

import React from "react";
import { motion } from "framer-motion";

interface ServiceCardProps {
  title: string;
  description: string;
  badge?: string;
  isOutline?: boolean;
  onClick?: () => void;
  className?: string;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  title,
  description,
  badge,
  isOutline = false,
  onClick,
  className = "",
}) => {
  if (isOutline) {
    return (
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        onClick={onClick}
        className={`group relative flex flex-col justify-between p-6 sm:p-7 min-h-[290px] sm:min-h-[315px] rounded-card border-[4px] border-lavender bg-transparent cursor-pointer transition-shadow shadow-soft hover:shadow-lift ${className}`}
      >
        <div>
          {badge && (
            <span className="inline-block bg-lavender text-navy text-xs font-bold px-2.5 py-1 rounded-tag mb-4 uppercase tracking-wider">
              {badge}
            </span>
          )}
          <h3 className="font-sans font-extrabold text-[24px] sm:text-[26px] leading-tight text-white mb-3">
            {title}
          </h3>
          <p className="font-sans font-normal text-[15px] sm:text-[16px] text-white/90 leading-relaxed">
            {description}
          </p>
        </div>
        <div className="flex justify-end pt-4">
          <span className="font-sans font-bold text-3xl sm:text-4xl text-white transform transition-transform duration-200 group-hover:translate-x-1.5 select-none">
            ›
          </span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      onClick={onClick}
      className={`group relative flex flex-col justify-between p-6 sm:p-7 min-h-[290px] sm:min-h-[315px] rounded-card bg-lavender cursor-pointer transition-shadow shadow-soft hover:shadow-lift ${className}`}
    >
      <div>
        {badge && (
          <span className="inline-block bg-sky/20 text-navy text-xs font-bold px-2.5 py-1 rounded-tag mb-3 uppercase tracking-wider">
            {badge}
          </span>
        )}
        <h3 className="font-sans font-extrabold text-[24px] sm:text-[26px] leading-tight text-navy mb-3">
          {title}
        </h3>
        <p className="font-sans font-normal text-[15px] sm:text-[16px] text-charcoal leading-relaxed">
          {description}
        </p>
      </div>
      <div className="flex justify-end pt-4">
        <span className="font-sans font-bold text-3xl sm:text-4xl text-navy transform transition-transform duration-200 group-hover:translate-x-1.5 select-none">
          ›
        </span>
      </div>
    </motion.div>
  );
};
