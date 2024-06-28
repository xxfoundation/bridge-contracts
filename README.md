# bridge-contracts
Solidity smart contracts for Bridge between xx network blockchain and EVM networks.

## Running locally

Run the [setup script](./scripts/setup.sh) to install dependencies and build the contracts.

```bash
./scripts/setup.sh
```
Then, start the local ETH node using geth

```bash
npm run start:geth
```

Then, deploy the contracts to the local ETH node

```bash
npm run deploy
```

## Mainnet Deployment

Addresses of deployed contracts on Ethereum mainnet.
```
Bridge: 0x104977989515b040879226f293eAcBF342F39Ab7
ERC20Handler: 0x2297db5f1775cdea3e9696e00a005996129283d8
WrappedXX: 0x171120219d3223e008558654ec3254a0f206edb2
RelayerFeeReceiver: 0x6e398fd37a69a417287cdbb1b0cfa41b63e03762
```

## Sepolia Deployment

Addresses of deployed contracts on Sepolia testnet.
```
Bridge: 0xA76bfbAD22a7769BF282649341f7B26adFa6e1A0
ERC20Handler: 0x3f3Dd3167B6a6CA2bBC8b8E1f322D27B3eA66754
WrappedXX: 0x777878005e784C7832565242cdC31f730C7A2Ba8
RelayerFeeReceiver: 0xEBF3262497FAa76cB609EB8b477dA7Ccb45C9039
```