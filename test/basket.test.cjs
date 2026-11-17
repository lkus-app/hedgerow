const assert = require("node:assert/strict");
const hre = require("hardhat");
const { parseEther, parseUnits, encodePacked, formatEther } = require("viem");

const USD = (n) => parseUnits(String(n), 8); // Chainlink-style 8-decimal answers
const FEE = 3000;
const path = (a, b) => encodePacked(["address", "uint24", "address"], [a, FEE, b]);
const pct = (part, whole) => Number((part * 10000n) / whole) / 100;

async function setup({ weights = [4000, 3000, 3000], slippage = 100, drift = 200, cooldown = 0 } = {}) {
  const [owner, alice, bob] = await hre.viem.getWalletClients();
  const pc = await hre.viem.getPublicClient();

  const weth = await hre.viem.deployContract("MockWETH");
  const tokens = [
    await hre.viem.deployContract("MockERC20", ["Mock TSLA", "mTSLA", 18]),
    await hre.viem.deployContract("MockERC20", ["Mock NVDA", "mNVDA", 18]),
    await hre.viem.deployContract("MockERC20", ["Mock T-Bill", "mTBILL", 6]),
  ];
  const ethFeed = await hre.viem.deployContract("MockPriceFeed", [8, USD(3000)]);
  const feeds = [
    await hre.viem.deployContract("MockPriceFeed", [8, USD(250)]),
    await hre.viem.deployContract("MockPriceFeed", [8, USD(120)]),
    await hre.viem.deployContract("MockPriceFeed", [8, USD(100)]),
  ];

  const router = await hre.viem.deployContract("MockSwapRouter");
  await router.write.setFeed([weth.address, ethFeed.address]);
  for (let i = 0; i < tokens.length; i++) {
    await router.write.setFeed([tokens[i].address, feeds[i].address]);
    await tokens[i].write.mint([router.address, parseUnits("1000000", await tokens[i].read.decimals())]);
  }
  await weth.write.deposit({ value: parseEther("200") });
  await weth.write.transfer([router.address, parseEther("200")]);

  const components = tokens.map((t, i) => ({
    token: t.address,
    feed: feeds[i].address,
    weightBps: weights[i],
    maxStaleness: 3600,
    buyPath: path(weth.address, t.address),
    sellPath: path(t.address, weth.address),
  }));

  const basket = await hre.viem.deployContract("BasketVault", [
    "Hedgerow Equity Basket",
    "hBASKET",
    weth.address,
    router.address,
    ethFeed.address,
    3600,
    components,
    slippage,
    drift,
    cooldown,
  ]);
  const as = (w) => hre.viem.getContractAt("BasketVault", basket.address, { client: { wallet: w } });
  return { owner, alice, bob, pc, weth, tokens, ethFeed, feeds, router, basket, components, asAlice: await as(alice), asBob: await as(bob) };
}

async function rebalanceFully(basket, max = 20) {
  let calls = 0;
  while ((await basket.read.needsRebalance()) && calls < max) {
    await basket.write.rebalance();
    calls++;
  }
  return calls;
}

async function weightsOf(basket) {
  const [, , , values, , wethValue, nav] = await basket.read.composition();
  return { values: values.map((v) => pct(v, nav)), idle: pct(wethValue, nav), nav };
}

