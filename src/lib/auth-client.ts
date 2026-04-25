import { createAuthClient } from "better-auth/client";
import { useEffect, useState } from "react";

// Create auth client for React components
export const authClient = createAuthClient({
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
});

// Export hooks and utilities
export const {
  signIn,
  signOut,
  signUp,
} = authClient;

// Types
export type User = typeof authClient.$Infer.Session.user;
export type Session = typeof authClient.$Infer.Session.session;

// Session return type
interface SessionData {
  user: User;
  session: Session;
}

interface UseSessionReturn {
  data: SessionData | null;
  isPending: boolean;
  error: Error | null;
  isRefetching: boolean;
  refetch: () => void;
}

// Custom hook that subscribes to better-auth's session state
export function useSession(): UseSessionReturn {
  const [sessionState, setSessionState] = useState<UseSessionReturn>({
    data: null,
    isPending: true,
    error: null,
    isRefetching: false,
    refetch: () => {},
  });

  useEffect(() => {
    // Subscribe to session changes using better-auth's atom
    const unsubscribe = (authClient.useSession as any).subscribe((state: any) => {
      setSessionState(state);
    });

    // Get initial state
    const initialState = (authClient.useSession as any).getValue?.() || (authClient.useSession as any).value;
    if (initialState) {
      setSessionState(initialState);
    }

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  return sessionState;
}
