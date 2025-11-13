import { getSession } from "@auth0/nextjs-auth0";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";
import { NextRequest, NextResponse } from "next/server";

const AUTH0_NAMESPACE = process.env.AUTH0_NAMESPACE!;

export async function GET(req: NextRequest) {
  const res = new NextResponse();
  
  try {
    // Get session before logout
    const session = await getSession(req, res);
    
    // Clean up device from active_devices if session exists
    if (session?.deviceId && session?.user) {
      const auth0UserId = session.user[AUTH0_NAMESPACE + "/user_id"];
      
      if (auth0UserId) {
        // Remove device from active_devices
        await supabaseAdmin
          .from("active_devices")
          .delete()
          .eq("device_id", session.deviceId)
          .eq("user_id", auth0UserId);
      }
    }
  } catch (error) {
    // Log error but don't block logout
    console.error("Error cleaning up device on logout:", error);
  }
  
  // Redirect to Auth0 logout
  const baseUrl = process.env.AUTH0_BASE_URL || req.nextUrl.origin;
  return NextResponse.redirect(`${baseUrl}/api/auth/logout`);
}

