const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("DZapNFTStaking Upgrade", function () {
  let deployer, nonOwner, proxy, newImplementation;

  before(async function () {
    [deployer, nonOwner] = await ethers.getSigners();

    const NFT = await ethers.getContractFactory("MockNFT");
    const nft = await NFT.deploy();
    await nft.deployed();

    const RewardToken = await ethers.getContractFactory("MockRewardToken");
    const rewardToken = await RewardToken.deploy();
    await rewardToken.deployed();

    const Staking = await ethers.getContractFactory("DZapNFTStaking");
    proxy = await upgrades.deployProxy(Staking, [
      deployer.address, // Admin address
      nft.address,
      rewardToken.address,
      ethers.utils.parseUnits("10", 18), // rewardPerBlock
      100, // unbondingPeriod
      600  // rewardClaimDelay
    ], { initializer: 'initialize', kind: 'uups' });
    await proxy.deployed();
  });

  it("should upgrade the contract", async function () {
    const NewStaking = await ethers.getContractFactory("NewDZapNFTStaking");
    newImplementation = await upgrades.prepareUpgrade(proxy.address, NewStaking);
    console.log("New implementation address prepared:", newImplementation);

    await upgrades.upgradeProxy(proxy.address, NewStaking);
    console.log("Proxy upgraded");

    const upgradedProxy = await ethers.getContractAt("NewDZapNFTStaking", proxy.address);
    expect(await upgradedProxy.nft()).to.equal(await proxy.nft());
  });

  it("should prevent non-owner from upgrading the contract", async function () {
    const NewStaking = await ethers.getContractFactory("NewDZapNFTStaking");
    await expect(
      upgrades.upgradeProxy(proxy.address, NewStaking.connect(nonOwner))
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });
});
