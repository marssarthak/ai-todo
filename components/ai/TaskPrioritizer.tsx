"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, Check, X, AlertTriangle } from "lucide-react";
import { Task, TaskPriority } from "@/types/task";
import { PrioritizationResult } from "@/services/AIService"; // Import result type
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

interface TaskPrioritizerProps {
  // Pass relevant task data needed for the prompt
  taskData: {
    title: string;
    description?: string;
    deadline?: Date;
    currentPriority?: TaskPriority;
  };
  // Callback to apply the suggested priority to the parent form
  onSuggestionAccept: (priority: TaskPriority) => void;
  // Optional: Callback when suggestion is ignored
  onSuggestionIgnore?: () => void;
}

export function TaskPrioritizer({
  taskData,
  onSuggestionAccept,
  onSuggestionIgnore,
}: TaskPrioritizerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<PrioritizationResult | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [showSuggestion, setShowSuggestion] = useState(false); // Control visibility

  const getSuggestion = async () => {
    setIsLoading(true);
    setError(null);
    setSuggestion(null);
    setShowSuggestion(false); // Hide previous suggestion if any

    // Basic check: Don't call AI without a title
    if (!taskData.title?.trim()) {
      setError("Please enter a title before getting a suggestion.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/ai/prioritize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...taskData,
          // Ensure deadline is sent in a consistent format (ISO string)
          deadline:
            taskData.deadline instanceof Date
              ? taskData.deadline.toISOString()
              : undefined,
        }),
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {}
        throw new Error(
          errorData?.details || `API error: ${response.statusText}`
        );
      }

      const result: PrioritizationResult = await response.json();
      setSuggestion(result);
      setShowSuggestion(true); // Show the suggestion box
    } catch (err) {
      console.error("Failed to get priority suggestion:", err);
      const message =
        err instanceof Error ? err.message : "Could not get suggestion.";
      setError(message);
      setShowSuggestion(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = () => {
    if (suggestion) {
      onSuggestionAccept(suggestion.priority);
      setShowSuggestion(false); // Hide after accepting
      setSuggestion(null);
    }
  };

  const handleIgnore = () => {
    setShowSuggestion(false); // Just hide it
    setSuggestion(null);
    onSuggestionIgnore?.();
  };

  return (
    <div className="space-y-2">
      <Button
        type="button" // Prevent form submission
        variant="outline"
        size="sm"
        onClick={getSuggestion}
        disabled={isLoading}
        className="w-full md:w-auto"
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="mr-2 h-4 w-4" />
        )}
        Get AI Priority Suggestion
      </Button>

      {error && (
        <Alert variant="destructive" className="text-xs">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Suggestion Display */}
      {showSuggestion && suggestion && (
        <div
          className={cn(
            "p-3 border rounded-md bg-primary/10 border-primary/20 relative",
            suggestion.priority === "high" && "bg-red-500/10 border-red-500/20",
            suggestion.priority === "medium" &&
              "bg-orange-500/10 border-orange-500/20",
            suggestion.priority === "low" && "bg-blue-500/10 border-blue-500/20"
          )}
        >
          <p className="text-sm font-medium mb-1">
            AI Suggests:{" "}
            <span className="font-bold uppercase">{suggestion.priority}</span>
          </p>
          <p className="text-xs text-muted-foreground mb-2 italic">
            Reason: {suggestion.reasoning}
          </p>
          <div className="flex gap-2 justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-muted-foreground hover:bg-muted/50"
              onClick={handleIgnore}
              title="Ignore Suggestion"
            >
              <X className="h-4 w-4" />
            </Button>
            <Button
              variant="default"
              size="sm"
              className="h-7 px-2"
              onClick={handleAccept}
              title="Accept Suggestion"
            >
              <Check className="h-4 w-4" /> Accept
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
