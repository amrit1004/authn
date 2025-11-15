import { getSession } from "@/app/lib/auth0Client";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";
import { NextRequest, NextResponse } from "next/server";

const AUTH0_NAMESPACE = process.env.AUTH0_NAMESPACE!;

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    
    if (session?.deviceId && session?.user) {
      const auth0UserId = session.user[AUTH0_NAMESPACE + "/user_id"];
      
      if (auth0UserId) {
        await supabaseAdmin
          .from("active_devices")
          .delete()
          .eq("device_id", session.deviceId)
          .eq("user_id", auth0UserId);
      }
    }
  } catch (error) {
    console.error("Error cleaning up device on logout:", error);
  }
  
  const baseUrl = process.env.AUTH0_BASE_URL || req.nextUrl.origin;
  return NextResponse.redirect(`${baseUrl}/api/auth/logout`);
}

