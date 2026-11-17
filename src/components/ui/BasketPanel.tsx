"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createPublicClient, custom, formatEther, parseEther, type Address, type Hash } from "viem";
import { basketVaultAbi, basketVaultAddress, erc20MetaAbi, explorerAddressUrl, explorerTxUrl, targetChain } from "@/lib/chain";
import { publicClient, readableError, useWallet } from "@/lib/useWallet";

type State = {
  tokens: { address: Address; symbol: string; decimals: number; weightBps: number; balance: bigint; valueUsd: bigint }[];
  wethValueUsd: bigint;
  navUsd: bigint;
  pricesFresh: boolean;
  totalSupply: bigint;
  needsRebalance: boolean;
  depositsPaused: boolean;
  maxSlippageBps: number;
  depositFeeBps: number;
  myShares: bigint;
  myEth?: bigint;
};

const usd = (v: bigint) =>
  `$${Number(formatEther(v)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const pct = (part: bigint, whole: bigint) => (whole === 0n ? 0 : Number((part * 10000n) / whole) / 100);
const short = (s: string) => `${s.slice(0, 6)}…${s.slice(-4)}`;

/** Live view of the deployed BasketVault with deposit, in-kind withdraw and permissionless rebalance. */
export const BasketPanel: React.FC = () => {
  const wallet = useWallet();
  const [state, setState] = useState<State>();
  const [loadError, setLoadError] = useState<string>();
  const [amount, setAmount] = useState("0.05");
  const [busy, setBusy] = useState<string>();
  const [result, setResult] = useState<{ ok: boolean; text: string; hash?: Hash }>();

  const reader = useMemo(() => {
    if (wallet.isOnTargetChain && typeof window !== "undefined" && window.ethereum) {
      return createPublicClient({ chain: targetChain, transport: custom(window.ethereum) });
    }
    return publicClient;
  }, [wallet.isOnTargetChain]);

  const load = useCallback(async () => {
    if (!basketVaultAddress) return;
    try {
      const vault = { address: basketVaultAddress, abi: basketVaultAbi } as const;
      const [comp, totalSupply, needsRebalance, depositsPaused, maxSlippageBps, depositFeeBps] = await Promise.all([
        reader.readContract({ ...vault, functionName: "composition" }),
        reader.readContract({ ...vault, functionName: "totalSupply" }),
        reader.readContract({ ...vault, functionName: "needsRebalance" }),
        reader.readContract({ ...vault, functionName: "depositsPaused" }),
        reader.readContract({ ...vault, functionName: "maxSlippageBps" }),
        reader.readContract({ ...vault, functionName: "depositFeeBps" }),
      ]);
      const [tokens, weights, balances, values, , wethValueUsd, navUsd, pricesFresh] = comp;
      const meta = await Promise.all(
        tokens.map(async (t) => {
          const [symbol, decimals] = await Promise.all([
            reader.readContract({ address: t, abi: erc20MetaAbi, functionName: "symbol" }),
            reader.readContract({ address: t, abi: erc20MetaAbi, functionName: "decimals" }),
          ]);
          return { symbol, decimals };
        })
      );
      const account = wallet.isOnTargetChain ? wallet.account : undefined;
      const [myShares, myEth] = account
        ? await Promise.all([
            reader.readContract({ ...vault, functionName: "balanceOf", args: [account] }),
            reader.getBalance({ address: account }),
          ])
        : [0n, undefined];

      setState({
        tokens: tokens.map((address, i) => ({
          address,
          symbol: meta[i].symbol,
          decimals: meta[i].decimals,
          weightBps: weights[i],
          balance: balances[i],
          valueUsd: values[i],
        })),
        wethValueUsd,
        navUsd,
        pricesFresh,
        totalSupply,
        needsRebalance,
        depositsPaused,
        maxSlippageBps,
        depositFeeBps,
        myShares,
        myEth,
      });
      setLoadError(undefined);
    } catch (e) {
      setLoadError(readableError(e));
    }
  }, [reader, wallet.account, wallet.isOnTargetChain]);

  useEffect(() => {
    load();
  }, [load]);

  if (!basketVaultAddress) return null;

  const parsed = (() => {
    try {
      const v = parseEther(amount.trim() || "0");
      return v > 0n ? v : undefined;
    } catch {
      return undefined;
    }
  })();

  const send = async (label: string, write: () => Promise<Hash>, okText: string) => {
    setBusy(label);
    setResult(undefined);
    let hash: Hash | undefined;
    try {
      hash = await write();
      const r = await reader.waitForTransactionReceipt({ hash });
      if (r.status !== "success") throw new Error("Transaction reverted on-chain.");
      setResult({ ok: true, text: okText, hash });
    } catch (e) {
      setResult({ ok: false, text: readableError(e), hash });
    } finally {
      setBusy(undefined);
      load();
    }
  };

  const vault = { address: basketVaultAddress, abi: basketVaultAbi } as const;

  const deposit = () =>
    send(
      "deposit",
      async () => {
        const preview = await reader.readContract({ ...vault, functionName: "previewDeposit", args: [parsed!] });
        const minShares = (preview * 995n) / 1000n; // tolerate 0.5% price movement before inclusion
        const { request } = await reader.simulateContract({
          ...vault,
          account: wallet.account!,
          functionName: "deposit",
          args: [minShares],
          value: parsed!,
        });
        return wallet.walletClient!.writeContract(request);
      },
      `Deposited ${amount} ETH. It is held as WETH until the next rebalance buys the basket.`
    );

  const withdraw = (fraction: bigint) =>
    send(
      "withdraw",
      async () => {
        const shares = (state!.myShares * fraction) / 100n;
        const { request } = await reader.simulateContract({
          ...vault,
          account: wallet.account!,
          functionName: "withdraw",
          args: [shares],
        });
        return wallet.walletClient!.writeContract(request);
      },
      "Withdrawn in kind: the basket tokens and ETH are in your wallet."
    );

  const rebalance = () =>
    send(
      "rebalance",
      async () => {
        const { request } = await reader.simulateContract({ ...vault, account: wallet.account!, functionName: "rebalance" });
        return wallet.walletClient!.writeContract(request);
      },
      "Rebalanced: the basket traded back to its target weights."
    );

  const myValue = state && state.totalSupply > 0n ? (state.myShares * state.navUsd) / state.totalSupply : 0n;
  const connected = wallet.account && wallet.isOnTargetChain;
  const contractUrl = explorerAddressUrl(basketVaultAddress);
  const txUrl = result?.hash ? explorerTxUrl(result.hash) : undefined;

  const gate = !wallet.hasProvider ? (
    <a
      href="https://metamask.io/download/"
      target="_blank"
      rel="noreferrer"
      className="block text-center w-full bg-coral text-white font-bold py-3 rounded-tile"
    >
      install a wallet to use the basket ›
    </a>
  ) : !wallet.account ? (
    <button onClick={wallet.connect} className="w-full bg-coral text-white font-bold py-3 rounded-tile hover:brightness-95">
      {wallet.isConnecting ? "approve in your wallet… (click to retry)" : "connect wallet ›"}
    </button>
  ) : !wallet.isOnTargetChain ? (
    <button onClick={wallet.switchToTarget} className="w-full bg-coral text-white font-bold py-3 rounded-tile hover:brightness-95">
      switch to {targetChain.name} ›
    </button>
  ) : null;

  return (
    <div className="mt-6 rounded-card border-2 border-sky/40 overflow-hidden">
      <div className="bg-sky/15 px-4 py-3 flex items-center justify-between gap-3">
        <div>
          <span className="block font-bold text-sm">Live contract</span>
          <span className="block text-[11px] font-mono text-charcoal/70">
            {targetChain.name} ·{" "}
            {contractUrl ? (
              <a href={contractUrl} target="_blank" rel="noreferrer" className="underline hover:text-coral">
                {short(basketVaultAddress)} ↗
              </a>
            ) : (
              short(basketVaultAddress)
            )}
          </span>
        </div>
        <div className="text-right">
          <span className="block text-[10px] font-mono font-bold uppercase text-charcoal/60">NAV</span>
          <span className="block font-display font-black text-lg">{state ? usd(state.navUsd) : "…"}</span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {loadError && <p className="text-xs text-coral font-semibold break-words">Could not read the vault: {loadError}</p>}

        {state && !state.pricesFresh && (
          <p className="text-xs bg-butter/40 rounded-tag p-2.5">
            A price feed is stale (often because the stock market is closed). Deposits and rebalancing are blocked until it
            updates. Withdrawals still work.
          </p>
        )}

        {state && (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] font-mono uppercase text-charcoal/60 text-left">
                <th className="font-bold pb-1">token</th>
                <th className="font-bold pb-1 text-right">target</th>
                <th className="font-bold pb-1 text-right">now</th>
                <th className="font-bold pb-1 text-right">value</th>
              </tr>
            </thead>
            <tbody>
              {state.tokens.map((t) => (
                <tr key={t.address} className="border-t border-lavender">
                  <td className="py-1.5 font-bold">{t.symbol}</td>
                  <td className="py-1.5 text-right">{t.weightBps / 100}%</td>
                  <td className="py-1.5 text-right">{pct(t.valueUsd, state.navUsd)}%</td>
                  <td className="py-1.5 text-right font-mono text-xs">{usd(t.valueUsd)}</td>
                </tr>
              ))}
              <tr className="border-t border-lavender text-charcoal/70">
                <td className="py-1.5">idle ETH</td>
                <td className="py-1.5 text-right">0%</td>
                <td className="py-1.5 text-right">{pct(state.wethValueUsd, state.navUsd)}%</td>
                <td className="py-1.5 text-right font-mono text-xs">{usd(state.wethValueUsd)}</td>
              </tr>
            </tbody>
          </table>
        )}

        {gate ?? (
          state && (
            <>
              <div className="flex items-center justify-between text-sm bg-lavender/70 rounded-tag px-3 py-2">
                <span>Your position</span>
                <span className="font-bold">
                  {usd(myValue)} <span className="font-mono text-xs text-charcoal/60">({pct(state.myShares, state.totalSupply)}%)</span>
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <label htmlFor="basket-amount" className="font-mono font-bold uppercase text-charcoal/60">
                    deposit (ETH)
                  </label>
                  {state.myEth !== undefined && (
                    <span className="text-charcoal/60">Balance: {Number(formatEther(state.myEth)).toFixed(4)} ETH</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    id="basket-amount"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="flex-1 min-w-0 bg-lavender/60 rounded-tile px-3 py-2.5 font-mono text-sm outline-none focus:ring-2 focus:ring-sky"
                  />
                  <button
                    onClick={deposit}
                    disabled={!!busy || !parsed || state.depositsPaused || !state.pricesFresh || (state.myEth !== undefined && parsed > state.myEth)}
                    className="shrink-0 bg-coral text-white font-bold px-5 rounded-tile disabled:opacity-40 hover:brightness-95"
                  >
                    {busy === "deposit" ? "depositing…" : "deposit"}
                  </button>
                </div>
                {state.depositsPaused ? (
                  <p className="text-xs text-coral mt-1">Deposits are paused by the owner.</p>
                ) : (
                  state.totalSupply > 0n &&
                  state.depositFeeBps > 0 && (
                    <p className="text-xs text-charcoal/60 mt-1">
                      {state.depositFeeBps / 100}% deposit fee, kept in the vault for existing holders.
                    </p>
                  )
                )}
              </div>

              <div>
                <span className="block text-xs font-mono font-bold uppercase text-charcoal/60 mb-1.5">withdraw in kind</span>
                <div className="grid grid-cols-3 gap-2">
                  {[25n, 50n, 100n].map((f) => (
                    <button
                      key={String(f)}
                      onClick={() => withdraw(f)}
                      disabled={!!busy || state.myShares === 0n}
                      className="bg-lavender hover:bg-pink/40 font-bold text-sm py-2 rounded-tile disabled:opacity-40"
                    >
                      {busy === "withdraw" ? "…" : `${f}%`}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={rebalance}
                disabled={!!busy || !state.needsRebalance}
                className="w-full border-2 border-navy font-bold text-sm py-2.5 rounded-tile hover:bg-navy hover:text-white transition-colors disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-navy"
              >
                {busy === "rebalance"
                  ? "rebalancing…"
                  : state.needsRebalance
                    ? `rebalance now (anyone can, max ${state.maxSlippageBps / 100}% slippage)`
                    : "basket is balanced"}
              </button>
            </>
          )
        )}

        {wallet.error && <p className="text-xs text-coral font-semibold break-words">{wallet.error}</p>}
        {result && (
          <p className={`text-xs font-semibold break-words ${result.ok ? "text-emerald-700" : "text-coral"}`}>
            {result.text}
            {result.hash && (
              <>
                {" "}
                {txUrl ? (
                  <a href={txUrl} target="_blank" rel="noreferrer" className="underline">
                    {short(result.hash)} ↗
                  </a>
                ) : (
                  <span className="font-mono">{short(result.hash)}</span>
                )}
              </>
            )}
          </p>
        )}
      </div>
    </div>
  );
};

