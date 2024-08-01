# DZap NFT Staking

## Overview

This project implements a staking mechanism for NFTs that rewards users with ERC20 tokens. The smart contract is upgradeable using the UUPS proxy pattern. Users can stake their NFTs to earn rewards, unstake their NFTs with an unbonding period, and claim their rewards after a delay period. The contract also includes control mechanisms to pause and unpause the staking process and update the reward configuration.

## Features

- **Staking Functionality**: Users can stake one or multiple NFTs to earn rewards.
- **Unstaking Functionality**: Users can unstake specific NFTs, with an unbonding period before withdrawal.
- **Reward Claiming**: Users can claim accumulated rewards after a delay period.
- **Upgradeable Contract**: Uses the UUPS proxy pattern for contract upgradeability.
- **Control Mechanisms**: Admin can pause/unpause staking, update reward per block, and other configurations.

## Requirements

- Node.js
- Hardhat
- Infura (or any other Ethereum node provider)
- Etherscan API Key

## Installation

1. Clone the repository:
    ```bash
    git clone https://github.com/your-repo/nft-staking.git
    cd nft-staking
    ```

2. Install dependencies:
    ```bash
    npm install
    ```

## Configuration

1. Create a `.env` file in the root directory and add the following environment variables:
    ```plaintext
    INFURA_PROJECT_ID=your_infura_project_id
    DEPLOYER_PRIVATE_KEY=your_private_key
    ETHERSCAN_API_KEY=your_etherscan_api_key
    ```

2. Update `hardhat.config.js` with the following content:
    ```javascript
    require("@nomiclabs/hardhat-waffle");
    require("@openzeppelin/hardhat-upgrades");
    require("@nomiclabs/hardhat-etherscan");
    require("dotenv").config();

    module.exports = {
      solidity: "0.8.18",
      networks: {
        hardhat: {
          chainId: 1337
        },
        sepolia: {
          url: `https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
          accounts: [`0x${process.env.DEPLOYER_PRIVATE_KEY}`],
        },
        // Add other networks here if needed
      },
      etherscan: {
        apiKey: process.env.ETHERSCAN_API_KEY
      }
    };
    ```

## Deployment

To deploy the contracts on a test network, follow these steps:

1. Deploy the contracts:
    ```bash
    npx hardhat run scripts/deploy.js --network sepolia
    ```

    This script will deploy the `MockNFT`, `MockERC20`, and `DZapNFTStaking` contracts and print their deployment addresses to the console.

## Verification

To verify the deployed contracts on Etherscan, follow these steps:

1. Create a `verify.js` script in the `scripts` directory with the following content:
    ```javascript
    async function main() {
      await hre.run("verify:verify", {
        address: "CONTRACT_ADDRESS", // Replace with the deployed contract address
        constructorArguments: [
          "ARGUMENT_1",
          "ARGUMENT_2",
          // Add all constructor arguments here
        ],
      });
    }

    main()
      .then(() => process.exit(0))
      .catch((error) => {
        console.error(error);
        process.exit(1);
      });
    ```

2. Run the verification script:
    ```bash
    npx hardhat run scripts/verify.js --network sepolia
    ```

    Make sure to replace `CONTRACT_ADDRESS` and constructor arguments with actual values.

## Testing

To run the tests, use the following command:
```bash
npx hardhat test
