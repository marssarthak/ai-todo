"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { getUserAchievements, Achievement } from "@/services/StreakService";
import { AchievementCard } from "@/components/gamification/AchievementCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StreakCounter } from "@/components/gamification/StreakCounter";
import { StreakCalendar } from "@/components/gamification/StreakCalendar";
import { Spinner } from "@/components/ui/spinner";
import { StreakAlert } from "@/components/gamification/StreakAlert";
import { Trophy, Clock, Calendar } from "lucide-react";

export default function AchievementsPage() {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Categories for filtering achievements
  const categories = ["all", "tasks", "streaks", "goals", "dedication"];

  useEffect(() => {
    if (!user?.id) return;

    async function fetchAchievements() {
      try {
        setIsLoading(true);
        setError(null);

        const achievementsData = await getUserAchievements(user.id);
        setAchievements(achievementsData);
      } catch (err) {
        console.error("Failed to fetch achievements:", err);
        setError("Failed to load achievements");
      } finally {
        setIsLoading(false);
      }
    }

    fetchAchievements();
  }, [user]);

  // Count unlocked achievements by category
  const getUnlockedCount = (category?: string) => {
    if (!category || category === "all") {
      return achievements.filter((a) => a.isUnlocked).length;
    }
    return achievements.filter((a) => a.category === category && a.isUnlocked)
      .length;
  };

  // Get total achievement count by category
  const getTotalCount = (category?: string) => {
    if (!category || category === "all") {
      return achievements.length;
    }
    return achievements.filter((a) => a.category === category).length;
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

  const unlockedAchievements = achievements.filter((a) => a.isUnlocked);
  const lockedAchievements = achievements.filter((a) => !a.isUnlocked);

  return (
    <Container>
      <PageHeader
        title="Achievements & Streaks"
        description="Track your productivity milestones and daily streaks"
      />

      {/* Streak alert if streak is at risk */}
      <div className="mb-6">
        <StreakAlert variant="inline" />
      </div>

      {/* Stats summary section */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <StreakCounter showWarning={false} variant="standard" />

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

      {/* Calendar section */}
      <div className="mb-8">
        <StreakCalendar />
      </div>

      {/* Achievements section */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold tracking-tight">Your Achievements</h2>
        <p className="text-muted-foreground">
          Complete tasks, maintain streaks, and unlock achievements
        </p>
      </div>

      <Tabs defaultValue="all" className="mb-6">
        <TabsList>
          {categories.map((category) => (
            <TabsTrigger key={category} value={category} className="capitalize">
              {category} ({getUnlockedCount(category)}/{getTotalCount(category)}
              )
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((category) => (
          <TabsContent key={category} value={category}>
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-4">
                Unlocked Achievements
              </h3>
              {unlockedAchievements.filter(
                (a) => category === "all" || a.category === category
              ).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {unlockedAchievements
                    .filter(
                      (a) => category === "all" || a.category === category
                    )
                    .map((achievement) => (
                      <AchievementCard
                        key={achievement.id}
                        achievement={achievement}
                      />
                    ))}
                </div>
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  No achievements unlocked in this category yet
                </div>
              )}

              <h3 className="text-lg font-medium mt-8 mb-4">
                Locked Achievements
              </h3>
              {lockedAchievements.filter(
                (a) => category === "all" || a.category === category
              ).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {lockedAchievements
                    .filter(
                      (a) => category === "all" || a.category === category
                    )
                    .map((achievement) => (
                      <AchievementCard
                        key={achievement.id}
                        achievement={achievement}
                      />
                    ))}
                </div>
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
