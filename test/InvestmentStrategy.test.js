const chai = require("chai");
const { expect } = chai;
const { solidity } = require("ethereum-waffle");
const { timestamp } = require("console");
chai.use(solidity);
const {
  ethers: {
    getNamedSigners,
    getContract,
    getContractAt,
    BigNumber,
    utils: { parseEther, parseUnits },
    constants: { NegativeOne },
  },
  deployments: { fixture, createFixture },
  run,
  ethers,
} = require("hardhat");
const helpers = require("@nomicfoundation/hardhat-network-helpers");

describe("InvestmentStrategy", () => {
  let deployer,
    user1,
    investmentStrategy,
    comptroller,
    swapRouter,
    usdc,
    dai,
    musdc,
    mdai;

  const setupFixture = createFixture(async () => {
    await fixture("hardhat");
    ({ deployer, user1 } = await getNamedSigners());

    investmentStrategy = await getContract("InvestmentStrategy");
    comptroller = await getContractAt(
      "IComptroller",
      "0xfBb21d0380beE3312B33c4353c8936a0F13EF26C"
    );
    usdc = await getContractAt(
      "IERC20",
      "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
    );
    dai = await getContractAt(
      "IERC20",
      "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb"
    );
    swapRouter = await getContractAt(
      "ISwapRouter",
      "0x2626664c2603336E57B271c5C0b26F421741e481"
    );

    musdc = "0xEdc817A28E8B93B03976FBd4a3dDBc9f7D176c22";
    mdai = "0x73b06D8d18De422E269645eaCe15400DE7462417";

    // Get usdc impersonating one of the holders account
    let usdcOwner = "0xd451e3919950963e9c1ca2f78a987dbd7937c0fb";
    await deployer.sendTransaction({
      to: usdcOwner,
      value: parseEther("10"),
    });

    await helpers.impersonateAccount(usdcOwner);
    usdcOwner = await ethers.getSigner(usdcOwner);
    await usdc
      .connect(usdcOwner)
      .transfer(user1.address, parseUnits("1000", 6));

    return [
      investmentStrategy,
      usdc,
      dai,
      comptroller,
      swapRouter,
      musdc,
      mdai,
    ];
  });

  before(async () => {
    ({ deployer, user1 } = await getNamedSigners());
  });

  beforeEach(async () => {
    [investmentStrategy, usdc, dai, comptroller, swapRouter, musdc, mdai] =
      await setupFixture();
  });

  describe("Initialization: ", () => {
    it("Should initialize contract parameters correctly", async function () {
      expect(await investmentStrategy.USDC()).to.equal(usdc.address);
      expect(await investmentStrategy.DAI()).to.equal(dai.address);
      expect(await investmentStrategy.mUSDC()).to.equal(musdc);
      expect(await investmentStrategy.mDAI()).to.equal(mdai);
      expect(await investmentStrategy.comptroller()).to.equal(
        comptroller.address
      );
      expect(await investmentStrategy.swapRouter()).to.equal(
        swapRouter.address
      );
    });
  });

  describe("Function depositUSDC", () => {
    it("Should update user state currectly", async function () {
      const amount = parseUnits("100", 6);
      await usdc.connect(user1).approve(investmentStrategy.address, amount);
      await investmentStrategy.connect(user1).depositUSDC(amount);
      expect(await investmentStrategy.userDeposits(user1.address)).to.equal(
        amount
      );
    });

    it("Should update token balances currectly", async function () {
      const amount = parseUnits("100", 6);
      await usdc.connect(user1).approve(investmentStrategy.address, amount);
      await expect(() =>
        investmentStrategy.connect(user1).depositUSDC(amount)
      ).to.changeTokenBalances(
        usdc,
        [user1, investmentStrategy],
        [NegativeOne.mul(amount), amount]
      );
    });
  });

  describe("Function depositInStrategy", () => {
    it("Should work :)", async function () {
      const amount = parseUnits("100", 6);
      await usdc.connect(user1).approve(investmentStrategy.address, amount);
      await investmentStrategy.connect(user1).depositUSDC(amount);
      await investmentStrategy.depositInStrategy();
    });
    xit("Should Swap DAI to USDC", async function () {
      const amount = parseUnits("100", 18);

      let daiOwner = "0x908f37d3b0d7406427f42bfe14108cd2590feb20";
      await deployer.sendTransaction({
        to: daiOwner,
        value: parseEther("10"),
      });

      await helpers.impersonateAccount(daiOwner);
      daiOwner = await ethers.getSigner(daiOwner);
      await dai.connect(daiOwner).transfer(investmentStrategy.address, amount);

      await dai.connect(daiOwner).transfer(deployer.address, amount);

      // await investmentStrategy.connect(user1)._swapDAIToUSDC(amount);

      await dai.approve(swapRouter.address, amount);

      let exactInputParams = {
        tokenIn: dai.address,
        tokenOut: usdc.address,
        fee: 10000,
        recipient: deployer.address,
        deadline: timestamp,
        amountIn: amount,
        amountOutMinimum: 0,
        sqrtPriceLimitX96: 0,
      };
      await swapRouter.connect(deployer).exactInputSingle(exactInputParams);
    });
  });
});
