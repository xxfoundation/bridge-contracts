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
    // Hardhat for deployment testing
    hardhat: {
      ledgerAccounts: ["0x70fFda7eef19d00EAe79ba041f1982016CA6ADd4"],
    },

    // Local testing with geth node
    local: {
      url: "http://127.0.0.1:8545",
      accounts: [
        "0x000000000000000000000000000000000000000000000000000000616c696365", // Alice: 0xff93B45308FD417dF303D6515aB04D9e89a750Ca
        "0x0000000000000000000000000000000000000000000000000000000000626f62", // Bob: 0x8e0a907331554AF72563Bd8D43051C2E64Be5d35
        "0x00000000000000000000000000000000000000000000000000636861726c6965", // Charlie: 0x24962717f8fA5BA3b931bACaF9ac03924EB475a0
        "0x0000000000000000000000000000000000000000000000000000000064617665", // Dave: 0x148FfB2074A9e59eD58142822b3eB3fcBffb0cd7
        "0x0000000000000000000000000000000000000000000000000000000000657665", // Eve: 0x4CEEf6139f00F9F4535Ad19640Ff7A0137708485
        "0x56289e99c94b6912bfc12adc093c9b51124f0dc54ac7a766b2bc5ccf558d8027", // Predefined 1: 0x8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC
        "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", // Hardhat 0: 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266
        "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d", // Hardhat 1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
        "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a", // Hardhat 2: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
        "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6", // Hardhat 3: 0x90F79bf6EB2c4f870365E785982E1f101E93b906
      ],
    },

    // Bridge development network
    // This is the same as local, but deployed on a cloud server
    devnet: {
      url: "https://bridge-dev.xx.network/eth/rpc",
      accounts: [
        "0x000000000000000000000000000000000000000000000000000000616c696365", // Alice: 0xff93B45308FD417dF303D6515aB04D9e89a750Ca
        "0x0000000000000000000000000000000000000000000000000000000000626f62", // Bob: 0x8e0a907331554AF72563Bd8D43051C2E64Be5d35
        "0x00000000000000000000000000000000000000000000000000636861726c6965", // Charlie: 0x24962717f8fA5BA3b931bACaF9ac03924EB475a0
        "0x0000000000000000000000000000000000000000000000000000000064617665", // Dave: 0x148FfB2074A9e59eD58142822b3eB3fcBffb0cd7
        "0x0000000000000000000000000000000000000000000000000000000000657665", // Eve: 0x4CEEf6139f00F9F4535Ad19640Ff7A0137708485
        "0x56289e99c94b6912bfc12adc093c9b51124f0dc54ac7a766b2bc5ccf558d8027", // Predefined 1: 0x8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC
        "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", // Hardhat 0: 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266
        "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d", // Hardhat 1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
        "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a", // Hardhat 2: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
        "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6", // Hardhat 3: 0x90F79bf6EB2c4f870365E785982E1f101E93b906
      ],
    },

    // ETH Sepolia Testnet
    testnet: {
      url: "https://ethereum-sepolia-rpc.publicnode.com",
      ledgerAccounts: ["0x70fFda7eef19d00EAe79ba041f1982016CA6ADd4"],
    },

    // ETH mainnet
    mainnet: {
      url: MAINNET_URL,
      ledgerAccounts: ["0x70fFda7eef19d00EAe79ba041f1982016CA6ADd4"],
    },
  },
};

export default config;
