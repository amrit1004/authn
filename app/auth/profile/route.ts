import { getSession } from "@/app/lib/auth0Client";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    // Read session server-side (app router). This returns the session or null.
    const session = await getSession();

    if (!session || !session.user) {
      // No session: return 204 No Content to indicate unauthenticated (matching SDK behavior)
      return new NextResponse(null, { status: 204 });
    }

    // Return the user profile payload
    return NextResponse.json(session.user);
  } catch (err) {
    console.error("/auth/profile error:", err);
    return NextResponse.json({ message: "Failed to read session" }, { status: 500 });
  }
}
