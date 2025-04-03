"use client";

import React from "react";
import { PrivyProvider } from "@privy-io/react-auth";
// import { baseSepolia } from "viem/chains";
import { WagmiProvider, createConfig } from "@privy-io/wagmi";
import { http } from "viem";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Chain as ViemChain } from "viem";
import type { Chain as PrivyChain } from "@privy-io/chains";
import { baseSepolia } from "@privy-io/chains";

const wagmiSupportedChains: readonly [ViemChain, ...ViemChain[]] = [
  baseSepolia,
];

// Create Wagmi config using Privy's helpers
const wagmiConfig = createConfig({
  chains: wagmiSupportedChains, // Use the readonly tuple here
  transports: {
    [baseSepolia.id]: http(), // Use default public RPC for Polygon
  },
});

// Create a React Query client
const queryClient = new QueryClient();

// Create a mutable array for PrivyProvider config
const privySupportedChains: PrivyChain[] = [
  baseSepolia as unknown as PrivyChain,
];

export function PrivyProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PrivyProvider
      appId={process.env["NEXT_PUBLIC_PRIVY_APP_ID"] || ""}
      config={{
        // Customize Privy's appearance and behavior here
        appearance: {
          theme: "light", // or 'dark' or 'system'
          accentColor: "#676FFF",
          // logo: 'YOUR_LOGO_URL', // Optional: Add your app's logo
        },
        // Configure embedded wallets
        embeddedWallets: {
          createOnLogin: "users-without-wallets", // Create wallets for users without one
          requireUserPasswordOnCreate: false,
        },
        // Login methods
        loginMethods: ["email", "wallet"], // Allow login via email or external wallet
        // Default chain configuration (users can switch)
        defaultChain: baseSepolia, // Set Polygon mainnet as default
        // Supported chains for users to connect to
        supportedChains: privySupportedChains, // Use the mutable array here
      }}
    >
      {/* Wrap with WagmiProvider from Privy and React Query Provider */}
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig} reconnectOnMount={false}>
          {children}
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
