/**
 * Deploys BasketVault to a real network using config/basket.<chainId>.json.
 * Every address is checked on-chain before deploying; nothing is guessed.
 *
 *   cp config/basket.example.json config/basket.46630.json   # fill in real addresses
 *   DEPLOYER_PRIVATE_KEY=0x... pnpm deploy:basket:testnet
 */
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const { encodePacked, getAddress, isAddress, parseAbi } = require("viem");

const erc20 = parseAbi(["function decimals() view returns (uint8)", "function symbol() view returns (string)"]);
const feedAbi = parseAbi([
  "function decimals() view returns (uint8)",
  "function description() view returns (string)",
  "function latestRoundData() view returns (uint80,int256,uint256,uint256,uint80)",
]);

function fail(msg) {
  throw new Error(`Basket config: ${msg}`);
}

async function main() {
  const pc = await hre.viem.getPublicClient();
  const chainId = await pc.getChainId();
  if (chainId === 31337) fail("use `pnpm deploy:basket:local` on the local chain.");
  // On a fork, mine one local block so reads run at a block the fork node owns.
  if (hre.network.name === "hardhat") await pc.request({ method: "hardhat_mine", params: ["0x1"] });

  const file = path.join(__dirname, "..", "config", `basket.${chainId}.json`);
  if (!fs.existsSync(file)) {
    fail(`missing ${path.relative(process.cwd(), file)}. Copy config/basket.example.json and fill in real addresses.`);
  }
  const cfg = JSON.parse(fs.readFileSync(file, "utf8"));

  const addr = (label, v) => {
    if (!isAddress(v || "")) fail(`${label} is not a valid address: ${JSON.stringify(v)}`);
    return getAddress(v);
  };
  const mustHaveCode = async (label, a) => {
    const code = await pc.getCode({ address: a });
    if (!code || code === "0x") fail(`${label} ${a} has no contract code on chain ${chainId}.`);
  };
  const now = BigInt(Math.floor(Date.now() / 1000));
  const checkFeed = async (label, a, maxStaleness) => {
    await mustHaveCode(label, a);
    const [, answer, , updatedAt] = await pc.readContract({ address: a, abi: feedAbi, functionName: "latestRoundData" });
    const desc = await pc.readContract({ address: a, abi: feedAbi, functionName: "description" }).catch(() => "?");
    if (answer <= 0n) fail(`${label} (${desc}) returned a non-positive price.`);
    const age = now - updatedAt;
    console.log(`  ${label.padEnd(18)} ${String(desc).padEnd(16)} age ${age}s`);
    if (age > BigInt(maxStaleness)) {
      console.warn(`  ! ${label} is older than maxStaleness (${maxStaleness}s); deposits stay blocked until it updates.`);
    }
  };

  const weth = addr("weth", cfg.weth);
  const router = addr("router (SwapRouter02)", cfg.router);
  const ethUsdFeed = addr("ethUsdFeed", cfg.ethUsdFeed);
  await mustHaveCode("weth", weth);
  await mustHaveCode("router", router);
  console.log("Checking price feeds:");
  await checkFeed("ETH/USD", ethUsdFeed, cfg.ethMaxStaleness);

  if (!Array.isArray(cfg.components) || cfg.components.length === 0) fail("components is empty.");
  const total = cfg.components.reduce((s, c) => s + Number(c.weightBps), 0);
  if (total !== 10000) fail(`weights sum to ${total}, must be 10000.`);

  const components = [];
  for (const c of cfg.components) {
    const token = addr(`${c.label} token`, c.token);
    const feed = addr(`${c.label} feed`, c.feed);
    await mustHaveCode(`${c.label} token`, token);
    const symbol = await pc.readContract({ address: token, abi: erc20, functionName: "symbol" });
    const decimals = await pc.readContract({ address: token, abi: erc20, functionName: "decimals" });
    console.log(`  token ${c.label}: ${symbol} (${decimals} decimals) weight ${c.weightBps / 100}%`);
    await checkFeed(`${c.label}/USD`, feed, c.maxStaleness);

    // Direct WETH<->token pool by default; set "via" + "viaFee" for a two-hop route (e.g. through USDC).
    const fee = Number(c.poolFee);
    let buyPath;
    let sellPath;
    if (c.via) {
      const via = addr(`${c.label} via`, c.via);
      const viaFee = Number(c.viaFee);
      buyPath = encodePacked(["address", "uint24", "address", "uint24", "address"], [weth, viaFee, via, fee, token]);
      sellPath = encodePacked(["address", "uint24", "address", "uint24", "address"], [token, fee, via, viaFee, weth]);
    } else {
      buyPath = encodePacked(["address", "uint24", "address"], [weth, fee, token]);
      sellPath = encodePacked(["address", "uint24", "address"], [token, fee, weth]);
    }
    components.push({ token, feed, weightBps: Number(c.weightBps), maxStaleness: Number(c.maxStaleness), buyPath, sellPath });
  }

  const [deployer] = await hre.viem.getWalletClients();
  if (!deployer) fail("no deployer account. Set DEPLOYER_PRIVATE_KEY.");
  console.log(`\nDeploying BasketVault from ${deployer.account.address} on chain ${chainId}`);
  const basket = await hre.viem.deployContract("BasketVault", [
    cfg.name,
    cfg.symbol,
    weth,
    router,
    ethUsdFeed,
    Number(cfg.ethMaxStaleness),
    components,
    Number(cfg.maxSlippageBps),
    Number(cfg.driftBps),
    Number(cfg.rebalanceCooldown),
  ]);

  if (hre.network.name === "hardhat") {
    // FORK_URL rehearsal: nothing is broadcast, so exercise the vault against the real pools and feeds.
    await rehearse(basket, pc, deployer);
    return;
  }

  const out = { chainId, deployer: deployer.account.address, basketVault: basket.address, config: cfg };
  const dir = path.join(__dirname, "..", "deployments");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `basket-${chainId}.json`), JSON.stringify(out, null, 2) + "\n");
  console.log("BasketVault", basket.address);
  console.log(`\nAdd to your env:\nNEXT_PUBLIC_BASKET_VAULT=${basket.address}`);
}

