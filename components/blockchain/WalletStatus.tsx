"use client";

import React from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";
import { LogOut, Copy, Check } from "lucide-react";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard"; // Assuming a copy hook exists
import { Skeleton } from "@/components/ui/skeleton";
import { polygon, polygonAmoy } from "viem/chains";

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
      <div className="flex items-center space-x-3">
        <Skeleton className="h-8 w-32 rounded-md" />
        <Skeleton className="h-8 w-20 rounded-md" />
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
      connectedWallet.chainId === `eip155:${polygon.id}`
        ? "Polygon"
        : connectedWallet.chainId === `eip155:${polygonAmoy.id}`
        ? "Amoy"
        : "Unknown Network";

    return (
      <div className="flex items-center space-x-3 bg-muted p-2 rounded-lg">
        <div className="flex items-center space-x-2 text-sm">
          <span>{displayAddress}</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => copyToClipboard(connectedWallet.address)}
            aria-label="Copy address"
            className="h-6 w-6"
          >
            {copied ? (
              <Check className="h-3 w-3 text-green-500" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
        </div>
        <span className="text-xs px-2 py-0.5 rounded bg-background">
          {chainName}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={logout}
          aria-label="Logout"
          className="h-6 w-6"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  // If ready but not authenticated, render nothing (WalletConnect button will show)
  return null;
}
