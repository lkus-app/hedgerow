"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

interface AmbushModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AmbushModal: React.FC<AmbushModalProps> = ({ isOpen, onClose }) => {
  const [selectedVault, setSelectedVault] = useState("GME");
  const [amount, setAmount] = useState("0.25");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);

  const vaults = [
    { id: "GME", name: "$GME-RWA Sunday Squeeze", apy: "+64.2% APY", risk: "Wild", icon: "🚀" },
    { id: "NVDA", name: "$NVDA-RWA Dark Hours Straddle", apy: "+38.5% APY", risk: "Medium", icon: "⚡" },
    { id: "TSLA", name: "$TSLA-RWA Gamma Ladder", apy: "+48.9% APY", risk: "High", icon: "🔋" },
    { id: "WEALD", name: "$WEALD Genesis Staking (OG)", apy: "+124.0% APY", risk: "OG Safe", icon: "👑" },
  ];

  const handleDeposit = () => {
    setIsDeploying(true);
    setTimeout(() => {
      setIsDeploying(false);
      setIsSuccess(true);
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#38CCFF", "#FF5E64", "#FFA3CC", "#FAD869"],
      });
    }, 1200);
  };

  const reset = () => {
    setIsSuccess(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={reset}
            className="absolute inset-0 bg-navy/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative z-10 w-full max-w-[520px] bg-white rounded-panel p-6 sm:p-8 shadow-lift border-2 border-lavender text-navy overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-lavender">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🥐🏹</span>
                <div>
                  <h3 className="font-display font-extrabold text-xl leading-none text-navy">
                    Hedgerow Vault Ambush
                  </h3>
                  <span className="text-xs font-mono font-bold text-coral">
                    Robinhood Chain L2 • ID 4663
                  </span>
                </div>
              </div>
              <button
                onClick={reset}
                className="w-8 h-8 rounded-full bg-lavender hover:bg-pink/40 text-navy font-bold flex items-center justify-center text-sm transition-colors"
              >
                ✕
              </button>
            </div>

            {isSuccess ? (
              <div className="py-8 text-center">
                <div className="text-6xl mb-4 animate-bounce">🎉</div>
                <h4 className="font-display font-black text-2xl text-navy mb-2">
                  Ambush Order Deployed!
                </h4>
                <p className="font-sans text-sm text-charcoal/80 mb-6 max-w-sm mx-auto">
                  Your deposit of <strong>{amount} ETH</strong> is now active in the{" "}
                  <strong>{vaults.find((v) => v.id === selectedVault)?.name}</strong>.
                  You have been awarded the exclusive <strong>Robinhood Chain OG #0042</strong> badge!
                </p>

                <div className="p-3 bg-lavender rounded-card font-mono text-xs text-navy mb-6 break-all">
                  Tx: 0x4663a89e...f018b2c4 (Arbitrum Orbit Finalized)
                </div>

                <button
                  onClick={reset}
                  className="w-full bg-coral hover:brightness-95 text-white font-sans font-bold py-3.5 rounded-tag text-lg lowercase shadow-soft transition-all"
                >
                  sweet! back to the greenwood ›
                </button>
              </div>
            ) : (
              <div className="pt-4 space-y-5">
                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-charcoal/70 mb-2">
                    1. Select Target Vault
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {vaults.map((vault) => (
                      <button
                        key={vault.id}
                        type="button"
                        onClick={() => setSelectedVault(vault.id)}
                        className={`p-3 rounded-tile text-left border-2 transition-all flex flex-col justify-between ${
                          selectedVault === vault.id
                            ? "bg-sky/20 border-sky shadow-sm"
                            : "bg-lavender/40 border-lavender hover:border-pink"
                        }`}
                      >
                        <div className="flex items-center justify-between text-base">
                          <span>{vault.icon}</span>
                          <span className="text-xs font-mono font-extrabold text-coral">
                            {vault.apy}
                          </span>
                        </div>
                        <div className="font-sans font-bold text-xs text-navy mt-1 truncate">
                          {vault.name}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-mono font-bold uppercase text-charcoal/70">
                      2. Stake Amount (ETH)
                    </label>
                    <span className="text-xs text-charcoal/60 font-sans">
                      Balance: 4.82 ETH (Robinhood L2)
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.05"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-bg border-2 border-lavender focus:border-sky rounded-tile px-4 py-3 font-mono font-bold text-lg text-navy outline-none transition-colors"
                      placeholder="0.00"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                      {["0.1", "0.5", "1.0"].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setAmount(preset)}
                          className="text-xs font-mono font-bold bg-white text-navy px-2 py-1 rounded-tag hover:bg-sky hover:text-white transition-colors"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Info block */}
                <div className="p-3 bg-blush rounded-tile flex items-start gap-2.5 text-xs text-charcoal">
                  <span className="text-base leading-none">💡</span>
                  <div>
                    <strong className="text-navy">Automated Off-Hours Execution:</strong>{" "}
                    When TradFi short interest spikes on weekend or after-hours prints, the Friar AI
                    sentinel triggers liquidity ambushes with zero PFOF extraction.
                  </div>
                </div>

                {/* Action button */}
                <button
                  type="button"
                  disabled={isDeploying}
                  onClick={handleDeposit}
                  className="w-full bg-coral hover:brightness-95 disabled:opacity-50 text-white font-display font-bold py-3.5 rounded-tag text-lg lowercase shadow-soft hover:shadow-lift transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {isDeploying ? (
                    <>
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>baking ambush on robinhood chain...</span>
                    </>
                  ) : (
                    <span>stake into {selectedVault} vault ›</span>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
