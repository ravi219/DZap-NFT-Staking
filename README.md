# DZap NFT Staking

## Overview

This project implements a staking mechanism for NFTs that rewards users with ERC20 tokens. The smart contract is upgradeable using the UUPS proxy pattern. Users can stake their NFTs to earn rewards, unstake their NFTs with an unbonding period, and claim their rewards after a delay period. The contract also includes control mechanisms to pause and unpause the staking process and update the reward configuration.

## Features

- **Staking Functionality**: Users can stake one or multiple NFTs to earn rewards.
- **Unstaking Functionality**: Users can unstake specific NFTs, with an unbonding period before withdrawal.
- **Reward Claiming**: Users can claim accumulated rewards after a delay period.
- **Upgradeable Contract**: Uses the UUPS proxy pattern for contract upgradeability.
- **Control Mechanisms**: Admin can pause/unpause staking, update reward per block, and other configurations.



## Installation

1. git clone https://github.com/ravi219/DZap-NFT-Staking.git
cd DZap-NFT-Staking

2. Install Dependencies
bash
Copy code
npm install
# or
yarn install
3. Compile the Contracts
bash
Copy code
npx hardhat compile
4. Deploy the Contracts
Configure your network settings in hardhat.config.js and deploy:

bash
Copy code
npx hardhat run scripts/deploy.js --network your-network
5. Verify the Contracts
Verify the deployed contracts on Etherscan:

bash
Copy code
npx hardhat run scripts/verify.js --network your-network 


Testing
Run tests using Hardhat:

bash
Copy code
npx hardhat test