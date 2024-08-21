import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isTenantRoute = createRouteMatcher(["/apps/(.*)"]);

const isTenantAdminRoute = createRouteMatcher(["/apps/create", "/apps/(.*)/edit"]);

export default clerkMiddleware((auth, request) => {
  if (isTenantAdminRoute(request)) {
    auth().protect((has) => {
      return has({ permission: "org:apps:create" });
    });
  }

  if (isTenantRoute(request)) {
    auth().protect((has) => {
      return (
        has({ role: "org:admin" }) || has({ role: "org:member" })
      );
    });
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
