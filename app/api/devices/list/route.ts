import { getSession, withApiAuthRequired } from "@auth0/nextjs-auth0";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";
import { NextResponse } from "next/server";

export const GET = withApiAuthRequired(async (req) => {
  const session = await getSession(req, new NextResponse());
  
  if (!session || !session.user) {
    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 401 }
    );
  }

  const AUTH0_NAMESPACE = process.env.AUTH0_NAMESPACE!;
  const auth0UserId = session.user[AUTH0_NAMESPACE + "/user_id"];

  if (!auth0UserId) {
    return NextResponse.json(
      { message: "User ID not found" },
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

    return NextResponse.json({ devices: devices || [] });

  } catch (error: any) {
    console.error("Error in devices/list:", error);
    return NextResponse.json(
      { message: "Failed to fetch devices", error: error.message },
      { status: 500 }
    );
  }
});

