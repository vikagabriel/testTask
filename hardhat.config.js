require("hardhat-dependency-compiler");
require("hardhat-deploy");
require("hardhat-deploy-ethers");
require("hardhat-contract-sizer");
require("hardhat-gas-reporter");
require("dotenv").config();
require("./tasks");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.19",
        settings: {
          optimizer: {
            enabled: true,
            runs: 2,
          },
        },
      },
    ],
  },

  namedAccounts: {
    deployer: {
      default: 0,
    },
    owner: {
      default: 1,
    },
    caller: {
      default: 2,
    },
    holder: {
      default: 3,
    },
    team: {
      default: 4,
    },
    setter: {
      default: 5,
    },
    user1: {
      default: 6,
    },
    user2: {
      default: 7,
    },
    user3: {
      default: 8,
    },
    user4: {
      default: 9,
    },
    user5: {
      default: 10,
    },
    referrer: {
      default: 11,
    },
    team: {
      default: 12,
    },
    user: {
      default: 13,
    },
    treasury: {
      default: 14,
    },
    admin: {
      default: 15,
    },
  },

  networks: {
    hardhat: {
      forking: {
        enabled: true,
        url: "https://mainnet.base.org/",
        blockNumber: 13148299,
      },
      deploy: ["deploy/hardhat"],
      tags: ["hardhat"],
    },
    base:{
      chainId: 8453,
      gasMultiplier: 1,
      accounts: [process.env.PRIVATE_KEY],
      url: 'https://mainnet.base.org/',
      deploy: ['deploy/base'],
      tags: ["base"],
      verify: {
        etherscan: {
          apiUrl: "https://api.basescan.org",
          apiKey: process.env.BASESCAN_API_KEY
        }
      }
    },
    "base-testnet": {
      chainId: 84532,
      gasMultiplier: 1,
      accounts: [process.env.PRIVATE_KEY],
      url: "https://sepolia.base.org",
      deploy: ["deploy/base-testnet"],
      tags: ["base-testnet"],
      verify: {
        etherscan: {
          apiUrl: "https://api.sepolia-explorer.base.org",
          apiKey: process.env.BASESCAN_API_KEY,
        },
      },
    },
  },
  dependencyCompiler: {
    paths: [
      "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol",
    ],
    keep: true,
  },

  gasReporter: {
    currency: "USD",
    gasPrice: 3,
    enabled: false,
    coinmarketcap: "36ea2dee-5a73-45cf-82e8-ab9d066f01f3",
  },

  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },

  contractSizer: {
    alphaSort: false,
    runOnCompile: true,
    disambiguatePaths: false,
  },
};
