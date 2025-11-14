import { getSession } from "@/app/lib/auth0Client";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (session) {
      // Clear the deviceAutoLoggedOut flag
      (session as any).deviceAutoLoggedOut = false;
      // Note: We can't update the session here without req/res, but the flag will be cleared on next login
      // For now, this is just a placeholder - the message will only show once per session anyway
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

