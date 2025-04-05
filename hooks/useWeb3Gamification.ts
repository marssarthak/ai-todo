import { useState, useCallback } from "react";
import { createPublicClient, http } from "viem";
import GamificationManagerABI from "../web3part/abis/GamificationManager";
import ReputationTrackerABI from "../web3part/abis/ReputationTracker";
import AchievementTrackerABI from "../web3part/abis/AchievementTracker";
import TaskVerificationABI from "../web3part/abis/TaskVerification";
import { keccak256, stringToHex } from "viem";
import { baseSepolia } from "viem/chains";
import { useAccount, useWriteContract } from "wagmi";

export type ReputationTier =
  | "Beginner"
  | "Intermediate"
  | "Advanced"
  | "Expert"
  | "Master";
export type AchievementCategory = "Tasks" | "Streaks" | "Goals" | "Dedication";

export interface UserGamificationData {
  taskCount: number;
  tier: ReputationTier;
  streak: number;
  maxStreak: number;
  lastActivity: number;
  streakAtRisk: boolean;
  achievementCount: number;
}

export interface Achievement {
  id: number;
  name: string;
  description: string;
  category: AchievementCategory;
  threshold: number;
  exists: boolean;
}

export interface UserAchievement {
  achievementId: number;
  unlocked: boolean;
  progress: number;
  unlockedAt: number;
}

export interface StreakData {
  maxStreak: number;
  lastActivity: number;
  streakAtRisk: boolean;
}

export interface NextTierRequirements {
  tasksNeeded: number;
  nextTier: ReputationTier;
}

// Map numeric tier to string representation
const mapTierToString = (tierNumber: number): ReputationTier => {
  const tiers: ReputationTier[] = [
    "Beginner",
    "Intermediate",
    "Advanced",
    "Expert",
    "Master",
  ];
  return tiers[tierNumber] || "Beginner";
};

// Map numeric category to string representation
const mapCategoryToString = (categoryNumber: number): AchievementCategory => {
  const categories: AchievementCategory[] = [
    "Tasks",
    "Streaks",
    "Goals",
    "Dedication",
  ];
  return categories[categoryNumber] || "Tasks";
};

