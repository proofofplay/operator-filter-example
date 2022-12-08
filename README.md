# Operator Filter Example

This project has a simple ERC721 contract with an optional hook that can be set for beforeTokenTransfer. This allows NFT creators to potentially add/remove restrictions on transfers after mint. An example hook was implemented that implements the OpenSea/Blur Operator Filter Registry.

We used this in https://piratenation.game post-launch to implement royalty protection on both OpenSea and Blur.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat run scripts/deploy.ts
```
