"use client";

import { useAuth } from "@clerk/nextjs";

/**
 * Safe wrapper around useAuth
 * ClerkProvider is always rendered, so useAuth will work
 */
export function useSafeAuth() {
  // Always call useAuth - ClerkProvider is always rendered
  const auth = useAuth();
  return {
    isSignedIn: auth.isSignedIn ?? false,
    userId: auth.userId ?? null,
    sessionId: auth.sessionId ?? null,
  };
}

