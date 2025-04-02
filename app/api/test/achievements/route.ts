import { NextResponse } from "next/server";
import { getUserAchievements, Achievement } from "@/services/StreakService";

/**
 * Test endpoint to check achievements service
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

    // For testing, we'll use mock achievements data or the actual service
    // depending on whether we're in a test environment
    let achievements: Achievement[];

    if (process.env.NODE_ENV === "test") {
      // Mock data for testing
      achievements = [
        {
          id: "1",
          name: "First Task Completed",
          description: "Complete your first task",
          category: "tasks",
          iconName: "CheckCircle",
          isUnlocked: true,
          unlockedAt: new Date(),
        },
        {
          id: "2",
          name: "3-Day Streak",
          description: "Maintain a streak for 3 days",
          category: "streaks",
          iconName: "Flame",
          isUnlocked: true,
          unlockedAt: new Date(),
        },
        {
          id: "3",
          name: "Level Up",
          description: "Reach Intermediate level",
          category: "dedication",
          iconName: "Trophy",
          isUnlocked: false,
        },
      ];
    } else {
      // Use the actual service
      achievements = await getUserAchievements(testUserId);
    }

    const unlockedCount = achievements.filter((a) => a.isUnlocked).length;

    // Get unique categories using an object instead of Set to avoid iteration issues
    const categoriesSet = achievements.reduce((acc, achievement) => {
      acc[achievement.category] = true;
      return acc;
    }, {} as Record<string, boolean>);

    const categories = Object.keys(categoriesSet);

    return NextResponse.json({
      status: "achievement",
      message: "Achievement service checked successfully",
      latency: Date.now() - startTime,
      achievements: {
        total: achievements.length,
        unlocked: unlockedCount,
        categories,
      },
    });
  } catch (error) {
    console.error("Achievement service test failed:", error);

    return NextResponse.json(
      {
        status: "error",
        message: "Achievement service check failed",
        error: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
