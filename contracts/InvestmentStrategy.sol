// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";
import "./Interfaces/IComptroller.sol";
import "./Interfaces/IMErc20.sol";
import "hardhat/console.sol";

/**
 * @title Investment Strategy
 * @dev This contract represents an investment strategy that interacts with Moonwell protocol and Uniswap V3.
 */
contract InvestmentStrategy {
    using SafeERC20 for IERC20;

    IERC20 public USDC;
    IMErc20 public mUSDC;
    IERC20 public DAI;
    IMErc20 public mDAI;
    IComptroller public comptroller;

    mapping(address => uint256) public userDeposits;

    /**
     * @dev Uniswap V3 router.
     */
    ISwapRouter public immutable swapRouter;

    /**
     * @dev Contract constructor.
     * @param _usdc Address of the USDC token contract.
     * @param _musdc Address of the Moonwell USDC token contract.
     * @param _dai Address of the DAI token contract.
     * @param _mdai Address of the Moonwell DAI token contract.
     * @param _comptroller Address of the Moonwell Comptroller contract.
     * @param _swapRouter Address of the Uniswap V3 swap router contract.
     */
    constructor(
        address _usdc,
        address _musdc,
        address _dai,
        address _mdai,
        address _comptroller,
        ISwapRouter _swapRouter
    ) {
        USDC = IERC20(_usdc);
        mUSDC = IMErc20(_musdc);
        DAI = IERC20(_dai);
        mDAI = IMErc20(_mdai);
        comptroller = IComptroller(_comptroller);
        swapRouter = _swapRouter;
    }

    /**
     * @dev Deposits USDC tokens into the contract.
     * @param _amount Amount of USDC tokens to deposit.
     */
    function depositUSDC(uint256 _amount) external {
        USDC.safeTransferFrom(msg.sender, address(this), _amount);
        userDeposits[msg.sender] += _amount;
    }

    /**
     * @dev Deposits USDC tokens into the Moonwell protocol.
     */
    function depositInStrategy() external {
        uint256 investment = USDC.balanceOf(address(this));
        _supplyUSDC(investment);

        // Entering the market to be able to borrow another type of asset
        address[] memory mTokens = new address[](1);
        mTokens[0] = address(mUSDC);
        uint256[] memory errors = comptroller.enterMarkets(mTokens);
        if (errors[0] != 0) {
            revert("InvestmentStrategy: Comptroller.enterMarkets failed.");
        }

        // Geting account's total liquidity value in moonwell
        (uint256 error2, uint256 liquidity, uint256 shortfall) = comptroller
            .getAccountLiquidity(address(this));
        if (error2 != 0) {
            revert(
                "InvestmentStrategy: Comptroller.getAccountLiquidity failed."
            );
        }
        require(shortfall == 0, "InvestmentStrategy: Contract underwater");
        require(
            liquidity > 0,
            "InvestmentStrategy: Contract has excess collateral"
        );

        // Borrow underlying
        uint256 underlyingToBorrow = (investment * 1e12 * 70) / 100; // LTV 70%
        require(
            underlyingToBorrow <= liquidity,
            "InvestmentStrategy: Can't borrow more than collateral allows"
        );

        // Borrow, check the underlying balance for this contract's address
        mDAI.borrow(underlyingToBorrow);

        // Get the borrow balance
        uint256 borrows = mDAI.borrowBalanceCurrent(address(this));
        // Swap DAI to USDC
        uint256 usdcReceived = _swapDAIToUSDC(borrows);
        // Supply the USDC
        _supplyUSDC(usdcReceived);
    }

    function _supplyUSDC(uint256 _usdcToSupply) internal {
        USDC.approve(address(mUSDC), _usdcToSupply);
        uint256 error = mUSDC.mint(_usdcToSupply);
        require(error == 0, "InvestmentStrategy: mErc20.mint Error");
    }

    function _swapDAIToUSDC(
        uint256 _amount
    ) public returns (uint256 usdcReceived) {
        TransferHelper.safeApprove(address(DAI), address(swapRouter), _amount);
        // ISwapRouter.ExactInputSingleParams memory exactInputParams = ISwapRouter
        // .ExactInputSingleParams({
        //     tokenIn: address(DAI),
        //     tokenOut: address(USDC),
        //     fee: 10000, // 0.1% fee (10000 out of 1e6)
        //     recipient: address(this),
        //     deadline: block.timestamp + 100, // Deadline for the swap (100 blocks from now)
        //     amountIn: _amount, // Amount of DAI tokens to swap
        //     amountOutMinimum: 0, // Minimum amount of USDC tokens to receive (set to 0 for no minimum)
        //     sqrtPriceLimitX96: 0 // No price limit
        // });
        ISwapRouter.ExactInputSingleParams memory exactInputParams = ISwapRouter
            .ExactInputSingleParams({
                tokenIn: address(DAI),
                tokenOut: address(USDC),
                fee: 3000,
                recipient: address(this),
                deadline: block.timestamp,
                amountIn: _amount,
                amountOutMinimum: 0,
                sqrtPriceLimitX96: 0
            });

        usdcReceived = swapRouter.exactInputSingle(exactInputParams);
    }
}
