"use client";

import Link from "next/link";
import { Menu, LogOut, User as UserIcon, Loader2 } from "lucide-react"; // Add icons
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
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
      <Link
        href="/"
        className="text-muted-foreground transition-colors hover:text-foreground"
      >
        Dashboard
      </Link>
      {/* Add other primary nav links here if needed */}
      {user && (
        <Link
          href="/profile"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          Profile
        </Link>
      )}
    </>
  );

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-50">
        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-5 text-sm lg:gap-6 md:flex">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-semibold md:text-base mr-4"
          >
            {/* <Package2 className="h-6 w-6" /> Add logo icon if desired */}
            <span className="font-bold">AI Productivity</span>
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
                {/* <Package2 className="h-6 w-6" /> */}
                <span className="font-bold">AI Productivity</span>
              </Link>
            </SheetHeader>
            <nav className="grid gap-4 text-base font-medium">{navLinks}</nav>
          </SheetContent>
        </Sheet>

        {/* Header Right Side: Theme Toggle and Auth Status */}
        <div className="flex w-full items-center justify-end gap-4 md:ml-auto md:gap-2 lg:gap-4">
          <ThemeToggle />
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="rounded-full"
                >
                  <UserIcon className="h-5 w-5" />
                  <span className="sr-only">Toggle user menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => router.push("/profile")}
                >
                  Profile
                </DropdownMenuItem>
                {/* Add Settings link if needed */}
                {/* <DropdownMenuItem>Settings</DropdownMenuItem> */}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50/50"
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
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/signup">Sign Up</Link>
              </Button>
            </div>
          )}
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        {children}
      </main>
    </div>
  );
}
