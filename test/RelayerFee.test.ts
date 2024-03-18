import { expect } from "chai";
import { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { RelayerFeeReceiver } from "../typechain-types";

const ZERO_HASH =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

const DOMAIN_ZERO = "0x00";
const NONCE_ZERO = "0x0000000000000000";
const NONCE_MID = "0x8000000000000000";
const NONCE_MAX = "0xffffffffffffffff";

describe("L1NS Payment Collector contract", function () {
  let relayerFeeReceiver: RelayerFeeReceiver;
  let relayerFeeReceiverAddr: string;
  let owner: HardhatEthersSigner;
  let relayer: HardhatEthersSigner;
  let addr1: HardhatEthersSigner;
  const initialFee = ethers.parseEther("0.01");

  // Deploy contract before each test
  beforeEach(async function () {
    [owner, relayer, addr1] = await ethers.getSigners();
    const fact = await ethers.getContractFactory("RelayerFeeReceiver");
    relayerFeeReceiver = await fact.deploy(
      initialFee,
      owner.address,
      relayer.address
    );
    relayerFeeReceiver.waitForDeployment();
    relayerFeeReceiverAddr = await relayerFeeReceiver.getAddress();
  });

  // Deployment
  describe("Deployment", function () {
    it("Should assign contract ownership", async function () {
      expect(
        await relayerFeeReceiver.hasRole(ZERO_HASH, owner.address)
      ).to.equal(true);
    });

    it("Should assign relayer role", async function () {
      const role = await relayerFeeReceiver.RELAYER_ROLE();
      expect(await relayerFeeReceiver.hasRole(role, relayer.address)).to.equal(
        true
      );
    });

    it("Should set initial fee", async function () {
      expect(await relayerFeeReceiver.currentFee()).to.equal(initialFee);
    });
  });

  // Pausing
  describe("Pausing", function () {
    it("Admin can pause contract", async function () {
      await relayerFeeReceiver.pause();
      expect(await relayerFeeReceiver.paused()).to.equal(true);
    });

    it("Admin can unpause contract", async function () {
      await relayerFeeReceiver.pause();
      expect(await relayerFeeReceiver.paused()).to.equal(true);
      await relayerFeeReceiver.unpause();
      expect(await relayerFeeReceiver.paused()).to.equal(false);
    });

    it("Non-admin cannot pause contract", async function () {
      await expect(
        relayerFeeReceiver.connect(addr1).pause()
      ).to.be.revertedWith(
        "AccessControl: account " +
          addr1.address.toLowerCase() +
          " is missing role " +
          ZERO_HASH
      );
    });

    it("Non-admin cannot unpause contract", async function () {
      await relayerFeeReceiver.pause();
      expect(await relayerFeeReceiver.paused()).to.equal(true);
      await expect(
        relayerFeeReceiver.connect(addr1).unpause()
      ).to.be.revertedWith(
        "AccessControl: account " +
          addr1.address.toLowerCase() +
          " is missing role " +
          ZERO_HASH
      );
    });

    it("Relayer cannot change fee when contract is paused", async function () {
      await relayerFeeReceiver.pause();
      await expect(
        relayerFeeReceiver.connect(relayer).setFee(ethers.parseEther("0.02"))
      ).to.be.revertedWith("Contract is paused");
    });

    it("User cannot pay fee when contract is paused", async function () {
      await relayerFeeReceiver.pause();
      await expect(
        relayerFeeReceiver
          .connect(addr1)
          .payFee(DOMAIN_ZERO, NONCE_ZERO, { value: initialFee })
      ).to.be.revertedWith("Contract is paused");
    });

    it("Admin can change fee, even with contract paused", async function () {
      await relayerFeeReceiver.pause();
      const newFee = ethers.parseEther("0.02");
      await relayerFeeReceiver.adminSetFee(newFee);
      expect(await relayerFeeReceiver.currentFee()).to.equal(newFee);
    });
  });

  // Relayer setting
  describe("Relayer setting", function () {
    it("Admin can add a relayer", async function () {
      await relayerFeeReceiver.addRelayer(addr1.address);
      const role = await relayerFeeReceiver.RELAYER_ROLE();
      expect(await relayerFeeReceiver.hasRole(role, addr1.address)).to.equal(
        true
      );
    });

    it("Non-admin cannot add a relayer", async function () {
      await expect(
        relayerFeeReceiver.connect(relayer).addRelayer(addr1.address)
      ).to.be.revertedWith(
        "AccessControl: account " +
          relayer.address.toLowerCase() +
          " is missing role " +
          ZERO_HASH
      );
    });

    it("Admin can remove a relayer", async function () {
      await relayerFeeReceiver.removeRelayer(relayer.address);
      const role = await relayerFeeReceiver.RELAYER_ROLE();
      expect(await relayerFeeReceiver.hasRole(role, relayer.address)).to.equal(
        false
      );
    });

    it("Non-admin cannot remove a relayer", async function () {
      await expect(
        relayerFeeReceiver.connect(relayer).removeRelayer(relayer.address)
      ).to.be.revertedWith(
        "AccessControl: account " +
          relayer.address.toLowerCase() +
          " is missing role " +
          ZERO_HASH
      );
    });
  });

  // Relayer set fee
  describe("Relayer set fee", function () {
    it("Relayer can set fee", async function () {
      const newFee = ethers.parseEther("0.02");
      await relayerFeeReceiver.connect(relayer).setFee(newFee);
      expect(await relayerFeeReceiver.currentFee()).to.equal(newFee);
    });

    it("Non-relayer cannot set fee", async function () {
      const role = await relayerFeeReceiver.RELAYER_ROLE();
      await expect(
        relayerFeeReceiver.connect(addr1).setFee(ethers.parseEther("0.02"))
      ).to.be.revertedWith(
        "AccessControl: account " +
          addr1.address.toLowerCase() +
          " is missing role " +
          role
      );
    });
  });

  // Fee collection
  describe("Fee collection", function () {
    it("User can pay fee", async function () {
      const before = await ethers.provider.getBalance(relayerFeeReceiverAddr);
      await relayerFeeReceiver
        .connect(addr1)
        .payFee(DOMAIN_ZERO, NONCE_ZERO, { value: initialFee });
      const after = await ethers.provider.getBalance(relayerFeeReceiverAddr);
      expect(after).to.equal(before + initialFee);
    });

    // For gas estimates
    it("User can pay fee (nonce mid)", async function () {
      const before = await ethers.provider.getBalance(relayerFeeReceiverAddr);
      await relayerFeeReceiver
        .connect(addr1)
        .payFee(DOMAIN_ZERO, NONCE_MID, { value: initialFee });
      const after = await ethers.provider.getBalance(relayerFeeReceiverAddr);
      expect(after).to.equal(before + initialFee);
    });

    it("User can pay fee (nonce max)", async function () {
      const before = await ethers.provider.getBalance(relayerFeeReceiverAddr);
      await relayerFeeReceiver
        .connect(addr1)
        .payFee(DOMAIN_ZERO, NONCE_MAX, { value: initialFee });
      const after = await ethers.provider.getBalance(relayerFeeReceiverAddr);
      expect(after).to.equal(before + initialFee);
    });

    it("User cannot pay fee with incorrect value", async function () {
      await expect(
        relayerFeeReceiver
          .connect(addr1)
          .payFee(DOMAIN_ZERO, NONCE_ZERO, { value: ethers.parseEther("0.02") })
      ).to.be.revertedWith("Fee value is not correct");
    });
  });

  // Withdraw
  describe("Withdraw", function () {
    it("Cannot withdraw if there are no funds", async function () {
      await expect(
        relayerFeeReceiver.withdraw(relayer.address)
      ).to.be.revertedWith("No balance to withdraw");
    });

    it("Owner can withdraw", async function () {
      // Pay a fee
      await relayerFeeReceiver
        .connect(addr1)
        .payFee(DOMAIN_ZERO, NONCE_ZERO, { value: initialFee });
      // Withdraw
      await expect(relayerFeeReceiver.withdraw(relayer.address)).to.not.be
        .reverted;
    });

    it("Withdrawal transfers value correctly", async function () {
      // Pay a fee
      await relayerFeeReceiver
        .connect(addr1)
        .payFee(DOMAIN_ZERO, NONCE_ZERO, { value: initialFee });
      // Withdraw
      const beforeDest = await ethers.provider.getBalance(relayer.address);
      await relayerFeeReceiver.withdraw(relayer.address);
      const after = await ethers.provider.getBalance(relayerFeeReceiverAddr);
      const afterDest = await ethers.provider.getBalance(relayer.address);
      expect(after).to.equal(0);
      expect(afterDest).to.equal(beforeDest + initialFee);
    });

    it("Non-owner cannot withdraw", async function () {
      await expect(
        relayerFeeReceiver.connect(addr1).withdraw(addr1.address)
      ).to.be.revertedWith(
        "AccessControl: account " +
          addr1.address.toLowerCase() +
          " is missing role " +
          ZERO_HASH
      );
    });
  });

  // Receive
  describe("Receive", function () {
    it("Contract reverts on direct call", async function () {
      await expect(
        addr1.sendTransaction({
          to: relayerFeeReceiverAddr,
          value: initialFee,
        })
      ).to.be.revertedWith("No direct payments allowed");
    });
  });
});
