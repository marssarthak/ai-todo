"use client";

import React from "react";
import { usePrivy } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";

export function WalletConnect() {
  const { login, ready, authenticated } = usePrivy();

  // Only render the button if Privy is ready and the user is not authenticated
  if (!ready || authenticated) {
    return null;
  }

  return (
    <Button
      onClick={login}
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
