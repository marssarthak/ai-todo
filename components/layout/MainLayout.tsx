"use client";

import Link from "next/link";
import {
  Menu,
  LogOut,
  User as UserIcon,
  Loader2,
  UserCircle,
  FileCheck,
  Wallet,
  ExternalLink,
  Sparkles,
  CheckSquare,
  Trophy,
  Flame,
  Home,
  X,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetClose,
} from "@/components/ui/sheet";
import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext"; // Import useAuth
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter, usePathname } from "next/navigation";
import { WalletConnect } from "@/components/blockchain/WalletConnect";
import { WalletStatus } from "@/components/blockchain/WalletStatus";
import { cn } from "@/lib/utils";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, session, signOut, isLoading } = useAuth(); // Get auth state
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push("/login"); // Redirect to login after sign out
    router.refresh();
  };

  // Navigation items with icons, labels, and paths
  const navigationItems = [
    {
      icon: <Home className="h-4 w-4" />,
      label: "Home",
      path: "/",
    },
    {
      icon: <CheckSquare className="h-4 w-4" />,
      label: "Tasks",
      path: "/tasks",
    },
    {
      icon: <UserCircle className="h-4 w-4" />,
      label: "Profile",
      path: "/profile",
      requiresAuth: true,
    },
    {
      icon: <FileCheck className="h-4 w-4" />,
      label: "Verification History",
      path: "/verification",
      requiresAuth: true,
    },
  ];

  // Gamification items
  const gamificationItems = [
    {
      icon: <Flame className="h-4 w-4" />,
      label: "Streaks",
      path: "/profile/streaks",
      requiresAuth: true,
    },
    {
      icon: <Trophy className="h-4 w-4" />,
      label: "Achievements",
      path: "/profile/achievements",
      requiresAuth: true,
    },
  ];

  return (
    <div className="flex min-h-screen w-full">
      {/* Header - now uses same bg-card color as sidebar */}
      <header className="fixed top-0 left-0 right-0 h-16 flex items-center border-b bg-card z-40 md:pl-4">
        {/* Mobile navigation trigger */}
        <Link href="/" className="flex items-center gap-1.5">
          <div className="relative">
            <Wallet className="h-5 w-5 text-primary" />
            <Sparkles className="h-3 w-3 absolute -top-1 -right-1 text-amber-500" />
          </div>
          <span className="font-bold bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent text-xl truncate">
            AI Productivity
          </span>
        </Link>
        <div className="flex items-center px-4 md:px-6 w-full">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>

          {/* Page title - mobile only */}

          <div className="flex md:hidden ml-3 font-semibold">
            {pathname
              ? pathname === "/dashboard"
                ? "Dashboard"
                : pathname === "/tasks"
                ? "Tasks"
                : pathname === "/profile"
                ? "Profile"
                : pathname.includes("streaks")
                ? "Streaks"
                : pathname.includes("achievements")
                ? "Achievements"
                : pathname.includes("verification")
                ? "Verification"
                : ""
              : ""}
          </div>

          {/* User profile dropdown & actions - right side */}
          <div className="flex items-center ml-auto gap-3">
            {/* Wallet Status/Connect - always in header */}
            <WalletStatus />
            <WalletConnect />
            <ThemeToggle />

            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="icon" className="h-9 w-9">
                    <UserIcon className="h-5 w-5" />
                    <span className="sr-only">Toggle user menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer flex items-center"
                    onClick={() => router.push("/profile")}
                  >
                    <UserCircle className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer flex items-center"
                    onClick={() => router.push("/verification")}
                  >
                    <FileCheck className="mr-2 h-4 w-4" />
                    Verification History
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50/50 flex items-center"
                    onClick={handleSignOut}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href="/login" className="flex items-center gap-1">
                    <ExternalLink className="h-4 w-4" />
                    Login
                  </Link>
                </Button>
                <Button asChild size="sm" className="hidden sm:flex">
                  <Link href="/signup">Sign Up</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Sidebar - Desktop */}
      <aside className="fixed top-0 left-0 h-full w-64 hidden md:flex flex-col bg-card border-r z-30 pt-16">
        {/* <div className="p-4 border-b">
          <Link href="/" className="flex items-center gap-1.5">
            <div className="relative">
              <Wallet className="h-5 w-5 text-primary" />
              <Sparkles className="h-3 w-3 absolute -top-1 -right-1 text-amber-500" />
            </div>
            <span className="font-bold bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent text-xl truncate">
              AI Productivity
            </span>
          </Link>
        </div> */}

        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-1 mb-6">
            {navigationItems.map((item, index) => {
              if (item.requiresAuth && !user) return null;
              return (
                <li key={index}>
                  <Link
                    href={item.path}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                      pathname === item.path
                        ? "bg-primary/10 text-primary font-medium"
                        : "hover:bg-accent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          {user && (
            <div className="border-t pt-4 mt-4">
              <p className="px-3 text-xs font-medium text-muted-foreground mb-3">
                GAMIFICATION
              </p>
              <ul className="space-y-1">
                {gamificationItems.map((item, index) => (
                  <li key={index}>
                    <Link
                      href={item.path}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                        pathname === item.path
                          ? "bg-primary/10 text-primary font-medium"
                          : "hover:bg-accent text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </nav>
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[85%] max-w-[300px] p-0">
          <div className="flex flex-col h-full">
            <SheetHeader className="p-4 border-b flex justify-between">
              <Link href="/" className="flex items-center gap-1.5">
                <div className="relative">
                  <Wallet className="h-5 w-5 text-primary" />
                  <Sparkles className="h-3 w-3 absolute -top-1 -right-1 text-amber-500" />
                </div>
                <span className="font-bold bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
                  AI Productivity
                </span>
              </Link>
              <SheetClose className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </SheetClose>
            </SheetHeader>

            <nav className="flex-1 overflow-y-auto p-4">
              <ul className="space-y-1 mb-6">
                {navigationItems.map((item, index) => {
                  if (item.requiresAuth && !user) return null;
                  return (
                    <li key={index}>
                      <Link
                        href={item.path}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                          pathname === item.path
                            ? "bg-primary/10 text-primary font-medium"
                            : "hover:bg-accent text-muted-foreground hover:text-foreground"
                        )}
                        onClick={() => setMobileOpen(false)}
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>

              {user && (
                <div className="border-t pt-4 mt-4">
                  <p className="px-3 text-xs font-medium text-muted-foreground mb-3">
                    GAMIFICATION
                  </p>
                  <ul className="space-y-1">
                    {gamificationItems.map((item, index) => (
                      <li key={index}>
                        <Link
                          href={item.path}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                            pathname === item.path
                              ? "bg-primary/10 text-primary font-medium"
                              : "hover:bg-accent text-muted-foreground hover:text-foreground"
                          )}
                          onClick={() => setMobileOpen(false)}
                        >
                          {item.icon}
                          <span>{item.label}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </nav>
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex flex-col w-full md:pl-64 pt-16">
        {/* Main content - scrollable */}
        <main className="flex-1 overflow-auto p-4 md:p-8 ">{children}</main>
      </div>
    </div>
  );
}
