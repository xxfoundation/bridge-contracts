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
