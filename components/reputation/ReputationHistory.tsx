import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ReputationBadge } from "./ReputationBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ChevronUp, Check, FileText } from "lucide-react";
import {
  getReputationHistory,
  ReputationHistory as ReputationHistoryType,
} from "@/services/ReputationService";
import { useAuth } from "@/context/AuthContext";

interface ReputationHistoryProps {
  limit?: number;
}

export function ReputationHistory({ limit = 5 }: ReputationHistoryProps) {
  const [history, setHistory] = useState<ReputationHistoryType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        setError(null);

        const result = await getReputationHistory(user.id);

        if (result.success && result.history) {
          setHistory(result.history.slice(0, limit));
        } else {
          setError(result.error || "Failed to load reputation history");
        }
      } catch (err) {
        console.error("Error fetching reputation history:", err);
        setError("An unexpected error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [user, limit]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Reputation History</CardTitle>
          <CardDescription>Your recent reputation changes</CardDescription>
        </CardHeader>
        <CardContent>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-start space-x-4 mb-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Reputation History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Failed to load reputation history: {error}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Reputation History</CardTitle>
          <CardDescription>Your recent reputation changes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-muted-foreground">No reputation history yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Complete and verify tasks to build your reputation
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reputation History</CardTitle>
        <CardDescription>Your recent reputation changes</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {history.map((item) => (
            <div
              key={item.id}
              className="flex items-start pb-4 border-b last:border-b-0 last:pb-0"
            >
              <div
                className={`h-10 w-10 rounded-full flex items-center justify-center mr-4 ${
                  item.isLevelUp
                    ? "bg-green-100 text-green-600"
                    : "bg-blue-100 text-blue-600"
                }`}
              >
                {item.isLevelUp ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <Check className="h-5 w-5" />
                )}
              </div>

              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">
                      {item.isLevelUp
                        ? `Level up to ${item.level}!`
                        : `Earned ${item.change} points`}
                    </p>

                    {item.taskTitle && (
                      <p className="text-sm text-muted-foreground flex items-center mt-1">
                        <FileText className="h-3 w-3 mr-1 inline" />
                        Task: {item.taskTitle}
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      {format(item.createdAt, "MMM d, yyyy")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(item.createdAt, "h:mm a")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2">
                  <div className="text-sm flex items-center">
                    <span className="text-muted-foreground mr-1">Score:</span>
                    <span className="font-medium">
                      {item.previousScore} → {item.score}
                    </span>
                  </div>

                  <ReputationBadge level={item.level} size="sm" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
