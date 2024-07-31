const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("DZapNFTStaking", function () {
  let stakingContract, nftContract, rewardToken, owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const NFT = await ethers.getContractFactory("MockNFT");
    nftContract = await NFT.deploy();
    await nftContract.deployed();

    const RewardToken = await ethers.getContractFactory("MockERC20");
    rewardToken = await RewardToken.deploy();
    await rewardToken.deployed();

    const Staking = await ethers.getContractFactory("DZapNFTStaking");
    stakingContract = await upgrades.deployProxy(Staking, [
      nftContract.address,
      rewardToken.address,
      ethers.utils.parseUnits("10", 18),
      100,
      600,
    ]);
    await stakingContract.deployed();

    // Mint some NFTs and reward tokens for testing
    await nftContract.mint(addr1.address, 1);
    await nftContract.mint(addr1.address, 2);
    await nftContract.mint(addr2.address, 3);
    await rewardToken.mint(stakingContract.address, ethers.utils.parseUnits("1000000", 18));
  });

  it("Should allow staking and unstaking of NFTs", async function () {
    await nftContract.connect(addr1).approve(stakingContract.address, 1);
    await stakingContract.connect(addr1).stake(1);

    let stakes = await stakingContract.stakes(addr1.address);
    expect(stakes.length).to.equal(1);

    await stakingContract.connect(addr1).unstake(1);

    stakes = await stakingContract.stakes(addr1.address);
    expect(stakes[0].unbondingAt).to.be.gt(0);
  });

  it("Should distribute rewards correctly", async function () {
    await nftContract.connect(addr1).approve(stakingContract.address, 1);
    await stakingContract.connect(addr1).stake(1);

    // Simulate some blocks
    for (let i = 0; i < 200; i++) {
      await ethers.provider.send("evm_mine", []);
    }

    await stakingContract.connect(addr1).claimRewards(1);

    let balance = await rewardToken.balanceOf(addr1.address);
    expect(balance).to.be.gt(0);
  });

  it("Should handle multiple users", async function () {
    await nftContract.connect(addr1).approve(stakingContract.address, 1);
    await stakingContract.connect(addr1).stake(1);

    await nftContract.connect(addr2).approve(stakingContract.address, 3);
    await stakingContract.connect(addr2).stake(3);

    // Simulate some blocks
    for (let i = 0; i < 200; i++) {
      await ethers.provider.send("evm_mine", []);
    }

    await stakingContract.connect(addr1).claimRewards(1);
    await stakingContract.connect(addr2).claimRewards(3);

    let balance1 = await rewardToken.balanceOf(addr1.address);
    let balance2 = await rewardToken.balanceOf(addr2.address);
    expect(balance1).to.be.gt(0);
    expect(balance2).to.be.gt(0);
  });
});