export function useWeb3Gamification() {
  const account = useAccount();
  const { writeContractAsync } = useWriteContract();

  const userAddress = account.address;

  const gamificationManagerAddress = process.env[
    "NEXT_PUBLIC_GAMIFICATION_MANAGER_ADDRESS"
  ] as `0x${string}`;
  const taskVerificationAddress = process.env[
    "NEXT_PUBLIC_TASK_VERIFICATION_ADDRESS"
  ] as `0x${string}`;
  const reputationTrackerAddress = process.env[
    "NEXT_PUBLIC_REPUTATION_TRACKER_ADDRESS"
  ] as `0x${string}`;
  const achievementTrackerAddress = process.env[
    "NEXT_PUBLIC_ACHIEVEMENT_TRACKER_ADDRESS"
  ] as `0x${string}`;

  // Client state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Create public client for read operations
  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(),
  });

  // Function to handle errors
  const handleError = useCallback((err: any) => {
    console.error("Web3 Gamification Error:", err);
    setError(err.message || "An unknown error occurred");
    setIsLoading(false);
  }, []);

  // ------------------------------------------------------
  // Task Verification Contract Functions
  // ------------------------------------------------------

  // Verify a task completion
  const verifyTask = useCallback(
    async (taskContent: string) => {
      setIsLoading(true);
      setError(null);

      try {
        // Create task hash from content
        const taskHash = keccak256(stringToHex(taskContent)) as `0x${string}`;

        const hash = await writeContractAsync({
          address: taskVerificationAddress,
          abi: TaskVerificationABI,
          functionName: "verifyTask",
          args: [taskHash],
          account: userAddress,
        });

        const receipt = await publicClient.waitForTransactionReceipt({ hash });

        setIsLoading(false);
        return receipt;
      } catch (err) {
        handleError(err);
        throw err;
      }
    },
    [userAddress, publicClient, handleError, taskVerificationAddress]
  );

  // Check if a task is verified
  const isTaskVerified = useCallback(
    async (taskContent: string, address?: `0x${string}`) => {
      if (!address && !userAddress) {
        throw new Error("No address provided");
      }

      try {
        const targetAddress = address || userAddress;
        const taskHash = keccak256(stringToHex(taskContent)) as `0x${string}`;

        return await publicClient.readContract({
          address: taskVerificationAddress,
          abi: TaskVerificationABI,
          functionName: "isTaskVerified",
          args: [targetAddress, taskHash],
        });
      } catch (err) {
        handleError(err);
        throw err;
      }
    },
    [userAddress, publicClient, handleError, taskVerificationAddress]
  );

  // Get user tasks
  const getUserTasks = useCallback(
    async (address?: `0x${string}`) => {
      if (!address && !userAddress) {
        throw new Error("No address provided");
      }

      try {
        const targetAddress = address || userAddress;

        return await publicClient.readContract({
          address: taskVerificationAddress,
          abi: TaskVerificationABI,
          functionName: "getUserTasks",
          args: [targetAddress],
        });
      } catch (err) {
        handleError(err);
        throw err;
      }
    },
    [userAddress, publicClient, handleError, taskVerificationAddress]
  );

  // Get reputation score
  const getReputationScore = useCallback(
    async (address?: `0x${string}`) => {
      if (!address && !userAddress) {
        throw new Error("No address provided");
      }

      try {
        const targetAddress = address || userAddress;

        const score = await publicClient.readContract({
          address: taskVerificationAddress,
          abi: TaskVerificationABI,
          functionName: "getReputationScore",
          args: [targetAddress],
        });

        return Number(score);
      } catch (err) {
        handleError(err);
        throw err;
      }
    },
    [userAddress, publicClient, handleError, taskVerificationAddress]
  );

  // ------------------------------------------------------
  // Reputation Tracker Contract Functions
  // ------------------------------------------------------

  // Get reputation tier
  const getReputationTier = useCallback(
    async (address?: `0x${string}`) => {
      if (!address && !userAddress) {
        throw new Error("No address provided");
      }

      try {
        const targetAddress = address || userAddress;

        const tier = await publicClient.readContract({
          address: reputationTrackerAddress,
          abi: ReputationTrackerABI,
          functionName: "getReputationTier",
          args: [targetAddress],
        });

        return mapTierToString(Number(tier));
      } catch (err) {
        handleError(err);
        throw err;
      }
    },
    [userAddress, publicClient, handleError, reputationTrackerAddress]
  );

  // Get streak data
  const getStreakData = useCallback(
    async (address?: `0x${string}`): Promise<StreakData> => {
      if (!address && !userAddress) {
        throw new Error("No address provided");
      }

      try {
        const targetAddress = address || userAddress;

        const data = (await publicClient.readContract({
          address: reputationTrackerAddress,
          abi: ReputationTrackerABI,
          functionName: "getStreakData",
          args: [targetAddress],
        })) as [bigint, bigint, boolean];

        return {
          maxStreak: Number(data[0]),
          lastActivity: Number(data[1]),
          streakAtRisk: data[2],
        };
      } catch (err) {
        handleError(err);
        throw err;
      }
    },
    [userAddress, publicClient, handleError, reputationTrackerAddress]
  );

  // Get current streak
  const getCurrentStreak = useCallback(
    async (address?: `0x${string}`) => {
      if (!address && !userAddress) {
        throw new Error("No address provided");
      }

      try {
        const targetAddress = address || userAddress;

        const streak = await publicClient.readContract({
          address: reputationTrackerAddress,
          abi: ReputationTrackerABI,
          functionName: "getCurrentStreak",
          args: [targetAddress],
        });

        return Number(streak);
      } catch (err) {
        handleError(err);
        throw err;
      }
    },
    [userAddress, publicClient, handleError, reputationTrackerAddress]
  );

  // Set daily goal
  const setDailyGoal = useCallback(
    async (goal: number) => {
      if (!userAddress) {
        throw new Error("Wallet not connected");
      }

      setIsLoading(true);
      setError(null);

      try {
        const hash = await writeContractAsync({
          address: reputationTrackerAddress,
          abi: ReputationTrackerABI,
          functionName: "setDailyGoal",
          args: [BigInt(goal)],
          account: userAddress,
        });

        const receipt = await publicClient.waitForTransactionReceipt({ hash });

        setIsLoading(false);
        return receipt;
      } catch (err) {
        handleError(err);
        throw err;
      }
    },
    [userAddress, publicClient, handleError, reputationTrackerAddress]
  );

  // Get daily goal
  const getDailyGoal = useCallback(
    async (address?: `0x${string}`) => {
      if (!address && !userAddress) {
        throw new Error("No address provided");
      }

      try {
        const targetAddress = address || userAddress;

        const goal = await publicClient.readContract({
          address: reputationTrackerAddress,
          abi: ReputationTrackerABI,
          functionName: "getDailyGoal",
          args: [targetAddress],
        });

        return Number(goal);
      } catch (err) {
        handleError(err);
        throw err;
      }
    },
    [userAddress, publicClient, handleError, reputationTrackerAddress]
  );

  // Get next tier requirements
  const getNextTierRequirements = useCallback(
    async (address?: `0x${string}`): Promise<NextTierRequirements> => {
      if (!address && !userAddress) {
        throw new Error("No address provided");
      }

      try {
        const targetAddress = address || userAddress;

        const data = (await publicClient.readContract({
          address: reputationTrackerAddress,
          abi: ReputationTrackerABI,
          functionName: "getNextTierRequirements",
          args: [targetAddress],
        })) as [bigint, number];

        return {
          tasksNeeded: Number(data[0]),
          nextTier: mapTierToString(data[1]),
        };
      } catch (err) {
        handleError(err);
        throw err;
      }
    },
    [userAddress, publicClient, handleError, reputationTrackerAddress]
  );

  // Get monthly streak calendar
  const getMonthlyStreakCalendar = useCallback(
    async (year: number, month: number, address?: `0x${string}`) => {
      if (!address && !userAddress) {
        throw new Error("No address provided");
      }

      try {
        const targetAddress = address || userAddress;

        return (await publicClient.readContract({
          address: reputationTrackerAddress,
          abi: ReputationTrackerABI,
          functionName: "getMonthlyStreakCalendar",
          args: [targetAddress, BigInt(year), BigInt(month)],
        })) as number[];
      } catch (err) {
        handleError(err);
        throw err;
      }
    },
    [userAddress, publicClient, handleError, reputationTrackerAddress]
  );

  // ------------------------------------------------------
  // Achievement Tracker Contract Functions
  // ------------------------------------------------------

  // Get achievement details
  const getAchievement = useCallback(
    async (achievementId: number): Promise<Achievement> => {
      try {
        const data = (await publicClient.readContract({
          address: achievementTrackerAddress,
          abi: AchievementTrackerABI,
          functionName: "getAchievement",
          args: [BigInt(achievementId)],
        })) as [string, string, number, bigint, boolean];

        return {
          id: achievementId,
          name: data[0],
          description: data[1],
          category: mapCategoryToString(data[2]),
          threshold: Number(data[3]),
          exists: data[4],
        };
      } catch (err) {
        handleError(err);
        throw err;
      }
    },
    [publicClient, handleError, achievementTrackerAddress]
  );

  // Get user achievement
  const getUserAchievement = useCallback(
    async (
      achievementId: number,
      address?: `0x${string}`
    ): Promise<UserAchievement> => {
      if (!address && !userAddress) {
        throw new Error("No address provided");
      }

      try {
        const targetAddress = address || userAddress;

        const data = (await publicClient.readContract({
          address: achievementTrackerAddress,
          abi: AchievementTrackerABI,
          functionName: "getUserAchievement",
          args: [targetAddress, BigInt(achievementId)],
        })) as [boolean, bigint, bigint];

        return {
          achievementId,
          unlocked: data[0],
          progress: Number(data[1]),
          unlockedAt: Number(data[2]),
        };
      } catch (err) {
        handleError(err);
        throw err;
      }
    },
    [userAddress, publicClient, handleError, achievementTrackerAddress]
  );

  // Get user achievement IDs
  const getUserAchievementIds = useCallback(
    async (address?: `0x${string}`) => {
      if (!address && !userAddress) {
        throw new Error("No address provided");
      }

      try {
        const targetAddress = address || userAddress;

        const ids = (await publicClient.readContract({
          address: achievementTrackerAddress,
          abi: AchievementTrackerABI,
          functionName: "getUserAchievementIds",
          args: [targetAddress],
        })) as bigint[];

        return ids.map((id) => Number(id));
      } catch (err) {
        handleError(err);
        throw err;
      }
    },
    [userAddress, publicClient, handleError, achievementTrackerAddress]
  );

  // Get all user achievements with details
  const getAllUserAchievements = useCallback(
    async (address?: `0x${string}`) => {
      if (!address && !userAddress) {
        throw new Error("No address provided");
      }

      try {
        const targetAddress = address || userAddress;

        // Get all achievement IDs for the user
        const ids = await getUserAchievementIds(targetAddress);

        // Get details for each achievement
        const achievements = await Promise.all(
          ids.map(async (id) => {
            const achievement = await getAchievement(id);
            const userAchievement = await getUserAchievement(id, targetAddress);

            return {
              ...achievement,
              ...userAchievement,
            };
          })
        );

        return achievements;
      } catch (err) {
        handleError(err);
        throw err;
      }
    },
    [
      userAddress,
      getUserAchievementIds,
      getAchievement,
      getUserAchievement,
      handleError,
    ]
  );

  const getUserGamificationData = useCallback(
    async (address?: `0x${string}`): Promise<UserGamificationData> => {
      if (!address && !userAddress) {
        throw new Error("No address provided");
      }

      try {
        const targetAddress = address || userAddress;

        const data = (await publicClient.readContract({
          address: gamificationManagerAddress,
          abi: GamificationManagerABI,
          functionName: "getUserGamificationData",
          args: [targetAddress],
        })) as [bigint, number, bigint, bigint, bigint, boolean, bigint];

        return {
          taskCount: Number(data[0]),
          tier: mapTierToString(data[1]),
          streak: Number(data[2]),
          maxStreak: Number(data[3]),
          lastActivity: Number(data[4]),
          streakAtRisk: data[5],
          achievementCount: Number(data[6]),
        };
      } catch (err) {
        handleError(err);
        throw err;
      }
    },
    [userAddress, publicClient, handleError, gamificationManagerAddress]
  );

  // Check and update achievements
  const checkAndUpdateAchievements = useCallback(
    async (address?: `0x${string}`) => {
      if (!userAddress) {
        throw new Error("Wallet not connected");
      }

      setIsLoading(true);
      setError(null);

      try {
        const targetAddress = address || userAddress;

        const hash = await writeContractAsync({
          address: gamificationManagerAddress,
          abi: GamificationManagerABI,
          functionName: "checkAndUpdateAchievements",
          args: [targetAddress],
          account: userAddress,
        });

        const receipt = await publicClient.waitForTransactionReceipt({ hash });

        setIsLoading(false);
        return receipt;
      } catch (err) {
        handleError(err);
        throw err;
      }
    },
    [userAddress, publicClient, handleError, gamificationManagerAddress]
  );

  // Check dedication achievements (time-based)
  const checkDedicationAchievements = useCallback(
    async (address?: `0x${string}`) => {
      if (!userAddress) {
        throw new Error("Wallet not connected");
      }

      setIsLoading(true);
      setError(null);

      try {
        const targetAddress = address || userAddress;

        const hash = await writeContractAsync({
          address: gamificationManagerAddress,
          abi: GamificationManagerABI,
          functionName: "checkDedicationAchievements",
          args: [targetAddress],
          account: userAddress,
        });
        const receipt = await publicClient.waitForTransactionReceipt({ hash });

        setIsLoading(false);
        return receipt;
      } catch (err) {
        handleError(err);
        throw err;
      }
    },
    [userAddress, publicClient, handleError, gamificationManagerAddress]
  );

  return {
    // State
    isLoading,
    error,
    userAddress,

    // Task Verification functions
    verifyTask,
    isTaskVerified,
    getUserTasks,
    getReputationScore,

    // Reputation Tracker functions
    getReputationTier,
    getStreakData,
    getCurrentStreak,
    setDailyGoal,
    getDailyGoal,
    getNextTierRequirements,
    getMonthlyStreakCalendar,

    // Achievement Tracker functions
    getAchievement,
    getUserAchievement,
    getUserAchievementIds,
    getAllUserAchievements,

    // Gamification Manager functions
    getUserGamificationData,
    checkAndUpdateAchievements,
    checkDedicationAchievements,
  };
}
