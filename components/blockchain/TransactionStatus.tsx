import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ExternalLinkIcon, RefreshCwIcon } from "lucide-react";
import { Task } from "@/types/task";

interface TransactionStatusProps {
  task: Task;
  onRetry?: () => void;
  networkType?: "base";
}

export function TransactionStatus({
  task,
  onRetry,
  networkType = "base",
}: TransactionStatusProps) {
  const metadata = task.metadata;

  if (!metadata || !metadata.verificationStatus) {
    return null;
  }

  // Get block explorer URL based on network type and testnet status
  const getExplorerUrl = () => {
    return "https://sepolia.basescan.org";
  };

  // Calculate progress value based on status
  const getProgressValue = () => {
    switch (metadata.verificationStatus) {
      case "pending":
        return 50;
      case "verified":
        return 100;
      case "failed":
        return 100; // Full but will be red
      default:
        return 0;
    }
  };

  // Set UI elements based on status
  const getStatusUI = () => {
    switch (metadata.verificationStatus) {
      case "pending":
        return {
          title: "Transaction Pending",
          description:
            "Your task verification is being processed on the blockchain. This may take a few minutes.",
          progressColor: "bg-blue-500",
        };
      case "verified":
        return {
          title: "Transaction Confirmed",
          description:
            "Your task has been successfully verified on the blockchain.",
          progressColor: "bg-green-500",
        };
      case "failed":
        return {
          title: "Transaction Failed",
          description:
            "There was an error verifying your task on the blockchain.",
          progressColor: "bg-red-500",
        };
      default:
        return {
          title: "Not Verified",
          description: "This task has not been submitted for verification.",
          progressColor: "",
        };
    }
  };

  const statusUI = getStatusUI();
  const explorerUrl = getExplorerUrl();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">{statusUI.title}</CardTitle>
        <CardDescription>{statusUI.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Progress
          value={getProgressValue()}
          className={`h-2 ${
            metadata.verificationStatus === "failed" ? "bg-red-200" : ""
          }`}
          indicatorClassName={statusUI.progressColor}
        />
        {metadata.transactionHash && (
          <p className="text-sm mt-4 font-mono break-all">
            Transaction: {metadata.transactionHash}
          </p>
        )}
        {metadata.verifiedAt && (
          <p className="text-sm mt-2">
            {metadata.verificationStatus === "verified"
              ? "Verified"
              : "Attempted"}{" "}
            at: {new Date(metadata.verifiedAt).toLocaleString()}
          </p>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        {metadata.verificationStatus === "failed" && onRetry && (
          <Button
            variant="outline"
            onClick={onRetry}
            className="flex items-center"
          >
            <RefreshCwIcon className="h-4 w-4 mr-2" /> Retry Verification
          </Button>
        )}
        {explorerUrl && (
          <Button
            variant="ghost"
            onClick={() => window.open(explorerUrl, "_blank")}
            className="flex items-center ml-auto"
          >
            <ExternalLinkIcon className="h-4 w-4 mr-2" /> View on Explorer
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
