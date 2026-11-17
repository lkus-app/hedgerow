import type { CadIconName } from "@/components/ui/CadIcon";
import type { VaultId } from "./chain";

export type StrategyId =
  | "midnight"
  | "gamma"
  | "darkHours"
  | "weald"
  | "sentinel"
  | "reversePfof"
  | "baskets"
  | "overview";

export interface Strategy {
  id: StrategyId;
  badge: string;
  title: string;
  cadIcon: CadIconName;
  tagline: string;
  /** How the strategy works, step by step. */
  mechanism: { title: string; body: string }[];
  /** Key numbers / parameters, shown as small stat chips. */
  params: { label: string; value: string }[];
  risks: string[];
  /** Vault the user can stake into for this strategy, if one exists. */
  vault?: VaultId;
  /** Backed by the live BasketVault contract (NEXT_PUBLIC_BASKET_VAULT). */
  basket?: boolean;
  related?: StrategyId[];
}

/** What every vault contract actually does today — shown on every vault-backed sheet. */
export const VAULT_REALITY =
  "Staking sends ETH to a HedgerowVault contract and mints h-shares at the current share price. You can withdraw at any time. The contract does not trade on its own: share price rises only when the sentinel calls recordAmbushProfit() and pays real profit into the vault. The strategy logic described here runs off-chain and is not enforced by the contract.";

export const CONCEPT_REALITY =
  "Concept only. No contract implements this yet, so there is nothing to stake into. It is on the roadmap and described here so you can see how it is meant to work.";

