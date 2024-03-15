import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-ledger";
import dotenv from "dotenv";

dotenv.config();

const MAINNET_URL = process.env.MAINNET_URL || "";
const COMPILE_MAINNET = process.env.COMPILE_MAINNET || false;

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        runs: 200,
        enabled: true,
      },
      evmVersion: COMPILE_MAINNET ? "cancun" : "paris",
    },
  },
  typechain: {
    externalArtifacts: [
      "chainbridge/build/contracts/*",
      "wrappedxx/artifacts/contracts/WrappedXX.sol/WrappedXX.json",
    ],
  },
  defaultNetwork: "local",
  networks: {
    // Local testing with geth node
    local: {
      url: "http://localhost:8545",
      accounts: [
        "0x000000000000000000000000000000000000000000000000000000616c696365", // Alice: 0xff93B45308FD417dF303D6515aB04D9e89a750Ca
        "0x0000000000000000000000000000000000000000000000000000000000626f62", // Bob: 0x8e0a907331554AF72563Bd8D43051C2E64Be5d35
        "0x00000000000000000000000000000000000000000000000000636861726c6965", // Charlie: 0x24962717f8fA5BA3b931bACaF9ac03924EB475a0
        "0x0000000000000000000000000000000000000000000000000000000064617665", // Dave: 0x148FfB2074A9e59eD58142822b3eB3fcBffb0cd7
        "0x0000000000000000000000000000000000000000000000000000000000657665", // Eve: 0x4CEEf6139f00F9F4535Ad19640Ff7A0137708485
      ],
    },

    // TODO: define dev network
    // devnet: {},

    // TODO: define test network
    // testnet: {},

    // ETH mainnet
    mainnet: {
      url: MAINNET_URL,
      ledgerAccounts: ["0x70fFda7eef19d00EAe79ba041f1982016CA6ADd4"],
    },
  },
};

export default config;
