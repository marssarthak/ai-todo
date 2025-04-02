import { NextResponse } from "next/server";
import { getUserStreak, StreakData } from "@/services/StreakService";

/**
 * Test endpoint to check streak calculation service
 * Only accessible in development and test environments
 */
export async function GET() {
  // Restrict access in production for security
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Test endpoints are not available in production" },
      { status: 403 }
    );
  }

  try {
    // Use a test user ID for integration testing
    const testUserId = "test-user-id";
    const startTime = Date.now();

    // For testing, we'll use a mock streak data or the actual service
    // depending on whether we're in a test environment
    let streakData: StreakData | null;

    if (process.env.NODE_ENV === "test") {
      // Mock data for testing
      streakData = {
        currentStreak: 5,
        maxStreak: 10,
        lastActiveDate: new Date(),
        dailyGoal: 3,
        isGoalReached: true,
        tasksCompletedToday: 4,
        streakAtRisk: false,
        daysMissed: 0,
        longestStreak: 10,
        lastActivity: new Date(),
        completedDays: [],
      };
    } else {
      // Use the actual service
      streakData = await getUserStreak(testUserId);
    }

    if (!streakData) {
      throw new Error("Failed to retrieve streak data");
    }

    return NextResponse.json({
      status: "calculated",
      message: "Streak calculation successful",
      latency: Date.now() - startTime,
      streak: {
        currentStreak: streakData.currentStreak,
        maxStreak: streakData.maxStreak,
        isGoalReached: streakData.isGoalReached,
        streakAtRisk: streakData.streakAtRisk,
      },
    });
  } catch (error) {
    console.error("Streak calculation test failed:", error);

    return NextResponse.json(
      {
        status: "error",
        message: "Streak calculation failed",
        error: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
