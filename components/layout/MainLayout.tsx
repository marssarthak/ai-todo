"use client";

import Link from "next/link";
import {
  Menu,
  LogOut,
  User as UserIcon,
  Loader2,
  LayoutDashboard,
  UserCircle,
  FileCheck,
  Wallet,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTrigger,
} from "@/components/ui/sheet";
import React from "react";
import { useAuth } from "@/context/AuthContext"; // Import useAuth
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { WalletConnect } from "@/components/blockchain/WalletConnect";
import { WalletStatus } from "@/components/blockchain/WalletStatus";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, session, signOut, isLoading } = useAuth(); // Get auth state
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/login"); // Redirect to login after sign out
    router.refresh();
  };

  // Consistent Nav Links for Desktop and Mobile
  const navLinks = (
    <>
      {user && (
        <>
          <Link
            href="/profile"
            className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <UserCircle className="h-4 w-4" />
            <span>Profile</span>
          </Link>
          <Link
            href="/verification"
            className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground text-nowrap"
          >
            <FileCheck className="h-4 w-4" />
            <span>Verification History</span>
          </Link>
        </>
      )}
    </>
  );

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur-sm px-4 md:px-6 z-50">
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-semibold md:text-base mr-4"
          >
            <span className="font-bold bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent text-nowrap text-2xl">
              AI Productivity
            </span>
          </Link>
          {navLinks}
        </nav>

        {/* Mobile Navigation */}
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 md:hidden"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <SheetHeader className="mb-4 border-b pb-4">
              <Link
                href="/"
                className="flex items-center gap-2 text-lg font-semibold"
              >
                <span className="font-bold bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
                  AI Productivity
                </span>
              </Link>
            </SheetHeader>
            <nav className="grid gap-4 text-base font-medium">{navLinks}</nav>
          </SheetContent>
        </Sheet>

        {/* Header Right Side: Wallet, Theme Toggle and Auth Status */}
        <div className="flex w-full items-center justify-end gap-3 md:ml-auto">
          {/* Wallet Status/Connect */}
          <div className="hidden sm:block">
            <WalletStatus />
            <WalletConnect />
          </div>

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
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        {/* Mobile Wallet Connect (only shown on small screens) */}
        <div className="sm:hidden mb-2">
          <WalletStatus />
          <WalletConnect />
        </div>
        {children}
      </main>
    </div>
  );
}
