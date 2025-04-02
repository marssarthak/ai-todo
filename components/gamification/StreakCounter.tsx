"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getUserStreak, checkStreakRisk } from "@/services/StreakService";
import { Card } from "@/components/ui/card";
import { ProgressCircle } from "@/components/ui/progress-circle";
import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreakCounterProps {
  showWarning?: boolean;
  variant?: "standard" | "compact" | "minimal";
}

export function StreakCounter({
  showWarning = true,
  variant = "standard",
}: StreakCounterProps) {
  const { user } = useAuth();
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [streakRisk, setStreakRisk] = useState({
    atRisk: false,
    hoursRemaining: 0,
    message: "",
  });

  useEffect(() => {
    if (!user) return;

    async function fetchStreakData() {
      try {
        setIsLoading(true);
        const data = await getUserStreak(user.id);

        if (data) {
          setStreak(data.currentStreak);
          setMaxStreak(data.maxStreak);
        }

        if (showWarning && user.id) {
          const riskInfo = await checkStreakRisk(user.id);
          setStreakRisk(riskInfo);
        }
      } catch (error) {
        console.error("Failed to fetch streak data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStreakData();
  }, [user, showWarning]);

  if (variant === "minimal") {
    return (
      <div className="flex items-center">
        <Flame
          className={cn(
            "h-5 w-5 mr-1",
            streak > 0 ? "text-orange-500" : "text-gray-400"
          )}
        />
        <span className="font-semibold">{streak}</span>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className="flex items-center bg-gradient-to-r from-amber-50 to-orange-50 border rounded-md px-3 py-1.5">
        <Flame className="h-5 w-5 mr-2 text-orange-500" />
        <div>
          <div className="text-sm font-semibold flex items-center">
            {streak} day streak
          </div>
          {streakRisk.atRisk && (
            <div className="text-xs text-red-500">
              {streakRisk.hoursRemaining}h left
            </div>
          )}
        </div>
      </div>
    );
  }

  // Standard variant
  return (
    <Card className="p-4">
      <div className="flex items-center mb-2">
        <Flame className="h-5 w-5 text-orange-500 mr-2" />
        <h3 className="text-lg font-medium">Streak</h3>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <div className="text-3xl font-bold">{streak}</div>
          <div className="text-sm text-muted-foreground">
            Best: {maxStreak} days
          </div>

          {streakRisk.atRisk && (
            <div className="text-xs text-red-500 mt-1 max-w-[180px]">
              Complete a task in {streakRisk.hoursRemaining}h to keep your
              streak!
            </div>
          )}
        </div>

        <div className="relative h-14 w-14">
          <ProgressCircle
            value={Math.min((streak / Math.max(maxStreak, 7)) * 100, 100)}
            size="lg"
            strokeWidth="medium"
            showValue={false}
            className="text-orange-500"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Flame
              className={cn(
                "h-6 w-6",
                streak > 0 ? "text-orange-500" : "text-gray-300"
              )}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
