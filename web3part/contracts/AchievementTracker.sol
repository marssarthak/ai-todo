// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ownable/Ownable.sol";

/**
 * @title AchievementTracker
 * @dev Contract for managing achievements and tracking user progress
 */
contract AchievementTracker is Ownable {
    // Achievement categories
    enum AchievementCategory {
        Tasks, // Task completion milestones
        Streaks, // Streak-based achievements
        Goals, // Goal completion achievements
        Dedication // Time-based achievements
    }

    // Achievement data structure
    struct Achievement {
        uint256 id;
        string name;
        string description;
        AchievementCategory category;
        uint256 threshold; // Value required to unlock the achievement
        bool exists; // Flag to check if the achievement exists
    }

    // User achievement data structure
    struct UserAchievement {
        uint256 achievementId;
        bool unlocked;
        uint256 progress; // Current progress towards the achievement
        uint256 unlockedAt; // Timestamp when unlocked
    }

    // Mapping of achievement ID to achievement data
    mapping(uint256 => Achievement) private achievements;

    // Mapping from user address to their achievements
    mapping(address => mapping(uint256 => UserAchievement))
        private userAchievements;

    // Mapping from user address to array of achievement IDs they have
    mapping(address => uint256[]) private userAchievementIds;

    // Total number of defined achievements
    uint256 private achievementCount;

    // Access control - Only GamificationManager can call certain functions
    address private gamificationManager;

    // Events
    event AchievementCreated(
        uint256 indexed id,
        string name,
        AchievementCategory category,
        uint256 threshold
    );
    event AchievementUpdated(
        uint256 indexed id,
        string name,
        uint256 threshold
    );
    event AchievementUnlocked(
        address indexed user,
        uint256 indexed achievementId,
        uint256 timestamp
    );
    event AchievementProgressUpdated(
        address indexed user,
        uint256 indexed achievementId,
        uint256 newProgress
    );
    event GamificationManagerSet(address managerAddress);

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Sets the GamificationManager address
     * @param managerAddress Address of the GamificationManager contract
     */
    function setGamificationManager(address managerAddress) external onlyOwner {
        require(managerAddress != address(0), "Invalid manager address");
        gamificationManager = managerAddress;
        emit GamificationManagerSet(managerAddress);
    }

    /**
     * @dev Modifier to restrict access to only the GamificationManager
     */
    modifier onlyGamificationManager() {
        require(
            msg.sender == gamificationManager,
            "Only GamificationManager can call"
        );
        _;
    }

    /**
     * @dev Creates a new achievement
     * @param name Achievement name
     * @param description Achievement description
     * @param category Achievement category
     * @param threshold Value required to unlock the achievement
     * @return id of the created achievement
     */
    function createAchievement(
        string calldata name,
        string calldata description,
        AchievementCategory category,
        uint256 threshold
    ) external onlyOwner returns (uint256) {
        require(bytes(name).length > 0, "Name cannot be empty");
        require(threshold > 0, "Threshold must be positive");

        achievementCount++;
        uint256 newId = achievementCount;

        achievements[newId] = Achievement({
            id: newId,
            name: name,
            description: description,
            category: category,
            threshold: threshold,
            exists: true
        });

        emit AchievementCreated(newId, name, category, threshold);
        return newId;
    }

    /**
     * @dev Updates an existing achievement
     * @param id Achievement ID
     * @param name New achievement name
     * @param description New achievement description
     * @param threshold New threshold value
     */
    function updateAchievement(
        uint256 id,
        string calldata name,
        string calldata description,
        uint256 threshold
    ) external onlyOwner {
        require(achievements[id].exists, "Achievement does not exist");
        require(bytes(name).length > 0, "Name cannot be empty");
        require(threshold > 0, "Threshold must be positive");

        Achievement storage achievement = achievements[id];
        achievement.name = name;
        achievement.description = description;
        achievement.threshold = threshold;

        emit AchievementUpdated(id, name, threshold);
    }

    /**
     * @dev Gets achievement details
     * @param id Achievement ID
     * @return name Achievement name
     * @return description Achievement description
     * @return category Achievement category
     * @return threshold Required value to unlock
     * @return exists Whether the achievement exists
     */
    function getAchievement(
        uint256 id
    )
        external
        view
        returns (
            string memory name,
            string memory description,
            AchievementCategory category,
            uint256 threshold,
            bool exists
        )
    {
        Achievement memory achievement = achievements[id];
        return (
            achievement.name,
            achievement.description,
            achievement.category,
            achievement.threshold,
            achievement.exists
        );
    }

    /**
     * @dev Gets user achievement data
     * @param user User address
     * @param achievementId Achievement ID
     * @return unlocked Whether the achievement is unlocked
     * @return progress Current progress towards the achievement
     * @return unlockedAt Timestamp when the achievement was unlocked
     */
    function getUserAchievement(
        address user,
        uint256 achievementId
    )
        external
        view
        returns (bool unlocked, uint256 progress, uint256 unlockedAt)
    {
        UserAchievement memory userAchievement = userAchievements[user][
            achievementId
        ];
        return (
            userAchievement.unlocked,
            userAchievement.progress,
            userAchievement.unlockedAt
        );
    }

    /**
     * @dev Gets all achievement IDs for a user
     * @param user User address
     * @return Array of achievement IDs
     */
    function getUserAchievementIds(
        address user
    ) external view returns (uint256[] memory) {
        return userAchievementIds[user];
    }

    /**
     * @dev Gets count of unlocked achievements for a user
     * @param user User address
     * @return Count of unlocked achievements
     */
    function getUserAchievementCount(
        address user
    ) external view returns (uint256) {
        uint256 count = 0;
        uint256[] memory ids = userAchievementIds[user];

        for (uint256 i = 0; i < ids.length; i++) {
            if (userAchievements[user][ids[i]].unlocked) {
                count++;
            }
        }

        return count;
    }

    /**
     * @dev Checks and updates task completion achievements
     * @param user User address
     * @param taskCount Number of tasks completed
     */
    function checkTaskCompletionAchievements(
        address user,
        uint256 taskCount
    ) external onlyGamificationManager {
        if (achievementCount == 0) return; // No achievements to check

        for (uint256 i = 1; i <= achievementCount; i++) {
            Achievement memory achievement = achievements[i];

            if (
                achievement.exists &&
                achievement.category == AchievementCategory.Tasks
            ) {
                updateAchievementProgress(user, i, taskCount);
            }
        }
    }

    /**
     * @dev Checks and updates streak-based achievements
     * @param user User address
     * @param currentStreak Current streak count
     * @param maxStreak Maximum streak achieved
     */
    function checkStreakAchievements(
        address user,
        uint256 currentStreak,
        uint256 maxStreak
    ) external onlyGamificationManager {
        if (achievementCount == 0) return; // No achievements to check

        for (uint256 i = 1; i <= achievementCount; i++) {
            Achievement memory achievement = achievements[i];

            if (
                achievement.exists &&
                achievement.category == AchievementCategory.Streaks
            ) {
                // Use the greater of current streak or max streak
                uint256 streakValue = maxStreak > currentStreak
                    ? maxStreak
                    : currentStreak;
                updateAchievementProgress(user, i, streakValue);
            }
        }
    }

    /**
     * @dev Checks and updates reputation tier achievements
     * @param user User address
     * @param tier Current reputation tier (as uint8)
     */
    function checkReputationTierAchievements(
        address user,
        uint8 tier
    ) external onlyGamificationManager {
        if (achievementCount == 0) return; // No achievements to check

        for (uint256 i = 1; i <= achievementCount; i++) {
            Achievement memory achievement = achievements[i];

            if (
                achievement.exists &&
                achievement.category == AchievementCategory.Goals
            ) {
                updateAchievementProgress(user, i, tier);
            }
        }
    }

    /**
     * @dev Checks and updates time-based achievements (dedication)
     * @param user User address
     * @param timeOfDay Time of day in hours (0-23)
     */
    function checkDedicationAchievements(
        address user,
        uint8 timeOfDay
    ) external onlyGamificationManager {
        if (achievementCount == 0) return; // No achievements to check
        require(timeOfDay < 24, "Invalid time of day");

        for (uint256 i = 1; i <= achievementCount; i++) {
            Achievement memory achievement = achievements[i];

            if (
                achievement.exists &&
                achievement.category == AchievementCategory.Dedication
            ) {
                // For time-based achievements, the logic depends on the achievement type
                // Early Bird: Achievement unlocks if user completes task before the threshold time
                // Night Owl: Achievement unlocks if user completes task after the threshold time
                if (bytes(achievement.name).length > 0) {
                    bool isEarlyBird = _containsString(
                        achievement.name,
                        "Early"
                    );

                    if (isEarlyBird && timeOfDay < achievement.threshold) {
                        // Early bird achievement - unlocks if time is before threshold
                        updateAchievementProgress(
                            user,
                            i,
                            achievement.threshold - 1
                        );
                    } else if (
                        !isEarlyBird && timeOfDay >= achievement.threshold
                    ) {
                        // Night owl achievement - unlocks if time is after or at threshold
                        updateAchievementProgress(user, i, timeOfDay);
                    }
                } else {
                    // Default behavior if name-based detection fails
                    updateAchievementProgress(user, i, timeOfDay);
                }
            }
        }
    }

    /**
     * @dev Helper function to check if a string contains a substring
     * @param source Source string
     * @param searchString String to search for
     * @return True if source contains searchString
     */
    function _containsString(
        string memory source,
        string memory searchString
    ) private pure returns (bool) {
        bytes memory sourceBytes = bytes(source);
        bytes memory searchBytes = bytes(searchString);

        // If search string is longer than source, it can't be contained
        if (searchBytes.length > sourceBytes.length) {
            return false;
        }

        // Simple substring search
        for (uint i = 0; i <= sourceBytes.length - searchBytes.length; i++) {
            bool found = true;
            for (uint j = 0; j < searchBytes.length; j++) {
                if (sourceBytes[i + j] != searchBytes[j]) {
                    found = false;
                    break;
                }
            }
            if (found) {
                return true;
            }
        }

        return false;
    }

    /**
     * @dev Updates achievement progress and unlocks if threshold is reached
     * @param user User address
     * @param achievementId Achievement ID
     * @param newValue New progress value
     */
    function updateAchievementProgress(
        address user,
        uint256 achievementId,
        uint256 newValue
    ) private {
        require(
            achievements[achievementId].exists,
            "Achievement does not exist"
        );

        // If user doesn't have this achievement tracked yet, add it
        if (
            userAchievements[user][achievementId].achievementId != achievementId
        ) {
            userAchievements[user][achievementId] = UserAchievement({
                achievementId: achievementId,
                unlocked: false,
                progress: 0,
                unlockedAt: 0
            });
            userAchievementIds[user].push(achievementId);
        }

        UserAchievement storage userAchievement = userAchievements[user][
            achievementId
        ];

        // Skip if already unlocked
        if (userAchievement.unlocked) {
            return;
        }

        // Update progress if new value is higher
        if (newValue > userAchievement.progress) {
            userAchievement.progress = newValue;
            emit AchievementProgressUpdated(user, achievementId, newValue);

            // Check if achievement should be unlocked
            if (newValue >= achievements[achievementId].threshold) {
                userAchievement.unlocked = true;
                userAchievement.unlockedAt = block.timestamp;
                emit AchievementUnlocked(user, achievementId, block.timestamp);
            }
        }
    }
}
