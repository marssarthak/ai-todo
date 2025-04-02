"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import {
  getUserStreak,
  getUserActivityCalendar,
} from "@/services/StreakService";
import { StreakCounter } from "@/components/gamification/StreakCounter";
import { StreakCalendar } from "@/components/gamification/StreakCalendar";
import { StreakAlert } from "@/components/gamification/StreakAlert";
import { Spinner } from "@/components/ui/spinner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Flame, Calendar, Trophy, Zap } from "lucide-react";
import { format, addDays } from "date-fns";
import Link from "next/link";

export default function StreaksPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [streakData, setStreakData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    async function fetchStreakData() {
      try {
        setIsLoading(true);
        setError(null);

        const data = await getUserStreak(user.id);
        setStreakData(data);
      } catch (err) {
        console.error("Failed to fetch streak data:", err);
        setError("Failed to load streak data");
      } finally {
        setIsLoading(false);
      }
    }

    fetchStreakData();
  }, [user]);

  // Show loading spinner while loading streak data
  if (isLoading) {
    return (
      <Container>
        <PageHeader
          title="Streaks"
          description="Track your daily productivity streaks"
        />
        <div className="py-20 flex justify-center">
          <Spinner size="lg" />
        </div>
      </Container>
    );
  }

  // Show error message if streak data couldn't be loaded
  if (error || !streakData) {
    return (
      <Container>
        <PageHeader
          title="Streaks"
          description="Track your daily productivity streaks"
        />
        <div className="py-8 text-center text-muted-foreground">
          {error || "Failed to load streak data"}
        </div>
      </Container>
    );
  }

  // Calculate dates for the streak visualization
  const today = new Date();
  const dates = [];
  for (let i = 6; i >= 0; i--) {
    dates.push(addDays(today, -i));
  }

  return (
    <Container>
      <PageHeader
        title="Productivity Streaks"
        description="Track your daily task completion streaks"
      />

      {/* Streak alert if streak is at risk */}
      <div className="mb-6">
        <StreakAlert variant="inline" />
      </div>

      {/* Stats summary section */}
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <StreakCounter variant="standard" />

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Zap className="h-5 w-5 mr-2 text-yellow-500" />
              Streak Stats
            </CardTitle>
            <CardDescription>Your streak performance over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">
                  Current Streak
                </div>
                <div className="text-2xl font-bold flex items-center">
                  <Flame className="h-5 w-5 mr-1 text-orange-500" />
                  {streakData.currentStreak} days
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Best Streak</div>
                <div className="text-2xl font-bold flex items-center">
                  <Trophy className="h-5 w-5 mr-1 text-amber-500" />
                  {streakData.maxStreak} days
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Daily Goal</div>
                <div className="text-xl font-medium">
                  {streakData.tasksCompletedToday}/{streakData.dailyGoal} tasks
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Last Active</div>
                <div className="text-xl font-medium">
                  {streakData.lastActiveDate
                    ? format(new Date(streakData.lastActiveDate), "MMM d, yyyy")
                    : "Never"}
                </div>
              </div>
            </div>

            {/* Week visualization */}
            <div className="mt-6">
              <div className="text-sm font-medium mb-2">Last 7 Days</div>
              <div className="flex justify-between">
                {dates.map((date, index) => {
                  const isActive = streakData.completedDays?.some(
                    (d: Date) =>
                      format(new Date(d), "yyyy-MM-dd") ===
                      format(date, "yyyy-MM-dd")
                  );
                  return (
                    <div key={index} className="flex flex-col items-center">
                      <div className="text-xs text-muted-foreground mb-1">
                        {format(date, "EEE")}
                      </div>
                      <div
                        className={`h-8 w-8 rounded-full flex items-center justify-center ${
                          isActive
                            ? "bg-green-500 text-white"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {format(date, "d")}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar section */}
      <div className="mb-8">
        <StreakCalendar title="Activity History" />
      </div>

      {/* Achievements link */}
      <div className="flex justify-center my-8">
        <Link
          href="/profile/achievements"
          className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          <Trophy className="h-5 w-5 mr-2" />
          View Your Achievements
        </Link>
      </div>
    </Container>
  );
}
