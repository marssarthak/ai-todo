export type TaskPriority = "high" | "medium" | "low";
export type TaskStatus = "todo" | "in-progress" | "completed";

export interface VerificationMetadata {
  verified: boolean;
  transactionHash?: string;
  taskHash?: string;
  verifiedAt?: Date;
  verificationStatus?: "pending" | "verified" | "failed";
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  createdAt: Date;
  updatedAt: Date;
  deadline?: Date;
  userId?: string; // Optional for now, will be required later
  metadata?: VerificationMetadata;
}
