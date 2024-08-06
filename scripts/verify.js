const { ethers, run } = require("hardhat");
const her = require("hardhat");

async function main() {
    try{
const MockRewardTokenAddress="0x6e90AD29aCa4B269B31f16B68CF613147a1B0C65";
const MOCKNFTAddress="0xDFAb4841440914FDc58f864B3a0d9e2B0324Df1c";
const DZapNFTStakingAddress = "0x50F6BaB82B59a2F8C9a49757344F860A9E893529";

await hre.run("verify", {
    address: MockRewardTokenAddress,
    constructorArguments: [],
    contract: "contracts/MockRewardToken.sol:MockRewardToken"
  });

  await hre.run("verify", {
    address: MOCKNFTAddress,
    constructorArguments: [],
    contract: "contracts/MockNFT.sol:MockNFT"
  });

  await hre.run("verify", {
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


// MockNFT Address: 0xB872af7a9363f6d811602672fC48dDA150691f9E
// MockRewardToken Address: 0x6B23d3215234091B84948495C34b3EB0e9E615e7
// I'm here
// DZapNFTStaking address: 0x4728BB003C8c55f62D2e9fC10AC02650Bf1c6E69