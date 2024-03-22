import { ethers } from "hardhat";
import WrappedXXArtifact from "../wrappedxx/artifacts/contracts/WrappedXX.sol/WrappedXX.json";
import { WrappedXX } from "../typechain-types";
import { ContractTransactionResponse } from "ethers";

const address = "0x3f709398808af36ADBA86ACC617FeB7F5B7B193E";
const amount = 100000000000; // 100 wXX

async function main() {
  const signers = await ethers.getSigners();
  const sender = signers[1];
  console.log("Minting from the following account:", sender.address);

  const contract = await ethers.getContractAt(WrappedXXArtifact.abi, address);
  const wrappedXX = contract as unknown as WrappedXX;

  let tx: ContractTransactionResponse | undefined; // Initialize tx variable
  for (const destination of signers) {
    tx = await wrappedXX.connect(sender).mint(destination.address, amount);
    console.log(
      `Minting ${amount / 1e9} wXX to ${destination.address} in transaction ${
        tx.hash
      }`
    );
  }
  if (tx) {
    await tx.wait(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
