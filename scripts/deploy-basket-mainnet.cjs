/**
 * Deploys the Equity Basket to Robinhood Chain mainnet.
 * The deployer key is typed at a hidden prompt and passed only to the child deploy process;
 * it is never written to disk or printed.
 *
 *   node scripts/deploy-basket-mainnet.cjs
 *   Optional RPC override: set RH_MAINNET_RPC_URL first.
 */
const { spawn } = require("child_process");
const path = require("path");

const rpc = process.env.RH_MAINNET_RPC_URL || "https://robinhood-rpc.publicnode.com";

function askHidden(question) {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    process.stdout.write(question);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    let value = "";
    const onData = (ch) => {
      if (ch === "\r" || ch === "\n" || ch === "\u0004") {
        stdin.setRawMode(false);
        stdin.pause();
        stdin.removeListener("data", onData);
        process.stdout.write("\n");
        resolve(value);
      } else if (ch === "\u0003") {
        process.stdout.write("\nCancelled.\n");
        process.exit(130);
      } else if (ch === "\u0008" || ch === "\u007f") {
        value = value.slice(0, -1);
      } else {
        value += ch; // pasted text arrives as one chunk; nothing is echoed
      }
    };
    stdin.on("data", onData);
  });
}

(async () => {
  console.log(`RPC: ${rpc}`);
  let key = (await askHidden("Paste the deployer private key (input hidden), then press Enter: ")).trim();
  if (!/^(0x)?[0-9a-fA-F]{64}$/.test(key)) {
    console.error("That does not look like a 64-hex-character private key. Nothing was deployed.");
    process.exit(1);
  }
  if (!key.startsWith("0x")) key = "0x" + key;

  const child = spawn("pnpm", ["deploy:basket:mainnet"], {
    cwd: path.join(__dirname, ".."),
    stdio: "inherit",
    shell: true,
    env: { ...process.env, RH_MAINNET_RPC_URL: rpc, DEPLOYER_PRIVATE_KEY: key },
  });
  key = null;
  child.on("exit", (code) => {
    console.log(code === 0 ? "\nDone. The key was only held in memory and is gone." : `\nDeploy failed (exit code ${code}).`);
    process.exit(code ?? 1);
  });
})();
