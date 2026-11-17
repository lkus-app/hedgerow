# 🥐🏹 HEDGEROW (`$WEALD`)
### The Sweetest Asymmetric Alpha & Anti-Short Engine on Robinhood Chain

> **"We don't do catering. We hunt overleveraged shorts."**

**HEDGEROW** is an original, first-of-its-kind DeFi protocol baked natively for **Robinhood Chain** (Arbitrum Orbit L2, Chain ID `4663`). It takes WallStreetBets-style retail collective action and codifies it into immutable, mathematically hedged gamma vaults, off-hours liquidity sweeps, and autonomous AI sentinels.

Designed with a playful, candy-colored creative-studio aesthetic ("like a bakery that makes design and bakes financial weapons for retail outlaws"), Hedgerow flips the grim crypto trope into a confident, witty, and viral experience.

---

## 🌲 Why Robinhood Chain?

Hedgerow cannot exist on standard L1s or generic L2s because it directly exploits what makes Robinhood Chain unique:

1. **Tokenized Real-World Assets (RWAs):** Traditional US equities (e.g. `$GME`, `$NVDA`, `$TSLA`) trade natively on-chain.
2. **The 128-Hour Dark Market:** Traditional stock exchanges (NYSE/Nasdaq) are closed for 128 hours each week (after-hours, weekends, holidays). Robinhood Chain trades 24/7. Hedgerow pools capital to harvest massive spreads and borrow fee spikes while Wall Street market makers are asleep.
3. **AI-Native Execution Infrastructure:** Built-in hooks for autonomous AI agents (*Friar-1*) to monitor SEC 13F short positions and execute sub-second liquidity sweeps without paying payment for order flow (PFOF).
4. **Arbitrum Orbit Speed & Ethereum Blob DA:** Instant transaction finality with sub-penny gas fees paid in native ETH.

---

## 🎨 UI Design Tokens & System

Hedgerow strictly adheres to the playful candy-colored master prompt:

### Color Palette
- `--bg`: `#F3F4F6` (Cool off-white gutter & frame background)
- `--surface`: `#FFFFFF` (Large white content panels)
- `--lavender`: `#EFE8F2` (Cards, industry tiles, contrast borders)
- `--blush`: `#F1E0ED` (Hero intro manifesto card)
- `--sky`: `#38CCFF` (Primary brand accent — services panel, tags, interactive triggers)
- `--coral`: `#FF5E64` (Primary CTA buttons, display headlines, footer, scroll indicator)
- `--pink`: `#FFA3CC` (Nav links, client labels, offset color blocks)
- `--navy`: `#005174` (Card titles, chevrons, script headlines, secondary dark CTA)
- `--charcoal`: `#504E57` (Body text, project titles)
- `--butter`: `#FAD869` (Accent offset block, illustration fills)
- `--ink`: `#000000` (Illustration outlines only)

### Typography
- **Body / UI:** `Poppins` (400, 500, 600, 700, 800)
- **Display Headlines:** `Geologica` (700, 800, 900)
- **Script / Brush Headlines:** `Permanent Marker` (400, all-caps, 3 short stacked lines)
- **Buttons:** Lowercase copy with right chevron (`›`), hover darken 6%, translate-x.

### Layout & Animations
- **16px Inset Page Frame:** Sections sit inside a 16px gutter showing `#F3F4F6`.
- **Soft Shadows:** `0 4px 12px rgba(0,0,0,.08)`, lifting to `0 10px 24px rgba(0,0,0,.12)`.
- **Global Micro-Interactions:**
  - ☝️ Floating help & Friar assistant button with hover wiggle (`rotate ±8°`).
  - Thin coral pill scroll progress indicator fixed on right edge.
  - 🥐 Back-to-top button.
  - Interactive Web3 vault staking simulator with `canvas-confetti` celebrations.

---

## ⚙️ Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (custom token configuration)
- **Animations:** Framer Motion (scroll reveals, staggered text, parallax cards)
- **Icons:** Custom SVGs & Lucide Icons
- **Effects:** Canvas Confetti

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
pnpm install
# or: npm install
```

### 2. Run the Development Server
```bash
pnpm dev
# or: npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Production Build
```bash
pnpm build
pnpm start
```

---

## 📜 Smart Contracts (`contracts/`)

1. **`WealdToken.sol` (`$WEALD`):**
   - Native utility and governance token on Robinhood Chain.
   - Max supply of 100M with automated OG badge rewards and liquidity incentives.
2. **`HedgerowVault.sol`:**
   - ERC-4626 style vault for tokenized equities (e.g. `$GME-RWA`, `$NVDA-RWA`) and ETH.
   - Handles deposits, shares calculation, and autonomous profit distributions.
3. **`AmbushController.sol`:**
   - The execution controller managed by the Friar AI Sentinel.
   - Triggers off-hours borrow fee sweeps when short interest crosses threshold limits.

---

## ⛓️ On-chain Setup

The staking modal sends a real `deposit()` transaction to a `HedgerowVault` through the visitor's browser wallet (MetaMask or any EIP-1193 wallet). It connects the wallet, switches to (or adds) the target network, checks the ETH balance, simulates the call, sends it, waits for the receipt and links the tx in the explorer. If no vault address is configured for the network, the button is disabled. Nothing is faked.

```bash
pnpm contracts:test                     # Hardhat tests for the vault + controller

# Local end-to-end
pnpm chain:local                        # terminal 1
pnpm deploy:local                       # terminal 2 -> prints NEXT_PUBLIC_* lines
# paste them into .env.local, then: pnpm dev

# Robinhood Chain Testnet (get test ETH: https://faucet.testnet.chain.robinhood.com)
DEPLOYER_PRIVATE_KEY=0x... pnpm deploy:testnet
```

Copy `.env.example` to `.env.local` and fill in the vault addresses printed by the deploy script (they are also saved to `deployments/<chainId>.json`). Restart `pnpm dev` after editing env vars, because Next.js inlines `NEXT_PUBLIC_*` at build time.

---

## 🛡️ Network Parameters (Robinhood Chain)

| Parameter | Mainnet | Testnet |
|---|---|---|
| **Network Name** | Robinhood Chain | Robinhood Chain Testnet |
| **Chain ID** | `4663` | `46630` |
| **Gas Token** | ETH | Sepolia ETH |
| **Rollup Framework** | Arbitrum Orbit L2 | Arbitrum Orbit L2 |
| **Data Availability** | Ethereum Blobs | Ethereum Sepolia |
| **Public RPC** | `rpc.mainnet.chain.robinhood.com` | `rpc.testnet.chain.robinhood.com` |
| **Block Explorer** | `robinhoodchain.blockscout.com` | `explorer.testnet.chain.robinhood.com` |

---

*Baked with love and righteous spite by The Greenwood Guild on Robinhood Chain.* 🥐🏹
