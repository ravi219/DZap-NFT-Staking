const { ethers, upgrades } = require("hardhat");

function sleep(ms)

 {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  
  const admin = "0x9D3cfA7Ba5d48B503861a87AeB1b220957004E3f";
  const proxyAddress = "0x1cA81D8236767c5d7B6BB59e8bb6a0fBD4CbCFBB";
try {
  // Deploy new implementation
  const NewStakingImplementation = await ethers.getContractFactory("DZapNFTStaking");
  const upgraded = await upgrades.upgradeProxy(proxyAddress, NewStakingImplementation, { gasLimit: 5000000 });
  await upgraded.deployed();
  console.log("Upgrded Contract:- ", upgraded.address);

} catch (error) {
  console.error("Error during upgrade:", error);
}
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
