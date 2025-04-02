import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import {
  differenceInDays,
  format,
  isSameDay,
  isAfter,
  isBefore,
  addDays,
} from "date-fns";

// Types for streak data
export interface StreakData {
  currentStreak: number;
  maxStreak: number;
  lastActiveDate: Date | null;
  dailyGoal: number;
  isGoalReached: boolean;
  tasksCompletedToday: number;
  streakAtRisk: boolean;
  daysMissed: number;
  longestStreak: number;
  lastActivity: Date | null;
  completedDays: Date[];
}

export interface DailyActivity {
  date: Date;
  tasksCompleted: number;
  goalReached: boolean;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: "tasks" | "streaks" | "goals" | "dedication";
  iconName: string;
  isUnlocked: boolean;
  unlockedAt?: Date;
  requiredValue?: number;
  currentValue?: number;
  reward?: string;
}

// Default values
const DEFAULT_DAILY_GOAL = 1;

// Cache implementation
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class Cache<T> {
  private store = new Map<string, CacheEntry<T>>();
  private ttl: number;

  constructor(ttlMs: number = 5 * 60 * 1000) {
    // Default 5 minute TTL
    this.ttl = ttlMs;
  }

  get(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    // Check if entry is expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.store.delete(key);
      return null;
    }

    return entry.data;
  }

  set(key: string, data: T): void {
    this.store.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  invalidate(key: string): void {
    this.store.delete(key);
  }

  invalidateAll(): void {
    this.store.clear();
  }
}

// Create caches for different data types
const streakCache = new Cache<StreakData>(2 * 60 * 1000); // 2 minute TTL
const activityCache = new Cache<DailyActivity[]>(5 * 60 * 1000); // 5 minute TTL
const achievementsCache = new Cache<Achievement[]>(10 * 60 * 1000); // 10 minute TTL

/**
 * Get a user's current streak data with caching
 */
export async function getUserStreak(
  userId: string
): Promise<StreakData | null> {
  try {
    if (!userId) return null;

    // Check cache first
    const cacheKey = `streak_${userId}`;
    const cachedData = streakCache.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const supabase = createClient();
    const today = new Date();

    // Use optimized stored function if available
    try {
      const { data: optimizedData, error: optimizedError } = await supabase.rpc(
        "get_user_streak_data",
        { p_user_id: userId }
      );

      if (!optimizedError && optimizedData) {
        // Transform the data to match our interface
        const streakData: StreakData = {
          currentStreak: optimizedData.current_streak || 0,
          maxStreak: optimizedData.max_streak || 0,
          lastActiveDate: optimizedData.last_active_date
            ? new Date(optimizedData.last_active_date)
            : null,
          dailyGoal: optimizedData.daily_goal || DEFAULT_DAILY_GOAL,
          isGoalReached: optimizedData.is_goal_reached || false,
          tasksCompletedToday: optimizedData.tasks_completed_today || 0,
          streakAtRisk: false, // Need to calculate
          daysMissed: 0, // Need to calculate
          longestStreak: optimizedData.max_streak || 0,
          lastActivity: optimizedData.last_active_date
            ? new Date(optimizedData.last_active_date)
            : null,
          completedDays: [], // Additional query needed for this
        };

        // Calculate if streak is at risk
        const lastActiveDate = streakData.lastActiveDate;
        const daysSinceActive = lastActiveDate
          ? differenceInDays(today, lastActiveDate)
          : 0;

        streakData.streakAtRisk =
          !streakData.isGoalReached && daysSinceActive === 1;
        streakData.daysMissed = streakData.streakAtRisk
          ? 0
          : daysSinceActive > 1
          ? daysSinceActive - 1
          : 0;

        // Cache before returning
        streakCache.set(cacheKey, streakData);
        return streakData;
      }
    } catch (rpcError) {
      console.log(
        "RPC not available, falling back to regular queries",
        rpcError
      );
    }

    // Fallback to regular queries if the RPC is not available
    const { data: userData, error: userError } = await supabase
      .from("user_reputation")
      .select("streak_count, max_streak, last_active_date, daily_goal")
      .eq("id", userId)
      .single();

    if (userError && userError.code !== "PGRST116") {
      throw userError;
    }

    // If no record, return default values
    if (!userData) {
      const defaultData: StreakData = {
        currentStreak: 0,
        maxStreak: 0,
        lastActiveDate: null,
        dailyGoal: DEFAULT_DAILY_GOAL,
        isGoalReached: false,
        tasksCompletedToday: 0,
        streakAtRisk: false,
        daysMissed: 0,
        longestStreak: 0,
        lastActivity: null,
        completedDays: [],
      };

      streakCache.set(cacheKey, defaultData);
      return defaultData;
    }

    // Get today's activity
    const { data: todayActivity, error: activityError } = await supabase
      .from("daily_activity")
      .select("tasks_completed, goal_reached")
      .eq("user_id", userId)
      .eq("activity_date", format(today, "yyyy-MM-dd"))
      .single();

    if (activityError && activityError.code !== "PGRST116") {
      throw activityError;
    }

    const lastActiveDate = userData.last_active_date
      ? new Date(userData.last_active_date)
      : null;
    const daysSinceActive = lastActiveDate
      ? differenceInDays(today, lastActiveDate)
      : 0;

    // Calculate if streak is at risk (active yesterday but not yet today)
    const streakAtRisk = !todayActivity && daysSinceActive === 1;

    // Get completed days for the last 30 days (could be optimized further)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: completedDaysData } = await supabase
      .from("daily_activity")
      .select("activity_date")
      .eq("user_id", userId)
      .eq("goal_reached", true)
      .gte("activity_date", format(thirtyDaysAgo, "yyyy-MM-dd"))
      .order("activity_date", { ascending: false });

    const completedDays = completedDaysData
      ? completedDaysData.map((d) => new Date(d.activity_date))
      : [];

    const streakData: StreakData = {
      currentStreak: userData.streak_count || 0,
      maxStreak: userData.max_streak || 0,
      lastActiveDate,
      dailyGoal: userData.daily_goal || DEFAULT_DAILY_GOAL,
      isGoalReached: todayActivity?.goal_reached || false,
      tasksCompletedToday: todayActivity?.tasks_completed || 0,
      streakAtRisk,
      daysMissed: streakAtRisk
        ? 0
        : daysSinceActive > 1
        ? daysSinceActive - 1
        : 0,
      longestStreak: userData.max_streak || 0,
      lastActivity: lastActiveDate,
      completedDays,
    };

    // Cache the streak data
    streakCache.set(cacheKey, streakData);
    return streakData;
  } catch (error) {
    console.error("Error getting user streak:", error);
    return null;
  }
}

