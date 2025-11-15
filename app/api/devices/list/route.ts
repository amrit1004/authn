import { getSession, withApiAuthRequired } from "@/app/lib/auth0Client";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";
import { NextResponse } from "next/server";

export const GET = withApiAuthRequired(async (req: Request) => {
  const session = await getSession();
  
  if (!session || !session.user) {
    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 401 }
    );
  }

  const AUTH0_NAMESPACE = process.env.AUTH0_NAMESPACE || "";
  const auth0UserId = 
    (session as any).user?.[AUTH0_NAMESPACE + "/user_id"] ||
    (session as any).user?.user_id ||
    (session as any).user?.sub ||
    (session as any).user?.id;

  if (!auth0UserId) {
    const userKeys = session.user && typeof session.user === 'object' 
      ? Object.keys(session.user) 
      : [];
    console.error("User ID not found in session. Available user keys:", userKeys);
    console.error("AUTH0_NAMESPACE:", AUTH0_NAMESPACE);
    return NextResponse.json(
      { 
        message: "User ID not found in session",
        availableKeys: userKeys,
        namespace: AUTH0_NAMESPACE
      },
      { status: 400 }
    );
  }

  try {
    const { data: devices, error } = await supabaseAdmin
      .from("active_devices")
      .select("device_id, user_agent, logged_in_at")
      .eq("user_id", auth0UserId)
      .order("logged_in_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch devices:", error);
      throw error;
    }

    const currentDeviceId = (session as any).deviceId || null;

    return NextResponse.json({ 
      devices: devices || [],
      currentDeviceId: currentDeviceId
    });

  } catch (error: any) {
    console.error("Error in devices/list:", error);
    return NextResponse.json(
      { message: "Failed to fetch devices", error: error.message },
      { status: 500 }
    );
  }
});

