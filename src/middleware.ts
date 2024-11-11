import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isSometimesProectedRoute = createRouteMatcher(["/"]);

const isTenantRoute = createRouteMatcher([
  "/join-group/(.*)",
  "/my-groups",
  "/my-pets",
  "/sitters/(.*)",
  "/groups/(.*)",
  "/pets/(.*)",
  "/user-profile",
]);

export default clerkMiddleware(async (auth, request) => {
  if ((await auth()).userId && isSometimesProectedRoute(request)) {
    await auth.protect();
  }

  if (isTenantRoute(request)) {
    await auth.protect();
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
