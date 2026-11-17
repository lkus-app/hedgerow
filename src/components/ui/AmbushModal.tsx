"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  createPublicClient,
  custom,
  formatEther,
  parseEther,
  parseEventLogs,
  type Hash,
} from "viem";
import { CadIcon, CadIconName } from "./CadIcon";
import { explorerTxUrl, hedgerowVaultAbi, targetChain, vaultAddresses, type VaultId } from "@/lib/chain";
import { publicClient, readableError, useWallet } from "@/lib/useWallet";

interface AmbushModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Vault to preselect each time the modal opens. */
  initialVault?: VaultId;
}

type Step =
  | { kind: "form" }
  | { kind: "confirm" }
  | { kind: "pending"; hash: Hash }
  | { kind: "success"; hash: Hash; shares?: bigint; assets: bigint }
  | { kind: "error"; message: string; hash?: Hash };

const vaults: { id: VaultId; name: string; apy: string; risk: string; cadIcon: CadIconName }[] = [
  { id: "GME", name: "$GME-RWA Sunday Squeeze", apy: "+64.2% APY", risk: "Wild", cadIcon: "rocket" },
  { id: "NVDA", name: "$NVDA-RWA Dark Hours Straddle", apy: "+38.5% APY", risk: "Medium", cadIcon: "gauge" },
  { id: "TSLA", name: "$TSLA-RWA Gamma Ladder", apy: "+48.9% APY", risk: "High", cadIcon: "gas" },
  { id: "WEALD", name: "$WEALD Genesis Staking (OG)", apy: "+124.0% APY", risk: "OG Safe", cadIcon: "bow" },
];

const fmt = (wei: bigint, digits = 4) => {
  const n = Number(formatEther(wei));
  return n.toLocaleString(undefined, { maximumFractionDigits: digits });
};
const short = (s: string) => `${s.slice(0, 6)}…${s.slice(-4)}`;

const viewTransition = { duration: 0.22, ease: [0.4, 0, 0.2, 1] as const };
const viewVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

