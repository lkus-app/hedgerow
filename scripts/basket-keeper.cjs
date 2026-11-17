/**
 * Rebalance keeper: checks needsRebalance() on an interval and calls rebalance() when true.
 * rebalance() is permissionless and oracle-bounded, so this key has no special power;
 * it only pays gas.
 *
 *   BASKET_VAULT=0x... DEPLOYER_PRIVATE_KEY=0x... pnpm keeper:basket --network robinhoodTestnet
 *   KEEPER_ONCE=1 runs a single check.
 */
const hre = require("hardhat");

const INTERVAL_MS = Number(process.env.KEEPER_INTERVAL_MS || 60_000);
const ONCE = process.env.KEEPER_ONCE === "1";

async function main() {
  const address = process.env.BASKET_VAULT;
  if (!address) throw new Error("Set BASKET_VAULT to the deployed BasketVault address.");
  const basket = await hre.viem.getContractAt("BasketVault", address);
  const pc = await hre.viem.getPublicClient();

  for (;;) {
    try {
      if (await basket.read.needsRebalance()) {
        const hash = await basket.write.rebalance();
        const r = await pc.waitForTransactionReceipt({ hash });
        console.log(new Date().toISOString(), "rebalanced", hash, r.status);
      } else {
        console.log(new Date().toISOString(), "balanced, nothing to do");
      }
    } catch (e) {
      console.error(new Date().toISOString(), "keeper error:", e.shortMessage || e.message);
    }
    if (ONCE) return;
    await new Promise((r) => setTimeout(r, INTERVAL_MS));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
