const { ethers, upgrades } = require("hardhat");

function sleep(ms)

 {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  
  const admin = "0x9D3cfA7Ba5d48B503861a87AeB1b220957004E3f";

  
  const NFT = await ethers.getContractFactory("MockNFT");
  await sleep(6000);
  const nft = await NFT.deploy();
  await nft.deployed();
  console.log("MockNFT Address:", nft.address);


  const RewardToken = await ethers.getContractFactory("MockRewardToken");
  await sleep(6000);
  const rewardToken = await RewardToken.deploy();
  await rewardToken.deployed();
  console.log("MockRewardToken Address:", rewardToken.address);

  await sleep(6000);
  const Staking = await ethers.getContractFactory("DZapNFTStaking");
  console.log("I'm here");
  await sleep(6000);

  
  const staking = await upgrades.deployProxy(Staking, [
    admin,
    nft.address,
    rewardToken.address,
    ethers.utils.parseUnits("10", 18), 
    10, 
    10  
  ], { initializer: 'initialize',  kind: 'uups' });
  await staking.deployed();
  console.log("DZapNFTStaking address:", staking.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
