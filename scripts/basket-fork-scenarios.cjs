/**
 * Adversarial scenarios for BasketVault against real Robinhood Chain mainnet pools and feeds,
 * on a local fork. Nothing is broadcast.
 *   pnpm scenarios:basket:mainnet
 */
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const assert = require("node:assert/strict");
const { encodePacked, parseAbi, parseEther, formatEther } = require("viem");

const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "config", "basket.4663.json"), "utf8"));
const wethAbi = parseAbi([
  "function deposit() payable",
  "function approve(address,uint256) returns (bool)",
  "function balanceOf(address) view returns (uint256)",
]);
const routerAbi = parseAbi([
  "struct P { address tokenIn; address tokenOut; uint24 fee; address recipient; uint256 amountIn; uint256 amountOutMinimum; uint160 sqrtPriceLimitX96; }",
  "function exactInputSingle(P params) payable returns (uint256)",
]);

const results = [];
const check = async (name, fn) => {
  try {
    const note = await fn();
    results.push(`PASS  ${name}${note ? ` (${note})` : ""}`);
  } catch (e) {
    results.push(`FAIL  ${name}: ${e.shortMessage || e.message}`);
    if (process.env.SCENARIO_DEBUG) {
      console.error(`--- ${name}`);
      console.error(String(e.details || ""));
      console.error(String(e.cause?.message || e.message).slice(0, 1500));
    }
  }
};

async function deployBasket() {
  const components = cfg.components.map((c) => ({
    token: c.token,
    feed: c.feed,
    weightBps: c.weightBps,
    maxStaleness: c.maxStaleness,
    buyPath: encodePacked(["address", "uint24", "address"], [cfg.weth, c.poolFee, c.token]),
    sellPath: encodePacked(["address", "uint24", "address"], [c.token, c.poolFee, cfg.weth]),
  }));
  return hre.viem.deployContract("BasketVault", [
    cfg.name, cfg.symbol, cfg.weth, cfg.router, cfg.ethUsdFeed, cfg.ethMaxStaleness, components,
    cfg.maxSlippageBps, cfg.driftBps, cfg.rebalanceCooldown,
  ]);
}

