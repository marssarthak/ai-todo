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
} from "@/components/ui/card";
import {
  getReputation,
  getUserMilestones,
  ReputationMilestone,
} from "@/services/ReputationService";
import { ReputationScore } from "@/components/reputation/ReputationScore";
import { ReputationHistory } from "@/components/reputation/ReputationHistory";
import { UserReputationCard } from "@/components/profile/UserReputationCard";
import { Trophy, Star, Calendar, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";

export default function ReputationPage() {
  const { user } = useAuth();
  const [score, setScore] = useState<number>(0);
  const [milestones, setMilestones] = useState<ReputationMilestone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReputationData = async () => {
      if (!user) return;

      try {
        setIsLoading(true);

        // Get user reputation
        const reputationResult = await getReputation(user.id);

        if (reputationResult.success && reputationResult.score !== undefined) {
          setScore(reputationResult.score);

          // Get milestones based on score
          const userMilestones = getUserMilestones(reputationResult.score);
          setMilestones(userMilestones);
        } else {
          setError(reputationResult.error || "Failed to load reputation data");
        }
      } catch (err) {
        console.error("Error fetching reputation data:", err);
        setError("An unexpected error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchReputationData();
  }, [user]);

  if (!user) {
    return (
      <Container>
        <PageHeader title="Reputation" description="Not logged in" />
        <div className="py-8 text-center text-muted-foreground">
          Please log in to view your reputation.
        </div>
      </Container>
    );
  }

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

  return (
    <Container>
      <PageHeader
        title="Your Reputation"
        description="Track your productivity achievements and reputation history"
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
        <div className="md:col-span-2 lg:col-span-1">
          <UserReputationCard showDetails={true} />
        </div>

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
            <div className="space-y-3">
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

        <Card>
          <CardHeader>
            <div className="flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-blue-500" />
              <CardTitle>Reputation Stats</CardTitle>
            </div>
            <CardDescription>Your productivity statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-primary/10 rounded-lg p-3">
                <div className="text-xs text-muted-foreground mb-1">
                  Total Score
                </div>
                <div className="text-2xl font-bold">{score}</div>
              </div>
              <div className="bg-primary/10 rounded-lg p-3">
                <div className="text-xs text-muted-foreground mb-1">
                  Verified Tasks
                </div>
                <div className="text-2xl font-bold">{score}</div>
              </div>
              <div className="bg-primary/10 rounded-lg p-3">
                <div className="text-xs text-muted-foreground mb-1">
                  Milestones
                </div>
                <div className="text-2xl font-bold">{completedMilestones}</div>
              </div>
              <div className="bg-primary/10 rounded-lg p-3">
                <div className="text-xs text-muted-foreground mb-1">
                  Longest Streak
                </div>
                <div className="text-2xl font-bold">5</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="history" className="mb-6">
        <TabsList>
          <TabsTrigger value="history">Reputation History</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
        </TabsList>
        <TabsContent value="history" className="mt-4">
          <ReputationHistory limit={10} />
        </TabsContent>
        <TabsContent value="milestones" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Star className="h-5 w-5 mr-2 text-yellow-500" />
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
                      Required score: {milestone.threshold}
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