/**
 * Get a user's activity calendar data for a given month with caching
 */
export async function getUserActivityCalendar(
  userId: string,
  year: number = new Date().getFullYear(),
  month: number = new Date().getMonth()
): Promise<DailyActivity[]> {
  try {
    if (!userId) return [];

    // Check cache first
    const cacheKey = `activity_${userId}_${year}_${month}`;
    const cachedData = activityCache.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const supabase = createClient();

    // Calculate start and end dates for the month
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0); // Last day of month

    // Get all activity for the month
    const { data, error } = await supabase
      .from("daily_activity")
      .select("activity_date, tasks_completed, goal_reached")
      .eq("user_id", userId)
      .gte("activity_date", format(startDate, "yyyy-MM-dd"))
      .lte("activity_date", format(endDate, "yyyy-MM-dd"))
      .order("activity_date");

    if (error) throw error;

    // Map database records to DailyActivity objects
    const activities = (data || []).map((record) => ({
      date: new Date(record.activity_date),
      tasksCompleted: record.tasks_completed,
      goalReached: record.goal_reached,
    }));

    // Cache the data before returning
    activityCache.set(cacheKey, activities);
    return activities;
  } catch (error) {
    console.error("Error getting activity calendar:", error);
    return [];
  }
}

/**
 * Update a user's daily goal and invalidate relevant caches
 */
export async function updateDailyGoal(
  userId: string,
  newGoal: number
): Promise<boolean> {
  try {
    if (!userId || newGoal < 1) return false;

    const supabase = createClient();

    // Update the user's daily goal
    const { error } = await supabase
      .from("user_reputation")
      .update({ daily_goal: newGoal })
      .eq("id", userId);

    if (error) throw error;

    // Invalidate cached streak data
    streakCache.invalidate(`streak_${userId}`);

    return true;
  } catch (error) {
    console.error("Error updating daily goal:", error);
    return false;
  }
}

/**
 * Check if streak is at risk and should show warning
 */
