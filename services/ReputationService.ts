import { getReputationData, getNextTierRequirements } from "@/lib/blockchain";
import { createClient } from "@/lib/supabase/client";
import { type User } from "@supabase/supabase-js";
import { levelRules, LevelRule } from "@/data/reputationLevels";

export interface ReputationLevel {
  name: string;
  threshold: number;
  color: string;
  icon: string;
  description: string;
}

export interface ReputationMilestone {
  id: string;
  name: string;
  description: string;
  threshold: number;
  reward?: string;
  icon: string;
  achieved: boolean;
}

export interface ReputationHistory {
  id: string;
  userId: string;
  change: number;
  reason: string;
  taskId?: string;
  taskTitle?: string;
  previousScore: number;
  score: number;
  level: string;
  isLevelUp: boolean;
  createdAt: Date;
}

export interface ReputationResponse {
  success: boolean;
  score?: number;
  level?: number;
  error?: string;
}

export interface ReputationHistoryResponse {
  success: boolean;
  history?: ReputationHistory[];
  error?: string;
}

export type ReputationScore = {
  userId: string;
  score: number;
  level: number;
  lastUpdated: Date;
};

// Define database row types
interface ReputationHistoryRow {
  id: string;
  user_id: string;
  score: number;
  previous_score: number;
  change: number;
  task_id?: string;
  task_title?: string;
  created_at: string;
  level: number;
  is_level_up: boolean;
}

interface UserReputationRow {
  id: string;
  score: number;
  level: number;
  last_updated: string;
}

interface ReputationLevelRow {
  id: number;
  level_name: string;
  threshold: number;
  icon: string;
  color: string;
  description: string;
}

// Define reputation levels
export const REPUTATION_LEVELS: ReputationLevel[] = [
  {
    name: "Beginner",
    threshold: 0,
    color: "bg-zinc-500",
    icon: "StarIcon",
    description: "Just starting your productivity journey",
  },
  {
    name: "Intermediate",
    threshold: 10,
    color: "bg-blue-500",
    icon: "StarIcon",
    description: "Consistently completing tasks",
  },
  {
    name: "Advanced",
    threshold: 25,
    color: "bg-green-500",
    icon: "BadgeIcon",
    description: "Building strong productivity habits",
  },
  {
    name: "Expert",
    threshold: 50,
    color: "bg-purple-500",
    icon: "AwardIcon",
    description: "Mastering your productivity",
  },
  {
    name: "Master",
    threshold: 100,
    color: "bg-yellow-500",
    icon: "TrophyIcon",
    description: "Maximum productivity achievement",
  },
];

// Define reputation milestones
export const REPUTATION_MILESTONES: Omit<ReputationMilestone, "achieved">[] = [
  {
    id: "first-verified-task",
    name: "First Verified Task",
    description: "Complete and verify your first task on the blockchain",
    threshold: 1,
    icon: "CheckCircleIcon",
  },
  {
    id: "productivity-starter",
    name: "Productivity Starter",
    description: "Complete 5 verified tasks",
    threshold: 5,
    icon: "ZapIcon",
  },
  {
    id: "halfway-there",
    name: "Halfway There",
    description: "Reach 50% of the way to Master level",
    threshold: 50,
    icon: "MilestoneIcon",
  },
  {
    id: "persistence-pays",
    name: "Persistence Pays",
    description: "Complete 25 verified tasks",
    threshold: 25,
    reward: "Unlock dark theme customization",
    icon: "CalendarIcon",
  },
  {
    id: "productivity-master",
    name: "Productivity Master",
    description: "Reach the highest reputation level",
    threshold: 100,
    reward: "Unlock custom dashboard layouts",
    icon: "TrophyIcon",
  },
];

/**
 * Get a user's reputation data from the blockchain
 */
export async function getReputationFromBlockchain(userAddress: string) {
  try {
    const reputationData = await getReputationData(userAddress);

    if (!reputationData.success) {
      throw new Error(reputationData.error || "Failed to get reputation data");
    }

    return {
      success: true,
      score: reputationData.taskCount,
      tier: reputationData.tier,
      tierName: reputationData.tierName,
      streak: reputationData.streak,
    };
  } catch (error) {
    console.error("Error getting reputation from blockchain:", error);
    return {
      success: false,
      score: 0,
      tier: 0,
      tierName: "Beginner",
      streak: 0,
      error: (error as Error).message,
    };
  }
}

/**
 * Get the requirements for the next reputation level
 */
