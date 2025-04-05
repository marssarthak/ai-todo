// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ownable/Ownable.sol";
import "./TaskVerification.sol";

/**
 * @title ReputationTracker
 * @dev Contract for tracking and calculating user reputation based on verified tasks
 */
contract ReputationTracker is Ownable {
    // Reference to the TaskVerification contract
    TaskVerification private taskVerificationContract;

    // Reputation tiers
    enum ReputationTier {
        Beginner,
        Intermediate,
        Advanced,
        Expert,
        Master
    }

    // Tier thresholds (in tasks completed)
    uint256 private constant INTERMEDIATE_THRESHOLD = 5;
    uint256 private constant ADVANCED_THRESHOLD = 15;
    uint256 private constant EXPERT_THRESHOLD = 30;
    uint256 private constant MASTER_THRESHOLD = 50;

    // Additional reputation metrics
    mapping(address => uint256) private streakCount;
    mapping(address => uint256) private maxStreakCount;
    mapping(address => uint256) private lastTaskTimestamp;

    // Daily goal tracking
    mapping(address => uint256) private dailyGoals;
    mapping(address => mapping(uint256 => uint256)) private tasksPerDay;

    // Streak calendar data (mapping from user to day to activity status)
    // The key for the inner mapping is a date encoded as: YYYYMMDD
    mapping(address => mapping(uint256 => bool)) private streakCalendar;

    // Reference to the GamificationManager
    address private gamificationManager;

    // Streak duration (1 day in seconds)
    uint256 private constant STREAK_DURATION = 1 days;

    // Streak risk threshold (hours remaining before streak resets)
    uint256 private constant STREAK_RISK_HOURS = 6;

    // Events
    event ReputationTierChanged(address indexed user, ReputationTier tier);
    event StreakUpdated(
        address indexed user,
        uint256 newStreak,
        uint256 maxStreak
    );
    event DailyGoalSet(address indexed user, uint256 goal);
    event DailyGoalAchieved(address indexed user, uint256 date);
    event GamificationManagerSet(address managerAddress);

    constructor(address taskVerificationAddress) Ownable(msg.sender) {
        taskVerificationContract = TaskVerification(taskVerificationAddress);
    }

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
     * @dev Modifier to allow only GamificationManager to call certain functions
     */
    modifier onlyGamificationManager() {
        require(
            msg.sender == gamificationManager,
            "Only GamificationManager can call"
        );
        _;
    }

    /**
     * @dev Updates the TaskVerification contract address
     * @param newTaskVerificationAddress Address of the new TaskVerification contract
     */
    function setTaskVerificationContract(
        address newTaskVerificationAddress
    ) external onlyOwner {
        taskVerificationContract = TaskVerification(newTaskVerificationAddress);
    }

    /**
     * @dev Calculates the current reputation tier based on number of verified tasks
     * @param user Address of the user
     * @return Reputation tier of the user
     */
    function getReputationTier(
        address user
    ) public view returns (ReputationTier) {
        uint256 taskCount = taskVerificationContract.getReputationScore(user);

        if (taskCount >= MASTER_THRESHOLD) {
            return ReputationTier.Master;
        } else if (taskCount >= EXPERT_THRESHOLD) {
            return ReputationTier.Expert;
        } else if (taskCount >= ADVANCED_THRESHOLD) {
            return ReputationTier.Advanced;
        } else if (taskCount >= INTERMEDIATE_THRESHOLD) {
            return ReputationTier.Intermediate;
        } else {
            return ReputationTier.Beginner;
        }
    }

    /**
     * @dev Converts a timestamp to a date in format YYYYMMDD
     * @param timestamp Unix timestamp
     * @return Date in format YYYYMMDD
     */
    function timestampToDate(
        uint256 timestamp
    ) internal pure returns (uint256) {
        // This is an improved implementation but still a simplification
        // For complete accuracy, a full date library would be needed

        // Number of seconds in a day
        uint256 secondsPerDay = 86400;

        // Calculate days since Unix epoch (January 1, 1970)
        uint256 daysSinceEpoch = timestamp / secondsPerDay;

        // Initial values for calculation
        uint256 year = 1970;
        uint256 month = 1;
        uint256 day = 1;

        // Add days, handling leap years
        uint256 daysRemaining = daysSinceEpoch;

        // Process whole years
        while (daysRemaining >= 365) {
            // Check for leap year
            bool isLeapYear = (year % 4 == 0 &&
                (year % 100 != 0 || year % 400 == 0));
            uint256 daysInYear = isLeapYear ? 366 : 365;

            if (daysRemaining >= daysInYear) {
                daysRemaining -= daysInYear;
                year++;
            } else {
                break;
            }
        }

        // Days in each month (not accounting for leap years)
        uint8[12] memory daysInMonth = [
            31,
            28,
            31,
            30,
            31,
            30,
            31,
            31,
            30,
            31,
            30,
            31
        ];

        // Adjust February for leap years
        if (year % 4 == 0 && (year % 100 != 0 || year % 400 == 0)) {
            daysInMonth[1] = 29;
        }

        // Process months
        for (uint256 i = 0; i < 12; i++) {
            if (daysRemaining >= daysInMonth[i]) {
                daysRemaining -= daysInMonth[i];
            } else {
                month = i + 1;
                day = daysRemaining + 1;
                break;
            }
        }

        // Return date in YYYYMMDD format
        return (year * 10000) + (month * 100) + day;
    }

    /**
     * @dev Updates the user's streak when a task is verified
     * @param user Address of the user
     * @param timestamp Time when the task was verified
     */
    function updateStreak(address user, uint256 timestamp) external {
        // Only the TaskVerification contract can call this
        require(
            msg.sender == address(taskVerificationContract),
            "Unauthorized"
        );

        uint256 lastTimestamp = lastTaskTimestamp[user];
        uint256 currentDate = timestampToDate(timestamp);

        // Mark today as active in the streak calendar
        streakCalendar[user][currentDate] = true;

        // Increment tasks completed today
        tasksPerDay[user][currentDate]++;

        // Check if daily goal achieved
        if (
            dailyGoals[user] > 0 &&
            tasksPerDay[user][currentDate] >= dailyGoals[user]
        ) {
            emit DailyGoalAchieved(user, currentDate);
        }

        // If this is the first task or if the streak is maintained
        if (lastTimestamp == 0) {
            // First task ever
            streakCount[user] = 1;
            maxStreakCount[user] = 1;
        } else {
            uint256 lastDate = timestampToDate(lastTimestamp);

            // If same day, streak doesn't change
            if (currentDate == lastDate) {
                // Do nothing
            }
            // If consecutive day, increase streak
            else if (currentDate == lastDate + 1) {
                streakCount[user]++;

                // Update max streak if current streak is higher
                if (streakCount[user] > maxStreakCount[user]) {
                    maxStreakCount[user] = streakCount[user];
                }
            }
            // If more than one day passed, reset streak
            else {
                streakCount[user] = 1;
            }
        }

        // Update the last task timestamp
        lastTaskTimestamp[user] = timestamp;

        emit StreakUpdated(user, streakCount[user], maxStreakCount[user]);
    }

    /**
     * @dev Gets the current streak count for a user
     * @param user Address of the user
     * @return Current streak count
     */
    function getCurrentStreak(address user) external view returns (uint256) {
        return streakCount[user];
    }

    /**
     * @dev Gets the maximum streak achieved by a user
     * @param user Address of the user
     * @return Maximum streak count
     */
    function getMaxStreak(address user) external view returns (uint256) {
        return maxStreakCount[user];
    }

    /**
     * @dev Sets the daily goal for a user
     * @param goal Number of tasks to complete daily
     */
    function setDailyGoal(uint256 goal) external {
        require(goal > 0, "Goal must be positive");
        dailyGoals[msg.sender] = goal;
        emit DailyGoalSet(msg.sender, goal);
    }

    /**
     * @dev Gets the daily goal for a user
     * @param user Address of the user
     * @return Daily goal
     */
    function getDailyGoal(address user) external view returns (uint256) {
        return dailyGoals[user];
    }

    /**
     * @dev Gets the number of tasks completed on a specific date
     * @param user Address of the user
     * @param date Date in format YYYYMMDD
     * @return Number of tasks completed
     */
    function getTasksCompletedOnDate(
        address user,
        uint256 date
    ) external view returns (uint256) {
        return tasksPerDay[user][date];
    }

    /**
     * @dev Checks if a specific date had activity
     * @param user Address of the user
     * @param date Date in format YYYYMMDD
     * @return Whether the date had activity
     */
    function hasActivityOnDate(
        address user,
        uint256 date
    ) external view returns (bool) {
        return streakCalendar[user][date];
    }

    /**
     * @dev Checks if a user's streak is at risk (less than 6 hours remaining)
     * @param user Address of the user
     * @return Whether the streak is at risk
     */
    function isStreakAtRisk(address user) public view returns (bool) {
        if (streakCount[user] == 0) {
            return false;
        }

        uint256 lastActivity = lastTaskTimestamp[user];
        uint256 currentTime = block.timestamp;
        uint256 timeElapsed = currentTime - lastActivity;

        // If more than (24 - STREAK_RISK_HOURS) hours have passed, streak is at risk
        return timeElapsed > (24 - STREAK_RISK_HOURS) * 3600;
    }

    /**
     * @dev Gets the hours remaining before streak resets
     * @param user Address of the user
     * @return Hours remaining before streak resets
     */
    function getHoursRemainingForStreak(
        address user
    ) external view returns (uint256) {
        if (streakCount[user] == 0) {
            return 0;
        }

        uint256 lastActivity = lastTaskTimestamp[user];
        uint256 currentTime = block.timestamp;
        uint256 timeElapsed = currentTime - lastActivity;

        // If already passed 24 hours, return 0
        if (timeElapsed >= STREAK_DURATION) {
            return 0;
        }

        // Calculate hours remaining
        uint256 secondsRemaining = STREAK_DURATION - timeElapsed;
        return secondsRemaining / 3600; // Convert seconds to hours
    }

    /**
     * @dev Gets streak data for a user
     * @param user Address of the user
     * @return maxStreak Maximum streak achieved
     * @return lastActivity Timestamp of last activity
     * @return streakAtRisk Whether streak is at risk
     */
    function getStreakData(
        address user
    )
        external
        view
        returns (uint256 maxStreak, uint256 lastActivity, bool streakAtRisk)
    {
        return (
            maxStreakCount[user],
            lastTaskTimestamp[user],
            isStreakAtRisk(user)
        );
    }

    /**
     * @dev Gets comprehensive reputation data for a user
     * @param user Address of the user
     * @return taskCount Number of verified tasks
     * @return tier Current reputation tier
     * @return streak Current streak count
     */
    function getReputationData(
        address user
    )
        external
        view
        returns (uint256 taskCount, ReputationTier tier, uint256 streak)
    {
        taskCount = taskVerificationContract.getReputationScore(user);
        tier = getReputationTier(user);
        streak = streakCount[user];
    }

    /**
     * @dev Calculates the number of tasks needed to reach the next tier
     * @param user Address of the user
     * @return tasksNeeded Number of additional tasks needed
     * @return nextTier The next reputation tier
     */
    function getNextTierRequirements(
        address user
    ) external view returns (uint256 tasksNeeded, ReputationTier nextTier) {
        uint256 taskCount = taskVerificationContract.getReputationScore(user);
        ReputationTier currentTier = getReputationTier(user);

        if (currentTier == ReputationTier.Beginner) {
            nextTier = ReputationTier.Intermediate;
            tasksNeeded = INTERMEDIATE_THRESHOLD - taskCount;
        } else if (currentTier == ReputationTier.Intermediate) {
            nextTier = ReputationTier.Advanced;
            tasksNeeded = ADVANCED_THRESHOLD - taskCount;
        } else if (currentTier == ReputationTier.Advanced) {
            nextTier = ReputationTier.Expert;
            tasksNeeded = EXPERT_THRESHOLD - taskCount;
        } else if (currentTier == ReputationTier.Expert) {
            nextTier = ReputationTier.Master;
            tasksNeeded = MASTER_THRESHOLD - taskCount;
        } else {
            // Already at Master tier
            nextTier = ReputationTier.Master;
            tasksNeeded = 0;
        }
    }

    /**
     * @dev Gets streak calendar data for a specific month
     * @param user Address of the user
     * @param year Year (e.g., 2023)
     * @param month Month (1-12)
     * @return Array of days that had activity in the month
     */
    function getMonthlyStreakCalendar(
        address user,
        uint256 year,
        uint256 month
    ) external view returns (uint8[] memory) {
        require(month >= 1 && month <= 12, "Invalid month");

        // Create an array to hold days with activity (max 31 days in a month)
        uint8[] memory activeDays = new uint8[](31);
        uint256 activeCount = 0;

        // Base date for the start of the month (YYYYMM01)
        uint256 baseDate = (year * 10000) + (month * 100) + 1;

        // Check each day of the month
        for (uint8 day = 1; day <= 31; day++) {
            uint256 currentDate = baseDate + day - 1;

            if (streakCalendar[user][currentDate]) {
                activeDays[activeCount] = day;
                activeCount++;
            }
        }

        // Resize array to actual active days
        assembly {
            mstore(activeDays, activeCount)
        }

        return activeDays;
    }
}