export const AmbushModal: React.FC<AmbushModalProps> = ({ isOpen, onClose, initialVault }) => {
  const wallet = useWallet();
  const [selectedVault, setSelectedVault] = useState<VaultId>("GME");
  const [amount, setAmount] = useState("0.01");
  const [step, setStep] = useState<Step>({ kind: "form" });
  const [balance, setBalance] = useState<bigint>();
  const [position, setPosition] = useState<bigint>();
  const [readError, setReadError] = useState<string>();

  const vaultAddress = vaultAddresses[selectedVault];
  const vaultMeta = vaults.find((v) => v.id === selectedVault)!;
  const busy = step.kind === "confirm" || step.kind === "pending";

  // Prefer the wallet's own RPC for reads once it is on the right chain: it is
  // the connection the user already trusts and works even if the public RPC is unreachable.
  const reader = useMemo(() => {
    if (wallet.isOnTargetChain && typeof window !== "undefined" && window.ethereum) {
      return createPublicClient({ chain: targetChain, transport: custom(window.ethereum) });
    }
    return publicClient;
  }, [wallet.isOnTargetChain]);

  const refresh = useCallback(async () => {
    if (!wallet.account || !wallet.isOnTargetChain) {
      setBalance(undefined);
      setPosition(undefined);
      return;
    }
    try {
      setReadError(undefined);
      setBalance(await reader.getBalance({ address: wallet.account }));
      if (vaultAddress) {
        const shares = await reader.readContract({
          address: vaultAddress,
          abi: hedgerowVaultAbi,
          functionName: "balanceOf",
          args: [wallet.account],
        });
        setPosition(
          shares === 0n
            ? 0n
            : await reader.readContract({
                address: vaultAddress,
                abi: hedgerowVaultAbi,
                functionName: "convertToAssets",
                args: [shares],
              })
        );
      } else {
        setPosition(undefined);
      }
    } catch (e) {
      setReadError(readableError(e));
    }
  }, [reader, wallet.account, wallet.isOnTargetChain, vaultAddress]);

  useEffect(() => {
    if (isOpen && initialVault && !busy) setSelectedVault(initialVault);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialVault]);

  useEffect(() => {
    if (isOpen) refresh();
  }, [isOpen, refresh]);

  // Close on Escape + lock page scroll while open.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && handleClose();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, step.kind]);

  const parsedAmount = useMemo(() => {
    try {
      const v = parseEther(amount.trim() || "0");
      return v > 0n ? v : undefined;
    } catch {
      return undefined;
    }
  }, [amount]);

  const validation = (() => {
    if (!parsedAmount) return "Enter an amount greater than 0.";
    if (balance !== undefined && parsedAmount > balance) return "Amount exceeds your ETH balance.";
    return undefined;
  })();

  const handleDeposit = async () => {
    if (!wallet.walletClient || !wallet.account || !vaultAddress || !parsedAmount) return;
    setStep({ kind: "confirm" });
    let hash: Hash | undefined;
    try {
      // Simulate first so contract reverts surface before the wallet popup.
      const { request } = await reader.simulateContract({
        account: wallet.account,
        address: vaultAddress,
        abi: hedgerowVaultAbi,
        functionName: "deposit",
        args: [parsedAmount, wallet.account],
        value: parsedAmount,
      });
      hash = await wallet.walletClient.writeContract(request);
      setStep({ kind: "pending", hash });

      const receipt = await reader.waitForTransactionReceipt({ hash });
      if (receipt.status !== "success") throw new Error("Transaction reverted on-chain.");

      const [log] = parseEventLogs({ abi: hedgerowVaultAbi, eventName: "Deposit", logs: receipt.logs });
      setStep({ kind: "success", hash, shares: log?.args.shares, assets: parsedAmount });
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#38CCFF", "#FF5E64", "#FFA3CC", "#FAD869"],
        disableForReducedMotion: true,
        zIndex: 60,
      });
      refresh();
    } catch (e) {
      setStep({ kind: "error", message: readableError(e), hash });
    }
  };

  function handleClose() {
    // A pending tx keeps going in the wallet; keep its state so reopening shows progress.
    if (step.kind === "success" || step.kind === "error") setStep({ kind: "form" });
    onClose();
  }

  const txLink = (hash: Hash) => {
    const url = explorerTxUrl(hash);
    return url ? (
      <a href={url} target="_blank" rel="noreferrer" className="underline decoration-2 underline-offset-2 hover:text-coral">
        {short(hash)} ↗
      </a>
    ) : (
      <span>{short(hash)}</span>
    );
  };

  // ---- Action button (connect → switch network → deposit) ----
  const action = (() => {
    if (!wallet.hasProvider)
      return { label: "install a wallet to stake ›", onClick: () => window.open("https://metamask.io/download/", "_blank", "noreferrer"), disabled: false };
    if (!wallet.account)
      return { label: wallet.isConnecting ? "approve in your wallet… (click to retry)" : "connect wallet ›", onClick: wallet.connect, disabled: false };
    if (!wallet.isOnTargetChain)
      return { label: `switch to ${targetChain.name} ›`, onClick: wallet.switchToTarget, disabled: false };
    if (!vaultAddress) return { label: "vault not deployed on this network", onClick: () => {}, disabled: true };
    return { label: `stake into ${selectedVault} vault ›`, onClick: handleDeposit, disabled: !!validation || busy };
  })();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="ambush-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="ambush-title"
        >
          {/* Backdrop */}
          <div onClick={handleClose} className="absolute inset-0 bg-navy/60 backdrop-blur-sm" />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ type: "spring", stiffness: 380, damping: 32, mass: 0.8 }}
            className="relative z-10 w-full max-w-[520px] max-h-[calc(100vh-2rem)] overflow-y-auto bg-white rounded-panel p-6 sm:p-8 shadow-lift border-2 border-lavender text-navy"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-lavender">
              <div className="flex items-center gap-3">
                <CadIcon name="bow" size="md" blueprintBg />
                <div>
                  <h3 id="ambush-title" className="font-display font-extrabold text-xl leading-none text-navy">
                    Hedgerow Vault Ambush
                  </h3>
                  <span className="text-xs font-mono font-bold text-coral">
                    {targetChain.name} • ID {targetChain.id}
                  </span>
                </div>
              </div>
              <button
                onClick={handleClose}
                aria-label="Close"
                className="w-8 h-8 rounded-full bg-lavender hover:bg-pink/40 text-navy font-bold flex items-center justify-center text-sm transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Wallet status strip */}
            <div className="mt-4 flex items-center justify-between text-xs font-mono">
              <span className="flex items-center gap-2 text-charcoal/80">
                <span
                  className={`w-2 h-2 rounded-full ${
                    wallet.account ? (wallet.isOnTargetChain ? "bg-emerald-500" : "bg-butter") : "bg-charcoal/30"
                  }`}
                />
                {wallet.account ? short(wallet.account) : "wallet not connected"}
              </span>
              {wallet.account && !wallet.isOnTargetChain && (
                <span className="text-coral font-bold">wrong network (id {wallet.chainId})</span>
              )}
            </div>

            <AnimatePresence mode="wait" initial={false}>
              {step.kind === "success" ? (
                <motion.div
                  key="success"
                  variants={viewVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={viewTransition}
                  className="py-6 text-center"
                >
                  <motion.div
                    initial={{ scale: 0.6, rotate: -8 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 260, damping: 14 }}
                    className="mb-4 flex justify-center"
                  >
                    <CadIcon name="rocket" size={96} blueprintBg className="shadow-lift animate-float" />
                  </motion.div>
                  <h4 className="font-display font-black text-2xl text-navy mb-2">Ambush Order Deployed!</h4>
                  <p className="font-sans text-sm text-charcoal/80 mb-6 max-w-sm mx-auto">
                    Your deposit of <strong>{fmt(step.assets, 6)} ETH</strong> is confirmed in the{" "}
                    <strong>{vaultMeta.name}</strong>
                    {step.shares !== undefined && (
                      <>
                        {" "}— you received <strong>{fmt(step.shares, 6)} h{selectedVault}</strong> shares
                      </>
                    )}
                    .
                  </p>
                  <div className="p-3 bg-lavender rounded-card font-mono text-xs text-navy mb-6 break-all">
                    Tx: {txLink(step.hash)} (confirmed)
                  </div>
                  <button
                    onClick={handleClose}
                    className="w-full bg-coral hover:brightness-95 text-white font-sans font-bold py-3.5 rounded-tag text-lg lowercase shadow-soft transition-all"
                  >
                    sweet! back to the greenwood ›
                  </button>
                </motion.div>
              ) : step.kind === "error" ? (
                <motion.div
                  key="error"
                  variants={viewVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={viewTransition}
                  className="py-6 text-center"
                >
                  <h4 className="font-display font-black text-2xl text-coral mb-2">Ambush failed</h4>
                  <p className="font-sans text-sm text-charcoal/80 mb-4 max-w-sm mx-auto break-words">{step.message}</p>
                  {step.hash && (
                    <div className="p-3 bg-lavender rounded-card font-mono text-xs text-navy mb-4 break-all">
                      Tx: {txLink(step.hash)}
                    </div>
                  )}
                  <button
                    onClick={() => setStep({ kind: "form" })}
                    className="w-full bg-navy hover:brightness-110 text-white font-sans font-bold py-3.5 rounded-tag text-lg lowercase shadow-soft transition-all"
                  >
                    try again ›
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="form"
                  variants={viewVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={viewTransition}
                  className="pt-4 space-y-5"
                >
                  <fieldset disabled={busy} className="space-y-5 disabled:opacity-70">
                    <div>
                      <label className="block text-xs font-mono font-bold uppercase text-charcoal/70 mb-2">
                        1. Select Target Vault
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {vaults.map((vault) => (
                          <motion.button
                            key={vault.id}
                            type="button"
                            whileTap={{ scale: 0.97 }}
                            onClick={() => setSelectedVault(vault.id)}
                            className={`p-3 rounded-tile text-left border-2 transition-colors flex flex-col justify-between ${
                              selectedVault === vault.id
                                ? "bg-sky/20 border-sky shadow-sm"
                                : "bg-lavender/40 border-lavender hover:border-pink"
                            }`}
                          >
                            <div className="flex items-center justify-between text-base mb-1">
                              <CadIcon name={vault.cadIcon} size="xs" blueprintBg />
                              <span className="text-xs font-mono font-extrabold text-coral">{vault.apy}</span>
                            </div>
                            <div className="font-sans font-bold text-xs text-navy mt-1 truncate">{vault.name}</div>
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label htmlFor="stake-amount" className="text-xs font-mono font-bold uppercase text-charcoal/70">
                          2. Stake Amount (ETH)
                        </label>
                        <span className="text-xs text-charcoal/60 font-sans">
                          Balance: {balance !== undefined ? `${fmt(balance)} ETH` : "—"}
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          id="stake-amount"
                          type="text"
                          inputMode="decimal"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value.replace(",", "."))}
                          className="w-full bg-bg border-2 border-lavender focus:border-sky rounded-tile pl-4 pr-36 py-3 font-mono font-bold text-lg text-navy outline-none transition-colors"
                          placeholder="0.00"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                          {["0.01", "0.05", "0.1"].map((preset) => (
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
                      {wallet.account && wallet.isOnTargetChain && validation && amount !== "" && (
                        <p className="mt-1 text-xs text-coral font-semibold">{validation}</p>
                      )}
                      {position !== undefined && position > 0n && (
                        <p className="mt-1 text-xs text-charcoal/70">
                          Your position in this vault: <strong>{fmt(position, 6)} ETH</strong>
                        </p>
                      )}
                    </div>
                  </fieldset>

                  {/* Info block */}
                  <div className="p-3 bg-blush rounded-tile flex items-start gap-3 text-xs text-charcoal">
                    <CadIcon name="gas" size="xs" blueprintBg className="flex-shrink-0 mt-0.5" />
                    <div>
                      {vaultAddress ? (
                        <>
                          <strong className="text-navy">Vault contract:</strong>{" "}
                          <span className="font-mono break-all">{vaultAddress}</span>. Deposits call{" "}
                          <code>deposit()</code> with native ETH; you can withdraw your shares at any time.
                        </>
                      ) : (
                        <>
                          <strong className="text-navy">Not deployed yet:</strong> no{" "}
                          <code>NEXT_PUBLIC_VAULT_{selectedVault}</code> address is configured for {targetChain.name}.
                        </>
                      )}
                    </div>
                  </div>

                  {(wallet.error || readError) && (
                    <p className="text-xs text-coral font-semibold break-words">{wallet.error || readError}</p>
                  )}

                  {/* Pending tx line */}
                  <AnimatePresence>
                    {step.kind === "pending" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-xs font-mono text-navy bg-lavender rounded-tile px-3 py-2 overflow-hidden"
                      >
                        Submitted: {txLink(step.hash)} — waiting for confirmation…
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Action button */}
                  <button
                    type="button"
                    disabled={action.disabled}
                    onClick={action.onClick}
                    className="w-full bg-coral hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed text-white font-display font-bold py-3.5 rounded-tag text-lg lowercase shadow-soft hover:shadow-lift transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {busy ? (
                      <>
                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>{step.kind === "confirm" ? "confirm in your wallet…" : "baking on-chain…"}</span>
                      </>
                    ) : (
                      <span>{action.label}</span>
                    )}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
