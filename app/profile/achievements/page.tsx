"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useAuth } from "@/context/AuthContext";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import dynamic from "next/dynamic";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";
import {
  Trophy,
  Clock,
  Calendar,
  AlertCircle,
  Medal,
  Award,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMemoizedFn } from "@/hooks/useMemoizedFn";
import { useWeb3Gamification } from "@/hooks/useWeb3Gamification";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format, fromUnixTime } from "date-fns";

// Create achievement card component that uses blockchain data
const BlockchainAchievementCard = ({
  achievement,
  variant = "default",
}: {
  achievement: any;
  variant?: "default" | "compact";
}) => {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Tasks":
        return <Trophy className="h-5 w-5 text-amber-500" />;
      case "Streaks":
        return <Clock className="h-5 w-5 text-orange-500" />;
      case "Goals":
        return <Award className="h-5 w-5 text-yellow-500" />;
      case "Dedication":
        return <Shield className="h-5 w-5 text-blue-500" />;
      default:
        return <Trophy className="h-5 w-5 text-amber-500" />;
    }
  };

  if (variant === "compact") {
    return (
      <div className="bg-card rounded-lg border p-3 flex items-start">
        <div className="bg-primary/10 p-2 rounded-full mr-3">
          {getCategoryIcon(achievement.category)}
        </div>
        <div className="flex-grow">
          <h4 className="text-sm font-medium">{achievement.name}</h4>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {achievement.description}
          </p>
          {!achievement.unlocked && (
            <div className="mt-2">
              <div className="flex justify-between items-center text-xs mb-1">
                <span>
                  {achievement.progress}/{achievement.threshold}
                </span>
                <span>
                  {Math.floor(
                    (achievement.progress / achievement.threshold) * 100
                  )}
                  %
                </span>
              </div>
              <Progress
                value={(achievement.progress / achievement.threshold) * 100}
                className="h-1"
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border overflow-hidden">
      <div
        className={`py-4 px-5 ${
          achievement.unlocked ? "bg-primary/10" : "bg-muted"
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <div className="bg-primary/20 p-2 rounded-full mr-2">
              {getCategoryIcon(achievement.category)}
            </div>
            <h3 className="font-semibold">{achievement.name}</h3>
          </div>
          {achievement.unlocked && (
            <div className="bg-green-500 text-white text-xs py-1 px-2 rounded-full">
              Unlocked
            </div>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {achievement.description}
        </p>
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="font-medium">Progress</span>
          <span>
            {achievement.progress}/{achievement.threshold}
          </span>
        </div>
        <Progress
          value={(achievement.progress / achievement.threshold) * 100}
          className={`h-2 ${achievement.unlocked ? "bg-green-500" : ""}`}
        />
        {achievement.unlocked && achievement.unlockedAt > 0 && (
          <div className="mt-3 text-xs text-muted-foreground">
            Unlocked on{" "}
            {format(fromUnixTime(achievement.unlockedAt), "MMM d, yyyy")}
          </div>
        )}
      </div>
    </div>
  );
};

export default function AchievementsPage() {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState("all");
  const ITEMS_PER_PAGE = 6;

  // Use web3 gamification hook
  const {
    userAddress,
    getAllUserAchievements,
    getUserGamificationData,
    getStreakData,
    getNextTierRequirements,
  } = useWeb3Gamification();

  // Store blockchain data
  const [gamificationData, setGamificationData] = useState<any>(null);
  const [streakData, setStreakData] = useState<any>(null);
  const [nextTierInfo, setNextTierInfo] = useState<any>(null);

  // Categories for filtering achievements
  const categoryMapping: Record<string, string> = {
    all: "all",
    tasks: "Tasks",
    streaks: "Streaks",
    goals: "Goals",
    dedication: "Dedication",
  };

  // Load blockchain achievements data
  useEffect(() => {
    async function fetchBlockchainData() {
      if (!userAddress) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Get all blockchain data in parallel
        const [achievementsData, userData, streak, nextTier] =
          await Promise.all([
            getAllUserAchievements(),
            getUserGamificationData(),
            getStreakData(),
            getNextTierRequirements(),
          ]);

        setAchievements(achievementsData);
        setGamificationData(userData);
        setStreakData(streak);
        setNextTierInfo(nextTier);
      } catch (err) {
        console.error("Failed to fetch blockchain achievements:", err);
        setError("Failed to load achievements data from blockchain");
      } finally {
        setIsLoading(false);
      }
    }

    fetchBlockchainData();
  }, [userAddress]);

  // Memoized filtered achievements to avoid unnecessary recalculations
  const {
    unlockedAchievements,
    lockedAchievements,
    paginatedUnlockedAchievements,
    paginatedLockedAchievements,
    totalUnlockedPages,
    totalLockedPages,
  } = useMemo(() => {
    // Skip if no achievements loaded
    if (!achievements.length) {
      return {
        unlockedAchievements: [],
        lockedAchievements: [],
        paginatedUnlockedAchievements: [],
        paginatedLockedAchievements: [],
        totalUnlockedPages: 0,
        totalLockedPages: 0,
      };
    }

    // Filter by category first
    const filtered =
      category === "all"
        ? achievements
        : achievements.filter((a) => a.category === categoryMapping[category]);

    // Split into unlocked and locked
    const unlocked = filtered.filter((a) => a.unlocked);
    const locked = filtered.filter((a) => !a.unlocked);

    // Calculate pagination
    const totalUnlockedPages = Math.ceil(unlocked.length / ITEMS_PER_PAGE);
    const totalLockedPages = Math.ceil(locked.length / ITEMS_PER_PAGE);

    // Apply pagination
    const startIdx = (page - 1) * ITEMS_PER_PAGE;
    const paginatedUnlocked = unlocked.slice(
      startIdx,
      startIdx + ITEMS_PER_PAGE
    );
    const paginatedLocked = locked.slice(startIdx, startIdx + ITEMS_PER_PAGE);

    return {
      unlockedAchievements: unlocked,
      lockedAchievements: locked,
      paginatedUnlockedAchievements: paginatedUnlocked,
      paginatedLockedAchievements: paginatedLocked,
      totalUnlockedPages,
      totalLockedPages,
    };
  }, [achievements, category, page, ITEMS_PER_PAGE, categoryMapping]);

  // Count unlocked achievements by category
  const getUnlockedCount = useMemoizedFn((cat?: string) => {
    if (!achievements.length) return 0;

    if (!cat || cat === "all") {
      return achievements.filter((a) => a.unlocked).length;
    }

    return achievements.filter(
      (a) => a.category === categoryMapping[cat] && a.unlocked
    ).length;
  });

  // Get total achievement count by category
  const getTotalCount = useMemoizedFn((cat?: string) => {
    if (!achievements.length) return 0;

    if (!cat || cat === "all") {
      return achievements.length;
    }

    return achievements.filter((a) => a.category === categoryMapping[cat])
      .length;
  });

  // Reset page when changing category
  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory);
    setPage(1);
  };

  // Show loading spinner while loading achievements
  if (isLoading) {
    return (
      <Container>
        <PageHeader
          title="Achievements"
          description="Track your productivity milestones"
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
          title="Achievements"
          description="Track your productivity milestones"
        />
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Connect your wallet to access on-chain achievements and reputation.
          </AlertDescription>
        </Alert>
        <div className="py-8 text-center text-muted-foreground">
          Your achievement data will appear here once you connect your wallet.
        </div>
      </Container>
    );
  }

  // Show error message if achievements couldn't be loaded
  if (error) {
    return (
      <Container>
        <PageHeader
          title="Achievements"
          description="Track your productivity milestones"
        />
        <div className="py-8 text-center text-muted-foreground">{error}</div>
      </Container>
    );
  }

  return (
    <Container>
      <PageHeader
        title="Achievements & Streaks"
        description="Track your productivity milestones and daily streaks"
      />

      {/* Streak alert if streak is at risk */}
      {streakData?.streakAtRisk && (
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
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        {/* Streak Counter Card */}
        <div className="bg-card rounded-lg border p-6">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative w-24 h-24 flex items-center justify-center">
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
                      (283 * (gamificationData?.streak || 0)) /
                        Math.max(30, gamificationData?.maxStreak || 1)
                    }
                    className="text-primary"
                    transform="rotate(-90 50 50)"
                  />
                </svg>
              </div>
              <div className="flex flex-col items-center justify-center">
                <span className="text-3xl font-bold">
                  {gamificationData?.streak || 0}
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
                <div className="text-lg font-semibold">
                  {gamificationData?.maxStreak || 0}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">Tier</div>
                <div className="text-lg font-semibold">
                  {gamificationData?.tier || "Beginner"}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center mb-2">
            <Trophy className="h-5 w-5 text-amber-500 mr-2" />
            <h3 className="text-lg font-medium">Achievements</h3>
          </div>
          <div className="text-3xl font-bold mb-1">
            {getUnlockedCount()}{" "}
            <span className="text-sm text-muted-foreground font-normal">
              / {getTotalCount()}
            </span>
          </div>
          <div className="text-sm text-muted-foreground">
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div>
                <div className="text-xs uppercase font-medium">Tasks</div>
                <div>
                  {getUnlockedCount("tasks")} / {getTotalCount("tasks")}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase font-medium">Streaks</div>
                <div>
                  {getUnlockedCount("streaks")} / {getTotalCount("streaks")}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase font-medium">Goals</div>
                <div>
                  {getUnlockedCount("goals")} / {getTotalCount("goals")}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase font-medium">Dedication</div>
                <div>
                  {getUnlockedCount("dedication")} /{" "}
                  {getTotalCount("dedication")}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center mb-2">
            <Clock className="h-5 w-5 text-blue-500 mr-2" />
            <h3 className="text-lg font-medium">Recent Activity</h3>
          </div>
          {unlockedAchievements.length > 0 ? (
            <div className="space-y-2">
              {unlockedAchievements
                .sort((a, b) => {
                  if (!a.unlockedAt || !b.unlockedAt) return 0;
                  return b.unlockedAt - a.unlockedAt;
                })
                .slice(0, 3)
                .map((achievement) => (
                  <div
                    key={achievement.id}
                    className="text-sm flex items-center"
                  >
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <div>
                      <div className="font-medium">{achievement.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {achievement.unlockedAt
                          ? `Unlocked ${format(
                              fromUnixTime(achievement.unlockedAt),
                              "MMM d, yyyy"
                            )}`
                          : "Recently unlocked"}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-muted-foreground text-sm">
              No achievements unlocked yet
            </div>
          )}
        </div>
      </div>

      {/* Next tier progress */}
      {nextTierInfo && (
        <div className="mb-8 bg-card rounded-lg border p-4">
          <div className="flex items-center mb-3">
            <Medal className="h-5 w-5 text-primary mr-2" />
            <h3 className="text-lg font-medium">Reputation Progress</h3>
          </div>
          <div className="flex justify-between items-center mb-2">
            <div className="font-medium">
              {gamificationData?.tier || "Beginner"}
            </div>
            <div className="font-medium">{nextTierInfo.nextTier}</div>
          </div>
          <Progress
            value={
              ((gamificationData?.taskCount || 0) /
                ((gamificationData?.taskCount || 0) +
                  nextTierInfo.tasksNeeded)) *
              100
            }
            className="h-2 mb-2"
          />
          <div className="text-sm text-muted-foreground text-center mt-1">
            {nextTierInfo.tasksNeeded} more tasks needed to reach{" "}
            {nextTierInfo.nextTier}
          </div>
        </div>
      )}

      {/* Achievements section */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold tracking-tight">Your Achievements</h2>
        <p className="text-muted-foreground">
          Complete tasks, maintain streaks, and unlock achievements
        </p>
      </div>

      <Tabs
        defaultValue="all"
        className="mb-6"
        value={category}
        onValueChange={handleCategoryChange}
      >
        <TabsList>
          {Object.keys(categoryMapping).map((cat) => (
            <TabsTrigger key={cat} value={cat} className="capitalize">
              {cat} ({getUnlockedCount(cat)}/{getTotalCount(cat)})
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.keys(categoryMapping).map((cat) => (
          <TabsContent key={cat} value={cat}>
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-4">
                Unlocked Achievements
              </h3>

              {unlockedAchievements.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {paginatedUnlockedAchievements.map((achievement) => (
                      <BlockchainAchievementCard
                        key={achievement.id}
                        achievement={achievement}
                      />
                    ))}
                  </div>

                  {/* Pagination controls */}
                  {totalUnlockedPages > 1 && (
                    <div className="flex justify-center mt-6 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                        disabled={page === 1}
                      >
                        Previous
                      </Button>

                      <div className="flex items-center mx-2">
                        <span className="text-sm text-muted-foreground">
                          Page {page} of {totalUnlockedPages}
                        </span>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setPage((prev) =>
                            Math.min(prev + 1, totalUnlockedPages)
                          )
                        }
                        disabled={page === totalUnlockedPages}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  No achievements unlocked in this category yet
                </div>
              )}

              <h3 className="text-lg font-medium mt-8 mb-4">
                Locked Achievements
              </h3>

              {lockedAchievements.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {paginatedLockedAchievements.map((achievement) => (
                      <BlockchainAchievementCard
                        key={achievement.id}
                        achievement={achievement}
                      />
                    ))}
                  </div>

                  {/* Pagination controls */}
                  {totalLockedPages > 1 && (
                    <div className="flex justify-center mt-6 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                        disabled={page === 1}
                      >
                        Previous
                      </Button>

                      <div className="flex items-center mx-2">
                        <span className="text-sm text-muted-foreground">
                          Page {page} of {totalLockedPages}
                        </span>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setPage((prev) =>
                            Math.min(prev + 1, totalLockedPages)
                          )
                        }
                        disabled={page === totalLockedPages}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-10 text-green-500 font-medium">
                  Congratulations! You've unlocked all achievements in this
                  category.
                </div>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </Container>
  );
}
