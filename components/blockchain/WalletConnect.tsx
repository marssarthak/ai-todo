"use client";

import React from "react";
import { usePrivy } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";

export function WalletConnect() {
  const { login, ready, authenticated } = usePrivy();

  // Only render the button if Privy is ready and the user is not authenticated
  if (!ready || authenticated) {
    return null;
  }

  return (
    <Button onClick={login} disabled={!ready}>
      <LogIn className="mr-2 h-4 w-4" />
      Connect Wallet / Login
    </Button>
  );
}
