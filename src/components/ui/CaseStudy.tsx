"use client";

import React from "react";
import { motion } from "framer-motion";
import { Tag } from "./Tag";

export interface CaseStudyItem {
  eyebrow: string;
  title: string;
  description: string;
  tags: string[];
  accentColor: "pink" | "butter" | "coral" | "sky";
  statLabel?: string;
  statValue?: string;
  illustrationType: "squeeze" | "straddle" | "sentinel" | "arbitrage";
}

interface CaseStudyProps {
  item: CaseStudyItem;
  align?: "left" | "right";
  onInteract?: () => void;
}

export const CaseStudy: React.FC<CaseStudyProps> = ({
  item,
  align = "left",
  onInteract,
}) => {
  const isRight = align === "right";

  const colorClasses = {
    pink: "bg-pink",
    butter: "bg-butter",
    coral: "bg-coral",
    sky: "bg-sky",
  };

  return (
    <div
      className={`flex flex-col ${
        isRight ? "lg:flex-row-reverse" : "lg:flex-row"
      } items-center justify-between gap-12 lg:gap-16 py-12 md:py-16`}
    >
      {/* Visual media with offset solid color block */}
      <div className="relative w-full lg:w-[50%] max-w-[540px]">
        {/* Offset background solid color block */}
        <motion.div
          initial={{ opacity: 0, x: isRight ? -40 : 40, y: 30 }}
          whileInView={{ opacity: 1, x: isRight ? -50 : 50, y: 20 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className={`absolute inset-0 rounded-card ${colorClasses[item.accentColor]} z-0 hidden sm:block`}
          style={{
            transform: isRight ? "translate(-50px, 20px)" : "translate(50px, 20px)",
          }}
        />

        {/* Foreground Media / Interactive Graphic Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative z-10 w-full bg-white rounded-card p-6 shadow-soft hover:shadow-lift transition-all border-2 border-lavender/50 overflow-hidden"
        >
          {/* Header pill & status */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-lavender">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-charcoal/70 bg-bg px-2.5 py-1 rounded-tag">
              Robinhood Chain (L2: 4663)
            </span>
            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Epoch
            </span>
          </div>

          {/* Interactive Graphic / Chart Preview */}
          <div className="h-[200px] sm:h-[220px] rounded-tile bg-bg flex flex-col justify-center items-center p-4 relative overflow-hidden group">
            {item.illustrationType === "squeeze" && (
              <div className="w-full flex flex-col items-center justify-center">
                <div className="text-4xl sm:text-5xl mb-2 animate-bounce">🏹 🚀</div>
                <div className="font-display font-extrabold text-navy text-xl sm:text-2xl text-center">
                  +382.4% Gamma Spike
                </div>
                <div className="text-xs text-charcoal/75 mt-1 font-mono">
                  Off-Hours Short Borrow: 142% APR Swept
                </div>
              </div>
            )}
            {item.illustrationType === "straddle" && (
              <div className="w-full flex flex-col items-center justify-center">
                <div className="text-4xl sm:text-5xl mb-2 animate-pulse">🥧 ⚡</div>
                <div className="font-display font-extrabold text-navy text-xl sm:text-2xl text-center">
                  Post-Earnings Straddle
                </div>
                <div className="text-xs text-charcoal/75 mt-1 font-mono">
                  Sunday Midnight Oracle Arbitrage Settled
                </div>
              </div>
            )}
            {item.illustrationType === "sentinel" && (
              <div className="w-full flex flex-col items-center justify-center">
                <div className="text-4xl sm:text-5xl mb-2 animate-float">🤖 🌲</div>
                <div className="font-display font-extrabold text-navy text-xl sm:text-2xl text-center">
                  Friar-1 AI Sentinel
                </div>
                <div className="text-xs text-charcoal/75 mt-1 font-mono">
                  Zero Latency • 100% Reverse-PFOF Recycled
                </div>
              </div>
            )}
            {item.illustrationType === "arbitrage" && (
              <div className="w-full flex flex-col items-center justify-center">
                <div className="text-4xl sm:text-5xl mb-2 animate-spin-around">🪙 🥐</div>
                <div className="font-display font-extrabold text-navy text-xl sm:text-2xl text-center">
                  24/7 RWA Liquidity Ambush
                </div>
                <div className="text-xs text-charcoal/75 mt-1 font-mono">
                  TradFi Gap Captured: +$1.42M MEV Reclaimed
                </div>
              </div>
            )}

            {/* Subtle background grid */}
            <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#005174_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
          </div>

          {/* Stats Bar */}
          {item.statLabel && (
            <div className="mt-4 pt-3 flex items-center justify-between text-sm">
              <span className="font-sans font-medium text-charcoal/75">{item.statLabel}</span>
              <span className="font-display font-bold text-coral text-base">{item.statValue}</span>
            </div>
          )}
        </motion.div>
      </div>

      {/* Copy column */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
        className="w-full lg:w-[45%]"
      >
        <span className="font-sans font-bold text-base text-pink block mb-2 tracking-wide uppercase">
          {item.eyebrow}
        </span>
        <h3 className="font-display font-bold text-[28px] sm:text-[34px] md:text-[36px] text-charcoal leading-[1.15] mb-4">
          {item.title}
        </h3>
        <p className="font-sans font-normal text-[16px] sm:text-[18px] text-charcoal/75 leading-relaxed mb-6">
          {item.description}
        </p>

        <div className="flex flex-wrap gap-2 mb-6">
          {item.tags.map((tag, idx) => (
            <Tag key={idx}>{tag}</Tag>
          ))}
        </div>

        {onInteract && (
          <button
            onClick={onInteract}
            className="inline-flex items-center gap-1.5 text-navy font-sans font-bold text-sm hover:text-coral transition-colors"
          >
            inspect vault contracts <span>↗</span>
          </button>
        )}
      </motion.div>
    </div>
  );
};
