import { getSession, withApiAuthRequired } from "@/app/lib/auth0Client";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";
import { NextResponse } from "next/server";

export const GET = withApiAuthRequired(async (req: Request) => {
  const session = await getSession();
  
  if (!session || !session.user) {
    // If no session at all, not active (though withApiAuthRequired should prevent this)
    return NextResponse.json({ active: false });
  }

  // This deviceId was stored in the session cookie during login
  const { deviceId } = (session as any) || {};

  // If there's no deviceId in the session, check if user needs device management
  // This could happen if user was redirected to manage-devices page
  if (!deviceId) {
    // User is authenticated but doesn't have a deviceId yet
    // Check if they're in a transitional state (needsDeviceManagement)
    const needsDeviceManagement = (session as any).needsDeviceManagement;
    if (needsDeviceManagement) {
      // User is authenticated but hasn't completed device setup yet
      // Consider them active to avoid false logout
      return NextResponse.json({ active: true });
    }
    
    // No deviceId - check if user has any active devices in the database
    // If they do, they're probably active but session doesn't have deviceId yet
    try {
      const AUTH0_NAMESPACE = process.env.AUTH0_NAMESPACE!;
      const auth0UserId = (session as any).user?.[AUTH0_NAMESPACE + "/user_id"];
      
      if (auth0UserId) {
        const { error, count } = await supabaseAdmin
          .from("active_devices")
          .select("device_id", { count: "exact" })
          .eq("user_id", auth0UserId);
        
        if (!error && count && count > 0) {
          // User has devices in database, so they're active
          // The deviceId just isn't in the session yet
          return NextResponse.json({ active: true });
        }
      }
    } catch (error) {
      console.error("Error checking user devices:", error);
      // On error, default to active to avoid false logout
      return NextResponse.json({ active: true });
    }
    
    // No deviceId and no devices found - might be a new session
    // Default to active since user is authenticated
    return NextResponse.json({ active: true });
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