// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockERC20
 * @dev Mock ERC20 token for testing purposes.
 */
contract MockRewardToken is ERC20 {
    constructor() ERC20("MockRewardToken", "MRT") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
