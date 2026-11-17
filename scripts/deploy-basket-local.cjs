/**
 * Local-only: deploys mock WETH, mock stock tokens, mock Chainlink feeds and a mock
 * Uniswap router, then a real BasketVault wired to them. Refuses to run on any other chain.
 *   pnpm chain:local            (terminal 1)
 *   pnpm deploy:basket:local    (terminal 2)
 */
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const { encodePacked, parseEther, parseUnits } = require("viem");

const USD = (n) => parseUnits(String(n), 8);

async function main() {
  const pc = await hre.viem.getPublicClient();
  const chainId = await pc.getChainId();
  if (chainId !== 31337) throw new Error(`deploy-basket-local only runs on the local Hardhat chain (got ${chainId}).`);

  const weth = await hre.viem.deployContract("MockWETH");
  const ethFeed = await hre.viem.deployContract("MockPriceFeed", [8, USD(3000)]);
  const router = await hre.viem.deployContract("MockSwapRouter");
  await router.write.setFeed([weth.address, ethFeed.address]);

  const specs = [
    { name: "Mock Tesla", symbol: "mTSLA", decimals: 18, price: 250, weight: 4000 },
    { name: "Mock NVIDIA", symbol: "mNVDA", decimals: 18, price: 120, weight: 3000 },
    { name: "Mock T-Bill", symbol: "mTBILL", decimals: 6, price: 100, weight: 3000 },
  ];
  const components = [];
  const out = { chainId, weth: weth.address, ethUsdFeed: ethFeed.address, router: router.address, tokens: {} };
  for (const s of specs) {
    const t = await hre.viem.deployContract("MockERC20", [s.name, s.symbol, s.decimals]);
    const f = await hre.viem.deployContract("MockPriceFeed", [8, USD(s.price)]);
    await router.write.setFeed([t.address, f.address]);
    await t.write.mint([router.address, parseUnits("1000000", s.decimals)]);
    components.push({
      token: t.address,
      feed: f.address,
      weightBps: s.weight,
      maxStaleness: 365 * 24 * 3600,
      buyPath: encodePacked(["address", "uint24", "address"], [weth.address, 3000, t.address]),
      sellPath: encodePacked(["address", "uint24", "address"], [t.address, 3000, weth.address]),
    });
    out.tokens[s.symbol] = { token: t.address, feed: f.address };
  }
  await weth.write.deposit({ value: parseEther("500") });
  await weth.write.transfer([router.address, parseEther("500")]);

  const basket = await hre.viem.deployContract("BasketVault", [
    "Hedgerow Equity Basket (local)",
    "hBASKET",
    weth.address,
    router.address,
    ethFeed.address,
    365 * 24 * 3600,
    components,
    100,
    200,
    0,
  ]);
  out.basketVault = basket.address;

  const dir = path.join(__dirname, "..", "deployments");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `basket-${chainId}.json`), JSON.stringify(out, null, 2) + "\n");
  console.log("BasketVault (local, mock markets)", basket.address);
  console.log(`\nAdd to .env.local:\nNEXT_PUBLIC_BASKET_VAULT=${basket.address}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
