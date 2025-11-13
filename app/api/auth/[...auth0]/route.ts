import {
  handleAuth,
  handleCallback,
  CallbackOptions,
  Session, // <-- Import the Session type
} from "@auth0/nextjs-auth0";
import { NextRequest } from "next/server"; // <-- Import NextRequest
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";
import { randomUUID } from "crypto";
import { ActiveDevice } from "@/app/lib/type"; 

const MAX_DEVICES = parseInt(process.env.MAX_CONCURRENT_DEVICES || "3");
const AUTH0_NAMESPACE = process.env.AUTH0_NAMESPACE!;

if (!AUTH0_NAMESPACE) {
  throw new Error("AUTH0_NAMESPACE is not set in .env.local");
}

const afterCallback = async (
  req: NextRequest, // <-- Explicitly type `req`
  session: Session,   // <-- Explicitly type `session`
  state: Record<string, unknown>
) => {
  const { user } = session;
  const auth0UserId = user[AUTH0_NAMESPACE + "/user_id"];

  if (!auth0UserId) {
    throw new Error("Auth0 user ID not found in session. Check Auth0 Action.");
  }

  // --- 1. Profile Completion Check ---
  // Fixed 'let' to 'const'
  const { data: profile, error: profileError } = await supabaseAdmin
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
    session.needsProfileCompletion = true;
  } else if (profile) {
    if (!profile.full_name || !profile.phone_number) {
      session.needsProfileCompletion = true;
    }
  } else if (profileError) {
    console.error("Failed to get profile:", profileError);
    throw profileError;
  }

  // --- 2. Device Session Check ---
  const { error: deviceError, count } = await supabaseAdmin
    .from("active_devices")
    .select("device_id", { count: "exact" })
    .eq("user_id", auth0UserId);

  if (deviceError) {
    console.error("Failed to get device count:", deviceError);
    throw deviceError;
  }

  const deviceCount = count || 0;
  const newDeviceId = randomUUID();
  // TS now knows `req` is NextRequest, so `req.headers.get` is valid.
  const userAgent = req.headers.get("user-agent") || "Unknown";
  const ip = req.headers.get("x-forwarded-for") || "Unknown";

  const newDevice: ActiveDevice = {
    user_id: auth0UserId,
    device_id: newDeviceId,
    user_agent: userAgent,
    ip: ip,
  };

  if (deviceCount < MAX_DEVICES) {
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
    
    // All these properties are now type-safe
    session.deviceId = newDeviceId;
  } else {
    session.needsDeviceManagement = true;
    session.newDeviceToAdd = newDevice;
  }

  return session; // <-- We correctly return the modified session
};

export const GET = handleAuth({
  callback: handleCallback({
    // We pass our correctly typed function here
    afterCallback: afterCallback as unknown as CallbackOptions["afterCallback"],
  }),
});