export async function getNextLevelRequirements(userAddress: string) {
  try {
    const requirements = await getNextTierRequirements(userAddress);

    if (!requirements.success) {
      throw new Error(
        requirements.error || "Failed to get next tier requirements"
      );
    }

    return {
      success: true,
      tasksNeeded: requirements.tasksNeeded,
      nextTier: requirements.nextTier,
      nextTierName: requirements.nextTierName,
    };
  } catch (error) {
    console.error("Error getting next level requirements:", error);
    return {
      success: false,
      tasksNeeded: 0,
      nextTier: 0,
      nextTierName: "Beginner",
      error: (error as Error).message,
    };
  }
}

/**
 * Get reputation level based on score
 */
export function getReputationLevel(score: number): ReputationLevel {
  // Find the highest level the user qualifies for
  for (let i = REPUTATION_LEVELS.length - 1; i >= 0; i--) {
    if (score >= REPUTATION_LEVELS[i].threshold) {
      return REPUTATION_LEVELS[i];
    }
  }

  // Fallback to beginner if something goes wrong
  return REPUTATION_LEVELS[0];
}

/**
 * Calculate progress to next level as percentage
 */
export function getProgressToNextLevel(score: number): number {
  const currentLevel = getReputationLevel(score);
  const currentLevelIndex = REPUTATION_LEVELS.findIndex(
    (level) => level.name === currentLevel.name
  );

  // If at max level, return 100%
  if (currentLevelIndex === REPUTATION_LEVELS.length - 1) {
    return 100;
  }

  const nextLevel = REPUTATION_LEVELS[currentLevelIndex + 1];
  const pointsInCurrentLevel = score - currentLevel.threshold;
  const pointsRequiredForNextLevel =
    nextLevel.threshold - currentLevel.threshold;

  return Math.min(
    Math.round((pointsInCurrentLevel / pointsRequiredForNextLevel) * 100),
    100
  );
}

/**
 * Get milestones with achievement status for a user
 */
export function getUserMilestones(score: number): ReputationMilestone[] {
  return REPUTATION_MILESTONES.map((milestone) => ({
    ...milestone,
    achieved: score >= milestone.threshold,
  }));
}

/**
 * Get user reputation from database
 */
export const getReputation = async (
  userId: string
): Promise<ReputationResponse> => {
  try {
    const supabase = createClient();

    // Query the user's reputation
    const { data, error } = await supabase
      .from("user_reputation")
      .select("score, level")
      .eq("id", userId)
      .single();

    if (error) {
      // If the user doesn't exist yet, initialize with 0
      if (error.code === "PGRST116") {
        return { success: true, score: 0, level: 0 };
      }
      throw error;
    }

    return {
      success: true,
      score: data.score,
      level: data.level,
    };
  } catch (error) {
    console.error("Error getting reputation:", error);
    return { success: false, error: "Failed to retrieve reputation" };
  }
};

/**
 * Update user reputation in database
 */
export const updateReputation = async (
  userId: string,
  changeAmount: number,
  reason: string,
  taskId?: string,
  taskTitle?: string
): Promise<ReputationResponse> => {
  try {
    const supabase = createClient();

    // Get current reputation
    const { data: currentRepData, error: getError } = await supabase
      .from("user_reputation")
      .select("score, level")
      .eq("id", userId)
      .single();

    // If error fetching data (user might not exist)
    if (getError) {
      if (getError.code !== "PGRST116") {
        throw getError;
      }

      // User doesn't exist, create new entry
      const newScore = Math.max(0, changeAmount);
      const newLevel = 1; // Beginner level id

      // Insert new user reputation
      const { error: insertError } = await supabase
        .from("user_reputation")
        .insert({
          id: userId,
          score: newScore,
          level: newLevel,
          last_updated: new Date().toISOString(),
        });

      if (insertError) throw insertError;

      // Add history entry
      const { error: historyError } = await supabase
        .from("reputation_history")
        .insert({
          user_id: userId,
          change: changeAmount,
          reason,
          task_id: taskId,
          task_title: taskTitle,
          previous_score: 0,
          score: newScore,
          level: newLevel,
          is_level_up: false,
        });

      if (historyError) throw historyError;

      return { success: true, score: newScore, level: newLevel };
    }

    // Update existing user
    const previousScore = currentRepData.score;
    const previousLevel = currentRepData.level;
    const newScore = Math.max(0, previousScore + changeAmount);

    // Get level id for the new score
    const { data: levelData, error: levelError } = await supabase
      .from("reputation_levels")
      .select("id")
      .lte("threshold", newScore)
      .order("threshold", { ascending: false })
      .limit(1)
      .single();

    if (levelError) throw levelError;

    const newLevel = levelData.id;
    const isLevelUp = newLevel > previousLevel;

    // Update user's reputation
    const { error: updateError } = await supabase
      .from("user_reputation")
      .update({
        score: newScore,
        level: newLevel,
        last_updated: new Date().toISOString(),
      })
      .eq("id", userId);

    if (updateError) throw updateError;

    // Add history entry
    const { error: historyError } = await supabase
      .from("reputation_history")
      .insert({
        user_id: userId,
        change: changeAmount,
        reason,
        task_id: taskId,
        task_title: taskTitle,
        previous_score: previousScore,
        score: newScore,
        level: newLevel,
        is_level_up: isLevelUp,
      });

    if (historyError) throw historyError;

    // If user leveled up, add a special history entry
    if (isLevelUp) {
      const { error: levelUpError } = await supabase
        .from("reputation_history")
        .insert({
          user_id: userId,
          change: 0,
          reason: `Achieved Level ${newLevel}`,
          previous_score: newScore,
          score: newScore,
          level: newLevel,
          is_level_up: true,
        });

      if (levelUpError) throw levelUpError;
    }

    return {
      success: true,
      score: newScore,
      level: newLevel,
    };
  } catch (error) {
    console.error("Error updating reputation:", error);
    return { success: false, error: "Failed to update reputation" };
  }
};

