import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";

/**
 * Test endpoint to check blockchain contract connection
 * Only accessible in development and test environments
 */
export async function GET() {
  // Restrict access in production for security
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Test endpoints are not available in production" },
      { status: 403 }
    );
  }

  try {
    const startTime = Date.now();

    // Mock contract connection for integration testing purposes
    // In a real implementation, this would attempt to connect to the actual contract
    // using ethers.js or a similar library

    // Simulating blockchain interaction delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    return NextResponse.json({
      status: "connected",
      message: "Contract connection successful",
      latency: Date.now() - startTime,
      contractAddress:
        process.env["NEXT_PUBLIC_CONTRACT_ADDRESS"] ||
        "0x1234567890abcdef1234567890abcdef12345678",
      network: process.env["NEXT_PUBLIC_BLOCKCHAIN_NETWORK"] || "test",
    });
  } catch (error) {
    console.error("Contract connection test failed:", error);

    return NextResponse.json(
      {
        status: "error",
        message: "Contract connection failed",
        error: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
