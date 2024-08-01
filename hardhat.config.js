require("@nomiclabs/hardhat-waffle");
require("@openzeppelin/hardhat-upgrades");
const dotenv = require('dotenv');
// dotenv.config();
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  // solidity: {
  //   compilers:[
  //     {
  //      version : "0.8.23"
  //     },
  //   ]
  // },

  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },

  },

  hardhat: {
    allowUnlimitedContractSize: true,
  },
  networks:{
    sepolia :{
      url: process.env.SEPOLIA_RPC_URL,
      chainId: 11155111,
      accounts: [`0x${process.env.PRIVATE_KEY}`],

    },

  },
  etherscan:{
    apiKey: {
      sepolia: "NBGM92QQNNYW4ETF6XWM9CNDX1NYHUDF47",
    },

  }
};
