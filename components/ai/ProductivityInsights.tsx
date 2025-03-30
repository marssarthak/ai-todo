"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Lightbulb, AlertTriangle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface AiInsights {
  insights: string;
}

export function ProductivityInsights() {
  const [isLoading, setIsLoading] = useState(false);
  const [insightsData, setInsightsData] = useState<AiInsights | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = async () => {
    setIsLoading(true);
    setError(null);
    setInsightsData(null);
    try {
      const response = await fetch("/api/ai/insights"); // Call the insights endpoint
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {}
        throw new Error(
          errorData?.details || `API error: ${response.statusText}`
        );
      }
      const data: AiInsights = await response.json();
      setInsightsData(data);
    } catch (err) {
      console.error("Failed to fetch insights:", err);
      setError(err instanceof Error ? err.message : "Could not load insights.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch insights on initial mount
  useEffect(() => {
    fetchInsights();
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-lg font-semibold flex items-center">
            <Lightbulb className="mr-2 h-5 w-5 text-yellow-500" />
            AI Productivity Insights
          </CardTitle>
          <CardDescription>
            Suggestions based on your recent activity.
          </CardDescription>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={fetchInsights}
          disabled={isLoading}
          aria-label="Refresh Insights"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading && !error && (
          <div className="flex items-center justify-center min-h-[100px]">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {error && (
          <Alert variant="destructive" className="text-sm">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error Loading Insights</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {!isLoading && !error && insightsData && (
          <div className="text-sm text-muted-foreground whitespace-pre-line">
            {insightsData.insights}
          </div>
        )}
        {!isLoading && !error && !insightsData && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No insights available currently.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
