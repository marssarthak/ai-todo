import React from "react";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ReputationBadge } from "./ReputationBadge";
import {
  getReputationLevel,
  getProgressToNextLevel,
  REPUTATION_LEVELS,
} from "@/services/ReputationService";
import { ChevronUp, ChevronRight } from "lucide-react";

interface ReputationScoreProps {
  score: number;
  compact?: boolean;
  showNextLevel?: boolean;
}

export function ReputationScore({
  score,
  compact = false,
  showNextLevel = true,
}: ReputationScoreProps) {
  const currentLevel = getReputationLevel(score);
  const progress = getProgressToNextLevel(score);
  const currentLevelIndex = REPUTATION_LEVELS.findIndex(
    (level) => level.name === currentLevel.name
  );
  const isMaxLevel = currentLevelIndex === REPUTATION_LEVELS.length - 1;

  // Determine next level
  const nextLevel = isMaxLevel
    ? null
    : REPUTATION_LEVELS[currentLevelIndex + 1];

  // Calculate points needed for next level
  const pointsNeeded = nextLevel ? nextLevel.threshold - score : 0;

  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        <ReputationBadge
          level={currentLevel.name}
          size="sm"
          showTooltip={false}
        />
        <span className="text-sm font-medium">{score} points</span>
        {showNextLevel && nextLevel && (
          <div className="flex items-center text-xs text-muted-foreground">
            <ChevronRight className="h-3 w-3" />
            <span>
              {pointsNeeded} to {nextLevel.name}
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">Reputation</CardTitle>
          <ReputationBadge level={currentLevel.name} />
        </div>
        <CardDescription>
          Your productivity reputation based on verified tasks
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-2">
          <div className="text-2xl font-bold">{score} points</div>
          {nextLevel && (
            <div className="text-sm text-muted-foreground flex items-center">
              <ChevronUp className="h-4 w-4 mr-1" />
              {pointsNeeded} more to {nextLevel.name}
            </div>
          )}
        </div>

        {nextLevel ? (
          <>
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between mt-1 text-xs text-muted-foreground">
              <span>{currentLevel.name}</span>
              <span>{nextLevel.name}</span>
            </div>
          </>
        ) : (
          <div className="text-sm mt-2 text-center font-medium text-primary">
            Maximum level achieved!
          </div>
        )}
      </CardContent>
    </Card>
  );
}
