const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const { mine } = require("@nomicfoundation/hardhat-network-helpers");

async function mineBlocks(numberOfBlocks) {
  await ethers.provider.send("hardhat_mine", [`0x${numberOfBlocks.toString(16)}`]);
}

describe("DZapNFTStaking", function () {
  let stakingContract, nftContract, rewardToken, owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const NFT = await ethers.getContractFactory("MockNFT");
    nftContract = await NFT.deploy();
    await nftContract.deployed();

    const RewardToken = await ethers.getContractFactory("MockRewardToken");
    rewardToken = await RewardToken.deploy();
    await rewardToken.deployed();

    const Staking = await ethers.getContractFactory("DZapNFTStaking");
    stakingContract = await upgrades.deployProxy(Staking, [
      owner.address,
      nftContract.address,
      rewardToken.address,
      ethers.utils.parseUnits("10", 18),
      100,
      100
    ], { initializer: 'initialize' });
    await stakingContract.deployed();

    // Mint some NFTs and reward tokens for testing
    await nftContract.mint(addr1.address, 1);
    await nftContract.mint(addr1.address, 2);
    await nftContract.mint(addr2.address, 3);
    await rewardToken.mint(stakingContract.address, ethers.utils.parseUnits("1000000", 18));
  });

  it.only("Should allow staking and unstaking of multiple NFTs per user", async function () {
    await nftContract.connect(addr1).approve(stakingContract.address, 1);
    await stakingContract.connect(addr1).stake(1);
    
    await nftContract.connect(addr1).approve(stakingContract.address, 2);
    await stakingContract.connect(addr1).stake(2);

    let stake1 = await stakingContract.stakes(addr1.address, 1);
    let stake2 = await stakingContract.stakes(addr1.address, 2);
    
    expect(stake1.tokenId).to.equal(1);
    expect(stake2.tokenId).to.equal(2);
    await mineBlocks(50);
    await stakingContract.updateRewardRate(ethers.utils.parseUnits("20", 18));
    await mineBlocks(25);
    await stakingContract.updateRewardRate(ethers.utils.parseUnits("40", 18));
    await mineBlocks(25);
    await stakingContract.connect(addr1).unstake(1);

    stake1 = await stakingContract.stakes(addr1.address, 1);
    expect(stake1.unbondingAt).to.be.gt(0);
  });

  it("Should distribute rewards correctly for multiple NFTs", async function () {
    await nftContract.connect(addr1).approve(stakingContract.address, 1);
    await stakingContract.connect(addr1).stake(1);

    await nftContract.connect(addr1).approve(stakingContract.address, 2);
    await stakingContract.connect(addr1).stake(2);
    // await stakingContract.connect(addr1).unstake(1);
    // await stakingContract.connect(addr1).unstake(2);
    // Simulate some blocks
    for (let i = 0; i < 200; i++) {
      await ethers.provider.send("evm_mine", []);
    }
    await stakingContract.connect(addr1).claimRewards(1);
    await stakingContract.connect(addr1).claimRewards(2);

    let balance = await rewardToken.balanceOf(addr1.address);
    expect(balance).to.be.gt(0);
  });

  it("Should handle multiple users with multiple NFTs", async function () {
    await nftContract.connect(addr1).approve(stakingContract.address, 1);
    await stakingContract.connect(addr1).stake(1);

    await nftContract.connect(addr1).approve(stakingContract.address, 2);
    await stakingContract.connect(addr1).stake(2);

    await nftContract.connect(addr2).approve(stakingContract.address, 3);
    await stakingContract.connect(addr2).stake(3);

    // Simulate some blocks
    for (let i = 0; i < 200; i++) {
      await ethers.provider.send("evm_mine", []);
    }

    await stakingContract.connect(addr1).claimRewards(1);
    await stakingContract.connect(addr1).claimRewards(2);
    await stakingContract.connect(addr2).claimRewards(3);

    let balance1 = await rewardToken.balanceOf(addr1.address);
    let balance2 = await rewardToken.balanceOf(addr2.address);
    expect(balance1).to.be.gt(0);
    expect(balance2).to.be.gt(0);
  });

  it("Should revert when staking while paused", async function () {
    await stakingContract.pause();
    await nftContract.connect(addr1).approve(stakingContract.address, 1);
    await expect(stakingContract.connect(addr1).stake(1)).to.be.revertedWith("Pausable: paused");
  });

  it("Should revert when staking an already staked NFT", async function () {
    await nftContract.connect(addr1).approve(stakingContract.address, 1);
    await stakingContract.connect(addr1).stake(1);
    await expect(stakingContract.connect(addr1).stake(1)).to.be.revertedWith("AlreadyStaked");
  });

  it("Should revert when staking an NFT not owned by the caller", async function () {
    await expect(stakingContract.connect(addr1).stake(3)).to.be.revertedWith("NotTokenOwner");
  });

  it("Should revert when unstaking while paused", async function () {
    await nftContract.connect(addr1).approve(stakingContract.address, 1);
    await stakingContract.connect(addr1).stake(1);
    await stakingContract.pause();
    await expect(stakingContract.connect(addr1).unstake(1)).to.be.revertedWith("Pausable: paused");
  });

  it("Should revert when unstaking an unstaked NFT", async function () {
    await expect(stakingContract.connect(addr1).unstake(1)).to.be.revertedWith("NotStaked");
  });

  it("Should revert when withdrawing before unbonding period is over", async function () {
    await nftContract.connect(addr1).approve(stakingContract.address, 1);
    await stakingContract.connect(addr1).stake(1);
    await stakingContract.connect(addr1).unstake(1);
    await expect(stakingContract.connect(addr1).withdraw(1)).to.be.revertedWith("UnbondingPeriodNotPassed");
  });

  it("Should revert when claiming rewards while NFT is unstaking", async function () {
    await nftContract.connect(addr1).approve(stakingContract.address, 1);
    await stakingContract.connect(addr1).stake(1);
    await stakingContract.connect(addr1).unstake(1);
    await expect(stakingContract.connect(addr1).claimRewards(1)).to.be.revertedWith("ClaimDelayNotPassed");
  });

  it("Should revert when claiming rewards before reward claim delay", async function () {
    await nftContract.connect(addr1).approve(stakingContract.address, 1);
    await stakingContract.connect(addr1).stake(1);
    stakingContract.connect(addr1).claimRewards(1)
    await ethers.provider.send("evm_increaseTime", [100]);
    await ethers.provider.send("evm_mine", []);
    await expect(stakingContract.connect(addr1).claimRewards(1)).to.be.revertedWith("ClaimDelayNotPassed");
  });

  it("Should revert when setting rewardPerBlock to zero", async function () {
    await expect(stakingContract.updateRewardRate(0)).to.be.revertedWith("InvalidRewardPerBlock");
  });

  it("Should revert when setting unbondingPeriod to zero", async function () {
    await expect(stakingContract.setUnbondingPeriod(0)).to.be.revertedWith("InvalidUnbondingPeriod");
  });

  it("Should revert when setting rewardClaimDelay to zero", async function () {
    await expect(stakingContract.setRewardClaimDelay(0)).to.be.revertedWith("InvalidRewardClaimDelay");
  });
});
