"use client";

import React from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";
import { LogOut, Copy, Check, Wallet } from "lucide-react";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { Skeleton } from "@/components/ui/skeleton";
import { base, baseSepolia } from "viem/chains";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function WalletStatus() {
  const { ready, authenticated, user, logout } = usePrivy();
  const { wallets } = useWallets(); // Get connected wallet details
  const { copied, copyToClipboard } = useCopyToClipboard();

  const externalWallet = wallets.find(
    (wallet) => wallet.walletClientType !== "privy"
  );
  const embeddedWallet = wallets.find(
    (wallet) => wallet.walletClientType === "privy"
  );
  const connectedWallet = externalWallet || embeddedWallet; // Prioritize external

  // Handle loading state
  if (!ready) {
    return (
      <div className="mr-1">
        <Skeleton className="h-8 w-24 rounded-md" />
      </div>
    );
  }

  // Handle authenticated state
  if (ready && authenticated && connectedWallet) {
    const displayAddress = `${connectedWallet.address.substring(
      0,
      6
    )}...${connectedWallet.address.substring(
      connectedWallet.address.length - 4
    )}`;
    const chainName =
      connectedWallet.chainId === `eip155:${base.id}`
        ? "Base"
        : connectedWallet.chainId === `eip155:${baseSepolia.id}`
        ? "Base Sepolia"
        : "Unknown Network";

    return (
      <TooltipProvider>
        <div className="flex items-center mr-1 bg-muted/70 hover:bg-muted transition-colors rounded-lg border border-border/50">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center px-2 py-1.5">
                <Wallet className="h-3.5 w-3.5 mr-1.5 text-primary" />
                <span className="text-xs font-medium">{displayAddress}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyToClipboard(connectedWallet.address)}
                  aria-label="Copy address"
                  className="h-5 w-5 ml-0.5 hover:bg-background/80"
                >
                  {copied ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="flex flex-col text-xs">
                <span>Connected to {chainName}</span>
                <span className="text-muted-foreground">
                  {connectedWallet.address}
                </span>
              </div>
            </TooltipContent>
          </Tooltip>
          <div className="h-5 mx-0.5 border-r border-border/50"></div>
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            aria-label="Disconnect wallet"
            className="h-full rounded-l-none px-1.5"
          >
            <LogOut className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
          </Button>
        </div>
      </TooltipProvider>
    );
  }

  // If ready but not authenticated, render nothing (WalletConnect button will show)
  return null;
}
