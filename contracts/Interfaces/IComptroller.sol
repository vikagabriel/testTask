// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

interface IComptroller {
    function markets(address) external returns (bool, uint256);
    function admin() external returns (address);

    function enterMarkets(address[] calldata)
        external
        returns (uint256[] memory);

    function getAccountLiquidity(address)
        external
        view
        returns (uint256, uint256, uint256);
    function _setMarketBorrowCaps(address[] calldata, uint[] calldata) external;
}