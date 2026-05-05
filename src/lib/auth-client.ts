'use client';

import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';

// Export a similar interface to WorkOS for compatibility
export function useWorkOSClient() {
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch('/api/auth/session', {
          credentials: 'include'
        });
        const data = await res.json();
        setSession(data);
      } catch (error) {
        logger.error('Error fetching WorkOS session', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSession();
  }, []);

  return {
    isAuthenticated: !!session?.user,
    isLoading,
    user: session?.user || null,
  };
}

// Custom hook that wraps the WorkOS session check
export function useSession() {
  const { isAuthenticated, isLoading, user } = useWorkOSClient();

  return {
    data: isAuthenticated === true && user ? { user, session: true } : null,
    isPending: isLoading,
    error: null,
    isRefetching: false,
    refetch: () => {
      // Logic to refetch if needed
    },
  };
}

// Aliases for compatibility with existing code
export const useAuth = useWorkOSClient;
export const useUser = useWorkOSClient;

export async function signOut() {
  window.location.href = '/api/auth/logout';
}
