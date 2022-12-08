/**
 * Tests for FilterRegistryHook
 */

import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { constants } from "ethers";
import { ethers } from "hardhat";
import {
  RegistryFilterHook
} from "typechain/contract-types";
import { NFTMock } from "../typechain-types";

describe("RegistryFilterHook", () => {
  let registryFilterHookContract: any;
  let nftContract: NFTMock;
  let contractOwnerAccount: any,
    marketplaceAccount: any,
    firstNFTOwner: any,
    secondNFTOwner: any

  const setupContractAndAccounts = async () => {
    [
      contractOwnerAccount,
      marketplaceAccount,
      firstNFTOwner,
      secondNFTOwner
    ] = (await ethers.getSigners());

    // Make sure auto-mine is on
    await ethers.provider.send("evm_setAutomine", [true]);

    const nftFactory = await ethers.getContractFactory(
      "NFTMock"
    );
    nftContract = (await nftFactory.deploy()) as NFTMock;
    await nftContract.deployed();

    const registryFilterHookFactory = await ethers.getContractFactory(
      "FilterRegistryHook"
    );
    registryFilterHookContract =
      (await registryFilterHookFactory.deploy()) as RegistryFilterHook;
    await registryFilterHookContract.deployed();

    await nftContract.setBeforeTokenTransferHandler(
      registryFilterHookContract.address
    );

    return {
      owner: contractOwnerAccount,
      acc1: marketplaceAccount,
      acc2: firstNFTOwner,
      acc3: secondNFTOwner,
      registryFilterContract: registryFilterHookContract,
      nftContract: nftContract,
    };
  };

  beforeEach(async () => {
    ({
      owner: contractOwnerAccount,
      acc1: marketplaceAccount,
      acc2: firstNFTOwner,
      acc3: secondNFTOwner,
      registryFilterContract: registryFilterHookContract,
      nftContract: nftContract,
    } = await loadFixture(setupContractAndAccounts));
  });

  describe("setOperatorFilterRegistry", () => {
    it("owners can change filter registry address", async () => {
      expect(
        await registryFilterHookContract
          .connect(contractOwnerAccount)
          .getOperatorFilterRegistry()
      ).to.equal(constants.AddressZero);
      await registryFilterHookContract
        .connect(contractOwnerAccount)
        .setOperatorFilterRegistry(contractOwnerAccount.address);
      expect(
        await registryFilterHookContract
          .connect(contractOwnerAccount)
          .getOperatorFilterRegistry()
      ).to.equal(contractOwnerAccount.address);
    });

    it("non-owners cannot change filter registry address", async () => {
      expect(
        await registryFilterHookContract
          .connect(contractOwnerAccount)
          .getOperatorFilterRegistry()
      ).to.equal(constants.AddressZero);
      await expect(
        registryFilterHookContract
          .connect(marketplaceAccount)
          .setOperatorFilterRegistry(contractOwnerAccount.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("beforeTransfer with an allowed operator", async () => {
      expect(
        await registryFilterHookContract
          .connect(contractOwnerAccount)
          .getOperatorFilterRegistry()
      ).to.equal(constants.AddressZero);

      const operatorFilterRegistryFactory = await ethers.getContractFactory(
        "OperatorFilterRegistry"
      );
      const operatorFilterRegistryContract =
        (await operatorFilterRegistryFactory.deploy()) as OperatorFilterRegistry;
      await operatorFilterRegistryContract.deployed();

      await registryFilterHookContract
        .connect(contractOwnerAccount)
        .setOperatorFilterRegistry(operatorFilterRegistryContract.address);
      expect(
        await registryFilterHookContract
          .connect(contractOwnerAccount)
          .getOperatorFilterRegistry()
      ).to.equal(operatorFilterRegistryContract.address);

      await operatorFilterRegistryContract
        .connect(contractOwnerAccount)
        .register(nftContract.address);

      await nftContract.mintForTests(firstNFTOwner.address, 1);
      await nftContract
        .connect(firstNFTOwner)
        .setApprovalForAll(marketplaceAccount.address, true);
      await expect(
        nftContract
          .connect(marketplaceAccount)
          .transferFrom(firstNFTOwner.address, secondNFTOwner.address, 1)
      ).not.to.be.revertedWithCustomError(
        operatorFilterRegistryContract,
        "AddressFiltered"
      );
    });

    it("beforeTransfer with a disallowed operator", async () => {
      expect(
        await registryFilterHookContract
          .connect(contractOwnerAccount)
          .getOperatorFilterRegistry()
      ).to.equal(constants.AddressZero);

      const operatorFilterRegistryFactory = await ethers.getContractFactory(
        "OperatorFilterRegistry"
      );
      const operatorFilterRegistryContract =
        (await operatorFilterRegistryFactory.deploy()) as OperatorFilterRegistry;
      await operatorFilterRegistryContract.deployed();

      await registryFilterHookContract
        .connect(contractOwnerAccount)
        .setOperatorFilterRegistry(operatorFilterRegistryContract.address);
      expect(
        await registryFilterHookContract
          .connect(contractOwnerAccount)
          .getOperatorFilterRegistry()
      ).to.equal(operatorFilterRegistryContract.address);

      await operatorFilterRegistryContract
        .connect(contractOwnerAccount)
        .register(nftContract.address);

      await expect(
        operatorFilterRegistryContract
          .connect(contractOwnerAccount)
          .updateOperator(
            nftContract.address,
            marketplaceAccount.address,
            true
          )
      )
        .to.emit(operatorFilterRegistryContract, "OperatorUpdated")
        .withArgs(
          nftContract.address,
          marketplaceAccount.address,
          true
        );

      await nftContract.mintForTests(firstNFTOwner.address, 1);
      await nftContract
        .connect(firstNFTOwner)
        .setApprovalForAll(marketplaceAccount.address, true);
      await expect(
        nftContract
          .connect(marketplaceAccount)
          .transferFrom(firstNFTOwner.address, secondNFTOwner.address, 1)
      )
        .to.be.revertedWithCustomError(
          operatorFilterRegistryContract,
          "AddressFiltered"
        )
        .withArgs(marketplaceAccount.address);
    });
  });
});
