"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useAuth } from "@/context/AuthContext";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { getUserAchievements, Achievement } from "@/services/StreakService";
import dynamic from "next/dynamic";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StreakCounter } from "@/components/gamification/StreakCounter";
import { Spinner } from "@/components/ui/spinner";
import { StreakAlert } from "@/components/gamification/StreakAlert";
import { Trophy, Clock, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMemoizedFn } from "@/hooks/useMemoizedFn";

// Lazily load heavy components
const StreakCalendar = dynamic(
  () =>
    import("@/components/gamification/StreakCalendar").then((mod) => ({
      default: mod.StreakCalendar,
    })),
  {
    loading: () => (
      <div className="h-64 bg-muted animate-pulse rounded-md"></div>
    ),
    ssr: false,
  }
);

const AchievementCard = dynamic(
  () =>
    import("@/components/gamification/AchievementCard").then((mod) => ({
      default: mod.AchievementCard,
    })),
  {
    loading: () => (
      <div className="h-48 bg-muted animate-pulse rounded-md"></div>
    ),
    ssr: false,
  }
);

// Create a simple cache for achievements data
const achievementsCache = new Map<
  string,
  { data: Achievement[]; timestamp: number }
>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

export default function AchievementsPage() {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState("all");
  const ITEMS_PER_PAGE = 6;

  // Categories for filtering achievements
  const categories = ["all", "tasks", "streaks", "goals", "dedication"];

  // Memoized function to fetch achievements with caching
  const fetchAchievements = useMemoizedFn(async (userId: string) => {
    // Check if we have cached data that's not expired
    const cacheKey = userId;
    const cached = achievementsCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }

    // No valid cache, fetch from service
    try {
      const achievementsData = await getUserAchievements(userId);

      // Update cache with new data
      achievementsCache.set(cacheKey, {
        data: achievementsData,
        timestamp: Date.now(),
      });

      return achievementsData;
    } catch (err) {
      console.error("Failed to fetch achievements:", err);
      throw err;
    }
  });

  useEffect(() => {
    if (!user?.id) return;

    const loadAchievements = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const achievementsData = await fetchAchievements(user.id);
        setAchievements(achievementsData);
      } catch (err) {
        console.error("Failed to fetch achievements:", err);
        setError("Failed to load achievements");
      } finally {
        setIsLoading(false);
      }
    };

    loadAchievements();
  }, [user, fetchAchievements]);

  // Memoized filtered achievements to avoid unnecessary recalculations
  const {
    unlockedAchievements,
    lockedAchievements,
    paginatedUnlockedAchievements,
    paginatedLockedAchievements,
    totalUnlockedPages,
    totalLockedPages,
  } = useMemo(() => {
    // Filter by category first
    const filtered = achievements.filter(
      (a) => category === "all" || a.category === category
    );

    // Split into unlocked and locked
    const unlocked = filtered.filter((a) => a.isUnlocked);
    const locked = filtered.filter((a) => !a.isUnlocked);

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
  }, [achievements, category, page, ITEMS_PER_PAGE]);

  // Count unlocked achievements by category
  const getUnlockedCount = useMemoizedFn((category?: string) => {
    if (!category || category === "all") {
      return achievements.filter((a) => a.isUnlocked).length;
    }
    return achievements.filter((a) => a.category === category && a.isUnlocked)
      .length;
  });

  // Get total achievement count by category
  const getTotalCount = useMemoizedFn((category?: string) => {
    if (!category || category === "all") {
      return achievements.length;
    }
    return achievements.filter((a) => a.category === category).length;
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
      <div className="mb-6">
        <Suspense fallback={null}>
          <StreakAlert variant="inline" />
        </Suspense>
      </div>

      {/* Stats summary section */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Suspense
          fallback={
            <div className="h-32 bg-muted animate-pulse rounded-md"></div>
          }
        >
          <StreakCounter showWarning={false} variant="standard" />
        </Suspense>

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
                  return b.unlockedAt.getTime() - a.unlockedAt.getTime();
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
                          ? `Unlocked ${new Date(
                              achievement.unlockedAt
                            ).toLocaleDateString()}`
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

      {/* Calendar section with lazy loading */}
      <div className="mb-8">
        <Suspense
          fallback={
            <div className="h-64 bg-muted animate-pulse rounded-md"></div>
          }
        >
          <StreakCalendar />
        </Suspense>
      </div>

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
          {categories.map((cat) => (
            <TabsTrigger key={cat} value={cat} className="capitalize">
              {cat} ({getUnlockedCount(cat)}/{getTotalCount(cat)})
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((cat) => (
          <TabsContent key={cat} value={cat}>
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-4">
                Unlocked Achievements
              </h3>

              {unlockedAchievements.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {paginatedUnlockedAchievements.map((achievement) => (
                      <Suspense
                        key={achievement.id}
                        fallback={
                          <div className="h-48 bg-muted animate-pulse rounded-md"></div>
                        }
                      >
                        <AchievementCard achievement={achievement} />
                      </Suspense>
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
                      <Suspense
                        key={achievement.id}
                        fallback={
                          <div className="h-48 bg-muted animate-pulse rounded-md"></div>
                        }
                      >
                        <AchievementCard achievement={achievement} />
                      </Suspense>
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
