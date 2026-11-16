"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";

export const BentoMosaic: React.FC = () => {
  const [copiedChain, setCopiedChain] = useState(false);

  const handleCopyChainId = () => {
    navigator.clipboard.writeText("4663");
    setCopiedChain(true);
    setTimeout(() => setCopiedChain(false), 2000);
  };

  return (
    <div className="w-full h-full min-h-[480px] lg:min-h-[620px] grid grid-cols-2 md:grid-cols-3 grid-rows-3 gap-1 p-1 bg-surface rounded-panel shadow-soft border-2 border-lavender/80 overflow-hidden select-none">
      {/* TILE 1: Sky Tile (Chain ID & L2 Status) */}
      <motion.div
        whileHover={{ scale: 0.99 }}
        onClick={handleCopyChainId}
        className="col-span-1 row-span-1 bg-sky p-4 sm:p-5 flex flex-col justify-between cursor-pointer rounded-tile group relative overflow-hidden text-navy"
      >
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs font-black uppercase bg-navy text-white px-2 py-0.5 rounded-tag">
            Chain ID 4663
          </span>
          <span className="text-xl group-hover:rotate-12 transition-transform">⚡</span>
        </div>
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-navy/70">
            Robinhood Chain L2
          </div>
          <div className="font-display font-extrabold text-2xl sm:text-3xl text-navy leading-none mt-1">
            0.0001 ETH
          </div>
          <div className="text-[11px] font-sans text-navy/80 mt-1 font-medium">
            {copiedChain ? "✓ Copied Chain ID!" : "click to copy RPC details ›"}
          </div>
        </div>
      </motion.div>

      {/* TILE 2: Coral Tile (The Outlaw Baker Mascot) */}
      <motion.div
        whileHover={{ scale: 0.99 }}
        className="col-span-1 md:col-span-2 row-span-1 bg-coral p-4 sm:p-6 flex items-center justify-between rounded-tile text-white relative overflow-hidden group"
      >
        <div className="relative z-10 max-w-[65%]">
          <span className="text-xs font-mono font-bold uppercase bg-white/20 px-2 py-0.5 rounded-tag mb-2 inline-block">
            Mascot of the Greenwood
          </span>
          <h4 className="font-display font-black text-xl sm:text-2xl lg:text-3xl leading-tight">
            Meet Friar Tuck &amp; The Doughboy
          </h4>
          <p className="font-sans text-xs sm:text-sm text-white/90 mt-1">
            ambushing overleveraged 13F short positions while TradFi sleeps.
          </p>
        </div>

        {/* Playful Animated Pastry Archer */}
        <div className="relative z-10 text-5xl sm:text-6xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
          🥐🏹
        </div>

        {/* Shimmer background */}
        <div className="absolute inset-0 bg-gradient-to-tr from-black/10 via-transparent to-white/10 pointer-events-none" />
      </motion.div>

      {/* TILE 3: Butter Tile (Short-Interest Radar) */}
      <motion.div
        whileHover={{ scale: 0.99 }}
        className="col-span-1 row-span-2 bg-butter p-4 sm:p-5 flex flex-col justify-between rounded-tile text-navy relative overflow-hidden"
      >
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-black uppercase tracking-wider bg-navy text-white px-2 py-0.5 rounded-tag">
              Radar
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-coral animate-ping" />
          </div>
          <h5 className="font-sans font-extrabold text-lg sm:text-xl text-navy">
            128-Hour Dark Market
          </h5>
          <p className="text-xs text-charcoal mt-1">
            NYSE is closed. Robinhood Chain is wide open.
          </p>
        </div>

        {/* Live ticker simulation */}
        <div className="space-y-2 my-2">
          <div className="bg-white/80 rounded-tag p-2 flex items-center justify-between text-xs">
            <span className="font-bold font-mono">$GME-RWA</span>
            <span className="text-coral font-extrabold font-mono">+24.8%</span>
          </div>
          <div className="bg-white/80 rounded-tag p-2 flex items-center justify-between text-xs">
            <span className="font-bold font-mono">$TSLA-RWA</span>
            <span className="text-navy font-extrabold font-mono">+11.2%</span>
          </div>
          <div className="bg-white/80 rounded-tag p-2 flex items-center justify-between text-xs">
            <span className="font-bold font-mono">$NVDA-RWA</span>
            <span className="text-coral font-extrabold font-mono">+19.4%</span>
          </div>
        </div>

        <div className="text-[11px] font-mono font-bold text-navy/70 text-center bg-navy/10 py-1 rounded-tag">
          Next Ambush: 04:00 PM EST
        </div>
      </motion.div>

      {/* TILE 4: Navy Tile (Reverse-PFOF Engine) */}
      <motion.div
        whileHover={{ scale: 0.99 }}
        className="col-span-1 md:col-span-1 row-span-1 bg-navy p-4 sm:p-5 flex flex-col justify-between rounded-tile text-white relative overflow-hidden"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-pink uppercase bg-white/10 px-2 py-0.5 rounded-tag">
            Reverse PFOF
          </span>
          <span className="text-2xl animate-bounce">🪙</span>
        </div>
        <div>
          <div className="text-xs text-white/70">MEV Recycled to Retail</div>
          <div className="font-display font-black text-2xl sm:text-3xl text-butter">
            $4,892,104
          </div>
          <div className="text-[11px] text-pink font-semibold mt-0.5">
            zero cuts to Wall Street brokers
          </div>
        </div>
      </motion.div>

      {/* TILE 5: Blush Tile (The $WEALD OG Token) */}
      <motion.div
        whileHover={{ scale: 0.99 }}
        className="col-span-1 md:col-span-1 row-span-1 bg-blush p-4 sm:p-5 flex flex-col justify-between rounded-tile text-navy relative overflow-hidden"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-black uppercase text-coral bg-white px-2 py-0.5 rounded-tag shadow-sm">
            OG Asset
          </span>
          <span className="text-xl">👑</span>
        </div>
        <div>
          <div className="font-script text-2xl sm:text-3xl text-coral tracking-wide">
            $WEALD
          </div>
          <div className="text-xs text-charcoal font-medium mt-1">
            Robinhood Chain Native • First Mover Epoch 0
          </div>
        </div>
      </motion.div>

      {/* TILE 6: Lavender Tile (Fresh Baked Banner) */}
      <motion.div
        whileHover={{ scale: 0.99 }}
        className="col-span-2 row-span-1 bg-lavender p-4 sm:p-5 flex items-center justify-between rounded-tile text-navy relative overflow-hidden"
      >
        <div>
          <div className="text-xs font-bold uppercase text-coral tracking-wider font-mono">
            ★ BAKED FRESH EVERY BLOCK
          </div>
          <div className="font-display font-extrabold text-lg sm:text-2xl text-navy">
            Asymmetric Alpha. Zero Hedge-Fund Fees.
          </div>
          <p className="text-xs text-charcoal/80 mt-1">
            Arbitrum Orbit settlement + Ethereum Blob DA security.
          </p>
        </div>
        <div className="text-4xl sm:text-5xl animate-wiggle">
          🥧✨
        </div>
      </motion.div>
    </div>
  );
};
