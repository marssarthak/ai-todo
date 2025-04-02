import React, { useState, useEffect } from "react";
import { AlertCircle, Clock, Flame, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { checkStreakRisk } from "@/services/StreakService";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface StreakAlertProps {
  onDismiss?: () => void;
  className?: string;
  variant?: "inline" | "toast" | "banner";
  showHoursRemaining?: boolean;
}

export function StreakAlert({
  onDismiss,
  className,
  variant = "inline",
  showHoursRemaining = true,
}: StreakAlertProps) {
  const { user } = useAuth();
  const [riskData, setRiskData] = useState<{
    atRisk: boolean;
    hoursRemaining: number;
    message: string;
  } | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    const checkStreak = async () => {
      const result = await checkStreakRisk(user.id);
      setRiskData(result);
      setIsVisible(result.atRisk);
    };

    checkStreak();

    // Check again every 30 minutes
    const intervalId = setInterval(checkStreak, 30 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [user]);

  // Hide the alert if it's dismissed or not at risk
  if (dismissed || !isVisible || !riskData?.atRisk) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    if (onDismiss) {
      onDismiss();
    }
  };

  const getHoursText = (hours: number) => {
    if (hours <= 1) return "Less than 1 hour";
    return `${hours} hours`;
  };

  // Progress percentage for hours remaining
  const hoursPercentage = Math.max(
    0,
    Math.min(100, (riskData.hoursRemaining / 24) * 100)
  );

  // Different layouts based on variant
  if (variant === "toast") {
    return (
      <div
        className={cn(
          "fixed bottom-4 right-4 w-80 bg-red-50 dark:bg-red-950/30 rounded-lg shadow-lg p-4",
          className
        )}
      >
        <div className="flex justify-between items-start">
          <div className="flex gap-3">
            <div className="mt-0.5">
              <Flame className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <h4 className="font-medium text-red-700 dark:text-red-300">
                Streak at risk!
              </h4>
              <p className="text-sm text-red-600 dark:text-red-400">
                {riskData.message}
              </p>

              {showHoursRemaining && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-red-600 dark:text-red-400 mb-1">
                    <span>Time remaining:</span>
                    <span>{getHoursText(riskData.hoursRemaining)}</span>
                  </div>
                  <Progress
                    value={hoursPercentage}
                    className="h-1.5 bg-red-200 dark:bg-red-800"
                    indicatorClassName="bg-red-500"
                  />
                </div>
              )}
            </div>
          </div>

          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 rounded-full text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900"
            onClick={handleDismiss}
          >
            <X className="h-3 w-3" />
            <span className="sr-only">Dismiss</span>
          </Button>
        </div>
      </div>
    );
  }

  if (variant === "banner") {
    return (
      <div
        className={cn(
          "w-full bg-red-50 dark:bg-red-950/30 py-2 px-4",
          className
        )}
      >
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-red-500 shrink-0" />
            <span className="text-sm text-red-700 dark:text-red-300">
              {riskData.message}
            </span>
          </div>

          {showHoursRemaining && (
            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
              <Clock className="h-4 w-4" />
              <span>{getHoursText(riskData.hoursRemaining)} remaining</span>
            </div>
          )}

          <Button
            size="sm"
            variant="ghost"
            className="text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900"
            onClick={handleDismiss}
          >
            Dismiss
          </Button>
        </div>
      </div>
    );
  }

  // Default inline variant
  return (
    <Alert
      variant="destructive"
      className={cn(
        "border-red-300 bg-red-50 dark:bg-red-950/30 text-red-900 dark:text-red-300",
        className
      )}
    >
      <AlertCircle className="h-4 w-4 text-red-500" />
      <AlertTitle>Streak at risk!</AlertTitle>
      <AlertDescription className="mt-1">
        {riskData.message}

        {showHoursRemaining && (
          <div className="mt-2">
            <div className="flex justify-between text-xs mb-1">
              <span>Time remaining:</span>
              <span>{getHoursText(riskData.hoursRemaining)}</span>
            </div>
            <Progress
              value={hoursPercentage}
              className="h-1.5 bg-red-200 dark:bg-red-800"
              indicatorClassName="bg-red-500"
            />
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}
