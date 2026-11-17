// Deploys $WEALD, the AmbushController and one native-ETH vault per strategy,
// then writes the addresses to deployments/<chainId>.json and prints the
// NEXT_PUBLIC_* lines to paste into .env.local.
//
//   npx hardhat run scripts/deploy.cjs --network robinhoodTestnet
const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

const VAULTS = [
  { id: "GME", name: "Hedgerow GME-RWA Sunday Squeeze", symbol: "hGME" },
  { id: "NVDA", name: "Hedgerow NVDA-RWA Dark Hours Straddle", symbol: "hNVDA" },
  { id: "TSLA", name: "Hedgerow TSLA-RWA Gamma Ladder", symbol: "hTSLA" },
  { id: "WEALD", name: "Hedgerow WEALD Genesis Staking", symbol: "hWEALD" },
];
const ZERO = "0x0000000000000000000000000000000000000000";

async function main() {
  const publicClient = await hre.viem.getPublicClient();
  const [deployer] = await hre.viem.getWalletClients();
  if (!deployer) throw new Error("No deployer account. Set DEPLOYER_PRIVATE_KEY.");
  const chainId = await publicClient.getChainId();
  console.log(`Deploying from ${deployer.account.address} on chain ${chainId}`);

  const weald = await hre.viem.deployContract("WealdToken");
  console.log("WealdToken       ", weald.address);

  const controller = await hre.viem.deployContract("AmbushController", [deployer.account.address, weald.address]);
  console.log("AmbushController ", controller.address);

  await publicClient.waitForTransactionReceipt({ hash: await weald.write.setAmbushController([controller.address]) });

  const vaults = {};
  for (const v of VAULTS) {
    const vault = await hre.viem.deployContract("HedgerowVault", [v.name, v.symbol, ZERO, weald.address, controller.address]);
    await publicClient.waitForTransactionReceipt({ hash: await controller.write.registerTarget([`${v.id}-RWA`, vault.address]) });
    vaults[v.id] = vault.address;
    console.log(`Vault ${v.id.padEnd(11)}`, vault.address);
  }

  const out = { chainId, deployer: deployer.account.address, wealdToken: weald.address, ambushController: controller.address, vaults };
  const dir = path.join(__dirname, "..", "deployments");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${chainId}.json`), JSON.stringify(out, null, 2) + "\n");

  console.log("\nAdd to .env.local:");
  console.log(`NEXT_PUBLIC_CHAIN_ID=${chainId}`);
  for (const [id, addr] of Object.entries(vaults)) console.log(`NEXT_PUBLIC_VAULT_${id}=${addr}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
