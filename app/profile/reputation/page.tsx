"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { useWeb3Gamification } from "@/hooks/useWeb3Gamification";
import {
  Trophy,
  Star,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Medal,
  Shield,
  Award,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { format, fromUnixTime } from "date-fns";

// Define tiers with their thresholds, colors, and icons
const reputationTiers = [
  {
    name: "Beginner",
    threshold: 0,
    color: "bg-blue-500",
    textColor: "text-blue-500",
    icon: <Shield className="h-5 w-5" />,
  },
  {
    name: "Intermediate",
    threshold: 10,
    color: "bg-green-500",
    textColor: "text-green-500",
    icon: <Award className="h-5 w-5" />,
  },
  {
    name: "Advanced",
    threshold: 30,
    color: "bg-yellow-500",
    textColor: "text-yellow-500",
    icon: <Star className="h-5 w-5" />,
  },
  {
    name: "Expert",
    threshold: 60,
    color: "bg-orange-500",
    textColor: "text-orange-500",
    icon: <Medal className="h-5 w-5" />,
  },
  {
    name: "Master",
    threshold: 100,
    color: "bg-purple-500",
    textColor: "text-purple-500",
    icon: <Trophy className="h-5 w-5" />,
  },
];

// Define blockchain milestones
const reputationMilestones = [
  {
    id: 1,
    name: "First Task",
    description: "Complete your first task",
    threshold: 1,
    reward: "Beginner badge",
  },
  {
    id: 2,
    name: "Getting Started",
    description: "Complete 5 tasks",
    threshold: 5,
    reward: "5% reputation boost",
  },
  {
    id: 3,
    name: "Consistent",
    description: "Complete 10 tasks",
    threshold: 10,
    reward: "Intermediate badge",
  },
  {
    id: 4,
    name: "Dedicated",
    description: "Complete 25 tasks",
    threshold: 25,
    reward: "Profile highlight",
  },
  {
    id: 5,
    name: "Professional",
    description: "Complete 50 tasks",
    threshold: 50,
    reward: "Advanced badge",
  },
  {
    id: 6,
    name: "Expert",
    description: "Complete 75 tasks",
    threshold: 75,
    reward: "Expert badge",
  },
  {
    id: 7,
    name: "Master",
    description: "Complete 100 tasks",
    threshold: 100,
    reward: "Master badge",
  },
  {
    id: 8,
    name: "Legend",
    description: "Complete 150 tasks",
    threshold: 150,
    reward: "Special profile theme",
  },
];

export default function ReputationPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use web3 gamification hook
  const {
    userAddress,
    getUserGamificationData,
    getReputationScore,
    getReputationTier,
    getNextTierRequirements,
    getStreakData,
  } = useWeb3Gamification();

  // Blockchain data states
  const [gamificationData, setGamificationData] = useState<any>(null);
  const [reputationScore, setReputationScore] = useState<number>(0);
  const [reputationTier, setReputationTier] = useState<string>("");
  const [nextTierInfo, setNextTierInfo] = useState<any>(null);
  const [streakData, setStreakData] = useState<any>(null);
  const [milestones, setMilestones] = useState<any[]>([]);

  // Load blockchain data
  useEffect(() => {
    const fetchBlockchainData = async () => {
      if (!userAddress) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Get all blockchain data in parallel
        const [userData, score, tier, nextTier, streak] = await Promise.all([
          getUserGamificationData(),
          getReputationScore(),
          getReputationTier(),
          getNextTierRequirements(),
          getStreakData(),
        ]);

        setGamificationData(userData);
        setReputationScore(score);
        setReputationTier(tier);
        setNextTierInfo(nextTier);
        setStreakData(streak);

        // Calculate achieved milestones based on task count
        const taskCount = userData.taskCount;
        const achievedMilestones = reputationMilestones.map((milestone) => ({
          ...milestone,
          achieved: taskCount >= milestone.threshold,
        }));

        setMilestones(achievedMilestones);
      } catch (err) {
        console.error("Error fetching blockchain reputation data:", err);
        setError("Failed to load reputation data from blockchain");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlockchainData();
  }, [userAddress]);

  if (isLoading) {
    return (
      <Container>
        <PageHeader
          title="Reputation"
          description="Loading your productivity reputation..."
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
          title="Reputation"
          description="Connect your wallet to view your blockchain reputation"
        />
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Connect your wallet to access on-chain reputation data.
          </AlertDescription>
        </Alert>
        <div className="py-8 text-center text-muted-foreground">
          Your reputation data will appear here once you connect your wallet.
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <PageHeader
          title="Reputation"
          description="Error loading reputation data"
        />
        <div className="py-8 text-center text-muted-foreground">{error}</div>
      </Container>
    );
  }

  // Calculate milestone completion percentage
  const completedMilestones = milestones.filter((m) => m.achieved).length;
  const totalMilestones = milestones.length;
  const milestoneCompletionPercentage = Math.round(
    (completedMilestones / totalMilestones) * 100
  );

  // Find current tier details
  const currentTierIndex = reputationTiers.findIndex(
    (tier) => tier.name === reputationTier
  );
  // Ensure we always have a valid tier by defaulting to the first tier (Beginner)
  const currentTier =
    currentTierIndex >= 0
      ? reputationTiers[currentTierIndex]
      : reputationTiers[0];
  const nextTierIndex =
    currentTierIndex >= 0 && currentTierIndex < reputationTiers.length - 1
      ? currentTierIndex + 1
      : currentTierIndex >= 0
      ? currentTierIndex
      : 0;
  const nextTier = reputationTiers[nextTierIndex];

  return (
    <Container>
      <PageHeader
        title="Your Reputation"
        description="Track your blockchain productivity reputation"
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
        {/* Reputation Card */}
        <Card className="md:col-span-2 lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Medal className="h-5 w-5 mr-2 text-primary" />
                <CardTitle>Reputation</CardTitle>
              </div>
              <Badge
                className={`${currentTier?.color || "bg-blue-500"} text-white`}
              >
                {reputationTier || "Beginner"}
              </Badge>
            </div>
            <CardDescription>
              Your blockchain productivity status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center justify-center">
              <div className="relative w-36 h-36 flex items-center justify-center">
                <div className="absolute inset-0">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      strokeLinecap="round"
                      className="text-muted stroke-muted-foreground/15"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray="283"
                      strokeDashoffset={
                        283 - (283 * Math.min(100, reputationScore)) / 100
                      }
                      className={currentTier?.textColor || "text-primary"}
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                </div>
                <div className="flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold">{reputationScore}</span>
                  <span className="text-xs text-muted-foreground">
                    Rep. Points
                  </span>
                </div>
              </div>

              <div className="mt-2 flex items-center">
                <div
                  className={`mr-2 ${
                    currentTier?.textColor || "text-blue-500"
                  }`}
                >
                  {currentTier?.icon || <Shield className="h-5 w-5" />}
                </div>
                <span className="font-semibold">
                  {reputationTier || "Beginner"}
                </span>
              </div>
            </div>

            {nextTierInfo &&
              nextTierInfo.tasksNeeded > 0 &&
              gamificationData && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center">
                      <div
                        className={currentTier?.textColor || "text-blue-500"}
                      >
                        {currentTier?.icon || (
                          <Shield className="h-4 w-4 mr-1" />
                        )}
                      </div>
                      <span className="text-sm font-medium">
                        {reputationTier || "Beginner"}
                      </span>
                    </div>
                    <div className="h-6 border-r border-muted-foreground/20"></div>
                    <div className="flex items-center">
                      <span className="text-sm font-medium mr-1">
                        {nextTierInfo.nextTier}
                      </span>
                      {nextTier?.icon || (
                        <Award className="h-4 w-4 ml-1 text-green-500" />
                      )}
                    </div>
                  </div>
                  <Progress
                    value={
                      ((gamificationData.taskCount || 0) /
                        ((gamificationData.taskCount || 0) +
                          nextTierInfo.tasksNeeded)) *
                      100
                    }
                    className="h-2 mb-2"
                  />
                  <p className="text-xs text-center text-muted-foreground">
                    {nextTierInfo.tasksNeeded} more tasks needed for next tier
                  </p>
                </div>
              )}
          </CardContent>
        </Card>

        {/* Milestones Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center">
              <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
              <CardTitle>Milestones</CardTitle>
            </div>
            <CardDescription>Your reputation achievements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="flex justify-between mb-1 text-sm">
                <span>
                  {completedMilestones} of {totalMilestones} completed
                </span>
                <span>{milestoneCompletionPercentage}%</span>
              </div>
              <Progress value={milestoneCompletionPercentage} className="h-2" />
            </div>
            <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2">
              {milestones.map((milestone) => (
                <div key={milestone.id} className="flex items-start">
                  <div
                    className={`rounded-full p-1.5 mr-3 ${
                      milestone.achieved
                        ? "bg-green-100 text-green-600"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">{milestone.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {milestone.description}
                    </div>
                    {milestone.reward && (
                      <div className="text-xs text-primary mt-0.5">
                        Reward: {milestone.reward}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Stats Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-blue-500" />
              <CardTitle>Reputation Stats</CardTitle>
            </div>
            <CardDescription>Your blockchain statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-primary/10 rounded-lg p-3">
                <div className="text-xs text-muted-foreground mb-1">
                  Total Tasks
                </div>
                <div className="text-2xl font-bold">
                  {gamificationData?.taskCount || 0}
                </div>
              </div>
              <div className="bg-primary/10 rounded-lg p-3">
                <div className="text-xs text-muted-foreground mb-1">
                  Current Streak
                </div>
                <div className="text-2xl font-bold">
                  {gamificationData?.streak || 0}
                </div>
              </div>
              <div className="bg-primary/10 rounded-lg p-3">
                <div className="text-xs text-muted-foreground mb-1">
                  Milestones
                </div>
                <div className="text-2xl font-bold">{completedMilestones}</div>
              </div>
              <div className="bg-primary/10 rounded-lg p-3">
                <div className="text-xs text-muted-foreground mb-1">
                  Max Streak
                </div>
                <div className="text-2xl font-bold">
                  {gamificationData?.maxStreak || 0}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tiers" className="mb-6">
        <TabsList>
          <TabsTrigger value="tiers">Reputation Tiers</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
        </TabsList>

        {/* Tiers Tab */}
        <TabsContent value="tiers" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Star className="h-5 w-5 mr-2 text-yellow-500" />
                Reputation Tier System
              </CardTitle>
              <CardDescription>
                Complete more tasks to advance through reputation tiers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {reputationTiers.map((tier, index) => {
                  const isCurrentTier = tier.name === reputationTier;
                  const nextTierThreshold =
                    index < reputationTiers.length - 1
                      ? reputationTiers[index + 1]?.threshold
                      : null;

                  return (
                    <div
                      key={tier.name}
                      className={`relative rounded-lg p-4 ${
                        isCurrentTier
                          ? `border-2 border-${tier.color.replace(
                              "bg-",
                              ""
                            )}/50 bg-${tier.color.replace("bg-", "")}/5`
                          : "border border-muted"
                      }`}
                    >
                      {isCurrentTier && (
                        <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs font-medium">
                          Current
                        </div>
                      )}
                      <div className="flex items-center">
                        <div
                          className={`p-2 rounded-full ${tier.color}/20 mr-3`}
                        >
                          <div className={tier.textColor}>{tier.icon}</div>
                        </div>
                        <div>
                          <div className="font-bold">{tier.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {index === 0
                              ? "Starting tier"
                              : `Requires ${tier.threshold} tasks`}
                          </div>
                        </div>
                      </div>

                      {nextTierThreshold && (
                        <div className="mt-3 text-xs text-muted-foreground flex items-center">
                          <span className="font-medium mr-2">Task Range:</span>
                          <span>
                            {tier.threshold}{" "}
                            {index < reputationTiers.length - 1
                              ? `- ${nextTierThreshold - 1}`
                              : "+"}
                          </span>
                        </div>
                      )}

                      {isCurrentTier && gamificationData && nextTierInfo && (
                        <div className="mt-3">
                          <div className="flex justify-between text-xs mb-1">
                            <span>Progress to {nextTierInfo.nextTier}</span>
                            <span>
                              {gamificationData.taskCount || 0}/
                              {nextTierThreshold || tier.threshold + 10}
                            </span>
                          </div>
                          <Progress
                            value={
                              ((gamificationData.taskCount || 0) /
                                (nextTierThreshold || tier.threshold + 10)) *
                              100
                            }
                            className="h-1"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Milestones Tab */}
        <TabsContent value="milestones" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
                All Milestones
              </CardTitle>
              <CardDescription>
                Detailed view of all reputation milestones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {milestones.map((milestone) => (
                  <div
                    key={milestone.id}
                    className={`border-l-4 pl-4 ${
                      milestone.achieved
                        ? "border-green-500"
                        : "border-gray-200"
                    }`}
                  >
                    <div className="font-semibold flex items-center">
                      {milestone.name}
                      {milestone.achieved && (
                        <span className="ml-2 text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">
                          Achieved
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {milestone.description}
                    </div>
                    <div className="text-sm mt-1">
                      Required tasks: {milestone.threshold}
                    </div>
                    {milestone.reward && (
                      <div className="text-sm text-primary mt-1">
                        Reward: {milestone.reward}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </Container>
  );
}