async function rehearse(basket, pc, deployer) {
  const { parseEther, formatEther } = require("viem");
  const show = async (label) => {
    const [tokens, , balances, values, , wethValue, nav, fresh] = await basket.read.composition();
    console.log(`\n${label}: NAV $${Number(formatEther(nav)).toFixed(2)} (prices fresh: ${fresh})`);
    for (let i = 0; i < tokens.length; i++) {
      const pct = nav ? Number((values[i] * 10000n) / nav) / 100 : 0;
      console.log(`  ${tokens[i]}  ${formatEther(balances[i])}  $${Number(formatEther(values[i])).toFixed(2)}  ${pct}%`);
    }
    console.log(`  idle WETH $${Number(formatEther(wethValue)).toFixed(2)}`);
  };
  const wait = async (hash) => {
    const r = await pc.waitForTransactionReceipt({ hash });
    if (r.status !== "success") throw new Error(`tx ${hash} reverted`);
    return r;
  };

  console.log("\nREHEARSAL on a mainnet fork (nothing is broadcast)");
  const amount = parseEther(process.env.REHEARSE_ETH || "0.002");
  await wait(await basket.write.deposit([0n], { value: amount }));
  await show(`After depositing ${formatEther(amount)} ETH`);
  const r = await wait(await basket.write.rebalance());
  console.log(`\nrebalance() gas used: ${r.gasUsed}`);
  await show("After rebalance");
  const shares = await basket.read.balanceOf([deployer.account.address]);
  const before = await pc.getBalance({ address: deployer.account.address });
  await wait(await basket.write.withdraw([shares]));
  const after = await pc.getBalance({ address: deployer.account.address });
  console.log(`\nWithdrew all shares in kind; ETH change incl. gas: ${formatEther(after - before)}`);
  await show("After withdraw");
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
