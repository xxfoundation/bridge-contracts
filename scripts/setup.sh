#!/usr/bin/env bash

set -eux

# Get ChainBridge contracts from ChainSafe repo

CONTRACTS_REPO="https://github.com/chainsafe/chainbridge-solidity"
CONTRACTS_TAG="v2.1.4"
CONTRACTS_DIR="./chainbridge"

# Only if the directory does not exist
if [ ! -d $CONTRACTS_DIR ]; then
  git clone $CONTRACTS_REPO $CONTRACTS_DIR
  (
    cd $CONTRACTS_DIR
    git checkout $CONTRACTS_TAG

    npm i
    npm run compile
  )
fi

# Get wrappedXX contract from xx repo

WRAPPED_XX_REPO="https://github.com/xx-labs/wrapped-xx"
WRAPPED_XX_DIR="./wrappedxx"

# Only if the directory does not exist
if [ ! -d $WRAPPED_XX_DIR ]; then
  git clone $WRAPPED_XX_REPO $WRAPPED_XX_DIR
  (
    cd $WRAPPED_XX_DIR

    npm i
    npm run compile
  )
fi

# Install deps
npm i

# Compile contracts
npm run compile

# Compile types
npm run types
