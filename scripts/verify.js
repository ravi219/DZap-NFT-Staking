const { ethers, run } = require("hardhat");
const her = require("hardhat");

async function main() {
    try{
const MockRewardTokenAddress="0x672EaEA98837DC0055c3B2d060Fb1c6d943288Dd";
const MOCKNFTAddress="0x6EC754C6F0ab95b2aBb7CBe985Ef9F1B89b2aB4c";
const DZapNFTStakingAddress = "0xBD1266fe8C8e443f73eAD2e98A4d616535c8dD22";

await hre.run("verify:verify", {
    address: MockRewardTokenAddress,
    constructorArguments: [],
    contract: "contracts/MockRewardToken.sol:MockRewardToken"
  });

  await hre.run("verify:verify", {
    address: MOCKNFTAddress,
    constructorArguments: [],
    contract: "contracts/MockNFT.sol:MockNFT"
  });

  await hre.run("verify:verify", {
    address: DZapNFTStakingAddress,
    contract: "contracts/DZapNFTStaking.sol:DZapNFTStaking"
  });

} catch (err) {
console.log(err);
}
}

main().catch((error) => {
console.error(error);
process.exitCode = 1;
});
