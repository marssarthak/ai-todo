"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { StreakCounter } from "@/components/gamification/StreakCounter";
import { StreakAlert } from "@/components/gamification/StreakAlert";
import Link from "next/link";
import { Trophy } from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="w-64 border-r bg-card hidden md:block">
        <div className="h-full flex flex-col">
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold">Dashboard</h2>
            {user && (
              <p className="text-sm text-muted-foreground">Welcome back!</p>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-1">
              <li>
                <Link
                  href="/dashboard"
                  className="flex items-center px-3 py-2 rounded-md hover:bg-accent"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/tasks"
                  className="flex items-center px-3 py-2 rounded-md hover:bg-accent"
                >
                  Tasks
                </Link>
              </li>
              <li>
                <Link
                  href="/profile"
                  className="flex items-center px-3 py-2 rounded-md hover:bg-accent"
                >
                  Profile
                </Link>
              </li>
            </ul>

            <div className="border-t mt-6 pt-6">
              <p className="px-3 text-sm font-medium text-muted-foreground mb-3">
                Gamification
              </p>
              <ul className="space-y-1">
                <li>
                  <Link
                    href="/profile/streaks"
                    className="flex items-center px-3 py-2 rounded-md hover:bg-accent"
                  >
                    <span className="mr-2">🔥</span>
                    Streaks
                  </Link>
                </li>
                <li>
                  <Link
                    href="/profile/achievements"
                    className="flex items-center px-3 py-2 rounded-md hover:bg-accent"
                  >
                    <Trophy className="h-4 w-4 mr-2" />
                    Achievements
                  </Link>
                </li>
              </ul>
            </div>
          </nav>

          {/* Streak widget at bottom of sidebar */}
          <div className="p-4 border-t mt-auto">
            <div className="mb-3">
              <StreakCounter variant="compact" />
            </div>
            <Link
              href="/profile/streaks"
              className="text-xs text-primary hover:underline block"
            >
              View streak details →
            </Link>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Streak alert at top of page when streak at risk */}
        <StreakAlert variant="banner" />

        {/* Main content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