async function main() {
  if (hre.network.name !== "hardhat" || (await (await hre.viem.getPublicClient()).getChainId()) !== 4663) {
    throw new Error("Run with `pnpm scenarios:basket:mainnet` (mainnet fork only).");
  }
  const pc = await hre.viem.getPublicClient();
  await pc.request({ method: "hardhat_mine", params: ["0x1"] });
  const [deployer, alice, attacker] = await hre.viem.getWalletClients();
  const asW = (c, name, w) => hre.viem.getContractAt(name, c.address, { client: { wallet: w } });
  const wait = async (h) => {
    const r = await pc.waitForTransactionReceipt({ hash: h });
    if (r.status !== "success") throw new Error("reverted");
    return r;
  };
  const navUsd = async (b) => Number(formatEther((await b.read.composition())[6]));

  // 1. Small deposit, rebalance, and a second depositor priced at NAV.
  let basket = await deployBasket();
  await check("deposit 0.01 ETH and rebalance into 4 stocks", async () => {
    await wait(await (await asW(basket, "BasketVault", alice)).write.deposit([0n], { value: parseEther("0.01") }));
    const r = await wait(await basket.write.rebalance());
    const [, , balances] = await basket.read.composition();
    assert.ok(balances.every((b) => b > 0n), "every token bought");
    return `gas ${r.gasUsed}, NAV $${(await navUsd(basket)).toFixed(2)}`;
  });

  const snapshot = () => pc.request({ method: "evm_snapshot", params: [] });
  const restore = (id) => pc.request({ method: "evm_revert", params: [id] });

  // 2. Sandwich: attacker pumps the NVDA pool, then triggers rebalance to make the vault buy high.
  const snap = await snapshot();
  await check("sandwich: a pumped NVDA pool is skipped, the vault never buys NVDA high", async () => {
    const b = await deployBasket();
    await wait(await (await asW(b, "BasketVault", alice)).write.deposit([0n], { value: parseEther("0.05") }));
    const nvda = cfg.components.find((c) => c.label === "NVDA");
    const atk = { account: attacker.account };
    const wethC = { address: cfg.weth, abi: wethAbi };
    await wait(await attacker.writeContract({ ...wethC, functionName: "deposit", value: parseEther("100"), ...atk }));
    await wait(await attacker.writeContract({ ...wethC, functionName: "approve", args: [cfg.router, parseEther("100")], ...atk }));
    await wait(
      await attacker.writeContract({
        address: cfg.router, abi: routerAbi, functionName: "exactInputSingle", ...atk,
        args: [{ tokenIn: cfg.weth, tokenOut: nvda.token, fee: nvda.poolFee, recipient: attacker.account.address,
                 amountIn: parseEther("60"), amountOutMinimum: 0n, sqrtPriceLimitX96: 0n }],
      })
    );
    const r = await wait(await b.write.rebalance());
    const skipped = await pc.getContractEvents({ address: b.address, abi: b.abi, eventName: "SwapSkipped", fromBlock: r.blockNumber, toBlock: r.blockNumber });
    const [tokens, , balances] = await b.read.composition();
    const i = tokens.findIndex((t) => t.toLowerCase() === nvda.token.toLowerCase());
    assert.equal(balances[i], 0n, "vault must not buy NVDA from the pumped pool");
    assert.ok(skipped.some((l) => l.args.tokenOut.toLowerCase() === nvda.token.toLowerCase()));
    const others = balances.filter((_, j) => j !== i);
    return `NVDA buy skipped; ${others.filter((x) => x > 0n).length}/3 other stocks bought normally`;
  });

  await restore(snap);

  // 3. A large deposit is invested in capped chunks over several rebalance() calls.
  await check("10 ETH deposit is invested in capped chunks", async () => {
    const id = await snapshot();
    try {
      const b = await deployBasket();
      await wait(await (await asW(b, "BasketVault", alice)).write.deposit([0n], { value: parseEther("10") }));
      let calls = 0;
      while ((await b.read.needsRebalance()) || calls === 0) {
        try {
          await wait(await b.write.rebalance());
        } catch (e) {
          if (/no swap could fill/.test(e.details || e.message)) break; // every remaining pool is out of range
          throw e;
        }
        calls++;
        if (calls > 40) throw new Error("did not converge in 40 calls");
        await pc.request({ method: "evm_increaseTime", params: [cfg.rebalanceCooldown + 1] });
        await pc.request({ method: "hardhat_mine", params: ["0x1"] });
      }
      const [, , , values, , wethValue, nav] = await b.read.composition();
      const pct = (v) => Number((v * 10000n) / nav) / 100;
      const invested = 100 - pct(wethValue);
      if (invested < 50) throw new Error(`only ${invested}% invested after ${calls} calls`);
      return `${calls} calls; NAV $${Number(formatEther(nav)).toFixed(0)}; weights ${values.map(pct).join("/")}%, idle WETH ${pct(wethValue)}% (no arbitrage bots on a fork, so thin pools stay moved)`;
    } finally {
      await restore(id);
    }
  });

  // 4. Stale prices: jump 2 days ahead. Deposits and rebalances stop, withdrawals still work.
  await check("stale feeds block deposit/rebalance but not withdraw", async () => {
    await pc.request({ method: "evm_increaseTime", params: [2 * 86400] });
    await pc.request({ method: "hardhat_mine", params: ["0x1"] });
    const v = await asW(basket, "BasketVault", alice);
    await assert.rejects(v.write.deposit([0n], { value: parseEther("0.01") }), /stale price/);
    assert.equal(await basket.read.needsRebalance(), false);
    const shares = await basket.read.balanceOf([alice.account.address]);
    await wait(await v.write.withdraw([shares]));
    assert.equal(await basket.read.balanceOf([alice.account.address]), 0n);
    return "withdrew all shares in kind while prices were stale";
  });

  console.log("\nBasketVault mainnet-fork scenarios\n" + results.join("\n"));
  if (results.some((r) => r.startsWith("FAIL"))) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
