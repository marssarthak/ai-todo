import React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Task } from "@/types/task";
import {
  InfoIcon,
  CheckCircle2Icon,
  XCircleIcon,
  ClockIcon,
} from "lucide-react";

interface VerificationStatusProps {
  task: Task;
  size?: "sm" | "md" | "lg";
}

export function VerificationStatus({
  task,
  size = "md",
}: VerificationStatusProps) {
  const metadata = task.metadata;

  if (!metadata) {
    return null;
  }

  // Set styles based on verification status
  const statusConfig = {
    pending: {
      variant: "outline" as const,
      icon: <ClockIcon className="h-4 w-4 mr-1" />,
      label: "Verifying",
      tooltip: "Transaction is being processed on the blockchain",
    },
    verified: {
      variant: "success" as const,
      icon: <CheckCircle2Icon className="h-4 w-4 mr-1" />,
      label: "Verified",
      tooltip: "Task has been verified on the blockchain",
    },
    failed: {
      variant: "destructive" as const,
      icon: <XCircleIcon className="h-4 w-4 mr-1" />,
      label: "Failed",
      tooltip: "Verification failed. Click for details.",
    },
    unknown: {
      variant: "secondary" as const,
      icon: <InfoIcon className="h-4 w-4 mr-1" />,
      label: "Unverified",
      tooltip: "Task has not been verified on the blockchain",
    },
  };

  // Determine status
  let status = "unknown";
  if (metadata.verificationStatus) {
    status = metadata.verificationStatus;
  } else if (metadata.verified) {
    status = "verified";
  }

  const config = statusConfig[status as keyof typeof statusConfig];

  // Size-based classes
  const sizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant={config.variant}
            className={`${sizeClasses[size]} flex items-center`}
          >
            {config.icon}
            {config.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{config.tooltip}</p>
          {metadata.transactionHash && (
            <p className="text-xs mt-1 text-muted-foreground">
              Tx: {metadata.transactionHash.substring(0, 8)}...
            </p>
          )}
          {metadata.verifiedAt && (
            <p className="text-xs mt-1 text-muted-foreground">
              {new Date(metadata.verifiedAt).toLocaleString()}
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
