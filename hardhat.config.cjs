require("@nomicfoundation/hardhat-viem");

const accounts = process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [];

// `pnpm rehearse:basket:mainnet` forks mainnet without needing env-var syntax that differs per shell.
const FORK_URL =
  process.env.FORK_URL ||
  (["rehearse:basket:mainnet", "scenarios:basket:mainnet"].includes(process.env.npm_lifecycle_event)
    ? process.env.RH_MAINNET_RPC_URL || "https://robinhood.drpc.org"
    : undefined);

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: { optimizer: { enabled: true, runs: 200 } },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./.hardhat/cache",
    artifacts: "./.hardhat/artifacts",
  },
  networks: {
    // FORK_URL=<mainnet RPC> runs the in-process chain as a fork of Robinhood Chain mainnet
    // (chain ID 4663) so deploys and swaps can be rehearsed against real contracts for free.
    hardhat: FORK_URL
      ? {
          chainId: 4663,
          forking: { url: FORK_URL },
          // Robinhood Chain is not in Hardhat's built-in list; treat its whole history as Cancun.
          chains: { 4663: { hardforkHistory: { cancun: 0 } } },
        }
      : { chainId: 31337 },
    localhost: { url: "http://127.0.0.1:8545", chainId: 31337 },
    robinhoodTestnet: {
      url: process.env.RH_TESTNET_RPC_URL || "https://rpc.testnet.chain.robinhood.com",
      chainId: 46630,
      accounts,
    },
    robinhood: {
      url: process.env.RH_MAINNET_RPC_URL || "https://rpc.mainnet.chain.robinhood.com",
      chainId: 4663,
      accounts,
    },
  },
};