export const strategies: Record<StrategyId, Strategy> = {
  midnight: {
    id: "midnight",
    badge: "Vault #01 · $GME-RWA",
    title: "Midnight Ambush Vaults",
    cadIcon: "rocket",
    tagline:
      "Lend into short-borrow spikes that happen while traditional markets are closed, and get paid the borrow fee.",
    mechanism: [
      {
        title: "Watch borrow rates after the bell",
        body: "Tokenized equities trade 24/7 on Robinhood Chain, but the underlying stock market closes. Short sellers who need to stay hedged over a weekend pay rising borrow fees for the tokenized shares.",
      },
      {
        title: "Trigger when the fee crosses a threshold",
        body: "Each target is registered in AmbushController with a borrow-APR trigger. When the sentinel sees the rate cross it, it calls executeAmbushSweep() for that target.",
      },
      {
        title: "Lend the vault's position",
        body: "The vault's tokenized stock is lent to the highest-paying borrower for the closed-market window only, so it is back before Monday's open.",
      },
      {
        title: "Recycle the fee to stakers",
        body: "The collected borrow fee is paid into the vault with recordAmbushProfit(), which raises the value of every h-share pro rata.",
      },
    ],
    params: [
      { label: "Active window", value: "Fri 4pm → Mon 9:30am ET" },
      { label: "Trigger", value: "Borrow APR ≥ target" },
      { label: "Payout", value: "Share-price accrual" },
    ],
    risks: [
      "Borrow demand can disappear and the vault earns nothing for the weekend.",
      "Lent shares carry counterparty risk if the borrower does not return them.",
      "Tokenized equity prices can gap at Monday's open.",
    ],
    vault: "GME",
    related: ["gamma", "sentinel"],
  },

  gamma: {
    id: "gamma",
    badge: "Vault #02 · $TSLA-RWA",
    title: "Asymmetric Gamma Pies",
    cadIcon: "gas",
    tagline:
      "A ladder of synthetic call strikes on a tokenized stock: small, capped cost, with payoff that accelerates if the price runs.",
    mechanism: [
      {
        title: "Slice the deposit into rungs",
        body: "The vault splits capital across 5 strikes above spot (for example +5%, +10%, +15%, +20%, +30%). Each rung is a slice of the pie.",
      },
      {
        title: "Concentrated liquidity instead of options",
        body: "Each rung is a single-sided AMM range above spot. If price rises through a range, the vault's ETH converts into the stock at that strike, behaving like a call that was bought there.",
      },
      {
        title: "No theta to pay",
        body: "Because the position is liquidity, not a bought option, it does not decay with time. It earns swap fees while it waits.",
      },
      {
        title: "Re-ladder after a run",
        body: "When the top rung fills, the sentinel takes profit and rebuilds the ladder around the new spot price.",
      },
    ],
    params: [
      { label: "Rungs", value: "5 strikes above spot" },
      { label: "Time decay", value: "None (LP, not options)" },
      { label: "Rebalance", value: "When top rung fills" },
    ],
    risks: [
      "If the price falls, the ladder never fills and you only earn swap fees.",
      "If the price spikes then drops, filled rungs hold the stock at a loss (impermanent loss).",
    ],
    vault: "TSLA",
    related: ["midnight", "darkHours"],
  },

  darkHours: {
    id: "darkHours",
    badge: "Vault #03 · $NVDA-RWA",
    title: "Dark Hours Straddle",
    cadIcon: "gauge",
    tagline:
      "Provide liquidity on both sides around earnings, when traditional after-hours spreads blow out, and capture the gap.",
    mechanism: [
      {
        title: "Position before the release",
        body: "Shortly before an after-hours earnings report, the vault places liquidity both above and below the current tokenized-stock price.",
      },
      {
        title: "Absorb the move on either side",
        body: "Whichever way the price jumps, traders swap through the vault's range and pay fees, which is the straddle-like payoff.",
      },
      {
        title: "Close at the next open",
        body: "At the next regular session, the vault unwinds against the traditional market price and pays the spread captured into the vault.",
      },
    ],
    params: [
      { label: "Event", value: "After-hours earnings" },
      { label: "Exposure", value: "Both directions" },
      { label: "Holding time", value: "Release → next open" },
    ],
    risks: [
      "A very large move can push price through the whole range and leave the vault one-sided.",
      "If the move is small, fees may not cover rebalancing costs.",
    ],
    vault: "NVDA",
    related: ["gamma", "baskets"],
  },

  weald: {
    id: "weald",
    badge: "Genesis · $WEALD",
    title: "$WEALD Genesis Staking",
    cadIcon: "bow",
    tagline:
      "The protocol's own vault: early stakers earn a share of profits from every other vault and an OG badge.",
    mechanism: [
      {
        title: "Stake ETH into the genesis vault",
        body: "Works like the other vaults: deposit ETH, receive hWEALD shares, withdraw any time.",
      },
      {
        title: "Protocol fee flows in",
        body: "A cut of profits recorded in the strategy vaults is meant to be paid into this vault, so it earns from all of them at once.",
      },
      {
        title: "OG badges",
        body: "AmbushController can call awardOGBadge() to mark early stakers. Badges are meant to carry governance weight later.",
      },
    ],
    params: [
      { label: "Earns from", value: "All strategy vaults" },
      { label: "Extra", value: "OG badge" },
      { label: "Lock", value: "None" },
    ],
    risks: [
      "Income depends on the other vaults actually making profit.",
      "The protocol fee split is not enforced by the current contracts.",
    ],
    vault: "WEALD",
    related: ["overview"],
  },

  sentinel: {
    id: "sentinel",
    badge: "Autonomous",
    title: "Friar AI Sentinels",
    cadIcon: "sentinel",
    tagline:
      "The off-chain agent that watches markets and is the only address allowed to trigger sweeps and pay profit into vaults.",
    mechanism: [
      {
        title: "Read the signals",
        body: "The agent tracks borrow rates, earnings calendars, 13F filings and order-book imbalance for every registered target.",
      },
      {
        title: "Decide against on-chain rules",
        body: "It can only sweep targets the owner registered in AmbushController. Whether a target's trigger condition is met is decided by the agent; the contract records the reported rate but does not check it.",
      },
      {
        title: "Act through a single key",
        body: "The sentinel address calls executeAmbushSweep() and recordAmbushProfit(). Every action is an on-chain transaction anyone can audit in the explorer.",
      },
    ],
    params: [
      { label: "Permissions", value: "Sweep + record profit" },
      { label: "Cannot", value: "Withdraw user funds" },
      { label: "Set by", value: "Contract owner" },
    ],
    risks: [
      "It is a trusted role: a compromised sentinel key could stop paying profits or record bad data.",
      "The model's decisions are off-chain and cannot be verified before they happen.",
    ],
    related: ["midnight", "reversePfof"],
  },

  reversePfof: {
    id: "reversePfof",
    badge: "Yield Engine",
    title: "Reverse-PFOF Sprinkles",
    cadIcon: "mev",
    tagline:
      "Instead of selling retail orders to market makers, batch them and let market makers bid to fill the batch, then return the payment to stakers.",
    mechanism: [
      {
        title: "Collect orders privately",
        body: "User swaps go into a private batch for a few seconds instead of the public mempool, so they cannot be front-run.",
      },
      {
        title: "Auction the batch",
        body: "Market makers bid for the right to fill the whole batch. The best price wins, and the winner pays a fee for the flow.",
      },
      {
        title: "Sprinkle it back",
        body: "That fee, which brokers normally keep as payment for order flow, is paid into the vaults as profit for stakers.",
      },
    ],
    params: [
      { label: "Batch window", value: "A few seconds" },
      { label: "Fee goes to", value: "Stakers, not broker" },
      { label: "MEV exposure", value: "Private batch" },
    ],
    risks: [
      "Needs enough order volume for market makers to bid.",
      "Batching adds a short delay before a swap fills.",
    ],
    related: ["sentinel", "weald"],
  },

  baskets: {
    id: "baskets",
    badge: "RWA Vault · BasketVault.sol",
    title: "Tokenized Equity Baskets",
    cadIcon: "actuator",
    tagline:
      "One ETH deposit owns a slice of a fixed, weighted basket of tokenized stocks. Prices come from Chainlink, trades go through Uniswap, and anyone can trigger the rebalance.",
    mechanism: [
      {
        title: "Deposit ETH, get shares priced at NAV",
        body: "Your ETH is valued with the Chainlink ETH/USD feed and you receive shares in proportion to the basket's current USD value. The ETH is held as WETH until the next rebalance.",
      },
      {
        title: "Rebalance back to target weights",
        body: "When any slice drifts more than the drift band from its target (or idle ETH builds up), anyone can call rebalance(). It sells overweight tokens into WETH on Uniswap, then buys underweight ones.",
      },
      {
        title: "Oracle-bounded swaps",
        body: "Every swap's minimum output is set from the Chainlink price minus the slippage limit (max 5%, set at 1%). A swap that would fill worse reverts, so a caller cannot route value out of the vault.",
      },
      {
        title: "Withdraw in kind, any time",
        body: "Burning shares sends you your exact pro-rata amount of every basket token plus ETH. No swap and no oracle are involved, so it works even when markets are closed or prices are stale.",
      },
    ],
    params: [
      { label: "Pricing", value: "Chainlink feeds" },
      { label: "Trades", value: "Uniswap, oracle-bounded" },
      { label: "Withdraw", value: "In kind, any time" },
    ],
    risks: [
      "You carry the market risk of every token in the basket.",
      "Stock tokens are issued by Robinhood and depend on the issuer holding the real asset.",
      "If a price feed stops updating (e.g. markets closed), deposits and rebalances pause until it updates.",
      "The contract has tests but no external audit yet.",
    ],
    basket: true,
    related: ["darkHours", "overview"],
  },

  overview: {
    id: "overview",
    badge: "All Strategies",
    title: "Overview of All Vaults",
    cadIcon: "bow",
    tagline:
      "Four vaults are deployable today. They all use the same open-source contract and differ only in the strategy the sentinel runs for them.",
    mechanism: [
      {
        title: "HedgerowVault.sol",
        body: "One vault per strategy. Deposit ETH → mint h-shares. Withdraw burns shares and returns ETH at the current share price. Reentrancy-guarded.",
      },
      {
        title: "AmbushController.sol",
        body: "Registry of targets (ticker, trigger APR, vault). The sentinel calls executeAmbushSweep() to record that a strategy fired.",
      },
      {
        title: "BasketVault.sol",
        body: "The Equity Basket: ETH in, a weighted basket of stock tokens held on-chain, Chainlink pricing, Uniswap rebalancing anyone can trigger, and in-kind withdrawals.",
      },
      {
        title: "Sentinel role",
        body: "The only address that can pay profit into a vault. It can never move user deposits out.",
      },
    ],
    params: [
      { label: "Live vaults", value: "GME · TSLA · NVDA · WEALD" },
      { label: "Concepts", value: "Sentinel · Reverse-PFOF" },
      { label: "Withdraw", value: "Any time" },
    ],
    risks: [
      "Contracts are not externally audited yet.",
      "Displayed APYs are targets, not guaranteed or historical returns.",
    ],
    related: ["midnight", "gamma", "darkHours", "weald"],
  },
};

