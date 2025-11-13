import { getSession, withApiAuthRequired } from "@auth0/nextjs-auth0";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";
import { NextResponse } from "next/server";

export const POST = withApiAuthRequired(async (req) => {
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
    const body = await req.json();
    const { deviceToLogoutId } = body;

    if (!deviceToLogoutId) {
      return NextResponse.json(
        { message: "deviceToLogoutId is required" },
        { status: 400 }
      );
    }

    // Get the new device info from session
    const newDevice = session.newDeviceToAdd;
    if (!newDevice) {
      return NextResponse.json(
        { message: "No new device to add" },
        { status: 400 }
      );
    }

    // Delete the old device
    const { error: deleteError } = await supabaseAdmin
      .from("active_devices")
      .delete()
      .eq("device_id", deviceToLogoutId)
      .eq("user_id", auth0UserId);

    if (deleteError) {
      console.error("Failed to delete old device:", deleteError);
      throw deleteError;
    }

    // Insert the new device
    const { error: insertError } = await supabaseAdmin
      .from("active_devices")
      .insert({
        ...newDevice,
        logged_in_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error("Failed to insert new device:", insertError);
      throw insertError;
    }

    // Update session to include deviceId and remove flags
    session.deviceId = newDevice.device_id;
    session.needsDeviceManagement = false;
    session.newDeviceToAdd = null;

    return NextResponse.json({ 
      success: true,
      message: "Device swapped successfully" 
    });

  } catch (error: any) {
    console.error("Error in devices/swap:", error);
    return NextResponse.json(
      { message: "Failed to swap devices", error: error.message },
      { status: 500 }
    );
  }
});

