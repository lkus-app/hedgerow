"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { formatUnits, parseAbi, type Address } from "viem";
import { CadIcon } from "./CadIcon";
import { targetChain } from "@/lib/chain";
import { publicClient } from "@/lib/useWallet";

// Chainlink standard proxies on Robinhood Chain mainnet (docs.chain.link, Robinhood tokenized equities).
const MAINNET_FEEDS: { ticker: string; feed: Address }[] = [
  { ticker: "NVDA", feed: "0x379EC4f7C378F34a1B47E4F3cbeBCbAC3E8E9F15" },
  { ticker: "TSLA", feed: "0x4A1166a659A55625345e9515b32adECea5547C38" },
  { ticker: "GME", feed: "0x27C71df6A64fB476468EdF256CF72c038baB5B67" },
];
const feedAbi = parseAbi([
  "function decimals() view returns (uint8)",
  "function latestRoundData() view returns (uint80,int256,uint256,uint256,uint80)",
]);

/** Live Chainlink prices on mainnet; null when not on mainnet or the read fails. */
function useLivePrices() {
  const [prices, setPrices] = useState<Record<string, number | null>>({});
  useEffect(() => {
    if (targetChain.id !== 4663) return;
    let cancelled = false;
    Promise.all(
      MAINNET_FEEDS.map(async ({ ticker, feed }) => {
        try {
          const [dec, round] = await Promise.all([
            publicClient.readContract({ address: feed, abi: feedAbi, functionName: "decimals" }),
            publicClient.readContract({ address: feed, abi: feedAbi, functionName: "latestRoundData" }),
          ]);
          return [ticker, Number(formatUnits(round[1], dec))] as const;
        } catch {
          return [ticker, null] as const;
        }
      })
    ).then((rows) => !cancelled && setPrices(Object.fromEntries(rows)));
    return () => {
      cancelled = true;
    };
  }, []);
  return prices;
}

export const BentoMosaic: React.FC = () => {
  const [copiedChain, setCopiedChain] = useState(false);
  const prices = useLivePrices();

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
          <CadIcon name="gas" size="sm" blueprintBg className="group-hover:rotate-6 transition-transform" />
        </div>
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-navy/70">
            Robinhood Chain L2
          </div>
          <div className="font-display font-extrabold text-2xl sm:text-3xl text-navy leading-none mt-1">
            Arbitrum Orbit
          </div>
          <div className="text-[11px] font-sans text-navy/80 mt-1 font-medium">
            {copiedChain ? "✓ Copied Chain ID!" : "click to copy the chain ID ›"}
          </div>
        </div>
      </motion.div>

      {/* TILE 2: Coral Tile (The Outlaw Baker Mascot & 3D CAD Icon) */}
      <motion.div
        whileHover={{ scale: 0.99 }}
        className="col-span-1 md:col-span-2 row-span-1 bg-coral p-4 sm:p-5 flex items-center justify-between rounded-tile text-white relative overflow-hidden group"
      >
        <div className="relative z-10 max-w-[60%]">
          <span className="text-[10px] sm:text-xs font-mono font-bold uppercase bg-white/20 px-2 py-0.5 rounded-tag mb-1.5 inline-block">
            3D CAD Prototype · v1.0
          </span>
          <h4 className="font-display font-black text-lg sm:text-2xl lg:text-3xl leading-tight">
            The Greenwood Compound Bow
          </h4>
          <p className="font-sans text-xs sm:text-sm text-white/90 mt-1 line-clamp-2">
            engineered golden mechanical croissant with CNC dual-cams and chamfered titanium limbs.
          </p>
        </div>

        {/* 3D CAD Render Thumbnail */}
        <div className="relative z-10 w-24 h-24 sm:w-28 sm:h-28 rounded-card overflow-hidden shadow-lift border-2 border-white/60 group-hover:scale-105 group-hover:rotate-3 transition-all duration-300 flex-shrink-0 bg-navy">
          <img
            src="/hedgerow-3d-cad-icon.jpg"
            alt="Hedgerow 3D CAD Compound Bow & Croissant Emblem"
            className="w-full h-full object-cover"
          />
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
            <CadIcon name="gauge" size="xs" blueprintBg />
          </div>
          <h5 className="font-sans font-extrabold text-lg sm:text-xl text-navy">
            When Wall Street Sleeps
          </h5>
          <p className="text-xs text-charcoal mt-1">
            NYSE closes. Robinhood stock tokens keep trading on-chain.
          </p>
        </div>

        {/* Live Chainlink prices (mainnet only) */}
        <div className="space-y-2 my-2">
          {MAINNET_FEEDS.map(({ ticker }) => (
            <div key={ticker} className="bg-white/80 rounded-tag p-2 flex items-center justify-between text-xs">
              <span className="font-bold font-mono">${ticker}</span>
              <span className="text-navy font-extrabold font-mono">
                {prices[ticker] != null ? `$${prices[ticker]!.toFixed(2)}` : "—"}
              </span>
            </div>
          ))}
        </div>

        <div className="text-[11px] font-mono font-bold text-navy/70 text-center bg-navy/10 py-1 rounded-tag">
          {targetChain.id === 4663 ? "Chainlink prices · 24/5" : "Live prices on mainnet"}
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
          <CadIcon name="mev" size="sm" blueprintBg className="animate-float" />
        </div>
        <div>
          <div className="text-xs text-white/70">Order-flow payments back to stakers</div>
          <div className="font-display font-black text-2xl sm:text-3xl text-butter">
            In design
          </div>
          <div className="text-[11px] text-pink font-semibold mt-0.5">
            not live yet
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
          <CadIcon name="bow" size="xs" blueprintBg />
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
            No management or performance fees.
          </div>
          <p className="text-xs text-charcoal/80 mt-1">
            Withdraw any time. The basket&apos;s 0.3% deposit fee stays in the vault.
          </p>
        </div>
        <div className="flex-shrink-0 ml-4">
          <CadIcon name="rocket" size="lg" blueprintBg className="animate-float" />
        </div>
      </motion.div>
    </div>
  );
};
