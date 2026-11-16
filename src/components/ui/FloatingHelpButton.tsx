"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FloatingHelpButtonProps {
  onOpenApp?: () => void;
}

export const FloatingHelpButton: React.FC<FloatingHelpButtonProps> = ({
  onOpenApp,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 15 }}
            className="absolute bottom-20 right-0 w-[300px] bg-white rounded-card p-5 shadow-lift border-2 border-lavender text-navy"
          >
            <div className="flex items-center justify-between pb-3 border-b border-lavender">
              <span className="font-display font-extrabold text-sm text-navy flex items-center gap-1.5">
                <span>🌲</span> Friar Assistant
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="text-xs font-bold text-charcoal/60 hover:text-coral"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-charcoal/80 my-3 leading-relaxed">
              Hey Outlaw! We are live on <strong>Robinhood Chain (L2 4663)</strong>.
              Ready to sweep off-hours short borrow rates or stake in the first-ever <code>$WEALD</code> vault?
            </p>
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenApp?.();
              }}
              className="w-full bg-coral text-white font-sans font-bold text-xs py-2.5 rounded-tag hover:brightness-95 transition-all text-center block lowercase shadow-sm"
            >
              launch ambush vault ›
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Help & Assistant"
        className="w-[64px] h-[64px] bg-sky hover:bg-sky/90 rounded-tile flex items-center justify-center text-3xl shadow-soft hover:shadow-lift transition-all duration-300 group hover:animate-wiggle cursor-pointer select-none border-2 border-white/60"
      >
        <span className="transform transition-transform group-hover:scale-110">☝️</span>
      </button>
    </div>
  );
};