export async function checkStreakRisk(userId: string): Promise<{
  atRisk: boolean;
  hoursRemaining: number;
  message: string;
}> {
  try {
    if (!userId) return { atRisk: false, hoursRemaining: 0, message: "" };

    const streakData = await getUserStreak(userId);

    if (!streakData) {
      return { atRisk: false, hoursRemaining: 0, message: "" };
    }

    const now = new Date();
    const endOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59
    );
    const hoursRemaining = Math.round(
      (endOfDay.getTime() - now.getTime()) / (1000 * 60 * 60)
    );

    // Streak is at risk if:
    // 1. You have an active streak (> 0)
    // 2. You haven't completed a task today
    // 3. You completed a task yesterday (otherwise streak is already broken)
    if (streakData.currentStreak > 0 && streakData.streakAtRisk) {
      return {
        atRisk: true,
        hoursRemaining,
        message: `Don't break your ${streakData.currentStreak} day streak! Complete a task in the next ${hoursRemaining} hours.`,
      };
    }

    return { atRisk: false, hoursRemaining: 0, message: "" };
  } catch (error) {
    console.error("Error checking streak risk:", error);
    return { atRisk: false, hoursRemaining: 0, message: "" };
  }
}

/**
 * Get user's achievements with pagination and caching
 */
export async function getUserAchievements(
  userId: string,
  category?: string,
  page: number = 1,
  pageSize: number = 100
): Promise<Achievement[]> {
  try {
    if (!userId) return [];

    // Check cache first for full set of achievements (we paginate client-side)
    const cacheKey = `achievements_${userId}`;
    const cachedData = achievementsCache.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    // Use optimized function if available
    const supabase = createClient();

    try {
      const { data: optimizedData, error: optimizedError } = await supabase.rpc(
        "get_paginated_achievements",
        {
          p_user_id: userId,
          p_category: category || null,
          p_page: page,
          p_page_size: pageSize,
        }
      );

      if (!optimizedError && optimizedData) {
        // Transform to our interface
        const achievements: Achievement[] = optimizedData.map(
          (item: {
            id: number;
            name: string;
            description: string;
            icon: string;
            category: string;
            is_unlocked: boolean;
            unlocked_at: string | null;
          }) => ({
            id: item.id.toString(),
            name: item.name,
            description: item.description,
            iconName: item.icon, // Note: backend uses 'icon' field
            category: item.category as any, // Cast to our enum type
            isUnlocked: item.is_unlocked,
            unlockedAt: item.unlocked_at
              ? new Date(item.unlocked_at)
              : undefined,
          })
        );

        // Cache before returning
        achievementsCache.set(cacheKey, achievements);
        return achievements;
      }
    } catch (rpcError) {
      console.log("RPC not available, falling back to regular query", rpcError);
    }

    // Fallback implementation with mock data
    const achievements: Achievement[] = [
      {
        id: "1",
        name: "First Task",
        description: "Complete your first task",
        category: "tasks",
        iconName: "check",
        isUnlocked: true,
        unlockedAt: new Date(Date.now() - 1000000),
      },
      {
        id: "2",
        name: "Task Master",
        description: "Complete 10 tasks",
        category: "tasks",
        iconName: "checkbox",
        isUnlocked: true,
        unlockedAt: new Date(Date.now() - 500000),
        requiredValue: 10,
        currentValue: 15,
      },
      {
        id: "3",
        name: "Productivity Pro",
        description: "Complete 100 tasks",
        category: "tasks",
        iconName: "list-checks",
        isUnlocked: false,
        requiredValue: 100,
        currentValue: 15,
      },
      {
        id: "4",
        name: "Streak Starter",
        description: "Achieve a 3-day streak",
        category: "streaks",
        iconName: "flame",
        isUnlocked: true,
        unlockedAt: new Date(Date.now() - 300000),
      },
      {
        id: "5",
        name: "Week Warrior",
        description: "Maintain a 7-day streak",
        category: "streaks",
        iconName: "zap",
        isUnlocked: false,
        requiredValue: 7,
        currentValue: 5,
      },
      {
        id: "6",
        name: "Month Master",
        description: "Maintain a 30-day streak",
        category: "streaks",
        iconName: "calendar",
        isUnlocked: false,
        requiredValue: 30,
        currentValue: 5,
      },
      {
        id: "7",
        name: "Goal Getter",
        description: "Complete your first goal",
        category: "goals",
        iconName: "target",
        isUnlocked: true,
        unlockedAt: new Date(Date.now() - 200000),
      },
      {
        id: "8",
        name: "Goal Guru",
        description: "Complete 5 goals",
        category: "goals",
        iconName: "trophy",
        isUnlocked: false,
        requiredValue: 5,
        currentValue: 1,
      },
      {
        id: "9",
        name: "Early Bird",
        description: "Complete a task before 9am",
        category: "dedication",
        iconName: "sunrise",
        isUnlocked: true,
        unlockedAt: new Date(Date.now() - 100000),
      },
      {
        id: "10",
        name: "Night Owl",
        description: "Complete a task after 10pm",
        category: "dedication",
        iconName: "moon",
        isUnlocked: false,
      },
      {
        id: "11",
        name: "Weekend Warrior",
        description: "Complete tasks on both Saturday and Sunday",
        category: "dedication",
        iconName: "calendar-days",
        isUnlocked: false,
      },
      {
        id: "12",
        name: "Perfect Week",
        description: "Complete at least one task every day for a week",
        category: "dedication",
        iconName: "calendar-check",
        isUnlocked: false,
        requiredValue: 7,
        currentValue: 5,
        reward: "50 bonus reputation points",
      },
    ];

    // Cache before returning
    achievementsCache.set(cacheKey, achievements);
    return achievements;
  } catch (error) {
    console.error("Error getting user achievements:", error);
    return [];
  }
}

