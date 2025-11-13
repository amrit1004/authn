import { NextResponse, type NextRequest } from "next/server";

export default async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Ask our server-side endpoint for session flags. We forward cookies so
  // the server can read the Auth0 session.
  const cookie = req.headers.get("cookie") || "";
  const origin = req.nextUrl.origin;

  let flags = { needsProfileCompletion: false, needsDeviceManagement: false };

  try {
    const flagsRes = await fetch(`${origin}/api/session-flags`, {
      headers: { cookie },
      cache: "no-store",
    });

    if (flagsRes.ok) {
      flags = await flagsRes.json();
    }
  } catch (err) {
    console.error("middleware: failed to fetch session flags:", err);
  }

  const { pathname } = req.nextUrl;

  // 1. Check for Profile Completion
  if (
    flags.needsProfileCompletion &&
    pathname !== "/complete-profile" &&
    !pathname.startsWith("/api")
  ) {
    console.log("Redirecting to /complete-profile");
    return NextResponse.redirect(new URL("/complete-profile", req.url));
  }

  // 2. Check for Device Management
  if (
    flags.needsDeviceManagement &&
    pathname !== "/manage-devices" &&
    !pathname.startsWith("/api")
  ) {
    console.log("Redirecting to /manage-devices");
    return NextResponse.redirect(new URL("/manage-devices", req.url));
  }
  
  // 3. Prevent access to special pages if not needed
  if (!flags.needsProfileCompletion && pathname === "/complete-profile") {
    return NextResponse.redirect(new URL("/private", req.url));
  }
  
  if (!flags.needsDeviceManagement && pathname === "/manage-devices") {
    return NextResponse.redirect(new URL("/private", req.url));
  }

  return res;
}

// The middleware will run on these routes
export const config = {
  matcher: ["/private", "/manage-devices", "/complete-profile"],
};