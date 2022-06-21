require('dotenv').config({path:__dirname+'/.env.development'});
require("@nomiclabs/hardhat-waffle");
require("hardhat-awesome-cli");
require("@nomiclabs/hardhat-etherscan");
require('@openzeppelin/hardhat-upgrades');

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  networks:{
    hardhat: {
      // forking: {
      //   url: process.env.RPC_RINKEBY,
      //   blockNumber: 10802792
      // },
      // allowUnlimitedContractSize: true,
      gas: 72_000_000,
      blockGasLimit: 72_000_000,
      gasPrice: 2000,
      initialBaseFeePerGas: 1
    },
    rinkeby:{
      url: `${process.env.RPC_RINKEBY}`,
      chainId: 4,
      gas: 25000000,
      gasPrice: 12000000000,
      accounts: {
        mnemonic: `${process.env.RINKEBY_MNEMONIC}`,
        path: "m/44'/60'/0'/0",
        initialIndex: 0,
        count: 10,
        passphrase: ""
      }
    },
    goerli: {
      url: `${process.env.RPC_GOERLI}`,
      chainId: 5,
      gas: 25000000,
      gasPrice: 12000000000,
      accounts: [process.env.PRIVATE_KEY_GOERLI]
    },
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: process.env.ETHERSCAN_API_KEY
  },
  solidity: {
    compilers: [
      {
        version: "0.6.0",
        settings: {
          optimizer: {
            runs: 200,
            enabled: true
          }
        }
      },
      {
        version: "0.6.2",
        settings: {
          optimizer: {
            runs: 200,
            enabled: true
          }
        }
      }
    ]
  },
  mocha: {
    timeout: 20000000
  },
};
