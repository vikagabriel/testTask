// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

interface IMErc20 {
    function mint(uint256) external returns (uint256);

    function borrow(uint256) external returns (uint256);
    
    function borrowBalanceCurrent(address) external returns (uint256);

    function exchangeRateCurrent() external returns (uint256);

    function supplyRatePerBlock() external returns (uint256);

    function redeem(uint) external returns (uint);

    function redeemUnderlying(uint) external returns (uint);
}
