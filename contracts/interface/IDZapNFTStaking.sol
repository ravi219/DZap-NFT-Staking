// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IDZapNFTStaking {

    function stake(uint256 tokenId) external;
    function unstake(uint256 tokenId) external;
    function withdraw(uint256 tokenId) external;
    function claimRewards(uint256 tokenId) external;
    function updateRewardRate(uint256 _rewardPerBlock) external;
    function setUnbondingPeriod(uint256 _unbondingPeriod) external;
    function setRewardClaimDelay(uint256 _rewardClaimDelay) external;
    function pause() external;
    function unpause() external;
}
