/**
 * @type import('hardhat/config').HardhatUserConfig
 */
require("@nomiclabs/hardhat-waffle");
require("dotenv").config();

module.exports = {
  //defaultNetwork: "PolygonMumbai",
  networks: {
    hardhat: {},
    PolygonMumbai: {
      url: `https://polygon-mumbai.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_PROJECT_ID}`,
      accounts: [process.env.DEPLOYER_PRIVATE_KEY],
    },
  },
  solidity: {
    version: "0.8.7",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
};