/**
 * Get reputation history for a user
 */
export const getReputationHistory = async (
  userId: string
): Promise<ReputationHistoryResponse> => {
  try {
    const supabase = createClient();

    // Join with reputation_levels to get level names
    const { data, error } = await supabase
      .from("reputation_history")
      .select(
        `
        id,
        user_id,
        change,
        reason,
        task_id,
        task_title,
        previous_score,
        score,
        level (id, level_name),
        is_level_up,
        created_at
      `
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Transform data to match our interface
    const history = data.map((item) => {
      // Handle the level data structure - could be an object or array depending on Supabase response
      let levelName: string;
      if (typeof item.level === "object") {
        // Check if it's an array or a single object
        if (Array.isArray(item.level)) {
          // If array, take the first item's level_name
          levelName = item.level[0]?.level_name || String(item.level);
        } else {
          // If object, access level_name directly
          levelName = (item.level as any)?.level_name || String(item.level);
        }
      } else {
        levelName = String(item.level);
      }

      return {
        id: item.id,
        userId: item.user_id,
        change: item.change,
        reason: item.reason,
        taskId: item.task_id,
        taskTitle: item.task_title,
        previousScore: item.previous_score,
        score: item.score,
        level: levelName,
        isLevelUp: item.is_level_up,
        createdAt: new Date(item.created_at),
      };
    });

    return {
      success: true,
      history,
    };
  } catch (error) {
    console.error("Error getting reputation history:", error);
    return { success: false, error: "Failed to retrieve reputation history" };
  }
};

/**
 * Process reputation update after task verification
 */
export async function processReputationAfterVerification(
  user: User,
  taskId: string,
  taskTitle: string
): Promise<{
  success: boolean;
  newScore?: number;
  previousScore?: number;
  newLevel?: string;
  isLevelUp?: boolean;
  error?: string;
}> {
  try {
    // Update user's reputation (add 1 point for each verified task)
    const result = await updateReputation(
      user.id,
      1, // Add 1 point per verification
      "Task completed and verified",
      taskId,
      taskTitle
    );

    if (!result.success) {
      throw new Error(result.error || "Failed to update reputation");
    }

    // Get the level name from id
    const supabase = createClient();

    interface LevelNameResult {
      level_name: string;
    }

    const { data, error: levelError } = await supabase
      .from("reputation_levels")
      .select("level_name")
      .eq("id", result.level)
      .single<LevelNameResult>();

    if (levelError) throw levelError;

    // Determine if user leveled up
    interface HistoryResult {
      is_level_up: boolean;
    }

    const { data: historyData, error: historyError } = await supabase
      .from("reputation_history")
      .select("is_level_up")
      .eq("user_id", user.id)
      .eq("task_id", taskId)
      .single<HistoryResult>();

    if (historyError && historyError.code !== "PGRST116") throw historyError;

    const isLevelUp = historyData?.is_level_up || false;

    return {
      success: true,
      newScore: result.score,
      previousScore: result.score ? result.score - 1 : 0,
      newLevel: data.level_name,
      isLevelUp,
    };
  } catch (error) {
    console.error("Error processing reputation after verification:", error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}
