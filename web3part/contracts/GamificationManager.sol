// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ownable/Ownable.sol";
import "./TaskVerification.sol";
import "./ReputationTracker.sol";
import "./AchievementTracker.sol";

/**
 * @title GamificationManager
 * @dev Central hub for managing all gamification features including achievements, streaks, and reputation
 */
contract GamificationManager is Ownable {
    // Reference to other contracts
    TaskVerification public taskVerificationContract;
    ReputationTracker public reputationTrackerContract;
    AchievementTracker public achievementTrackerContract;

    // Events
    event TaskVerificationContractUpdated(address newAddress);
    event ReputationTrackerContractUpdated(address newAddress);
    event AchievementTrackerContractUpdated(address newAddress);
    event DedicationAchievementChecked(address user, uint8 timeOfDay);

    constructor(
        address taskVerificationAddress,
        address reputationTrackerAddress,
        address achievementTrackerAddress
    ) Ownable(msg.sender) {
        taskVerificationContract = TaskVerification(taskVerificationAddress);
        reputationTrackerContract = ReputationTracker(reputationTrackerAddress);
        achievementTrackerContract = AchievementTracker(
            achievementTrackerAddress
        );
    }

    /**
     * @dev Updates the TaskVerification contract address
     * @param newAddress Address of the new TaskVerification contract
     */
    function setTaskVerificationContract(
        address newAddress
    ) external onlyOwner {
        require(newAddress != address(0), "Invalid address");
        taskVerificationContract = TaskVerification(newAddress);
        emit TaskVerificationContractUpdated(newAddress);
    }

    /**
     * @dev Updates the ReputationTracker contract address
     * @param newAddress Address of the new ReputationTracker contract
     */
    function setReputationTrackerContract(
        address newAddress
    ) external onlyOwner {
        require(newAddress != address(0), "Invalid address");
        reputationTrackerContract = ReputationTracker(newAddress);
        emit ReputationTrackerContractUpdated(newAddress);
    }

    /**
     * @dev Updates the AchievementTracker contract address
     * @param newAddress Address of the new AchievementTracker contract
     */
    function setAchievementTrackerContract(
        address newAddress
    ) external onlyOwner {
        require(newAddress != address(0), "Invalid address");
        achievementTrackerContract = AchievementTracker(newAddress);
        emit AchievementTrackerContractUpdated(newAddress);
    }

    /**
     * @dev Gets comprehensive gamification data for a user
     * @param user Address of the user
     * @return taskCount Number of verified tasks
     * @return tier Current reputation tier
     * @return streak Current streak count
     * @return maxStreak Maximum streak achieved
     * @return lastActivity Timestamp of last activity
     * @return streakAtRisk Whether streak is at risk
     * @return achievementCount Number of unlocked achievements
     */
    function getUserGamificationData(
        address user
    )
        external
        view
        returns (
            uint256 taskCount,
            ReputationTracker.ReputationTier tier,
            uint256 streak,
            uint256 maxStreak,
            uint256 lastActivity,
            bool streakAtRisk,
            uint256 achievementCount
        )
    {
        // Get reputation data
        (taskCount, tier, streak) = reputationTrackerContract.getReputationData(
            user
        );

        // Get streak data
        (maxStreak, lastActivity, streakAtRisk) = reputationTrackerContract
            .getStreakData(user);

        // Get achievement count
        achievementCount = achievementTrackerContract.getUserAchievementCount(
            user
        );
    }

    /**
     * @dev Checks and updates achievements based on user activities
     * @param user Address of the user
     */
    function checkAndUpdateAchievements(address user) external {
        // Get user data from reputation and task contracts
        (
            uint256 taskCount,
            ReputationTracker.ReputationTier tier,
            uint256 streak
        ) = reputationTrackerContract.getReputationData(user);

        uint256 maxStreak = reputationTrackerContract.getMaxStreak(user);

        // Check and update achievements based on the data
        achievementTrackerContract.checkTaskCompletionAchievements(
            user,
            taskCount
        );
        achievementTrackerContract.checkStreakAchievements(
            user,
            streak,
            maxStreak
        );
        achievementTrackerContract.checkReputationTierAchievements(
            user,
            uint8(tier)
        );
    }

    /**
     * @dev Checks for time-based dedication achievements (early bird, night owl, etc.)
     * @param user Address of the user
     */
    function checkDedicationAchievements(address user) external {
        // Get current time of day (UTC)
        // This will extract the hour (0-23) from the current timestamp
        uint8 timeOfDay = uint8((block.timestamp / 3600) % 24);

        // Check time-based achievements
        achievementTrackerContract.checkDedicationAchievements(user, timeOfDay);

        emit DedicationAchievementChecked(user, timeOfDay);
    }
}
