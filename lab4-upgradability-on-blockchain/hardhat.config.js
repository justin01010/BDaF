require("@nomicfoundation/hardhat-toolbox");
//const dotenv = require("dotenv");

// Configure dotenv to manage environment variables
//dotenv.config();

// Access your private key environment variable
//const ZIRCUIT_PRIVATE_KEY = process.env.ZIRCUIT_PRIVATE_KEY;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.24",
  /*
  networks: {
    zircuit: {
      url: `https://zircuit1.p2pify.com`,
      accounts: [ZIRCUIT_PRIVATE_KEY]
    }
  },
  */
};
