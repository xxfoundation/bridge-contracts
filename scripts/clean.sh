#!/usr/bin/env bash

# Remove ChainBridge contracts
rm -rf ./chainbridge

# Remove wrappedXX contracts
rm -rf ./wrappedxx

# Remove node_modules
rm -rf ./node_modules

# Remove build/run artifacts
rm -rf ./artifacts ./cache ./coverage ./typechain-types ./gethdata
