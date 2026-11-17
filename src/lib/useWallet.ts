"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  numberToHex,
  type Address,
  type EIP1193Provider,
} from "viem";
import { targetChain } from "./chain";

declare global {
  interface Window {
    ethereum?: EIP1193Provider;
  }
}

type WalletState = {
  hasProvider: boolean;
  account?: Address;
  chainId?: number;
  isConnecting: boolean;
  error?: string;
};

/** Read-only client. Uses NEXT_PUBLIC_RPC_URL when set, else the chain's public RPC. */
export const publicClient = createPublicClient({ chain: targetChain, transport: http() });

export function readableError(e: unknown): string {
  const err = e as { shortMessage?: string; message?: string; code?: number; details?: string; cause?: { code?: number } };
  if (err?.code === 4001 || err?.cause?.code === 4001 || /user rejected|user denied/i.test(err?.message ?? "")) {
    return "You rejected the request in your wallet.";
  }
  if (/insufficient funds/i.test(err?.message ?? "")) return "Not enough ETH to cover the deposit plus gas.";
  if (err?.code === -32002 || /already pending/i.test(err?.message ?? "")) {
    return "A connection request is already waiting in your wallet. Open the wallet extension to approve it.";
  }
  return err?.shortMessage || err?.details || err?.message || "Something went wrong.";
}

const isChainMissing = (e: unknown) => {
  const err = e as { code?: number; message?: string; data?: { originalError?: { code?: number } } };
  return err?.code === 4902 || err?.data?.originalError?.code === 4902 || /unrecognized chain|not been added/i.test(err?.message ?? "");
};

export function useWallet() {
  const [state, setState] = useState<WalletState>({ hasProvider: false, isConnecting: false });

  // Some wallets inject after page load and announce it with this event.
  const [providerTick, setProviderTick] = useState(0);
  useEffect(() => {
    const onInit = () => setProviderTick((t) => t + 1);
    window.addEventListener("ethereum#initialized", onInit);
    return () => window.removeEventListener("ethereum#initialized", onInit);
  }, []);

  useEffect(() => {
    const eth = typeof window !== "undefined" ? window.ethereum : undefined;
    if (!eth) return;
    setState((s) => ({ ...s, hasProvider: true }));

    // Restore an existing connection silently (no popup).
    eth.request({ method: "eth_accounts" })
      .then((accs) => setState((s) => ({ ...s, account: (accs as Address[])[0] })))
      .catch(() => {});
    eth.request({ method: "eth_chainId" })
      .then((id) => setState((s) => ({ ...s, chainId: Number(id) })))
      .catch(() => {});

    const onAccounts = (accs: string[]) => setState((s) => ({ ...s, account: accs[0] as Address | undefined }));
    const onChain = (id: string) => setState((s) => ({ ...s, chainId: Number(id) }));
    eth.on("accountsChanged", onAccounts);
    eth.on("chainChanged", onChain);
    return () => {
      eth.removeListener("accountsChanged", onAccounts);
      eth.removeListener("chainChanged", onChain);
    };
  }, [providerTick]);

  const connect = useCallback(async () => {
    const eth = window.ethereum;
    if (!eth) return;
    setState((s) => ({ ...s, isConnecting: true, error: undefined }));
    try {
      const accs = (await eth.request({ method: "eth_requestAccounts" })) as Address[];
      const id = Number(await eth.request({ method: "eth_chainId" }));
      setState((s) => ({ ...s, account: accs[0], chainId: id, isConnecting: false }));
    } catch (e) {
      setState((s) => ({ ...s, isConnecting: false, error: readableError(e) }));
    }
  }, []);

  const switchToTarget = useCallback(async () => {
    const eth = window.ethereum;
    if (!eth) return;
    const chainIdHex = numberToHex(targetChain.id);
    setState((s) => ({ ...s, error: undefined }));
    try {
      await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: chainIdHex }] });
    } catch (e) {
      if (!isChainMissing(e)) {
        setState((s) => ({ ...s, error: readableError(e) }));
        return;
      }
      try {
        await eth.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: chainIdHex,
              chainName: targetChain.name,
              nativeCurrency: targetChain.nativeCurrency,
              rpcUrls: [...targetChain.rpcUrls.default.http],
              blockExplorerUrls: targetChain.blockExplorers ? [targetChain.blockExplorers.default.url] : undefined,
            },
          ],
        });
      } catch (e2) {
        setState((s) => ({ ...s, error: readableError(e2) }));
      }
    }
  }, []);

  const walletClient = useMemo(() => {
    if (!state.account || typeof window === "undefined" || !window.ethereum) return undefined;
    return createWalletClient({ account: state.account, chain: targetChain, transport: custom(window.ethereum) });
  }, [state.account]);

  return {
    ...state,
    isOnTargetChain: state.chainId === targetChain.id,
    connect,
    switchToTarget,
    walletClient,
  };
}
