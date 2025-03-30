"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { clearData, loadData } from "@/lib/storage";
import { Task } from "@/types/task";

const TASKS_STORAGE_KEY = "ai_productivity_tasks"; // Make sure this matches the hook

export function LocalStorageDebug() {
  const [storedTasks, setStoredTasks] = useState<Task[] | null>(null);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    // Check availability on mount (client-side only)
    setIsAvailable(
      typeof window !== "undefined" && window.localStorage !== undefined
    );
    if (isAvailable) {
      setStoredTasks(loadData<Task[]>(TASKS_STORAGE_KEY));
    }
  }, [isAvailable]); // Re-run if isAvailable changes (though it shouldn't after mount)

  const handleRefresh = () => {
    if (isAvailable) {
      setStoredTasks(loadData<Task[]>(TASKS_STORAGE_KEY));
    }
  };

  const handleClear = () => {
    if (isAvailable) {
      if (
        confirm("Are you sure you want to clear all tasks from local storage?")
      ) {
        clearData(TASKS_STORAGE_KEY);
        setStoredTasks(null); // Clear state immediately
        window.location.reload(); // Reload to reflect changes in the main app state
      }
    }
  };

  // Only render this component in development
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-muted p-4 rounded-lg shadow-lg border z-50 max-w-sm w-full">
      <h4 className="text-sm font-semibold mb-2">LocalStorage Debug</h4>
      {isAvailable === null ? (
        <p className="text-xs text-muted-foreground">
          Checking availability...
        </p>
      ) : isAvailable ? (
        <div className="space-y-2">
          <p className="text-xs">
            Stored Tasks ({storedTasks ? storedTasks.length : 0}):
          </p>
          <pre className="text-xs bg-background p-2 rounded overflow-auto max-h-40">
            {JSON.stringify(storedTasks, null, 2) || "null"}
          </pre>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleRefresh}>
              Refresh View
            </Button>
            <Button size="sm" variant="destructive" onClick={handleClear}>
              Clear Storage
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-xs text-red-500">LocalStorage not available.</p>
      )}
    </div>
  );
}
