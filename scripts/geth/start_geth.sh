#!/usr/bin/env bash
# Copyright 2020 ChainSafe Systems
# SPDX-License-Identifier: LGPL-3.0-only
DATADIR=./gethdata

# Exit on failure
set -e

##############################
## Check OS to install Geth ##
##############################
unameOut="$(uname -s)"
case "${unameOut}" in
    Linux*)     arch=x86;;
    Darwin*)   arch=mac;;
    *)          arch="UNKNOWN:${unameOut}"
                echo "ERROR: your OS is not either Linunx or Darwin, so you cannot run this script. OS: $arch" && exit 1
esac
echo "Running in $arch"
echo " "

if command -v geth &> /dev/null; then
    echo -e "\n ==> Geth Software already installed. Ready to proceed."
else
    read -p 'To continue you need to install geth on your computer. Do you want to proceed? (y/n) ' -n 1 -r
    if [[ $REPLY == "y" || $REPLY == "Y" ]]; then
        if [[ $arch == "mac" ]]; then
            brew tap ethereum/ethereum
            brew install ethereum
        else
            sudo add-apt-repository -y ppa:ethereum/ethereum
            sudo apt-get update
            sudo apt-get install ethereum
        fi
    else
        echo -e "\n ==> Geth Software not installed. Exiting..."
        exit 0
    fi

    if command -v geth &> /dev/null; then
        echo -e "\n ==> Geth Software already installed. Ready to proceed."
    else
        echo -e "\n ==> Geth Software not found. Unable to install it. Exiting..."
        exit 0
    fi
fi

# Delete old chain data
rm -rf $DATADIR
# Init genesis
geth --datadir $DATADIR init ./scripts/geth/genesis.json
# Copy keystore
rm -rf $DATADIR/keystore
cp -r ./scripts/geth/keystore $DATADIR
# Start geth with rpc, mining and unlocked accounts

echo -e "\n==> Output will be saved in ./gethdata/geth.log\n"
sleep 2

if [[ $QUIET ]]; then
    geth --verbosity 2 \
    --datadir $DATADIR \
    --nodiscover \
    --unlock "0xff93B45308FD417dF303D6515aB04D9e89a750Ca","0x8e0a907331554AF72563Bd8D43051C2E64Be5d35","0x24962717f8fA5BA3b931bACaF9ac03924EB475a0","0x148FfB2074A9e59eD58142822b3eB3fcBffb0cd7","0x4CEEf6139f00F9F4535Ad19640Ff7A0137708485" \
    --password ./scripts/geth/password.txt \
    --ws \
    --ws.port 8545 \
    --networkid 5 \
    --ws.origins="*" \
    --http \
    --http.corsdomain="*" \
    --http.vhosts="*" \
    --allow-insecure-unlock \
    --mine \
    --miner.etherbase "0xff93B45308FD417dF303D6515aB04D9e89a750Ca" \
    > $DATADIR/geth.log 2>&1 &
else
    geth --datadir $DATADIR \
    --nodiscover \
    --unlock "0xff93B45308FD417dF303D6515aB04D9e89a750Ca","0x8e0a907331554AF72563Bd8D43051C2E64Be5d35","0x24962717f8fA5BA3b931bACaF9ac03924EB475a0","0x148FfB2074A9e59eD58142822b3eB3fcBffb0cd7","0x4CEEf6139f00F9F4535Ad19640Ff7A0137708485" \
    --password ./scripts/geth/password.txt \
    --ws \
    --ws.port 8545 \
    --networkid 5 \
    --ws.origins="*" \
    --http \
    --http.corsdomain="*" \
    --http.vhosts="*" \
    --allow-insecure-unlock \
    --mine \
    --miner.etherbase "0xff93B45308FD417dF303D6515aB04D9e89a750Ca" \
    >  $DATADIR/geth.log 2>&1 &
fi
