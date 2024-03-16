import { ethers } from "hardhat";
import WrappedXXArtifact from "../wrappedxx/artifacts/contracts/WrappedXX.sol/WrappedXX.json";
import { WrappedXX } from "../typechain-types";

const address = "0x3f709398808af36ADBA86ACC617FeB7F5B7B193E";
const destination = "0x148FfB2074A9e59eD58142822b3eB3fcBffb0cd7"; // Dave
const amount = 100000000000; // 100 wXX

async function main() {
  const signers = await ethers.getSigners();
  const sender = signers[1];
  console.log("Minting from the following account:", sender.address);

  const contract = await ethers.getContractAt(WrappedXXArtifact.abi, address);
  const wrappedXX = contract as unknown as WrappedXX;

  const tx = await wrappedXX.connect(sender).mint(destination, amount);
  console.log(
    `Minting ${amount / 1e9} wXX to ${destination} in transaction ${tx.hash}`
  );
  await tx.wait(1);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
