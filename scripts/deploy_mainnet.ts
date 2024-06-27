import { ethers } from "hardhat";
import BridgeArtifact from "../chainbridge/build/contracts/Bridge.json";
import ERC20HandlerArtifact from "../chainbridge/build/contracts/ERC20Handler.json";
import WrappedXXArtifact from "../wrappedxx/artifacts/contracts/WrappedXX.sol/WrappedXX.json";
import {
  Bridge__factory,
  ERC20Handler__factory,
  WrappedXX__factory,
  WrappedXX,
} from "../typechain-types";
import dotenv from "dotenv";

dotenv.config();

const testmode = !!process.env.TESTING || false;
const ledger = !!process.env.LEDGER || false;

// Constants
const deployer =
  testmode && !ledger
    ? "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"
    : "0x70fFda7eef19d00EAe79ba041f1982016CA6ADd4";
const wrappedXXAddress = testmode
  ? ledger
    ? "0xA76bfbAD22a7769BF282649341f7B26adFa6e1A0"
    : "0x5FbDB2315678afecb367f032d93F642f64180aa3"
  : "0x171120219d3223e008558654ec3254a0f206edb2";
const domainId = 1;
const relayerThreshold = 1;
const bridgeFee = ethers.parseEther("0");
const relayers = ["0xff93B45308FD417dF303D6515aB04D9e89a750Ca"];
const expiry = 100;
const relayerFee = ethers.parseEther("0.002");
const resourceId =
  "0x26c3ecba0b7cea7c131a6aedf4774f96216318a2ae74926cd0e01832a0b0b500";
const relayerFeeUpdater = "0x4CEEf6139f00F9F4535Ad19640Ff7A0137708485";

async function main() {
  const prompt = require("readline-sync");
  const signers = await ethers.getSigners();
  const sender = signers.find(
    (s) => s.address.toLowerCase() === deployer.toLowerCase()
  );
  if (!sender) {
    throw new Error(`Deployer ${deployer} not found in signers`);
  }
  console.log(
    "Deploying Bridge Infra with the following account:",
    sender.address
  );

  if (testmode) {
    console.log("Test mode enabled");
    const base = signers[0];
    // Fund deployer if required
    if (base.address.toLowerCase() !== deployer.toLowerCase()) {
      const tx = await base.sendTransaction({
        to: deployer,
        value: ethers.parseEther("10"),
      });
      await tx.wait(1);
      console.log("Deployer funded");
    }
  }

  const balance = await sender.provider.getBalance(sender.address);
  console.log("Deployer balance:", ethers.formatEther(balance));

  // Ask to proceed
  const proceed = prompt.question("Proceed? (y/n) ");
  if (proceed != "y") {
    console.log("Aborting");
    return;
  }

  // If testing, deploy wrapped XX
  if (testmode) {
    const wrappedXXFact = (await ethers.getContractFactory(
      WrappedXXArtifact.abi,
      WrappedXXArtifact.bytecode,
      sender
    )) as WrappedXX__factory;

    const wrappedXX = await wrappedXXFact.deploy(sender.address);
    await wrappedXX.waitForDeployment();
    const wrappedXXAddr = await wrappedXX.getAddress();
    console.log("WrappedXX deployed to:", wrappedXXAddr);
  }

  // Deploy Bridge
  const bridgeFact = (await ethers.getContractFactory(
    BridgeArtifact.abi,
    BridgeArtifact.bytecode,
    sender
  )) as Bridge__factory;
  const bridge = await bridgeFact.deploy(
    domainId,
    relayers,
    relayerThreshold,
    bridgeFee,
    expiry
  );
  await bridge.waitForDeployment();
  const bridgeAddr = await bridge.getAddress();
  console.log("Bridge deployed to:", bridgeAddr);

  // Deploy ERC20Handler
  const erc20HandlerFact = (await ethers.getContractFactory(
    ERC20HandlerArtifact.abi,
    ERC20HandlerArtifact.bytecode,
    sender
  )) as ERC20Handler__factory;
  const erc20Handler = await erc20HandlerFact.deploy(bridgeAddr);
  await erc20Handler.waitForDeployment();
  const erc20HandlerAddr = await erc20Handler.getAddress();
  console.log("ERC20Handler deployed to:", erc20HandlerAddr);

  // Deploy RelayerFeeReceiver
  const relayerFeeReceiverFact = await ethers.getContractFactory(
    "RelayerFeeReceiver"
  );
  const relayerFeeReceiver = await relayerFeeReceiverFact
    .connect(sender)
    .deploy(relayerFee, sender.address, relayerFeeUpdater);
  await relayerFeeReceiver.waitForDeployment();
  const relayerFeeReceiverAddr = await relayerFeeReceiver.getAddress();
  console.log("RelayerFeeReceiver deployed to:", relayerFeeReceiverAddr);

  // Register wrapped XX resource on Bridge
  let tx = await bridge
    .connect(sender)
    .adminSetResource(erc20HandlerAddr, resourceId, wrappedXXAddress);
  await tx.wait(1);

  console.log("Registered Wrapped XX in Bridge");

  // Set burn semantics for wrapped XX
  tx = await bridge
    .connect(sender)
    .adminSetBurnable(erc20HandlerAddr, wrappedXXAddress);
  await tx.wait(1);

  console.log("Set Wrapped XX as Burnable");

  // If testing, add ERC20Handler as minter to wrapped XX
  if (testmode) {
    const contract = await ethers.getContractAt(
      WrappedXXArtifact.abi,
      wrappedXXAddress
    );
    const wrappedXX = contract as unknown as WrappedXX;
    const role = await wrappedXX.MINTER_ROLE();
    tx = await wrappedXX.connect(sender).grantRole(role, erc20HandlerAddr);
    await tx.wait(1);

    console.log("Set ERC20Handler as Minter for Wrapped XX");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
