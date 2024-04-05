import { ethers } from "hardhat";
import BridgeArtifact from "../chainbridge/build/contracts/Bridge.json";
import ERC20HandlerArtifact from "../chainbridge/build/contracts/ERC20Handler.json";
import WrappedXXArtifact from "../wrappedxx/artifacts/contracts/WrappedXX.sol/WrappedXX.json";
import {
  Bridge__factory,
  ERC20Handler__factory,
  WrappedXX__factory,
} from "../typechain-types";

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
  const signers = await ethers.getSigners();
  const deployer = signers[0];
  const admin = signers[1];
  console.log(
    "Deploying Bridge Infra with the following account:",
    deployer.address
  );

  // Deploy Bridge
  const bridgeFact = (await ethers.getContractFactory(
    BridgeArtifact.abi,
    BridgeArtifact.bytecode,
    deployer
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
    deployer
  )) as ERC20Handler__factory;
  const erc20Handler = await erc20HandlerFact.deploy(bridgeAddr);
  await erc20Handler.waitForDeployment();
  const erc20HandlerAddr = await erc20Handler.getAddress();
  console.log("ERC20Handler deployed to:", erc20HandlerAddr);

  // Deploy WrappedXX
  const wrappedXXFact = (await ethers.getContractFactory(
    WrappedXXArtifact.abi,
    WrappedXXArtifact.bytecode,
    deployer
  )) as WrappedXX__factory;
  const wrappedXX = await wrappedXXFact.deploy(admin.address);
  await wrappedXX.waitForDeployment();
  const wrappedXXAddr = await wrappedXX.getAddress();
  console.log("WrappedXX deployed to:", wrappedXXAddr);

  // Deploy RelayerFeeReceiver
  const relayerFeeReceiverFact = await ethers.getContractFactory(
    "RelayerFeeReceiver"
  );
  const relayerFeeReceiver = await relayerFeeReceiverFact
    .connect(admin)
    .deploy(relayerFee, admin.address, relayerFeeUpdater);
  await relayerFeeReceiver.waitForDeployment();
  const relayerFeeReceiverAddr = await relayerFeeReceiver.getAddress();
  console.log("RelayerFeeReceiver deployed to:", relayerFeeReceiverAddr);

  // Register wrapped XX resource on Bridge
  let tx = await bridge
    .connect(deployer)
    .adminSetResource(erc20HandlerAddr, resourceId, wrappedXXAddr);
  await tx.wait(1);

  console.log("Registered Wrapped XX in Bridge");

  // Set burn semantics for wrapped XX
  tx = await bridge
    .connect(deployer)
    .adminSetBurnable(erc20HandlerAddr, wrappedXXAddr);
  await tx.wait(1);

  console.log("Set Wrapped XX as Burnable");

  // Add ERC20Handler as minter to wrapped XX
  const role = await wrappedXX.MINTER_ROLE();
  tx = await wrappedXX.connect(admin).grantRole(role, erc20HandlerAddr);
  await tx.wait(1);

  console.log("Set ERC20Handler as Minter for Wrapped XX");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
