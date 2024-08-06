// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/utils/ERC721HolderUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./interface/IDZapNFTStaking.sol";
import "hardhat/console.sol";

/**
 * @title DZapNFTStaking
 * @dev Contract for staking NFTs and earning ERC20 rewards.
 */
contract DZapNFTStaking is Initializable, UUPSUpgradeable, OwnableUpgradeable, PausableUpgradeable, ERC721HolderUpgradeable, IDZapNFTStaking {
    using SafeERC20 for IERC20;

    IERC721 public nft;
    IERC20 public rewardToken;
    address public admin;

    struct RewardRate {
        uint256 blockNumber;
        uint256 rewardPerBlock;
    }

    RewardRate[] public rewardRates;

    uint256 public unbondingPeriod;
    uint256 public rewardClaimDelay;

    struct Stake {
        uint256 tokenId;
        uint256 stakedAt;
        uint256 unbondingAt;
        uint256 rewardClaimedAt;
        bool isStaked;
    }

    mapping(address => mapping(uint256 => Stake)) public stakes;
    mapping(uint256 => address) public tokenOwner;

    event Staked(address indexed user, uint256 tokenId);
    event Unstaked(address indexed user, uint256 tokenId);
    event RewardClaimed(address indexed user, uint256 amount);
    event RewardRateUpdated(uint256 blockNumber, uint256 rewardPerBlock);

    error NotTokenOwner();
    error AlreadyStaked();
    error NotStaked();
    error InvalidToken();
    error UnbondingPeriodNotPassed();
    error ClaimDelayNotPassed();
    error StakingPaused();
    error InvalidRewardPerBlock();
    error InvalidUnbondingPeriod();
    error InvalidRewardClaimDelay();

    /**
     * @dev Initializes the contract by setting the admin, NFT contract, reward token contract, reward per block, unbonding period, and reward claim delay.
     * @param _admin Address of the contract admin.
     * @param _nft Address of the NFT contract.
     * @param _rewardToken Address of the reward token contract.
     * @param _rewardPerBlock Number of reward tokens given per block.
     * @param _unbondingPeriod Number of blocks required to wait before withdrawing an unstaked NFT.
     * @param _rewardClaimDelay Number of seconds required to wait before claiming rewards.
     */
    function initialize(
        address _admin,
        address _nft,
        address _rewardToken,
        uint256 _rewardPerBlock,
        uint256 _unbondingPeriod,
        uint256 _rewardClaimDelay
    ) public initializer {
        __UUPSUpgradeable_init();
        __Ownable_init();
        __Pausable_init();

        admin = _admin;
        nft = IERC721(_nft);
        rewardToken = IERC20(_rewardToken);
        rewardRates.push(RewardRate(block.number, _rewardPerBlock));
        unbondingPeriod = _unbondingPeriod;
        rewardClaimDelay = _rewardClaimDelay;
    }

    /**
     * @dev Authorizes the upgrade to a new implementation.
     * @param newImplementation Address of the new implementation contract.
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    /**
     * @notice Stakes an NFT to earn rewards.
     * @dev Transfers the NFT from the caller to the contract.
     * @param tokenId ID of the NFT to be staked.
     */
    function stake(uint256 tokenId) external whenNotPaused {
        if (stakes[msg.sender][tokenId].isStaked) revert AlreadyStaked();
        if (nft.ownerOf(tokenId) != msg.sender) revert NotTokenOwner();

        nft.safeTransferFrom(msg.sender, address(this), tokenId);
        stakes[msg.sender][tokenId] = Stake({
            tokenId: tokenId,
            stakedAt: block.number,
            unbondingAt: 0,
            rewardClaimedAt: block.timestamp,
            isStaked: true
        });
        tokenOwner[tokenId] = msg.sender;
        emit Staked(msg.sender, tokenId);
    }

    /**
     * @notice Unstakes an NFT.
     * @dev Sets the unbonding period for the staked NFT.
     * @param tokenId ID of the NFT to be unstaked.
     */
    function unstake(uint256 tokenId) external whenNotPaused {
        if (!stakes[msg.sender][tokenId].isStaked) revert NotStaked();

        _claimRewards(msg.sender, tokenId);

        stakes[msg.sender][tokenId].unbondingAt = block.number + unbondingPeriod;
        emit Unstaked(msg.sender, tokenId);
    }

    /**
     * @notice Withdraws an unstaked NFT after the unbonding period has passed.
     * @dev Transfers the NFT from the contract back to the caller.
     * @param tokenId ID of the NFT to be withdrawn.
     */
    function withdraw(uint256 tokenId) external {
        if (!stakes[msg.sender][tokenId].isStaked) revert NotStaked();
        if (block.number < stakes[msg.sender][tokenId].unbondingAt) revert UnbondingPeriodNotPassed();

        nft.safeTransferFrom(address(this), msg.sender, tokenId);
        delete stakes[msg.sender][tokenId];
        delete tokenOwner[tokenId];
    }

    /**
     * @notice Claims accumulated rewards for a staked NFT.
     * @dev Transfers the reward tokens to the caller.
     * @param tokenId ID of the staked NFT.
     */
    function claimRewards(uint256 tokenId) external {
        if (!stakes[msg.sender][tokenId].isStaked) revert NotStaked();
        if (stakes[msg.sender][tokenId].unbondingAt != 0) revert ClaimDelayNotPassed();
        if (block.timestamp < stakes[msg.sender][tokenId].rewardClaimedAt + rewardClaimDelay) revert ClaimDelayNotPassed();

        _claimRewards(msg.sender, tokenId);
    }

    /**
     * @dev Internal function to claim rewards for a specific staked NFT.
     * @param user Address of the user.
     * @param tokenId ID of the staked NFT.
     */
    function _claimRewards(address user, uint256 tokenId) internal {
        Stake storage stakeInfo = stakes[user][tokenId];
        uint256 rewards = _calculateRewards(stakeInfo.stakedAt, block.number);
        if (rewards > 0) {
            rewardToken.safeTransfer(user, rewards);
            emit RewardClaimed(user, rewards);
            stakeInfo.stakedAt = block.number;
            stakeInfo.rewardClaimedAt = block.timestamp;
        }
    }

    /**
     * @dev Internal function to calculate rewards from a start block to an end block.
     * @param startBlock The block number to start calculating rewards from.
     * @param endBlock The block number to stop calculating rewards at.
     * @return totalRewards The total rewards accumulated from startBlock to endBlock.
     */
    function _calculateRewards(uint256 startBlock, uint256 endBlock) internal view returns (uint256 totalRewards) {
        uint256 len = rewardRates.length;
        for (uint256 i = len - 1; i >= 0; i--) {
            RewardRate memory rate = rewardRates[i];
            if (endBlock > rate.blockNumber) {
                uint256 blocks = endBlock - rate.blockNumber;
                totalRewards += blocks * rate.rewardPerBlock;
                endBlock = rate.blockNumber;
            if (i == 0) break;
            }
        }
    }

    /**
     * @notice Updates the number of reward tokens given per block.
     * @dev Records the new reward rate along with the current block number.
     * @param _rewardPerBlock New number of reward tokens per block.
     */
    function updateRewardRate(uint256 _rewardPerBlock) external onlyOwner {
        if (_rewardPerBlock == 0) revert InvalidRewardPerBlock();

        rewardRates.push(RewardRate(block.number, _rewardPerBlock));
        emit RewardRateUpdated(block.number, _rewardPerBlock);
    }

    /**
     * @notice Sets the unbonding period.
     * @dev Only callable by the contract owner.
     * @param _unbondingPeriod New unbonding period in blocks.
     */
    function setUnbondingPeriod(uint256 _unbondingPeriod) external onlyOwner {
        if (_unbondingPeriod == 0) revert InvalidUnbondingPeriod();
        unbondingPeriod = _unbondingPeriod;
    }

    /**
     * @notice Sets the reward claim delay.
     * @dev Only callable by the contract owner.
     * @param _rewardClaimDelay New reward claim delay in seconds.
     */
    function setRewardClaimDelay(uint256 _rewardClaimDelay) external onlyOwner {
        if (_rewardClaimDelay == 0) revert InvalidRewardClaimDelay();
        rewardClaimDelay = _rewardClaimDelay;
    }

    /**
     * @notice Pauses the staking process.
     * @dev Only callable by the contract owner.
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpauses the staking process.
     * @dev Only callable by the contract owner.
     */
    function unpause() external onlyOwner {
        _unpause();
    }

}
