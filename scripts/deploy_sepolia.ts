import { ethers } from "hardhat";
import BridgeArtifact from "../chainbridge/build/contracts/Bridge.json";
import ERC20HandlerArtifact from "../chainbridge/build/contracts/ERC20Handler.json";
import WrappedXXArtifact from "../wrappedxx/artifacts/contracts/WrappedXX.sol/WrappedXX.json";
import {
  Bridge__factory,
  ERC20Handler__factory,
  WrappedXX,
} from "../typechain-types";
import dotenv from "dotenv";

dotenv.config();

const testmode = !!process.env.TESTING || false;
const ledger = !!process.env.LEDGER || false;

const deployer =
  testmode && !ledger
    ? "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"
    : "0x70fFda7eef19d00EAe79ba041f1982016CA6ADd4";
const wrappedXXSalt =
  testmode && !ledger
    ? "0x1432fbf1e70decaae796fa6024a024a59a909462b8e7e59a1715bc6c27be7388"
    : "0xf35603f2e7e44c0f499a3c87b0a0d1b816958d63076da1965f7c3e008db9b2e1";
const wrappedXXAddress =
  testmode && !ledger
    ? "0x777878001dc3EC14a978E3fFb84A5DFAE7f94dFe"
    : "0x777878005e784C7832565242cdC31f730C7A2Ba8";

const create2ProxyDeployer = "0x3fab184622dc19b6109349b94811493bf2a45362";
const create2ProxyTransaction =
  "0xf8a58085174876e800830186a08080b853604580600e600039806000f350fe7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe03601600081602082378035828234f58015156039578182fd5b8082525050506014600cf31ba02222222222222222222222222222222222222222222222222222222222222222a02222222222222222222222222222222222222222222222222222222222222222";
const create2ProxyAddress = "0x4e59b44847b379578588920ca78fbf26c0b4956c";

const domainId = 1;
const relayerThreshold = 1;
const bridgeFee = ethers.parseEther("0");
const relayers = ["0xff93B45308FD417dF303D6515aB04D9e89a750Ca"];
const expiry = 100;
const relayerFee = ethers.parseEther("0.001");
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
  }

  const balance = await sender.provider.getBalance(sender.address);
  console.log("Deployer balance:", ethers.formatEther(balance));

  // Ask to proceed
  const proceed = prompt.question("Proceed? (y/n) ");
  if (proceed != "y") {
    console.log("Aborting");
    return;
  }

  // If testing, deploy CREATE2 Proxy and fund deployer
  if (testmode) {
    const base = signers[0];
    // Deploy CREATE2 proxy
    // Fund deployer
    let tx = await base.sendTransaction({
      to: create2ProxyDeployer,
      value: ethers.parseEther("0.1"),
    });
    await tx.wait(1);

    let balance = await base.provider.getBalance(create2ProxyDeployer);
    console.log("CREATE2 deployer balance:", ethers.formatEther(balance));

    // Send raw transaction
    await base.provider.broadcastTransaction(create2ProxyTransaction);

    // Confirm CREATE2 proxy deployment
    while (true) {
      const res = await base.provider.send("eth_getCode", [
        create2ProxyAddress,
        "latest",
      ]);
      if (res !== "0x") {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    console.log("CREATE2 proxy deployed to:", create2ProxyAddress);

    // Fund deployer if required
    if (base.address !== deployer) {
      tx = await base.sendTransaction({
        to: deployer,
        value: ethers.parseEther("10"),
      });
      await tx.wait(1);
      console.log("Deployer funded");
    }
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

  // Deploy WrappedXX using create2 proxy

  // Build data
  const data =
    wrappedXXSalt +
    WrappedXXArtifact.bytecode.slice(2) +
    "000000000000000000000000" +
    deployer.slice(2);

  // Check if address matches
  const addr = await sender.call({
    to: create2ProxyAddress,
    data,
  });
  if (addr !== wrappedXXAddress.toLowerCase()) {
    throw new Error(
      `Wrapped XX address mismatch: ${addr} !== ${wrappedXXAddress}`
    );
  }

  // Send transaction
  let tx = await sender.sendTransaction({
    to: create2ProxyAddress,
    data,
    maxFeePerGas: 70000000000,
  });

  console.log("Deploy transaction hash:", tx.hash);
  await tx.wait(1);

  console.log("WrappedXX deployed to:", wrappedXXAddress);

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
  tx = await bridge
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

  // Add ERC20Handler as minter to wrapped XX
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

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
