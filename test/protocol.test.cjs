const assert = require("node:assert/strict");
const hre = require("hardhat");
const { parseEther, keccak256, toHex } = require("viem");

const ZERO = "0x0000000000000000000000000000000000000000";
const KEY = keccak256(toHex("GME-RWA"));

async function setup({ erc20Asset = false } = {}) {
  const [owner, alice, bob, mallory] = await hre.viem.getWalletClients();
  const pc = await hre.viem.getPublicClient();
  const weald = await hre.viem.deployContract("WealdToken");
  const controller = await hre.viem.deployContract("AmbushController", [owner.account.address, weald.address]);
  await weald.write.setAmbushController([controller.address]);
  let asset;
  if (erc20Asset) {
    asset = await hre.viem.deployContract("MockERC20", ["Mock Stock", "mSTK", 18]);
    for (const w of [owner, alice, bob]) await asset.write.mint([w.account.address, parseEther("1000")]);
  }
  const vault = await hre.viem.deployContract("HedgerowVault", ["Hedgerow GME", "hGME", asset ? asset.address : ZERO, weald.address, controller.address]);
  await controller.write.registerTarget(["GME-RWA", vault.address]);
  const as = async (c, name, w) => hre.viem.getContractAt(name, c.address, { client: { wallet: w } });
  return {
    owner, alice, bob, mallory, pc, weald, controller, vault, asset,
    vaultAs: (w) => as(vault, "HedgerowVault", w),
    tokenAs: (w) => as(asset, "MockERC20", w),
    controllerAs: (w) => as(controller, "AmbushController", w),
    wealdAs: (w) => as(weald, "WealdToken", w),
  };
}

describe("HedgerowVault: accounting", () => {
  it("late depositors do not capture profit recorded before they joined", async () => {
    const { alice, bob, vault, controller, vaultAs } = await setup();
    await (await vaultAs(alice)).write.deposit([parseEther("1"), alice.account.address], { value: parseEther("1") });
    await controller.write.executeAmbushSweep([KEY, 10_000n], { value: parseEther("0.5") }); // +50%
    await (await vaultAs(bob)).write.deposit([parseEther("1.5"), bob.account.address], { value: parseEther("1.5") });

    const aliceVal = await vault.read.convertToAssets([await vault.read.balanceOf([alice.account.address])]);
    const bobVal = await vault.read.convertToAssets([await vault.read.balanceOf([bob.account.address])]);
    assert.equal(aliceVal, parseEther("1.5"));
    assert.equal(bobVal, parseEther("1.5"));
  });

  it("supports partial withdrawals and rejects over-withdrawal", async () => {
    const { alice, vault, vaultAs } = await setup();
    const v = await vaultAs(alice);
    await v.write.deposit([parseEther("2"), alice.account.address], { value: parseEther("2") });
    await v.write.withdraw([parseEther("0.5"), alice.account.address]);
    assert.equal(await vault.read.balanceOf([alice.account.address]), parseEther("1.5"));
    await assert.rejects(v.write.withdraw([parseEther("2"), alice.account.address]), /insufficient shares/);
    await assert.rejects(v.write.withdraw([0n, alice.account.address]), /zero shares/);
  });

  it("only the sentinel or owner can record profit, and only when there are stakers", async () => {
    const { alice, mallory, vault, vaultAs } = await setup();
    await assert.rejects(vault.write.recordAmbushProfit([1n], { value: 1n }), /no stakers/);
    await (await vaultAs(alice)).write.deposit([parseEther("1"), alice.account.address], { value: parseEther("1") });
    await assert.rejects((await vaultAs(mallory)).write.recordAmbushProfit([1n], { value: 1n }), /not sentinel/);
    await assert.rejects(vault.write.recordAmbushProfit([2n], { value: 1n }), /invalid profit payload/);
  });

  it("no role can take user deposits: the owner cannot withdraw shares it does not hold", async () => {
    const { owner, alice, vault, vaultAs } = await setup();
    await (await vaultAs(alice)).write.deposit([parseEther("1"), alice.account.address], { value: parseEther("1") });
    await assert.rejects(vault.write.withdraw([1n, owner.account.address]), /insufficient shares/);
  });
});

