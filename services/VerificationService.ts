import { Task, VerificationMetadata } from "@/types/task";
import { ethers } from "ethers";
/**
 * Formats a task into a string for hashing
 * Format: taskId|title|description|status|userId|timestamp
 */
export function formatTaskForHashing(task: Task): string {
  return `${task.id}|${task.title}|${task.description || ""}|${task.status}|${
    task.userId || ""
  }|${new Date(task.updatedAt).getTime()}`;
}

/**
 * Generates a hash for a task
 */
export function generateTaskHash(task: Task): string {
  const taskString = formatTaskForHashing(task);
  return ethers.keccak256(ethers.toUtf8Bytes(taskString));
}
