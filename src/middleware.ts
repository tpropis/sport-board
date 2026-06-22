import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Only run Clerk's middleware when keys are configured; otherwise pass through
// so the app works with zero auth setup.
const enabled =
  !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && !!process.env.CLERK_SECRET_KEY;

export default enabled ? clerkMiddleware() : () => NextResponse.next();

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/(api|trpc)(.*)"],
};
