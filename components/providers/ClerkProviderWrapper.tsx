"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { ReactNode } from "react";

interface ClerkProviderWrapperProps {
  children: ReactNode;
}

/**
 * Wrapper that always renders ClerkProvider to allow hooks to work
 * 
 * Note: If publishableKey is invalid, Clerk will show an error message,
 * but the app will continue to function. Add a valid Clerk key to .env.local
 * to enable authentication features.
 */
export function ClerkProviderWrapper({ children }: ClerkProviderWrapperProps) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  
  // Always render ClerkProvider so hooks work
  // If key is invalid, Clerk will show an error but won't crash the app
  // Users should add valid keys to .env.local: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
  return (
    <ClerkProvider publishableKey={publishableKey || ""}>
      {children}
    </ClerkProvider>
  );
}

