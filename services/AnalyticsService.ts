import { createClient } from "@/lib/supabase/server"; // Correct import for server client factory
import { Task } from "@/types/task";
import { differenceInDays, startOfWeek, endOfWeek, subDays } from "date-fns";

// Define the structure for the analytics data
export interface TaskAnalyticsData {
  totalCompleted: number;
  completedLast7Days: number;
  completedThisWeek: number;
  averageCompletionTimeDays?: number; // Optional: Calculation can be complex
  completionRateLast30Days?: number; // Optional: Needs creation data too
  // Add more metrics as needed: completedByPriority, overdueCompletedCount etc.
}

type AnalyticsTask = Pick<Task, "id" | "createdAt" | "updatedAt" | "status">;

/**
 * Fetches completed tasks and calculates basic analytics.
 * NOTE: This requires tasks to have accurate `created_at` and `updated_at` timestamps,
 * and assumes `updated_at` reflects completion time when status is 'completed'.
 */
export async function getCompletionAnalytics(): Promise<TaskAnalyticsData | null> {
  const supabase = await createClient();

  // 1. Get User ID (should be called from an authenticated context)
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    console.error("Analytics Service: Unauthorized access attempt.");
    return null; // Or throw an error
  }

  // 2. Fetch recently completed tasks for the user
  // Fetch tasks completed in the last N days (e.g., 90 days) for meaningful averages
  const lookbackDays = 90;
  const lookbackDate = subDays(new Date(), lookbackDays).toISOString();

  const { data: completedTasks, error: dbError } = await supabase
    .from("tasks")
    .select("id, created_at, updated_at, status") // Select necessary fields
    .eq("user_id", user.id)
    .eq("status", "completed")
    .gte("updated_at", lookbackDate) // Filter for tasks completed recently
    .order("updated_at", { ascending: false })
    .returns<AnalyticsTask[]>(); // Specify return type for better inference

  if (dbError) {
    console.error(
      "Analytics Service: Error fetching completed tasks:",
      dbError
    );
    throw new Error(`Failed to fetch task data: ${dbError.message}`);
  }

  if (!completedTasks || completedTasks.length === 0) {
    return {
      totalCompleted: 0,
      completedLast7Days: 0,
      completedThisWeek: 0,
      // Default other metrics or leave undefined
    };
  }

  // 3. Calculate Metrics
  const now = new Date();
  const sevenDaysAgo = subDays(now, 7);
  const startOfCurrentWeek = startOfWeek(now);
  const endOfCurrentWeek = endOfWeek(now);

  let totalCompletionTimeDays = 0;
  let tasksWithValidCompletionTime = 0;
  let completedLast7Days = 0;
  let completedThisWeek = 0;

  completedTasks.forEach((task: AnalyticsTask) => {
    const completedAt = new Date(task.updatedAt);
    const createdAt = new Date(task.createdAt);

    // Basic checks for valid dates
    if (!isNaN(completedAt.getTime()) && !isNaN(createdAt.getTime())) {
      const completionTime = differenceInDays(completedAt, createdAt);
      if (completionTime >= 0) {
        // Ensure non-negative difference
        totalCompletionTimeDays += completionTime;
        tasksWithValidCompletionTime++;
      }

      if (completedAt >= sevenDaysAgo) {
        completedLast7Days++;
      }
      if (
        completedAt >= startOfCurrentWeek &&
        completedAt <= endOfCurrentWeek
      ) {
        completedThisWeek++;
      }
    }
  });

  const averageCompletionTimeDays =
    tasksWithValidCompletionTime > 0
      ? Math.round(totalCompletionTimeDays / tasksWithValidCompletionTime)
      : undefined;

  // Optional: Calculate completion rate (requires fetching created tasks too)
  // const thirtyDaysAgo = subDays(now, 30).toISOString();
  // const { count: createdLast30Days } = await supabase.from('tasks')...eq('user_id', user.id).gte('created_at', thirtyDaysAgo)...;
  // const completionRate = createdLast30Days ? Math.round((completedTasks.filter(...).length / createdLast30Days) * 100) : undefined;

  return {
    totalCompleted: completedTasks.length, // Based on the lookback period
    completedLast7Days,
    completedThisWeek,
    averageCompletionTimeDays: averageCompletionTimeDays || 0,
    // completionRateLast30Days: completionRate,
  };
}
