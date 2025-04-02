import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReputationScore } from "@/components/reputation/ReputationScore";
import { ReputationBadge } from "@/components/reputation/ReputationBadge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { getReputation } from "@/services/ReputationService";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink } from "lucide-react";

interface UserReputationCardProps {
  userId?: string; // Optional - if not provided, use the current user's ID
  showDetails?: boolean;
}

export function UserReputationCard({
  userId,
  showDetails = true,
}: UserReputationCardProps) {
  const { user } = useAuth();
  const [reputationScore, setReputationScore] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use provided userId or fall back to current user
  const targetUserId = userId || (user?.id as string);

  useEffect(() => {
    const fetchReputation = async () => {
      if (!targetUserId) return;

      try {
        setIsLoading(true);
        setError(null);

        const result = await getReputation(targetUserId);

        if (result.success && result.score !== undefined) {
          setReputationScore(result.score);
        } else {
          setError(result.error || "Failed to load reputation");
        }
      } catch (err) {
        console.error("Error fetching reputation:", err);
        setError("An unexpected error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchReputation();
  }, [targetUserId]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Reputation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || reputationScore === null) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Reputation</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {error || "Unable to load reputation data"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {showDetails ? (
        <ReputationScore score={reputationScore} />
      ) : (
        <>
          <CardHeader className="pb-2">
            <CardTitle>Reputation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <ReputationScore score={reputationScore} compact />
              {user && user.id === targetUserId && (
                <Button variant="outline" size="sm" className="text-xs" asChild>
                  <a href="/profile/reputation">
                    View Details
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </>
      )}
    </Card>
  );
}