export interface Article {
  category: string;
  author: string;
  title: string;
  readTime: string;
  cadIcon: CadIconName;
  paragraphs: string[];
  related?: StrategyId;
}

export const articles: Article[] = [
  {
    category: "Protocol Lore",
    author: "Friar Tuck",
    title: "Why Robinhood Chain is the Trojan Horse for Decentralized Retail Vengeance",
    readTime: "4 min read",
    cadIcon: "bow",
    paragraphs: [
      "For decades, the stock market has had opening hours. Retail traders are locked out at night and on weekends, while large firms keep hedging in private venues.",
      "Robinhood Chain puts tokenized versions of those stocks on an Arbitrum Orbit L2 that never closes. That changes who is awake when prices move.",
      "Hedgerow is built for exactly those closed-market hours: lending into weekend borrow spikes, laddering into breakouts, and absorbing after-hours earnings moves. Every rule that can be on-chain is on-chain, and every payout is a public transaction.",
      "The vaults are small and simple on purpose. Deposits can always be withdrawn, and the only privileged role can add profit but never remove funds.",
    ],
    related: "midnight",
  },
  {
    category: "Mechanics",
    author: "Little John",
    title: "Baking the Math: How Reverse-PFOF Steals the Spread from Market Makers",
    readTime: "6 min read",
    cadIcon: "mev",
    paragraphs: [
      "Payment for order flow (PFOF) is simple: a broker sends your order to a market maker, and the market maker pays the broker for it. The payment exists because your order is worth something.",
      "Reverse-PFOF keeps that value with the people who created it. Orders are collected into a short private batch, so nobody can front-run them in the public mempool.",
      "Market makers then bid to fill the batch. The winner gives the best price and pays a fee for the flow. That fee goes into the vaults instead of to a broker.",
      "The trade-off is a delay of a few seconds before a swap fills, and it only works once there is enough volume for market makers to compete. It is still a concept and is not deployed yet.",
    ],
    related: "reversePfof",
  },
  {
    category: "Architecture",
    author: "Will Scarlet",
    title: "Arbitrum Orbit + Ethereum Blobs: The Sub-Second Settlement Engine (ID 4663)",
    readTime: "5 min read",
    cadIcon: "gas",
    paragraphs: [
      "Robinhood Chain (chain ID 4663, testnet 46630) is an Arbitrum Orbit rollup. Transactions are ordered by a sequencer and confirmed in well under a second.",
      "Batches of transactions are posted to Ethereum as blobs, which keeps fees low while inheriting Ethereum's security for final settlement.",
      "For Hedgerow this means two things: the sentinel can react to a borrow spike in real time, and a deposit or withdrawal costs a fraction of a cent in gas.",
      "Everything is standard EVM. The vaults are plain Solidity and work with any EIP-1193 wallet, such as MetaMask.",
    ],
    related: "overview",
  },
  {
    category: "Manifesto",
    author: "The Greenwood Guild",
    title: "We Don't Do Catering: Codifying WallStreetBets as an Immutable Financial Weapon",
    readTime: "3 min read",
    cadIcon: "sentinel",
    paragraphs: [
      "Retail traders have shown they can move markets when they act together. What they lacked was a way to coordinate without trusting a broker that can switch off the buy button.",
      "Hedgerow's answer is to put the rules in contracts: anyone can deposit, anyone can withdraw, and profits are split by share count, not by who you know.",
      "We are honest about what is not finished. The strategies run off-chain today through a single sentinel key, and the contracts have not been audited yet. Moving more of that logic on-chain is the roadmap.",
    ],
    related: "weald",
  },
];

