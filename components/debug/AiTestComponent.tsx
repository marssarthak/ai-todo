"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Terminal, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function AiTestComponent() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTestApi = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch("/api/ai/test"); // Call the test endpoint
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { details: response.statusText };
        }
        throw new Error(
          errorData?.details ||
            `API request failed with status ${response.status}`
        );
      }
      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error("AI Test API call failed:", err);
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Only render in development
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div className="mt-6 p-4 border rounded-lg bg-muted/50">
      <h4 className="text-sm font-semibold mb-2">AI Service Test (Dev Only)</h4>
      <Button onClick={handleTestApi} disabled={isLoading} size="sm">
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Terminal className="mr-2 h-4 w-4" />
        )}
        Test /api/ai/test
      </Button>

      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <div className="mt-4 space-y-2 text-sm">
          <Alert variant="default">
            <Terminal className="h-4 w-4" />
            <AlertTitle>API Response</AlertTitle>
            <AlertDescription>
              <pre className="mt-2 w-full rounded-md bg-background p-4 overflow-x-auto">
                <code>{JSON.stringify(result, null, 2)}</code>
              </pre>
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
}
