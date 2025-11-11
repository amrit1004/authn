import {
  handleAuth,
  handleCallback,
  CallbackOptions,
} from "@auth0/nextjs-auth0";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";
import { randomUUID } from "crypto";

const MAX_DEVICES = parseInt(process.env.MAX_CONCURRENT_DEVICES || "3");
const AUTH0_NAMESPACE = process.env.AUTH0_NAMESPACE!;

if (!AUTH0_NAMESPACE) {
  throw new Error("AUTH0_NAMESPACE is not set in .env.local");
}

const afterCallback: CallbackOptions["afterCallback"] = async (
  req,
  session,
  state
) => {
  const { user } = session;
  const auth0UserId = user[AUTH0_NAMESPACE + "/user_id"];

  if (!auth0UserId) {
    throw new Error("Auth0 user ID not found in session. Check Auth0 Action.");
  }

  // --- 1. Profile Completion Check ---
  let { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("full_name, phone_number")
    .eq("user_id", auth0UserId)
    .single();

  if (profileError && profileError.code === "PGRST116") {
    // Profile doesn't exist. Create it.
    const { error: insertError } = await supabaseAdmin
      .from("profiles")
      .insert({ user_id: auth0UserId });
    
    if (insertError) {
      console.error("Failed to create profile:", insertError);
      throw insertError;
    }
    
    // Since it's new, it's incomplete.
    session.needsProfileCompletion = true;
  } else if (profile) {
    // Profile exists, check if it's complete
    if (!profile.full_name || !profile.phone_number) {
      session.needsProfileCompletion = true;
    }
  } else if (profileError) {
    console.error("Failed to get profile:", profileError);
    throw profileError; // Other database error
  }

  // --- 2. Device Session Check ---
  const { data: devices, error: deviceError, count } = await supabaseAdmin
    .from("active_devices")
    .select("device_id", { count: "exact" }) // Just get the count
    .eq("user_id", auth0UserId);

  if (deviceError) {
    console.error("Failed to get device count:", deviceError);
    throw deviceError;
  }

  const deviceCount = count || 0;
  const newDeviceId = randomUUID();
  const userAgent = req.headers.get("user-agent") || "Unknown";
  const ip = req.headers.get("x-forwarded-for") || "Unknown";

  const newDevice = {
    user_id: auth0UserId,
    device_id: newDeviceId,
    user_agent: userAgent,
    ip: ip,
  };

  if (deviceCount < MAX_DEVICES) {
    // Slot available! Add the new device.
    const { error: insertError } = await supabaseAdmin
      .from("active_devices")
      .insert(newDevice);
      
    if (insertError) {
       console.error("Failed to insert new device:", insertError);
       throw insertError;
    }
    
    // Add the device ID to the user's session cookie
    session.deviceId = newDeviceId;
  } else {
    // Device limit reached (N+1)
    session.needsDeviceManagement = true;
    session.newDeviceToAdd = newDevice; // Store for later
  }

  return session;
};

export const GET = handleAuth({
  callback: handleCallback({
    afterCallback,
    redirectUri: "/private", // Always try to go to private page
  }),
});