export type PageId = "about" | "mechanics" | "governance" | "contact";

export interface InfoPage {
  id: PageId;
  badge: string;
  title: string;
  cadIcon: CadIconName;
  intro: string;
  sections: { title: string; body: string; code?: string }[];
}

export const pages: Record<PageId, InfoPage> = {
  about: {
    id: "about",
    badge: "About us",
    title: "What Hedgerow is",
    cadIcon: "bow",
    intro:
      "Hedgerow is a set of open-source vault contracts on Robinhood Chain that pool ETH from retail stakers and pay out profit from strategies that run while traditional markets are closed.",
    sections: [
      {
        title: "Why Robinhood Chain",
        body: "Robinhood Chain is an Arbitrum Orbit L2 with tokenized equities that trade 24/7. The traditional stock market still closes at night and on weekends, so prices, borrow fees and spreads behave differently in those hours. That gap is what the strategies target.",
      },
      {
        title: "What is live",
        body: "Four ETH vaults (GME, TSLA, NVDA, WEALD), the AmbushController that registers targets and records sweeps, and the $WEALD token. You can deposit and withdraw from any deployed vault through this site with your own wallet.",
      },
      {
        title: "What is not live yet",
        body: "Friar AI Sentinels and Reverse-PFOF are designs without contracts. Equity Baskets has a real contract (BasketVault) that holds the stock tokens itself. Strategy profit for the live vaults is paid in by the sentinel key; the trading itself is not enforced on-chain.",
      },
      {
        title: "Audits",
        body: "The contracts have Hardhat tests but have not had an external security audit. Only deposit what you can afford to lose.",
      },
    ],
  },

  mechanics: {
    id: "mechanics",
    badge: "Mechanics",
    title: "How the vault math works",
    cadIcon: "gauge",
    intro:
      "Every vault uses the same HedgerowVault contract. Your stake is tracked in shares, and the value of one share only goes up when profit is paid in.",
    sections: [
      {
        title: "1. Deposit",
        body: "You send ETH and receive shares. The first deposit is 1 share per 1 ETH; after that, shares are priced at the vault's current share value.",
        code: "shares = assets × totalSupply ÷ totalAssets",
      },
      {
        title: "2. Profit",
        body: "When a strategy makes money, the sentinel calls recordAmbushProfit() and sends that ETH into the vault. totalAssets rises while totalSupply stays the same, so every share is worth more.",
        code: "totalAssets += profit",
      },
      {
        title: "3. Withdraw",
        body: "Burn any number of your shares at any time and receive their current value in ETH. There is no lock-up and no withdrawal fee.",
        code: "assets = shares × totalAssets ÷ totalSupply",
      },
      {
        title: "Example",
        body: "You deposit 1 ETH into an empty vault and get 1 share. The sentinel pays in 0.1 ETH of profit. Your 1 share is now worth 1.1 ETH, which you can withdraw.",
      },
      {
        title: "Safety checks",
        body: "Deposits and withdrawals are reentrancy-guarded, plain ETH sent to a vault without deposit() is rejected, and no role can move user deposits out of a vault.",
      },
    ],
  },

  governance: {
    id: "governance",
    badge: "Governance",
    title: "Who controls what",
    cadIcon: "sentinel",
    intro:
      "Governance today is a single owner key plus a sentinel key. There is no on-chain voting yet. This page lists exactly what each key can and cannot do.",
    sections: [
      {
        title: "Owner (deployer)",
        body: "Can change the sentinel address, register strategy targets in AmbushController, set which controller may mint $WEALD, and mint $WEALD up to the cap. Cannot withdraw user deposits or change share balances.",
      },
      {
        title: "Sentinel",
        body: "Can call executeAmbushSweep() and recordAmbushProfit(), which can only add ETH to a vault. Cannot withdraw or move user funds.",
      },
      {
        title: "$WEALD token",
        body: "Supply starts at 0 with a hard cap of 100,000,000 WEALD. New tokens are minted by the controller each time a sweep is recorded, and the owner can also mint directly, always within the cap. The controller and owner can mark addresses as OG members.",
      },
      {
        title: "Roadmap",
        body: "Move owner powers to a multisig, then to $WEALD holder voting with a timelock so any change is visible on-chain before it takes effect.",
      },
    ],
  },

  contact: {
    id: "contact",
    badge: "Contact",
    title: "Get in touch",
    cadIcon: "actuator",
    intro:
      "Follow announcements on X, verify every contract address on the explorer, and never trust an address you were sent in a DM.",
    sections: [
      {
        title: "Verify before you send",
        body: "The only contract addresses to trust are the ones listed here and on the official website. Hedgerow will never DM you first or ask for your seed phrase.",
      },
    ],
  },
};
