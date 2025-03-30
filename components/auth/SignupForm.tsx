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

const signupFormSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters." }),
  // Add confirm password if desired
  // confirmPassword: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});
// .refine((data) => data.password === data.confirmPassword, {
//   message: "Passwords don't match",
//   path: ["confirmPassword"], // path of error
// });

type SignupFormValues = z.infer<typeof signupFormSchema>;

export function SignupForm() {
  console.log("SignupForm");
  const { signUp, isLoading, error: authError } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: SignupFormValues) {
    setFormError(null);
    setSuccessMessage(null);

    const { error, requiresConfirmation } = await signUp(values);

    if (error) {
      console.error("Signup failed:", error);
      setFormError(error.message || "Signup failed. Please try again.");
    } else if (requiresConfirmation) {
      setSuccessMessage(
        "Signup successful! Please check your email to confirm your account."
      );
      // Optionally redirect to a confirmation pending page or stay here
      // form.reset(); // Reset form on success
    } else {
      // Signup successful and logged in (if email confirmation disabled)
      setSuccessMessage("Signup successful! Redirecting...");
      // Redirect to dashboard
      router.push("/");
      router.refresh();
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Display General Auth Error */}
        {authError && !formError && !successMessage && (
          <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-md">
            <p className="text-sm text-destructive">
              Auth Error: {authError.message}
            </p>
          </div>
        )}
        {/* Display Form Submission Error */}
        {formError && (
          <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-md">
            <p className="text-sm text-destructive">
              Signup Error: {formError}
            </p>
          </div>
        )}
        {/* Display Success Message (e.g., confirmation pending) */}
        {successMessage && (
          <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-md">
            <p className="text-sm text-green-600">{successMessage}</p>
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
                <Input
                  placeholder="•••••••• (min. 6 characters)"
                  {...field}
                  type="password"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Add Confirm Password Field if using refine */}
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Signing Up..." : "Sign Up"}
        </Button>
        <div className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="underline hover:text-primary">
            Sign in
          </Link>
        </div>
      </form>
    </Form>
  );
}
