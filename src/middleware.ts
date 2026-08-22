import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Public: the sign-in flow and the /i/<code> invite redirect (used before sign-up).
const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)", "/i/(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect(); // unauthenticated → redirected to sign-in
  }
});

export const config = {
  matcher: [
    // Run on everything except Next internals and static assets…
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpg|jpeg|gif|png|svg|ico|webp|avif|woff2?|ttf|map)).*)",
    // …and always on API routes.
    "/(api|trpc)(.*)",
  ],
};
