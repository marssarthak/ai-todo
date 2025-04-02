import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";

/**
 * Test endpoint to check database connection
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
    const supabase = createClient();

    // Try a simple query to check connection
    const { data, error } = await supabase
      .from("tasks")
      .select("count()", { count: "exact" });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      status: "connected",
      message: "Database connection successful",
      latency: Date.now() - startTime,
      count: data?.[0]?.count ?? 0,
    });
  } catch (error) {
    console.error("Database connection test failed:", error);

    return NextResponse.json(
      {
        status: "error",
        message: "Database connection failed",
        error: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
