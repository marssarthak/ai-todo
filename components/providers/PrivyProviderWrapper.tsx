"use client";

import React from "react";
import { PrivyProvider } from "@privy-io/react-auth";
import { polygon, polygonAmoy } from "viem/chains"; // Import Polygon chains from viem
import { WagmiProvider, createConfig } from "@privy-io/wagmi"; // Use Privy's WagmiProvider
import { http } from "viem";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Chain } from "viem"; // Explicitly import Chain type

// Define your supported chains for Wagmi config
const wagmiSupportedChains: readonly [Chain, ...Chain[]] = [
  polygon,
  polygonAmoy,
];

// Create Wagmi config using Privy's helpers
const wagmiConfig = createConfig({
  chains: wagmiSupportedChains, // Use the readonly tuple here
  transports: {
    [polygon.id]: http(), // Use default public RPC for Polygon
    [polygonAmoy.id]: http(), // Use default public RPC for Amoy
  },
});

// Create a React Query client
const queryClient = new QueryClient();

// Create a mutable array for PrivyProvider config
const privySupportedChains: Chain[] = [...wagmiSupportedChains];

export function PrivyProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ""}
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
        defaultChain: polygon, // Set Polygon mainnet as default
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
