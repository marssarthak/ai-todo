"use client";

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRouter } from "next/navigation";

export function Profile() {
  const { user, signOut, isLoading } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (!error) {
      router.push("/login"); // Redirect to login after sign out
      router.refresh();
    } else {
      console.error("Failed to sign out:", error);
      // Optionally show an error message to the user
    }
  };

  if (isLoading) {
    return <div>Loading profile...</div>;
  }

  if (!user) {
    // This shouldn't happen if the page is protected, but good for safety
    return <div>No user logged in.</div>;
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>User Profile</CardTitle>
        <CardDescription>Your account information.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Email:</span>
          <span>{user.email}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">User ID:</span>
          <span className="text-xs break-all">{user.id}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Last Sign In:</span>
          <span>
            {user.last_sign_in_at
              ? new Date(user.last_sign_in_at).toLocaleString()
              : "N/A"}
          </span>
        </div>

        <Button
          onClick={handleSignOut}
          className="w-full"
          variant="outline"
          disabled={isLoading}
        >
          {isLoading ? "Signing Out..." : "Sign Out"}
        </Button>
      </CardContent>
    </Card>
  );
}
