"use client";

import React from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";

export function WalletConnect() {
  const { login, ready, authenticated, linkWallet } = usePrivy();
  const { wallets } = useWallets(); // Get connected wallet details

  const externalWallet = wallets.find(
    (wallet) => wallet.walletClientType !== "privy"
  );
  const embeddedWallet = wallets.find(
    (wallet) => wallet.walletClientType === "privy"
  );
  const connectedWallet = externalWallet || embeddedWallet;

  // Only render the button if Privy is ready and the user is not authenticated
  if (authenticated && connectedWallet) {
    return null;
  }

  return (
    <Button
      onClick={authenticated ? linkWallet : login}
      disabled={!ready}
      variant="outline"
      size="sm"
      className="mr-1 h-8 text-xs gap-1 border-border/50 hover:bg-muted/80"
    >
      <Wallet className="h-3.5 w-3.5" />
      Connect Wallet
    </Button>
  );
}
