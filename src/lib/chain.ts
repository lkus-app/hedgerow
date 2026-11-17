import { defineChain, parseAbi, type Address, type Chain } from "viem";

export const robinhoodTestnet = defineChain({
  id: 46630,
  name: "Robinhood Chain Testnet",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.testnet.chain.robinhood.com"] } },
  blockExplorers: {
    default: { name: "Robinhood Testnet Explorer", url: "https://explorer.testnet.chain.robinhood.com" },
  },
  testnet: true,
});

export const robinhoodMainnet = defineChain({
  id: 4663,
  name: "Robinhood Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.mainnet.chain.robinhood.com"] } },
  blockExplorers: {
    default: { name: "Blockscout", url: "https://robinhoodchain.blockscout.com" },
  },
});

export const hardhatLocal = defineChain({
  id: 31337,
  name: "Hardhat Local",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["http://127.0.0.1:8545"] } },
  testnet: true,
});

const CHAINS: Record<number, Chain> = {
  [robinhoodTestnet.id]: robinhoodTestnet,
  [robinhoodMainnet.id]: robinhoodMainnet,
  [hardhatLocal.id]: hardhatLocal,
};

const configuredId = Number(process.env.NEXT_PUBLIC_CHAIN_ID || robinhoodTestnet.id);
const baseChain = CHAINS[configuredId] ?? robinhoodTestnet;
const rpcOverride = process.env.NEXT_PUBLIC_RPC_URL;

/** The chain the dApp transacts on (NEXT_PUBLIC_CHAIN_ID, default: Robinhood Chain Testnet). */
export const targetChain: Chain = rpcOverride
  ? { ...baseChain, rpcUrls: { default: { http: [rpcOverride] } } }
  : baseChain;

export type VaultId = "GME" | "NVDA" | "TSLA" | "WEALD";

const asAddress = (v: string | undefined): Address | undefined =>
  v && /^0x[0-9a-fA-F]{40}$/.test(v) ? (v as Address) : undefined;

// Must be literal `process.env.NEXT_PUBLIC_*` reads so Next.js inlines them at build time.
export const vaultAddresses: Record<VaultId, Address | undefined> = {
  GME: asAddress(process.env.NEXT_PUBLIC_VAULT_GME),
  NVDA: asAddress(process.env.NEXT_PUBLIC_VAULT_NVDA),
  TSLA: asAddress(process.env.NEXT_PUBLIC_VAULT_TSLA),
  WEALD: asAddress(process.env.NEXT_PUBLIC_VAULT_WEALD),
};

/** $WEALD token contract address (the "CA"), printed by the deploy script. */
export const wealdTokenAddress = asAddress(process.env.NEXT_PUBLIC_WEALD_TOKEN);

/** Public project links. Unset links render as disabled buttons rather than placeholders. */
export const projectLinks = {
  x: process.env.NEXT_PUBLIC_X_URL || undefined,
  website: process.env.NEXT_PUBLIC_WEBSITE_URL || undefined,
};

export const explorerAddressUrl = (address: string) => {
  const base = targetChain.blockExplorers?.default.url;
  return base ? `${base}/address/${address}` : undefined;
};

export const explorerTxUrl = (hash: string) => {
  const base = targetChain.blockExplorers?.default.url;
  return base ? `${base}/tx/${hash}` : undefined;
};

export const hedgerowVaultAbi = [
  {
    type: "function",
    name: "deposit",
    stateMutability: "payable",
    inputs: [
      { name: "assets", type: "uint256" },
      { name: "receiver", type: "address" },
    ],
    outputs: [{ name: "shares", type: "uint256" }],
  },
  {
    type: "function",
    name: "withdraw",
    stateMutability: "nonpayable",
    inputs: [
      { name: "shares", type: "uint256" },
      { name: "receiver", type: "address" },
    ],
    outputs: [{ name: "assets", type: "uint256" }],
  },
  { type: "function", name: "asset", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { type: "function", name: "totalAssets", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "totalSupply", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "convertToAssets",
    stateMutability: "view",
    inputs: [{ name: "shares", type: "uint256" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "event",
    name: "Deposit",
    inputs: [
      { name: "caller", type: "address", indexed: true },
      { name: "owner", type: "address", indexed: true },
      { name: "assets", type: "uint256", indexed: false },
      { name: "shares", type: "uint256", indexed: false },
    ],
  },
] as const;

/** Equity Basket vault (BasketVault.sol), printed by the basket deploy script. */
export const basketVaultAddress = asAddress(process.env.NEXT_PUBLIC_BASKET_VAULT);

export const basketVaultAbi = parseAbi([
  "function composition() view returns (address[] tokens, uint16[] weightsBps, uint256[] balances, uint256[] valuesUsd, uint256 wethBalance, uint256 wethValueUsd, uint256 navUsd, bool pricesFresh)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function previewDeposit(uint256 ethAmount) view returns (uint256)",
  "function needsRebalance() view returns (bool)",
  "function depositsPaused() view returns (bool)",
  "function maxSlippageBps() view returns (uint16)",
  "function depositFeeBps() view returns (uint16)",
  "function deposit(uint256 minShares) payable returns (uint256)",
  "function withdraw(uint256 shares) returns (uint256)",
  "function rebalance()",
]);

export const erc20MetaAbi = parseAbi([
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
]);
