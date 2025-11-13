import { getSession } from "@/app/lib/auth0Client";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const res = new NextResponse();

  try {
    const session = await getSession();

    return NextResponse.json({
      needsProfileCompletion: !!session?.needsProfileCompletion,
      needsDeviceManagement: !!session?.needsDeviceManagement,
    });
  } catch (err) {
    console.error("/api/session-flags error:", err);
    return NextResponse.json({});
  }
}