describe("HedgerowVault: ERC-20 asset", () => {
  it("pulls tokens on deposit, rejects ETH, and returns tokens on withdraw", async () => {
    const { alice, vault, asset, vaultAs, tokenAs } = await setup({ erc20Asset: true });
    await (await tokenAs(alice)).write.approve([vault.address, parseEther("10")]);
    const v = await vaultAs(alice);
    await assert.rejects(v.write.deposit([parseEther("1"), alice.account.address], { value: 1n }), /ETH not accepted/);
    await v.write.deposit([parseEther("10"), alice.account.address]);
    assert.equal(await asset.read.balanceOf([vault.address]), parseEther("10"));
    await v.write.withdraw([parseEther("10"), alice.account.address]);
    assert.equal(await asset.read.balanceOf([alice.account.address]), parseEther("1000"));
  });
});

describe("AmbushController", () => {
  it("rejects unknown targets and non-sentinel callers", async () => {
    const { mallory, controller, controllerAs } = await setup();
    await assert.rejects(controller.write.executeAmbushSweep([keccak256(toHex("NOPE")), 1n]), /target not found/);
    await assert.rejects((await controllerAs(mallory)).write.executeAmbushSweep([KEY, 1n]), /not authorized sentinel/);
    await assert.rejects((await controllerAs(mallory)).write.registerTarget(["X", mallory.account.address]), /not owner/);
  });

  it("re-registering a ticker does not duplicate the key list", async () => {
    const { controller, vault } = await setup();
    await controller.write.registerTarget(["GME-RWA", vault.address]);
    assert.equal(await controller.read.activeTargetKeys([0n]), KEY);
    await assert.rejects(controller.read.activeTargetKeys([1n]));
  });

  it("requires real profit per sweep and never mints WEALD into the vault", async () => {
    const { alice, weald, vault, controller, vaultAs } = await setup();
    await (await vaultAs(alice)).write.deposit([parseEther("1"), alice.account.address], { value: parseEther("1") });
    const supplyBefore = await weald.read.totalSupply();
    await assert.rejects(controller.write.executeAmbushSweep([KEY, 1n]), /no profit/);
    await controller.write.executeAmbushSweep([KEY, 1n], { value: parseEther("0.1") });
    assert.equal(await weald.read.balanceOf([vault.address]), 0n);
    assert.equal(await weald.read.totalSupply(), supplyBefore);
    assert.equal(await vault.read.totalAssets(), parseEther("1.1"));
  });
});

describe("WealdToken", () => {
  it("mints 15M to the deployer at launch and enforces the 100M cap", async () => {
    const { owner, alice, weald } = await setup();
    assert.equal(await weald.read.totalSupply(), parseEther("15000000"));
    assert.equal(await weald.read.balanceOf([owner.account.address]), parseEther("15000000"));
    await assert.rejects(weald.write.mintAmbushReward([alice.account.address, parseEther("85000001")]), /max supply/);
    await weald.write.mintAmbushReward([alice.account.address, parseEther("85000000")]);
    assert.equal(await weald.read.totalSupply(), parseEther("100000000"));
  });

  it("restricts minting and badges to the controller or owner", async () => {
    const { mallory, wealdAs } = await setup();
    const w = await wealdAs(mallory);
    await assert.rejects(w.write.mintAmbushReward([mallory.account.address, 1n]), /not controller/);
    await assert.rejects(w.write.awardOGBadge([mallory.account.address, 1n]), /not controller/);
    await assert.rejects(w.write.setAmbushController([mallory.account.address]), /not owner/);
  });

  it("handles transfers and allowances", async () => {
    const { owner, alice, bob, weald, wealdAs } = await setup();
    await weald.write.transfer([alice.account.address, 100n]);
    await (await wealdAs(alice)).write.approve([bob.account.address, 60n]);
    const asBob = await wealdAs(bob);
    await assert.rejects(asBob.write.transferFrom([alice.account.address, bob.account.address, 61n]), /allowance exceeded/);
    await asBob.write.transferFrom([alice.account.address, bob.account.address, 60n]);
    assert.equal(await weald.read.balanceOf([bob.account.address]), 60n);
    assert.equal(await weald.read.allowance([alice.account.address, bob.account.address]), 0n);
    await assert.rejects((await wealdAs(alice)).write.transfer([owner.account.address, 41n]), /insufficient balance/);
  });
});
