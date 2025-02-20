import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Define protected routes
const protectedRoutes = createRouteMatcher([
  "/dashboard(.*)"
]);

// Define public routes
const publicRoutes = createRouteMatcher([
  "/",
  "/api/demo/generate-logo",
  "/api/generate-logo",
  "/sign-in(.*)",
  "/sign-up(.*)"
]);

export default clerkMiddleware(async (auth, req) => {
  // Protect dashboard routes
  if (protectedRoutes(req)) {
    await auth.protect();
  }

  // For homepage, check auth status and redirect if logged in
  if (req.nextUrl.pathname === '/' || publicRoutes(req)) {
    const isAuthenticated = await auth.protect().then(() => true).catch(() => false);
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
