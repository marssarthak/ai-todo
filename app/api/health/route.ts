import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";

/**
 * Health check endpoint to verify API and dependencies are working
 * Used by monitoring services and integration tests to verify system health
 */
export async function GET() {
  const version = process.env["NEXT_PUBLIC_APP_VERSION"] || "1.0.0";
  const environment = process.env.NODE_ENV || "development";
  const startTime = Date.now();

  try {
    // Check database connection
    let dbStatus = "unknown";
    let dbLatency = 0;

    try {
      const dbStartTime = Date.now();
      const supabase = createClient();
      const { data, error } = await supabase
        .from("tasks")
        .select("id")
        .limit(1);
      dbLatency = Date.now() - dbStartTime;

      if (error) {
        throw error;
      }

      dbStatus = "connected";
    } catch (err) {
      console.error("Health check - DB connection error:", err);
      dbStatus = "error";
    }

    // System metrics
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();

    // Build response object
    const health = {
      status: dbStatus === "connected" ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      version,
      environment,
      services: {
        api: {
          status: "available",
          responseTime: Date.now() - startTime,
        },
        database: {
          status: dbStatus,
          latency: dbLatency,
        },
      },
      system: {
        uptime: uptime,
        memory: {
          rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        },
      },
    };

    // Return 200 if healthy, 503 if not
    return NextResponse.json(health, {
      status: health.status === "healthy" ? 200 : 503,
    });
  } catch (error) {
    console.error("Health check failed:", error);

    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        error: "Health check failed",
        version,
        environment,
      },
      { status: 500 }
    );
  }
}
