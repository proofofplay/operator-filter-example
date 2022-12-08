// SPDX-License-Identifier: MIT LICENSE

pragma solidity ^0.8.9;

import "../OperatorFilterExample.sol";

/** @title NFT Mock for testing */
contract NFTMock is OperatorFilterExample {
    function mintForTests(address to, uint256 tokenId) external {
        _safeMint(to, tokenId);
    }
}
