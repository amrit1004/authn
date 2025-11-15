import { getSession, withApiAuthRequired } from "@/app/lib/auth0Client";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";
import { NextResponse } from "next/server";

export const GET = withApiAuthRequired(async (req: Request) => {
  const session = await getSession();
  
  if (!session || !session.user) {
    return NextResponse.json({ active: false });
  }

  const { deviceId } = (session as any) || {};

  if (!deviceId) {
    const needsDeviceManagement = (session as any).needsDeviceManagement;
    if (needsDeviceManagement) {
      return NextResponse.json({ active: true });
    }
    
    try {
      const AUTH0_NAMESPACE = process.env.AUTH0_NAMESPACE!;
      const auth0UserId = (session as any).user?.[AUTH0_NAMESPACE + "/user_id"];
      
      if (auth0UserId) {
        const { error, count } = await supabaseAdmin
          .from("active_devices")
          .select("device_id", { count: "exact" })
          .eq("user_id", auth0UserId);
        
        if (!error && count && count > 0) {
          return NextResponse.json({ active: true });
        }
      }
    } catch (error) {
      console.error("Error checking user devices:", error);
      return NextResponse.json({ active: true });
    }
    
    return NextResponse.json({ active: true });
  }

  try {
    const { error, count } = await supabaseAdmin
      .from("active_devices")
      .select("device_id", { count: "exact" })
      .eq("device_id", deviceId);
    
    if (error) throw error;
    
    return NextResponse.json({ active: count === 1 });

  } catch (error: any) {
     console.error("Failed to check device status:", error);
    return NextResponse.json(
      { message: "Failed to check status", error: error.message },
      { status: 500 }
    );
  }
});