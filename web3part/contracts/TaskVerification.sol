// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ownable/Ownable.sol";

interface IReputationTracker {
    function updateStreak(address user, uint256 timestamp) external;
}

interface IGamificationManager {
    function checkAndUpdateAchievements(address user) external;
}

/**
 * @title TaskVerification
 * @dev Contract for verifying completed tasks and maintaining user reputation
 */
contract TaskVerification is Ownable {
    // Mapping from user address to array of task hashes
    mapping(address => bytes32[]) private userTasks;

    // Mapping from user address to reputation score
    mapping(address => uint256) private reputationScores;

    // Reference to the ReputationTracker contract
    IReputationTracker private reputationTracker;

    // Reference to the GamificationManager contract
    IGamificationManager private gamificationManager;

    // Boolean to track if the contracts are set
    bool private isReputationTrackerSet;
    bool private isGamificationManagerSet;

    // Events
    event TaskVerified(
        address indexed user,
        bytes32 taskHash,
        uint256 timestamp
    );
    event ReputationUpdated(address indexed user, uint256 newScore);
    event ReputationTrackerSet(address trackerAddress);
    event GamificationManagerSet(address managerAddress);

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Sets the ReputationTracker contract address
     * @param trackerAddress Address of the ReputationTracker contract
     */
    function setReputationTracker(address trackerAddress) external onlyOwner {
        require(trackerAddress != address(0), "Invalid tracker address");
        reputationTracker = IReputationTracker(trackerAddress);
        isReputationTrackerSet = true;
        emit ReputationTrackerSet(trackerAddress);
    }

    /**
     * @dev Sets the GamificationManager contract address
     * @param managerAddress Address of the GamificationManager contract
     */
    function setGamificationManager(address managerAddress) external onlyOwner {
        require(managerAddress != address(0), "Invalid manager address");
        gamificationManager = IGamificationManager(managerAddress);
        isGamificationManagerSet = true;
        emit GamificationManagerSet(managerAddress);
    }

    /**
     * @dev Verifies a completed task by storing its hash
     * @param taskHash Hash of the completed task data
     */
    function verifyTask(bytes32 taskHash) external {
        require(taskHash != bytes32(0), "Invalid task hash");

        userTasks[msg.sender].push(taskHash);

        // Update reputation score
        reputationScores[msg.sender] += 1;

        uint256 timestamp = block.timestamp;

        // Notify ReputationTracker if set
        if (isReputationTrackerSet) {
            reputationTracker.updateStreak(msg.sender, timestamp);
        }

        // Trigger achievement checks via GamificationManager if set
        if (isGamificationManagerSet) {
            gamificationManager.checkAndUpdateAchievements(msg.sender);
        }

        emit TaskVerified(msg.sender, taskHash, timestamp);
        emit ReputationUpdated(msg.sender, reputationScores[msg.sender]);
    }

    /**
     * @dev Verifies if a task has been completed by a user
     * @param user Address of the user
     * @param taskHash Hash of the task to verify
     * @return Whether the task has been verified
     */
    function isTaskVerified(
        address user,
        bytes32 taskHash
    ) external view returns (bool) {
        bytes32[] memory tasks = userTasks[user];

        for (uint256 i = 0; i < tasks.length; i++) {
            if (tasks[i] == taskHash) {
                return true;
            }
        }

        return false;
    }

    /**
     * @dev Gets the reputation score of a user
     * @param user Address of the user
     * @return Reputation score
     */
    function getReputationScore(address user) external view returns (uint256) {
        return reputationScores[user];
    }

    /**
     * @dev Gets all task hashes for a user
     * @param user Address of the user
     * @return Array of task hashes
     */
    function getUserTasks(
        address user
    ) external view returns (bytes32[] memory) {
        return userTasks[user];
    }
}
