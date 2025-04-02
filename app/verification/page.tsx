"use client";

import { useEffect, useState } from "react";
import { Task } from "@/types/task";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getTasks } from "@/services/TaskService";
import { TransactionStatus } from "@/components/blockchain/TransactionStatus";
import { VerificationStatus } from "@/components/blockchain/VerificationStatus";
import { retryVerification } from "@/services/VerificationService";
import { NetworkType } from "@/lib/blockchain";
import { format } from "date-fns";
import { Loader2, Download } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function VerificationHistoryPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingTaskIds, setLoadingTaskIds] = useState<Set<string>>(new Set());
  const { user } = useAuth();

  useEffect(() => {
    const fetchTasks = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        const allTasks = await getTasks();

        // Filter to only include tasks with verification metadata
        const verifiedTasks = allTasks.filter(
          (task) => task.metadata?.verified || task.metadata?.verificationStatus
        );

        // Ensure dates are Date objects
        const tasksWithDates = verifiedTasks.map((t) => ({
          ...t,
          createdAt: new Date(t.createdAt),
          updatedAt: new Date(t.updatedAt),
          deadline: t.deadline ? new Date(t.deadline) : undefined,
          metadata: {
            ...t.metadata,
            verifiedAt: t.metadata?.verifiedAt
              ? new Date(t.metadata.verifiedAt)
              : undefined,
          },
        }));

        // Sort by verification date, newest first
        tasksWithDates.sort((a, b) => {
          const dateA = a.metadata?.verifiedAt || a.updatedAt;
          const dateB = b.metadata?.verifiedAt || b.updatedAt;
          return dateB.getTime() - dateA.getTime();
        });

        setTasks(tasksWithDates);
      } catch (error) {
        console.error("Failed to fetch tasks:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, [user]);

  const handleRetry = async (task: Task) => {
    setLoadingTaskIds((prev) => new Set(prev).add(task.id));
    try {
      await retryVerification(task);
      // Refresh the tasks list
      const allTasks = await getTasks();
      const verifiedTasks = allTasks.filter(
        (task) => task.metadata?.verified || task.metadata?.verificationStatus
      );
      setTasks(verifiedTasks);
    } catch (error) {
      console.error("Failed to retry verification:", error);
    } finally {
      setLoadingTaskIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(task.id);
        return newSet;
      });
    }
  };

  const exportVerificationData = () => {
    const verificationData = tasks.map((task) => ({
      id: task.id,
      title: task.title,
      status: task.status,
      verificationStatus: task.metadata?.verificationStatus || "unknown",
      verified: task.metadata?.verified || false,
      transactionHash: task.metadata?.transactionHash || "",
      taskHash: task.metadata?.taskHash || "",
      verifiedAt: task.metadata?.verifiedAt
        ? format(new Date(task.metadata.verifiedAt), "yyyy-MM-dd HH:mm:ss")
        : "",
      completedAt: format(task.updatedAt, "yyyy-MM-dd HH:mm:ss"),
    }));

    const dataStr = JSON.stringify(verificationData, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const exportFileDefaultName = `verification-history-${format(
      new Date(),
      "yyyy-MM-dd"
    )}.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
    linkElement.remove();
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Verification History</h1>
          <p className="text-muted-foreground mt-1">
            View the blockchain verification status of your completed tasks
          </p>
        </div>

        <Button
          onClick={exportVerificationData}
          disabled={tasks.length === 0 || isLoading}
          className="flex items-center"
        >
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : tasks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-40">
            <p className="text-muted-foreground">No verified tasks found</p>
            <p className="text-sm text-muted-foreground mt-2">
              Complete tasks and verify them to see them here
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {tasks.map((task) => (
            <Card key={task.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">{task.title}</CardTitle>
                  <VerificationStatus task={task} size="md" />
                </div>
                <CardDescription>
                  Completed on {format(task.updatedAt, "PPP 'at' p")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TransactionStatus
                  task={task}
                  networkType={NetworkType.Base}
                  onRetry={() => handleRetry(task)}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
