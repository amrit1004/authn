import { getSession } from "@auth0/nextjs-auth0";
import { NextResponse, type NextRequest } from "next/server";

export default async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  // The `types/auth0.d.ts` file automatically types this `session` object
  const session = await getSession(req, res as unknown as Response);

  if (!session || !session.user) {
    return res;
  }

  const { pathname } = req.nextUrl;

  // 1. Check for Profile Completion
  if (
    session.needsProfileCompletion &&
    pathname !== "/complete-profile" &&
    !pathname.startsWith("/api")
  ) {
    console.log("Redirecting to /complete-profile");
    return NextResponse.redirect(new URL("/complete-profile", req.url));
  }

  // 2. Check for Device Management
  if (
    session.needsDeviceManagement &&
    pathname !== "/manage-devices" &&
    !pathname.startsWith("/api")
  ) {
    console.log("Redirecting to /manage-devices");
    return NextResponse.redirect(new URL("/manage-devices", req.url));
  }
  
  // 3. Prevent access to special pages if not needed
  if (!session.needsProfileCompletion && pathname === "/complete-profile") {
    return NextResponse.redirect(new URL("/private", req.url));
  }
  
  if (!session.needsDeviceManagement && pathname === "/manage-devices") {
    return NextResponse.redirect(new URL("/private", req.url));
  }

  return res;
}

// The middleware will run on these routes
export const config = {
  matcher: ["/private", "/manage-devices", "/complete-profile"],
};