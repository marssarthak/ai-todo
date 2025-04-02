import { Task, VerificationMetadata } from "@/types/task";
import { ethers } from "ethers";
import { verifyTaskOnChain, isTaskVerified } from "@/lib/blockchain";
import { updateTask } from "./TaskService";
import { UpdateTaskData } from "@/hooks/useTaskManager";
import { processReputationAfterVerification } from "./ReputationService";
import { createClient } from "@/lib/supabase/client";

/**
 * Formats a task into a string for hashing
 * Format: taskId|title|description|status|userId|timestamp
 */
export function formatTaskForHashing(task: Task): string {
  return `${task.id}|${task.title}|${task.description || ""}|${task.status}|${
    task.userId || ""
  }|${task.updatedAt.getTime()}`;
}

/**
 * Generates a hash for a task
 */
export function generateTaskHash(task: Task): string {
  const taskString = formatTaskForHashing(task);
  return ethers.keccak256(ethers.toUtf8Bytes(taskString));
}

/**
 * Verifies a completed task on the blockchain
 */
export async function verifyTask(task: Task): Promise<{
  success: boolean;
  transactionHash?: string;
  taskHash?: string;
  error?: string;
  reputationUpdate?: {
    newScore: number;
    previousScore: number;
    newLevel: string;
    isLevelUp: boolean;
  };
}> {
  try {
    if (task.status !== "completed") {
      return {
        success: false,
        error: "Only completed tasks can be verified",
      };
    }

    const taskString = formatTaskForHashing(task);
    const result = await verifyTaskOnChain(taskString);

    if (result.success) {
      // Create verification metadata
      const verificationMetadata: VerificationMetadata = {
        verified: true,
        transactionHash: result.hash,
        taskHash: result.taskHash,
        verifiedAt: new Date(),
        verificationStatus: "verified",
      };

      // Update the task in Supabase with the transaction hash
      const updates: UpdateTaskData = {
        metadata: verificationMetadata,
      };

      await updateTask(task.id, updates);

      // Process reputation update if user ID is available in the task
      if (task.userId) {
        // Get the current user
        const supabase = createClient();
        const { data: userData } = await supabase.auth.getUser();

        if (userData?.user) {
          const reputationUpdate = await processReputationAfterVerification(
            userData.user,
            task.id,
            task.title
          );

          if (
            reputationUpdate.success &&
            reputationUpdate.newScore !== undefined
          ) {
            return {
              success: true,
              transactionHash: result.hash,
              taskHash: result.taskHash,
              reputationUpdate: {
                newScore: reputationUpdate.newScore,
                previousScore: reputationUpdate.previousScore || 0,
                newLevel: reputationUpdate.newLevel || "Beginner",
                isLevelUp: reputationUpdate.isLevelUp || false,
              },
            };
          }
        }
      }

      return {
        success: true,
        transactionHash: result.hash,
        taskHash: result.taskHash,
      };
    } else {
      // Update task with failed verification status
      const verificationMetadata: VerificationMetadata = {
        verified: false,
        verificationStatus: "failed",
      };

      await updateTask(task.id, { metadata: verificationMetadata });

      return {
        success: false,
        error: result.error || "Failed to verify task on blockchain",
      };
    }
  } catch (error) {
    console.error("Error in verifyTask:", error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Checks if a task has been verified on the blockchain
 */
export async function checkTaskVerification(task: Task): Promise<{
  success: boolean;
  isVerified: boolean;
  error?: string;
}> {
  try {
    if (!task.userId) {
      return {
        success: false,
        isVerified: false,
        error: "Task has no user ID",
      };
    }

    const taskString = formatTaskForHashing(task);
    const result = await isTaskVerified(task.userId, taskString);

    return {
      success: result.success,
      isVerified: result.isVerified,
      error: result.error,
    };
  } catch (error) {
    console.error("Error in checkTaskVerification:", error);
    return {
      success: false,
      isVerified: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Retries a failed verification
 */
export async function retryVerification(task: Task): Promise<{
  success: boolean;
  transactionHash?: string;
  error?: string;
  reputationUpdate?: {
    newScore: number;
    previousScore: number;
    newLevel: string;
    isLevelUp: boolean;
  };
}> {
  try {
    // Update task with pending verification status
    const pendingMetadata: VerificationMetadata = {
      verified: false,
      verificationStatus: "pending",
    };

    await updateTask(task.id, { metadata: pendingMetadata });

    // Call verifyTask again
    return await verifyTask(task);
  } catch (error) {
    console.error("Error in retryVerification:", error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}
