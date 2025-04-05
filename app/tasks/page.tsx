"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { useWeb3Gamification } from "@/hooks/useWeb3Gamification";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AlertCircle, Medal, Award, Clock } from "lucide-react";

// Achievement Badge component tailored for blockchain achievements
const BlockchainAchievementBadge = ({
  achievement,
  size = "md",
}: {
  achievement: any;
  size?: "sm" | "md" | "lg";
}) => {
  const sizeClasses = {
    sm: "w-16 h-16 text-sm",
    md: "w-20 h-20 text-base",
    lg: "w-24 h-24 text-lg",
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`${sizeClasses[size]} relative`}>
            <div className="bg-primary/10 hover:bg-primary/20 rounded-lg flex items-center justify-center p-2 w-full h-full transition-colors">
              <Award className="text-primary" />
            </div>
            {achievement.unlocked && (
              <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-0.5">
                <CheckCircle2 className="h-3 w-3 text-white" />
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm font-medium">{achievement.name}</div>
          <div className="text-xs text-muted-foreground">
            {achievement.description}
          </div>
          <div className="text-xs mt-1">
            Progress: {achievement.progress}/{achievement.threshold}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Import CheckCircle2 icon
import { CheckCircle2 } from "lucide-react";

export default function TasksPage() {
  const { user } = useAuth();

  // Use the web3 gamification hook for all data
  const {
    userAddress,
    getAllUserAchievements,
    getUserGamificationData,
    getNextTierRequirements,
  } = useWeb3Gamification();

  // State for blockchain data
  const [gamificationData, setGamificationData] = useState<any>(null);
  const [onchainAchievements, setOnchainAchievements] = useState<any[]>([]);
  const [nextTierInfo, setNextTierInfo] = useState<any>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Motivational messages based on streak count
  const getMotivationalMessage = (streak: number) => {
    if (streak === 0)
      return "Ready to start a new streak? Complete a task today!";
    if (streak === 1) return "Great start! You've completed your first day.";
    if (streak < 5) return `You're on a ${streak}-day streak! Keep going!`;
    if (streak < 10)
      return `Impressive ${streak}-day streak! You're building momentum!`;
    if (streak < 20)
      return `Amazing ${streak}-day streak! You're showing real dedication!`;
    return `Incredible ${streak}-day streak! You're unstoppable!`;
  };

  // Load blockchain gamification data when wallet is connected
  useEffect(() => {
    async function loadBlockchainData() {
      if (!userAddress) {
        setIsLoadingData(false);
        return;
      }

      setIsLoadingData(true);

      try {
        // Get all blockchain data in parallel
        const [data, achievements, nextTier] = await Promise.all([
          getUserGamificationData(),
          getAllUserAchievements(),
          getNextTierRequirements(),
        ]);

        setGamificationData(data);

        // Filter to only include achievements with some progress
        const relevantAchievements = achievements
          .sort((a, b) => {
            // Prioritize unlocked achievements
            if (a.unlocked && !b.unlocked) return -1;
            if (!a.unlocked && b.unlocked) return 1;
            // Then sort by progress percentage
            const aProgress = a.progress / a.threshold;
            const bProgress = b.progress / b.threshold;
            return bProgress - aProgress;
          })
          .slice(0, 3); // Get top 3

        setOnchainAchievements(relevantAchievements);
        setNextTierInfo(nextTier);
      } catch (error) {
        console.error("Error loading blockchain gamification data:", error);
      } finally {
        setIsLoadingData(false);
      }
    }

    loadBlockchainData();
  }, [userAddress]);

  // Generate motivational message based on streak data
  const motivationalMessage = gamificationData
    ? getMotivationalMessage(gamificationData.streak)
    : "Complete tasks to build your streak!";

  return (
    <Container>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <PageHeader
          title="Tasks"
          description="Manage your tasks and stay productive"
          className="md:mb-0"
        />

        <div className="mt-4 md:mt-0 flex flex-col items-end">
          {isLoadingData ? (
            <Skeleton className="h-16 w-40" />
          ) : gamificationData ? (
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-xs text-muted-foreground">
                  Current Streak
                </div>
                <div className="text-2xl font-bold">
                  {gamificationData.streak}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground">Max Streak</div>
                <div className="text-2xl font-bold">
                  {gamificationData.maxStreak}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground">Tier</div>
                <div className="text-lg font-medium">
                  {gamificationData.tier}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-2 bg-muted p-2 rounded-md">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Connect wallet to track streaks
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Reputation Information */}
      {gamificationData && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6 flex items-center">
          <Medal className="h-5 w-5 mr-2 text-primary" />
          <div className="flex-1">
            <p className="text-sm font-medium">
              Reputation: {gamificationData.tier}
            </p>
            <p className="text-xs text-muted-foreground">
              You've completed {gamificationData.taskCount} tasks on the
              blockchain
            </p>
          </div>
          {nextTierInfo && nextTierInfo.tasksNeeded > 0 && (
            <div className="text-right">
              <p className="text-xs font-medium">
                Next tier: {nextTierInfo.nextTier}
              </p>
              <p className="text-xs text-muted-foreground">
                {nextTierInfo.tasksNeeded} more tasks needed
              </p>
            </div>
          )}
        </div>
      )}

      {/* Motivational message */}
      {motivationalMessage && !isLoadingData && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6">
          <p className="text-sm">{motivationalMessage}</p>
        </div>
      )}

      {/* Show wallet connection prompt if not connected */}
      {!userAddress && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Connect your wallet to access on-chain achievements and reputation.
          </AlertDescription>
        </Alert>
      )}

      {/* Recent achievements */}
      {isLoadingData ? (
        <div className="mb-6">
          <h3 className="text-sm font-medium mb-2">Achievements</h3>
          <div className="flex gap-2">
            <Skeleton className="w-16 h-16 rounded-lg" />
            <Skeleton className="w-16 h-16 rounded-lg" />
            <Skeleton className="w-16 h-16 rounded-lg" />
          </div>
        </div>
      ) : (
        onchainAchievements.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">Blockchain Achievements</h3>
              <Badge variant="outline">
                <a href="/profile/achievements" className="text-xs">
                  View All
                </a>
              </Badge>
            </div>
            <div className="flex gap-2">
              {onchainAchievements.map((achievement) => (
                <BlockchainAchievementBadge
                  key={achievement.id}
                  achievement={achievement}
                  size="sm"
                />
              ))}
            </div>
          </div>
        )
      )}
    </Container>
  );
}
