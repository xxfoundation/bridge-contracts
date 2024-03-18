import { ethers } from "hardhat";

const address = "0x028152c03ad5E28dE97AEaf90f104C7eD42a47bB";
const domain = 0;
const nonce = 1;

async function main() {
  const signers = await ethers.getSigners();
  const sender = signers[2];
  console.log("Paying fee from the following account:", sender.address);

  const relayerFeeReceiver = await ethers.getContractAt(
    "RelayerFeeReceiver",
    address
  );

  const fee = await relayerFeeReceiver.currentFee();
  console.log("Current fee:", fee.toString());

  const tx = await relayerFeeReceiver
    .connect(sender)
    .payFee(domain, nonce, { value: fee });
  console.log(`Paying fee for nonce ${nonce} in transaction ${tx.hash}`);
  await tx.wait(1);
  console.log("Fee paid!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
