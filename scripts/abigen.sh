#!/usr/bin/env bash

rm -rf ./go
mkdir ./go

echo "Generating go bindings for contracts"

jq -r '.abi' artifacts/contracts/RelayerFeeReceiver.sol/RelayerFeeReceiver.json > RelayerFeeReceiver.abi
jq -r '.bytecode' artifacts/contracts/RelayerFeeReceiver.sol/RelayerFeeReceiver.json | cut -c 3- > RelayerFeeReceiver.bin
abigen --abi RelayerFeeReceiver.abi --pkg RelayerFeeReceiver --type RelayerFeeReceiver --bin RelayerFeeReceiver.bin --out go/RelayerFeeReceiver.go

rm RelayerFeeReceiver.abi RelayerFeeReceiver.bin