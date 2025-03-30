"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import type {
  SupabaseClient,
  Session,
  User,
  AuthError,
  SignInWithPasswordCredentials,
  SignUpWithPasswordCredentials,
} from "@supabase/supabase-js";
import { useRouter } from "next/navigation"; // Use next/navigation
import { createClient } from "@/lib/supabase/client";

interface AuthContextType {
  supabase: SupabaseClient;
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  error: AuthError | null;
  signIn: (
    credentials: SignInWithPasswordCredentials
  ) => Promise<{ error: AuthError | null }>;
  signUp: (
    credentials: SignUpWithPasswordCredentials
  ) => Promise<{ error: AuthError | null; requiresConfirmation?: boolean }>;
  signOut: () => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const supabase = createClient();

  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastError, setLastError] = useState<AuthError | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Get initial session
    const fetchSession = async () => {
      try {
        setIsLoading(true);
        const {
          data: { session: currentSession },
          error: sessionError,
        } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
      } catch (e) {
        console.error("Error fetching initial session:", e);
        setLastError(e as AuthError);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSession();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLastError(null); // Clear previous errors on state change
        setIsLoading(false); // Ensure loading is false after state change
      }
    );

    // Cleanup listener on unmount
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [supabase.auth]);

  const signIn = async (credentials: SignInWithPasswordCredentials) => {
    setIsLoading(true);
    setLastError(null);
    let signInError: AuthError | null = null;
    try {
      const { error } = await supabase.auth.signInWithPassword(credentials);
      if (error) throw error;
    } catch (e) {
      console.error("Sign in error:", e);
      signInError = e as AuthError;
      setLastError(signInError);
    } finally {
      setIsLoading(false);
    }
    return { error: signInError };
  };

  const signUp = async (credentials: SignUpWithPasswordCredentials) => {
    setIsLoading(true);
    setLastError(null);
    let signUpError: AuthError | null = null;
    let requiresConfirmation = false;
    try {
      const { data, error } = await supabase.auth.signUp(credentials);
      if (error) throw error;

      // Check if email confirmation is likely required
      if (data.user && data.session === null) {
        // This typically means confirmation is needed
        requiresConfirmation = true;
        console.log("Sign up successful, confirmation likely required.");
        // Optionally set a specific message or state here if needed globally
      } else {
        console.log(
          "Sign up successful, user session created (or confirmation not needed)."
        );
      }
    } catch (e) {
      console.error("Sign up error:", e);
      signUpError = e as AuthError;
      setLastError(signUpError);
    } finally {
      setIsLoading(false);
    }
    return { error: signUpError, requiresConfirmation };
  };

  const signOut = async () => {
    setIsLoading(true);
    setLastError(null);
    let signOutError: AuthError | null = null;
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (e) {
      console.error("Sign out error:", e);
      signOutError = e as AuthError;
      setLastError(signOutError);
    } finally {
      setIsLoading(false);
    }
    return { error: signOutError };
  };

  const value: AuthContextType = {
    supabase,
    session,
    user,
    isLoading,
    error: lastError,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the AuthContext
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
