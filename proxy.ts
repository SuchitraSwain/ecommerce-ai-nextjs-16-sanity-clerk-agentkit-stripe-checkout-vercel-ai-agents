import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const isClerkConfigured =
  publishableKey &&
  publishableKey !== "your-clerk-publishable-key-here" &&
  publishableKey.startsWith("pk_");

const isProtectedRoute = createRouteMatcher([
  "/checkout",
  "/orders",
  "/orders/[id]",
  "/checkout/success",
]);

// Wrap clerkMiddleware to handle cases where Clerk isn't configured
function createMiddleware() {
  if (isClerkConfigured) {
    return clerkMiddleware(async (auth, req) => {
      if (isProtectedRoute(req)) {
        await auth.protect();
      }
    });
  }

  // Passthrough middleware when Clerk is not configured
  return async function middleware(req: NextRequest) {
    // If trying to access protected routes without Clerk, redirect to home
    if (isProtectedRoute(req)) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  };
}

export default createMiddleware();

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