/**
 * Check if a user has unlocked an achievement
 * Uses cached achievement data if available
 */
export async function hasAchievement(
  userId: string,
  achievementId: string
): Promise<boolean> {
  try {
    if (!userId || !achievementId) return false;

    // Check cache first
    const cacheKey = `achievements_${userId}`;
    const cachedData = achievementsCache.get(cacheKey);

    if (cachedData) {
      // Use cached data if available
      const achievement = cachedData.find((a) => a.id === achievementId);
      return achievement?.isUnlocked || false;
    }

    // Fallback to direct query if no cache
    const supabase = createClient();
    const { data, error } = await supabase
      .from("user_achievements")
      .select("achievement_id")
      .eq("user_id", userId)
      .eq("achievement_id", achievementId)
      .maybeSingle();

    if (error) throw error;

    return !!data;
  } catch (error) {
    console.error("Error checking achievement status:", error);
    return false;
  }
}

/**
 * Unlock an achievement for a user and invalidate cached data
 */
export async function unlockAchievement(
  userId: string,
  achievementId: string
): Promise<boolean> {
  try {
    if (!userId || !achievementId) return false;

    const supabase = createClient();

    // Check if already unlocked
    const { data: existing, error: checkError } = await supabase
      .from("user_achievements")
      .select("id")
      .eq("user_id", userId)
      .eq("achievement_id", achievementId)
      .maybeSingle();

    if (checkError) throw checkError;

    // If already unlocked, just return success
    if (existing) return true;

    // Insert new achievement with current timestamp
    const { error } = await supabase.from("user_achievements").insert({
      user_id: userId,
      achievement_id: achievementId,
      unlocked_at: new Date().toISOString(),
    });

    if (error) throw error;

    // Invalidate the achievements cache for this user
    achievementsCache.invalidate(`achievements_${userId}`);

    return true;
  } catch (error) {
    console.error("Error unlocking achievement:", error);
    return false;
  }
}

/**
 * Get motivational message based on streak status
 */
export function getMotivationalMessage(streakData: StreakData): string {
  if (!streakData) return "Complete tasks to build your streak!";

  const {
    currentStreak,
    streakAtRisk,
    isGoalReached,
    tasksCompletedToday,
    dailyGoal,
  } = streakData;

  if (streakAtRisk) {
    return `Don't break your ${currentStreak} day streak! Complete a task today to keep it going.`;
  }

  if (currentStreak === 0) {
    return "Start your streak today by completing a task!";
  }

  if (isGoalReached) {
    return `Great job! You've reached your daily goal and maintained a ${currentStreak} day streak!`;
  }

  if (tasksCompletedToday > 0) {
    return `You've completed ${tasksCompletedToday} of ${dailyGoal} tasks today. Keep going!`;
  }

  if (currentStreak >= 30) {
    return `Amazing! Your ${currentStreak} day streak shows incredible dedication.`;
  }

  if (currentStreak >= 7) {
    return `You're on fire with a ${currentStreak} day streak! Keep up the momentum.`;
  }

  return `You're on a ${currentStreak} day streak! Complete a task today to keep it going.`;
}

// Function to clear all caches (useful when testing)
export function clearAllCaches(): void {
  streakCache.invalidateAll();
  activityCache.invalidateAll();
  achievementsCache.invalidateAll();
}
