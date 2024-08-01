// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/**
 * @title MockNFT
 * @dev Mock ERC721 token for testing purposes.
 */
contract MockNFT is ERC721 {
    uint256 private _tokenIds;

    constructor() ERC721("Mock NFT", "MNFT") {}

    function mint(address to, uint256 tokenId) external {
        _mint(to, tokenId);
    }
}
