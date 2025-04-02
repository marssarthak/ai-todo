"use client";

import { Task, TaskPriority, TaskStatus } from "@/types/task";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { format, isPast } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Edit,
  Trash2,
  CalendarIcon,
  AlertTriangle,
  Loader2,
  ShieldCheckIcon,
} from "lucide-react";
import { VerificationStatus } from "@/components/blockchain/VerificationStatus";
import { retryVerification, verifyTask } from "@/services/VerificationService";

interface TaskCardProps {
  task: Task;
  isLoading: boolean;
  onToggleComplete: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

const priorityColors: Record<TaskPriority, string> = {
  high: "bg-red-500 hover:bg-red-600",
  medium: "bg-orange-500 hover:bg-orange-600",
  low: "bg-blue-500 hover:bg-blue-600",
};

const statusText: Record<TaskStatus, string> = {
  todo: "To Do",
  "in-progress": "In Progress",
  completed: "Completed",
};

export function TaskCard({
  task,
  isLoading,
  onToggleComplete,
  onEdit,
  onDelete,
}: TaskCardProps) {
  const isOverdue =
    task.deadline && isPast(task.deadline) && task.status !== "completed";

  // Handle verification of a completed task
  const handleVerify = async () => {
    if (task.status === "completed") {
      await verifyTask(task);
    }
  };

  // Handle retry for failed verification
  const handleRetryVerification = async () => {
    await retryVerification(task);
  };

  // Determine if we should show verification options
  const showVerification = task.status === "completed";
  const isVerified = task.metadata?.verified;
  const verificationFailed = task.metadata?.verificationStatus === "failed";

  return (
    <Card
      className={cn(
        "flex flex-col h-full relative",
        isLoading && "opacity-50 pointer-events-none"
      )}
    >
      {isLoading && (
        <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10 rounded-lg">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-semibold leading-none tracking-tight mr-2">
            {task.title}
          </CardTitle>
          <Badge
            className={cn(
              "text-xs text-white shrink-0",
              priorityColors[task.priority]
            )}
          >
            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
          </Badge>
        </div>
        {task.description && (
          <CardDescription className="text-sm text-muted-foreground mt-1">
            {task.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex-grow py-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center text-xs text-muted-foreground">
            <span
              className={cn("inline-block w-2 h-2 rounded-full mr-1.5", {
                "bg-gray-400": task.status === "todo",
                "bg-yellow-400": task.status === "in-progress",
                "bg-green-500": task.status === "completed",
              })}
            ></span>
            {statusText[task.status]}
          </div>

          {/* Show verification status if task is completed */}
          {showVerification && <VerificationStatus task={task} size="sm" />}
        </div>
        {task.deadline && (
          <div
            className={cn(
              "flex items-center text-xs",
              isOverdue ? "text-red-600 font-medium" : "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
            <span>Deadline: {format(task.deadline, "PPP")}</span>
            {isOverdue && <AlertTriangle className="ml-1.5 h-3.5 w-3.5" />}
          </div>
        )}
        <div className="text-xs text-muted-foreground">
          Created: {format(task.createdAt, "PPp")}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center pt-3 pb-4 px-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id={`complete-${task.id}`}
            checked={task.status === "completed"}
            onCheckedChange={() => onToggleComplete(task.id)}
            disabled={isLoading}
            aria-label={`Mark ${task.title} as ${
              task.status === "completed" ? "incomplete" : "complete"
            }`}
          />
          <label
            htmlFor={`complete-${task.id}`}
            className={cn(
              "text-sm font-medium leading-none",
              isLoading
                ? "cursor-not-allowed opacity-70"
                : "peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            )}
          >
            Done
          </label>
        </div>

        <div className="flex items-center space-x-1">
          {/* Verification Button */}
          {showVerification && !isVerified && !isLoading && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 flex items-center text-xs"
              onClick={
                verificationFailed ? handleRetryVerification : handleVerify
              }
              disabled={task.metadata?.verificationStatus === "pending"}
            >
              <ShieldCheckIcon className="h-3 w-3 mr-1" />
              {verificationFailed ? "Retry Verify" : "Verify"}
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onEdit(task)}
            disabled={isLoading}
            aria-label={`Edit task ${task.title}`}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-red-500 hover:text-red-600"
            onClick={() => onDelete(task.id)}
            disabled={isLoading}
            aria-label={`Delete task ${task.title}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
