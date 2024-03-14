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
  defaultNetwork: "hardhat",
  networks: {
    // Local testing
    hardhat: {
      ledgerAccounts: ["0x70fFda7eef19d00EAe79ba041f1982016CA6ADd4"],
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
