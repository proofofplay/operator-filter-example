// SPDX-License-Identifier: MIT LICENSE

pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IBeforeTokenTransferHandler.sol";

/** 
 * @title OperatorFilterExample 
 * 
 * @dev This contract is an example NFT contract that has a beforeTokenTransfer hook 
 * that can be changed by the owner to implement different transfer logic depending on context.
 */
contract OperatorFilterExample is ERC721Enumerable, Ownable {
    /// @notice Reference to the handler contract for transfer hooks
    address public beforeTokenTransferHandler;

    /** SETUP **/
    constructor()
        ERC721("OpFilter", "OF")
    {
        // Do nothing
    }

    /**
     * Sets the before token transfer handler
     *
     * @param handlerAddress  Address to the transfer hook handler contract
     */
    function setBeforeTokenTransferHandler(address handlerAddress)
        external
        onlyOwner
    {
        beforeTokenTransferHandler = handlerAddress;
    }

    /**
     * @notice Handles any pre-transfer actions
     * @inheritdoc ERC721
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal virtual override {
        if (beforeTokenTransferHandler != address(0)) {
            IBeforeTokenTransferHandler handlerRef = IBeforeTokenTransferHandler(
                    beforeTokenTransferHandler
                );
            handlerRef.beforeTokenTransfer(
                address(this),
                _msgSender(),
                from,
                to,
                tokenId,
                batchSize
            );
        }

        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }
}
