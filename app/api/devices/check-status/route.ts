import { getSession, withApiAuthRequired } from "@auth0/nextjs-auth0";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";
import { NextResponse } from "next/server";

export const GET = withApiAuthRequired(async (req) => {
  const session = await getSession(req, new NextResponse());
  
  // This deviceId was stored in the session cookie during login
  const { deviceId } = session;

  if (!deviceId) {
    // If there's no deviceId in the session, they aren't active.
    return NextResponse.json({ active: false });
  }

  try {
    const { error, count } = await supabaseAdmin
      .from("active_devices")
      .select("device_id", { count: "exact" })
      .eq("device_id", deviceId);
    
    if (error) throw error;
    
    // If count is 1, we are active. If 0, we've been logged out.
    return NextResponse.json({ active: count === 1 });

  } catch (error: any) {
     console.error("Failed to check device status:", error);
    return NextResponse.json(
      { message: "Failed to check status", error: error.message },
      { status: 500 }
    );
  }
});