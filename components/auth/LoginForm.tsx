"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const loginFormSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters." }),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export function LoginForm() {
  const { signIn, isLoading, error: authError } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const router = useRouter();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginFormValues) {
    setFormError(null); // Clear previous form errors
    const { error } = await signIn(values);

    if (error) {
      console.error("Login failed:", error);
      setFormError(
        error.message || "Login failed. Please check your credentials."
      );
    } else {
      console.log("Login successful, navigating...");
      router.push("/"); // Redirect to dashboard on successful login
      router.refresh(); // Refresh server components
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Display Authentication Error from Context */}
        {authError && !formError && (
          <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-md">
            <p className="text-sm text-destructive">
              Auth Error: {authError.message}
            </p>
          </div>
        )}
        {/* Display Form Submission Error */}
        {formError && (
          <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-md">
            <p className="text-sm text-destructive">Login Error: {formError}</p>
          </div>
        )}

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="you@example.com" {...field} type="email" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input placeholder="••••••••" {...field} type="password" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Signing In..." : "Sign In"}
        </Button>
        <div className="text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link href="/signup" className="underline hover:text-primary">
            Sign up
          </Link>
        </div>
      </form>
    </Form>
  );
}
