require("@nomicfoundation/hardhat-toolbox");
const dotenv = require("dotenv");

// Configure dotenv to manage environment variables
dotenv.config();

// Access your private key environment variable
const ZIRCUIT_API_KEY = process.env.ZIRCUIT_API_KEY;
const ZIRCUIT_PRIVATE_KEY_OWNER = process.env.ZIRCUIT_PRIVATE_KEY_OWNER;
const ZIRCUIT_PRIVATE_KEY_OTHER = process.env.ZIRCUIT_PRIVATE_KEY_OTHER;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.24",
  networks: {
    zircuit: {
      url: `https://zircuit1.p2pify.com`,
      accounts: [`0x${ZIRCUIT_PRIVATE_KEY_OWNER}`, `0x${ZIRCUIT_PRIVATE_KEY_OTHER}`]
    }
  },
  etherscan: {
    apiKey: {
      zircuit: [ZIRCUIT_API_KEY]
    }, 
    customChains: [
      {
        network: 'zircuit',
        chainId: 48899,
        urls: {
          apiURL: 'https://explorer.zircuit.com/api/contractVerifyHardhat',
          browserURL: 'https://explorer.zircuit.com',
        },
      }
    ]
  },
};