describe("BasketVault", () => {
  it("prices the first deposit in USD and burns minimum liquidity", async () => {
    const { alice, basket, asAlice, weth } = await setup();
    await asAlice.write.deposit([0n], { value: parseEther("1") });
    const shares = await basket.read.balanceOf([alice.account.address]);
    assert.equal(shares, parseEther("3000") - 1000n);
    assert.equal(await basket.read.totalSupply(), parseEther("3000"));
    assert.equal(await weth.read.balanceOf([basket.address]), parseEther("1"));
    assert.equal(await basket.read.needsRebalance(), true);
  });

  it("rebalance() buys the basket at target weights with oracle-bounded swaps", async () => {
    const { basket, asAlice, bob } = await setup();
    await asAlice.write.deposit([0n], { value: parseEther("1") });

    const asBobBasket = await hre.viem.getContractAt("BasketVault", basket.address, { client: { wallet: bob } });
    await asBobBasket.write.rebalance(); // permissionless
    await rebalanceFully(asBobBasket);

    const w = await weightsOf(basket);
    assert.ok(Math.abs(w.values[0] - 40) < 0.5, `TSLA ${w.values[0]}%`);
    assert.ok(Math.abs(w.values[1] - 30) < 0.5, `NVDA ${w.values[1]}%`);
    assert.ok(Math.abs(w.values[2] - 30) < 0.5, `TBILL ${w.values[2]}%`);
    assert.ok(w.idle < 0.5, `idle WETH ${w.idle}%`);
    // Only the 0.3% swap fee is lost.
    assert.ok(w.nav > parseEther("2990") && w.nav < parseEther("3000"), formatEther(w.nav));
    assert.equal(await basket.read.needsRebalance(), false);
    await assert.rejects(asBobBasket.write.rebalance(), /nothing to rebalance/);
  });

  it("sells the overweight slice after a price move", async () => {
    const { basket, asAlice, feeds } = await setup();
    await asAlice.write.deposit([0n], { value: parseEther("1") });
    await rebalanceFully(asAlice);

    await feeds[0].write.setAnswer([USD(500)]); // TSLA doubles
    let w = await weightsOf(basket);
    assert.ok(w.values[0] > 55, `TSLA drifted to ${w.values[0]}%`);
    assert.equal(await basket.read.needsRebalance(), true);

    await rebalanceFully(asAlice);
    w = await weightsOf(basket);
    assert.ok(Math.abs(w.values[0] - 40) < 1, `TSLA back to ${w.values[0]}%`);
    assert.ok(Math.abs(w.values[1] - 30) < 1 && Math.abs(w.values[2] - 30) < 1);
  });

  it("prices later deposits against current NAV", async () => {
    const { basket, asAlice, asBob, bob, feeds } = await setup();
    await asAlice.write.deposit([0n], { value: parseEther("1") });
    await rebalanceFully(asAlice);
    await feeds[0].write.setAnswer([USD(500)]); // basket gains value

    await asBob.write.deposit([0n], { value: parseEther("1") });
    const bobValue = await basket.read.valueOfShares([await basket.read.balanceOf([bob.account.address])]);
    // Bob pays a 0.3% fee ($9) that stays in the vault; he owns about half the vault afterwards,
    // so about half of it comes back to him. He does not share in Alice's earlier gain.
    assert.ok(bobValue > parseEther("2994") && bobValue < parseEther("2996"), formatEther(bobValue));
  });

  it("withdraw() pays out in kind and works even with stale prices", async () => {
    const { alice, pc, basket, asAlice, tokens, feeds, ethFeed } = await setup();
    await asAlice.write.deposit([0n], { value: parseEther("2") });
    await asAlice.write.rebalance();

    const block = await pc.getBlock();
    for (const f of [...feeds, ethFeed]) await f.write.setUpdatedAt([block.timestamp - 7200n]);
    await assert.rejects(asAlice.write.deposit([0n], { value: parseEther("1") }), /stale price/);

    const shares = await basket.read.balanceOf([alice.account.address]);
    const supply = await basket.read.totalSupply();
    const held = await Promise.all(tokens.map((t) => t.read.balanceOf([basket.address])));

    await asAlice.write.withdraw([shares]);
    for (let i = 0; i < tokens.length; i++) {
      assert.equal(await tokens[i].read.balanceOf([alice.account.address]), (held[i] * shares) / supply);
    }
    assert.equal(await basket.read.balanceOf([alice.account.address]), 0n);
    assert.equal(await basket.read.totalSupply(), 1000n); // only the burned minimum remains
  });

  it("withdraw() before any rebalance returns ETH", async () => {
    const { alice, pc, basket, asAlice } = await setup();
    await asAlice.write.deposit([0n], { value: parseEther("1") });
    const before = await pc.getBalance({ address: alice.account.address });
    const hash = await asAlice.write.withdraw([await basket.read.balanceOf([alice.account.address])]);
    const r = await pc.waitForTransactionReceipt({ hash });
    const after = await pc.getBalance({ address: alice.account.address });
    const got = after - before + r.gasUsed * r.effectiveGasPrice;
    assert.ok(got > parseEther("0.999999") && got <= parseEther("1"), formatEther(got));
  });

  it("reverts a rebalance when the swap fills worse than the slippage limit", async () => {
    const { basket, asAlice, router } = await setup({ slippage: 100 });
    await asAlice.write.deposit([0n], { value: parseEther("1") });
    await router.write.setExecutionBps([9800n]); // 2% worse than oracle
    // Every swap is skipped, so the call reverts instead of burning the cooldown.
    await assert.rejects(asAlice.write.rebalance(), /no swap could fill/);
    // Nothing was traded.
    const [, , balances] = await basket.read.composition();
    assert.ok(balances.every((b) => b === 0n));
  });

  it("enforces minShares, the cooldown and plain-ETH rejection", async () => {
    const { alice, asAlice, basket } = await setup({ cooldown: 3600 });
    await assert.rejects(asAlice.write.deposit([parseEther("4000")], { value: parseEther("1") }), /slippage/);
    await asAlice.write.deposit([0n], { value: parseEther("1") });
    await asAlice.write.rebalance();
    await assert.rejects(alice.sendTransaction({ to: basket.address, value: 1n }), /use deposit/);
    assert.equal(await basket.read.needsRebalance(), false);
  });

  it("limits the owner to pausing deposits and capped parameters", async () => {
    const { basket, asAlice, alice } = await setup();
    await assert.rejects(asAlice.write.setParams([50, 100, 0]), /not owner/);
    await assert.rejects(basket.write.setParams([600, 100, 0]), /slippage cap/);
    await basket.write.setDepositsPaused([true]);
    await assert.rejects(asAlice.write.deposit([0n], { value: parseEther("1") }), /deposits paused/);
  });

  it("validates weights and swap paths at deployment", async () => {
    const ctx = await setup();
    const bad = (components) =>
      hre.viem.deployContract("BasketVault", ["x", "x", ctx.weth.address, ctx.router.address, ctx.ethFeed.address, 3600, components, 100, 200, 0]);
    await assert.rejects(bad(ctx.components.map((c) => ({ ...c, weightBps: 3000 }))), /sum to 100%/);
    const swapped = ctx.components.map((c, i) => (i === 0 ? { ...c, buyPath: c.sellPath } : c));
    await assert.rejects(bad(swapped), /bad buy path/);
  });
  it("caps every swap at maxSwapUsd and finishes large rebalances over several calls", async () => {
    const { basket, asAlice, pc } = await setup();
    await asAlice.write.deposit([0n], { value: parseEther("2") }); // $6000 to invest
    const calls = await rebalanceFully(asAlice);
    assert.ok(calls >= 2, `took ${calls} calls`);
    const logs = await pc.getContractEvents({ address: basket.address, abi: basket.abi, eventName: "Swapped", fromBlock: 0n });
    const maxEthIn = parseEther("500") / 3000n + 1n; // $500 cap at $3000/ETH
    for (const l of logs) assert.ok(l.args.amountIn <= maxEthIn, `swap of ${formatEther(l.args.amountIn)} WETH exceeds cap`);
    const w = await weightsOf(basket);
    assert.ok(Math.abs(w.values[0] - 40) < 2 && w.idle < 2, JSON.stringify(w.values));
  });

  it("keeps the deposit fee in the vault for existing holders", async () => {
    const { basket, asAlice, asBob, alice } = await setup();
    await asAlice.write.deposit([0n], { value: parseEther("1") });
    const aliceShares = await basket.read.balanceOf([alice.account.address]);
    const before = await basket.read.valueOfShares([aliceShares]);
    await asBob.write.deposit([0n], { value: parseEther("1") });
    const after = await basket.read.valueOfShares([aliceShares]);
    // Bob's $9 fee stays in the vault; Alice owns about half of it afterwards, so she gains about $4.50.
    assert.ok(after - before > parseEther("4.4") && after - before < parseEther("4.6"), formatEther(after - before));
  });

  it("bounds trade limits set by the owner", async () => {
    const { basket, asAlice } = await setup();
    await assert.rejects(asAlice.write.setTradeLimits([parseEther("1000"), 10]), /not owner/);
    await assert.rejects(basket.write.setTradeLimits([parseEther("1"), 10]), /swap cap too low/);
    await assert.rejects(basket.write.setTradeLimits([parseEther("1000"), 101]), /fee cap/);
    await basket.write.setTradeLimits([parseEther("5000"), 0]);
    assert.equal(await basket.read.maxSwapUsd(), parseEther("5000"));
    assert.equal(await basket.read.depositFeeBps(), 0);
  });
  it("skips one pool that cannot fill and still trades the others", async () => {
    const { basket, asAlice, router, tokens, pc } = await setup();
    await asAlice.write.deposit([0n], { value: parseEther("0.2") }); // $600
    await router.write.setBadTokenOut([tokens[1].address]); // NVDA pool fills 10% below oracle
    await asAlice.write.rebalance();
    const [, , balances] = await basket.read.composition();
    assert.ok(balances[0] > 0n && balances[2] > 0n, "TSLA and T-Bill were bought");
    assert.equal(balances[1], 0n, "NVDA swap was skipped");
    const skipped = await pc.getContractEvents({ address: basket.address, abi: basket.abi, eventName: "SwapSkipped", fromBlock: 0n });
    assert.equal(skipped.length, 1);
    await router.write.setBadTokenOut(["0x0000000000000000000000000000000000000000"]);
    await rebalanceFully(asAlice);
    assert.ok((await basket.read.composition())[2][1] > 0n, "NVDA bought once its pool recovered");
  });
});
