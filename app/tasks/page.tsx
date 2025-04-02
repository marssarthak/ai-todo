"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { StreakCounter } from "@/components/gamification/StreakCounter";
import { AchievementBadge } from "@/components/gamification/AchievementCard";
import { getUserAchievements } from "@/services/StreakService";
import { Badge } from "@/components/ui/badge";
import { getMotivationalMessage } from "@/services/StreakService";
import { getUserStreak } from "@/services/StreakService";

// Import your existing task components
// import { TaskList } from '@/components/tasks/TaskList';
// import { AddTaskButton } from '@/components/tasks/AddTaskButton';

export default function TasksPage() {
  const { user } = useAuth();
  const [streakData, setStreakData] = useState<any>(null);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [motivationalMessage, setMotivationalMessage] = useState("");

  useEffect(() => {
    if (!user?.id) return;

    async function loadGamificationData() {
      try {
        // Get streak data
        const streak = await getUserStreak(user.id);
        setStreakData(streak);

        if (streak) {
          setMotivationalMessage(getMotivationalMessage(streak));
        }

        // Get recent achievements
        const userAchievements = await getUserAchievements(user.id);
        setAchievements(
          userAchievements.filter((a) => a.isUnlocked).slice(0, 3)
        );
      } catch (error) {
        console.error("Error loading gamification data:", error);
      }
    }

    loadGamificationData();
  }, [user]);

  return (
    <Container>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <PageHeader
          title="Tasks"
          description="Manage your tasks and stay productive"
          className="md:mb-0"
        />

        <div className="mt-4 md:mt-0">
          <StreakCounter variant="compact" />
        </div>
      </div>

      {/* Motivational message */}
      {motivationalMessage && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6">
          <p className="text-sm">{motivationalMessage}</p>
        </div>
      )}

      {/* Recent achievements */}
      {achievements.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium">Recent Achievements</h3>
            <Badge variant="outline">
              <a href="/profile/achievements" className="text-xs">
                View All
              </a>
            </Badge>
          </div>
          <div className="flex gap-2">
            {achievements.map((achievement) => (
              <AchievementBadge
                key={achievement.id}
                achievement={achievement}
                size="sm"
              />
            ))}
          </div>
        </div>
      )}

      {/* Your existing task components */}
      <div className="mt-6">
        {/* <TaskList /> */}
        {/* <AddTaskButton /> */}
        <div className="py-10 text-center text-muted-foreground">
          Your task components will go here
        </div>
      </div>
    </Container>
  );
}
