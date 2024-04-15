module.exports = async ({
    ethers: { getNamedSigners },
    deployments: { deploy },
  }) => {
    const { deployer } = await getNamedSigners();
  
    const usdc = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
    const musdc = "0xEdc817A28E8B93B03976FBd4a3dDBc9f7D176c22";
    const dai = "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb";
    const mdai = "0x73b06D8d18De422E269645eaCe15400DE7462417";
    const comptroller = "0xfBb21d0380beE3312B33c4353c8936a0F13EF26C";
    const swapRouter = "0x2626664c2603336E57B271c5C0b26F421741e481";
  
    const InvestmentStrategy = await deploy("InvestmentStrategy", {
      from: deployer.address,
      contract: "InvestmentStrategy",
      args: [usdc, musdc, dai, mdai, comptroller, swapRouter],
      log: true,
    });
  };
  
  module.exports.tags = ["InvestmentStrategy", "base"];
  