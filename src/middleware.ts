import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isSometimesProectedRoute = createRouteMatcher(["/"]);

const isTenantRoute = createRouteMatcher(["/onboarding", "/sitters/(.*)"]);

export default clerkMiddleware((auth, request) => {
  if (auth().userId && isSometimesProectedRoute(request)) {
    auth().protect();
  }

  if (isTenantRoute(request)) {
    auth().protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
  debug: true,
};
