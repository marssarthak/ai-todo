"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";

import { Spinner } from "@/components/ui/spinner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Flame,
  Calendar,
  Trophy,
  Zap,
  AlertCircle,
  Shield,
} from "lucide-react";
import { format, addDays, fromUnixTime } from "date-fns";
import Link from "next/link";
import { useWeb3Gamification } from "@/hooks/useWeb3Gamification";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

export default function StreaksPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [monthlyCalendarData, setMonthlyCalendarData] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Use the web3 gamification hook for streak data
  const {
    userAddress,
    getCurrentStreak,
    getStreakData,
    getNextTierRequirements,
    getDailyGoal,
    getReputationTier,
    getMonthlyStreakCalendar,
    getUserGamificationData,
    getAllUserAchievements,
  } = useWeb3Gamification();

  // State for blockchain data
  const [gamificationData, setGamificationData] = useState<any>(null);
  const [dailyGoal, setDailyGoal] = useState<number>(0);
  const [nextTierInfo, setNextTierInfo] = useState<any>(null);
  const [recentAchievements, setRecentAchievements] = useState<any[]>([]);

  useEffect(() => {
    async function fetchBlockchainData() {
      if (!userAddress) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Get current date for calendar data
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed

        // Get all blockchain data in parallel
        const [
          gamificationData,
          streakCalendarData,
          userDailyGoal,
          nextTier,
          achievements,
        ] = await Promise.all([
          getUserGamificationData(),
          getMonthlyStreakCalendar(currentYear, currentMonth),
          getDailyGoal(),
          getNextTierRequirements(),
          getAllUserAchievements(),
        ]);

        setGamificationData(gamificationData);
        setMonthlyCalendarData(streakCalendarData as number[]);
        setDailyGoal(userDailyGoal as number);
        setNextTierInfo(nextTier);

        // Get top 3 most recent achievements
        const recentAchievs = achievements
          .sort((a, b) => {
            // Sort by unlocked status and then by most recent
            if (a.unlocked && !b.unlocked) return -1;
            if (!a.unlocked && b.unlocked) return 1;
            if (a.unlocked && b.unlocked) {
              return b.unlockedAt - a.unlockedAt;
            }
            // Then by progress percentage if not unlocked
            const aProgress = a.progress / a.threshold;
            const bProgress = b.progress / b.threshold;
            return bProgress - aProgress;
          })
          .slice(0, 3);

        setRecentAchievements(recentAchievs);
      } catch (err) {
        console.error("Failed to fetch blockchain streak data:", err);
        setError("Failed to load blockchain data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchBlockchainData();
  }, [userAddress]);

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

  // Show wallet connection prompt if not connected
  if (!userAddress) {
    return (
      <Container>
        <PageHeader
          title="Streaks"
          description="Track your daily productivity streaks"
        />
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Connect your wallet to access on-chain streak data and achievements.
          </AlertDescription>
        </Alert>
        <div className="py-8 text-center text-muted-foreground">
          Your streak data will appear here once you connect your wallet.
        </div>
      </Container>
    );
  }

  // Show error message if streak data couldn't be loaded
  if (error || !gamificationData) {
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

  // Get completion status for recent dates
  const getCompletionStatus = (date: Date): boolean => {
    const dateString = format(date, "d");
    const dayOfMonth = parseInt(dateString);
    return monthlyCalendarData.includes(dayOfMonth);
  };

  return (
    <Container>
      <PageHeader
        title="Productivity Streaks"
        description="Track your daily task completion streaks"
      />

      {/* Streak alert if streak is at risk */}
      {gamificationData.streakAtRisk && (
        <div className="mb-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your streak is at risk! Complete a task today to maintain your
              streak.
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Stats summary section */}
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <Card className="p-6">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative w-32 h-32 flex items-center justify-center">
              <div className="absolute inset-0">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="10"
                    strokeLinecap="round"
                    className="text-muted stroke-muted-foreground/15"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray="283"
                    strokeDashoffset={
                      283 -
                      (283 * gamificationData.streak) /
                        Math.max(30, gamificationData.maxStreak)
                    }
                    className="text-primary"
                    transform="rotate(-90 50 50)"
                  />
                </svg>
              </div>
              <div className="flex flex-col items-center justify-center">
                <span className="text-4xl font-bold">
                  {gamificationData.streak}
                </span>
                <span className="text-xs text-muted-foreground">
                  Day Streak
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">
                  Max Streak
                </div>
                <div className="text-xl font-semibold">
                  {gamificationData.maxStreak}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">Tier</div>
                <div className="text-xl font-semibold">
                  {gamificationData.tier}
                </div>
              </div>
            </div>
          </div>
        </Card>

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
                  {gamificationData.streak} days
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Best Streak</div>
                <div className="text-2xl font-bold flex items-center">
                  <Trophy className="h-5 w-5 mr-1 text-amber-500" />
                  {gamificationData.maxStreak} days
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Daily Goal</div>
                <div className="text-xl font-medium">
                  {gamificationData.taskCount % dailyGoal}/{dailyGoal} tasks
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Last Active</div>
                <div className="text-xl font-medium">
                  {gamificationData.lastActivity
                    ? format(
                        fromUnixTime(gamificationData.lastActivity),
                        "MMM d, yyyy"
                      )
                    : "Never"}
                </div>
              </div>
            </div>

            {/* Week visualization */}
            <div className="mt-6">
              <div className="text-sm font-medium mb-2">Last 7 Days</div>
              <div className="flex justify-between">
                {dates.map((date, index) => {
                  const isActive = getCompletionStatus(date);
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

      {/* Reputation progress section */}
      {nextTierInfo && (
        <Card className="mb-8">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Trophy className="h-5 w-5 mr-2 text-amber-500" />
              Reputation Progress
            </CardTitle>
            <CardDescription>Your journey to the next tier</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mb-2">
              <div className="font-medium">{gamificationData.tier}</div>
              <div className="font-medium">{nextTierInfo.nextTier}</div>
            </div>
            <Progress
              value={
                (gamificationData.taskCount /
                  (gamificationData.taskCount + nextTierInfo.tasksNeeded)) *
                100
              }
              className="h-2 mb-2"
            />
            <div className="text-sm text-muted-foreground text-center mt-1">
              {nextTierInfo.tasksNeeded} more tasks needed to reach{" "}
              {nextTierInfo.nextTier}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent achievements section */}
      {recentAchievements.length > 0 && (
        <Card className="mb-8">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Shield className="h-5 w-5 mr-2 text-blue-500" />
              Recent Achievements
            </CardTitle>
            <CardDescription>Your latest unlocked achievements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentAchievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="bg-muted/50 rounded-lg p-3"
                >
                  <div className="flex items-start">
                    <div className="bg-primary/10 rounded-full p-2 mr-3">
                      {achievement.category === "Tasks" && (
                        <Trophy className="h-5 w-5 text-amber-500" />
                      )}
                      {achievement.category === "Streaks" && (
                        <Flame className="h-5 w-5 text-orange-500" />
                      )}
                      {achievement.category === "Goals" && (
                        <Zap className="h-5 w-5 text-yellow-500" />
                      )}
                      {achievement.category === "Dedication" && (
                        <Shield className="h-5 w-5 text-blue-500" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium">
                        {achievement.name}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {achievement.description}
                      </p>
                      {!achievement.unlocked && (
                        <div className="mt-2">
                          <div className="flex justify-between text-xs mb-1">
                            <span>
                              {achievement.progress}/{achievement.threshold}
                            </span>
                            <span>
                              {Math.floor(
                                (achievement.progress / achievement.threshold) *
                                  100
                              )}
                              %
                            </span>
                          </div>
                          <Progress
                            value={
                              (achievement.progress / achievement.threshold) *
                              100
                            }
                            className="h-1"
                          />
                        </div>
                      )}
                      {achievement.unlocked && (
                        <div className="flex items-center mt-1">
                          <div className="bg-green-500 rounded-full p-0.5 mr-1">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="10"
                              height="10"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="4"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="text-white"
                            >
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          </div>
                          <span className="text-xs text-green-600">
                            Unlocked
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Achievements link */}
      <div className="flex justify-center my-8">
        <Link
          href="/profile/achievements"
          className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          <Trophy className="h-5 w-5 mr-2" />
          View All Achievements
        </Link>
      </div>
    </Container>
  );
}
