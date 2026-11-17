const assert = require("node:assert/strict");
const hre = require("hardhat");
const { parseEther, keccak256, toHex } = require("viem");

const ZERO = "0x0000000000000000000000000000000000000000";

async function setup() {
  const [owner, alice, bob] = await hre.viem.getWalletClients();
  const pc = await hre.viem.getPublicClient();
  const weald = await hre.viem.deployContract("WealdToken");
  const controller = await hre.viem.deployContract("AmbushController", [owner.account.address, weald.address]);
  await weald.write.setAmbushController([controller.address]);
  const vault = await hre.viem.deployContract("HedgerowVault", ["Hedgerow GME", "hGME", ZERO, weald.address, controller.address]);
  await controller.write.registerTarget(["GME-RWA", vault.address]);
  const asAlice = await hre.viem.getContractAt("HedgerowVault", vault.address, { client: { wallet: alice } });
  const asBob = await hre.viem.getContractAt("HedgerowVault", vault.address, { client: { wallet: bob } });
  return { owner, alice, bob, pc, weald, controller, vault, asAlice, asBob };
}

describe("HedgerowVault (native ETH)", () => {
  it("mints shares 1:1 on first deposit and tracks ETH", async () => {
    const { alice, pc, vault, asAlice } = await setup();
    const amt = parseEther("0.25");
    await asAlice.write.deposit([amt, alice.account.address], { value: amt });
    assert.equal(await vault.read.balanceOf([alice.account.address]), amt);
    assert.equal(await vault.read.totalAssets(), amt);
    assert.equal(await pc.getBalance({ address: vault.address }), amt);
  });

  it("rejects mismatched msg.value and plain ETH transfers", async () => {
    const { alice, vault, asAlice } = await setup();
    await assert.rejects(asAlice.write.deposit([parseEther("1"), alice.account.address], { value: parseEther("0.5") }), /invalid ETH value/);
    await assert.rejects(alice.sendTransaction({ to: vault.address, value: 1n }), /use deposit/);
  });

  it("distributes ambush profit pro-rata and pays it out on withdraw", async () => {
    const { alice, bob, pc, controller, vault, asAlice, asBob } = await setup();
    await asAlice.write.deposit([parseEther("1"), alice.account.address], { value: parseEther("1") });
    await asBob.write.deposit([parseEther("3"), bob.account.address], { value: parseEther("3") });

    const key = keccak256(toHex("GME-RWA"));
    await controller.write.executeAmbushSweep([key, 14200n], { value: parseEther("0.4") });
    assert.equal(await vault.read.totalAssets(), parseEther("4.4"));

    const shares = await vault.read.balanceOf([alice.account.address]);
    assert.equal(await vault.read.convertToAssets([shares]), parseEther("1.1"));

    const before = await pc.getBalance({ address: alice.account.address });
    const hash = await asAlice.write.withdraw([shares, alice.account.address]);
    const r = await pc.waitForTransactionReceipt({ hash });
    const after = await pc.getBalance({ address: alice.account.address });
    assert.equal(after - before + r.gasUsed * r.effectiveGasPrice, parseEther("1.1"));
    assert.equal(await vault.read.balanceOf([alice.account.address]), 0n);
  });

  it("blocks withdrawing more shares than owned and non-sentinel profit", async () => {
    const { alice, bob, asAlice, asBob } = await setup();
    await asAlice.write.deposit([parseEther("1"), alice.account.address], { value: parseEther("1") });
    await assert.rejects(asBob.write.withdraw([1n, bob.account.address]), /insufficient shares/);
    await assert.rejects(asBob.write.recordAmbushProfit([1n], { value: 1n }), /not sentinel/);
  });
});

describe("AmbushController", () => {
  it("does not duplicate target keys on re-register", async () => {
    const { controller, vault } = await setup();
    await controller.write.registerTarget(["GME-RWA", vault.address]);
    await controller.read.activeTargetKeys([0n]);
    await assert.rejects(controller.read.activeTargetKeys([1n]));
  });
});
