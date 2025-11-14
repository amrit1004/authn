import { Auth0Client } from "@auth0/nextjs-auth0/server";
import { NextRequest } from "next/server"; // <-- Import NextRequest
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";
import { randomUUID } from "crypto";
import { ActiveDevice } from "@/app/lib/type"; 

const MAX_DEVICES = parseInt(process.env.MAX_CONCURRENT_DEVICES || "3");

const AUTH0_NAMESPACE = (process.env.AUTH0_NAMESPACE || "").replace(/\/$/, "");


const requiredEnvVars = {
  AUTH0_SECRET: process.env.AUTH0_SECRET,
  AUTH0_BASE_URL: process.env.AUTH0_BASE_URL,
  AUTH0_ISSUER_BASE_URL: process.env.AUTH0_ISSUER_BASE_URL,
  AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID,
  AUTH0_CLIENT_SECRET: process.env.AUTH0_CLIENT_SECRET,
  AUTH0_NAMESPACE: AUTH0_NAMESPACE,
};

const missingEnvVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missingEnvVars.length > 0) {
  console.error("❌ Missing required environment variables:", missingEnvVars.join(", "));
  console.error("Please create a .env.local file with all required Auth0 configuration.");
  console.error("Current env vars:", {
    AUTH0_SECRET: process.env.AUTH0_SECRET ? "✓" : "✗",
    AUTH0_BASE_URL: process.env.AUTH0_BASE_URL || "✗",
    AUTH0_ISSUER_BASE_URL: process.env.AUTH0_ISSUER_BASE_URL || "✗",
    AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID ? "✓" : "✗",
    AUTH0_CLIENT_SECRET: process.env.AUTH0_CLIENT_SECRET ? "✓" : "✗",
    AUTH0_NAMESPACE: AUTH0_NAMESPACE || "✗",
  });
} else {
  console.log("✓ All Auth0 environment variables are set");
}

const afterCallback = async (
  req: NextRequest, // <-- Explicitly type `req`
  session: any,
  state: Record<string, unknown>
) => {
  const { user } = session;
  // Prefer the namespaced user id (if you added it via an Auth0 Action),
  // but fall back to available claims like `user_id` or `sub` so login still works.
  const auth0UserId =
    user?.[AUTH0_NAMESPACE + "/user_id"] || user?.user_id || user?.sub || user?.id;

  if (!auth0UserId) {
    // Debug: log the session server-side to inspect available claims during callback.
    // This is safe server-side but avoid logging in production with sensitive data.
    console.error("afterCallback: session missing expected user id claims:", {
      user:
        typeof user === "object"
          ? // redact some keys if present
            {
              keys: Object.keys(user),
            }
          : user,
    });
    throw new Error("Auth0 user ID not found in session. Check Auth0 Action or inspect session keys (see server logs).");
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

  console.log(`Device limit check: deviceCount=${deviceCount}, MAX_DEVICES=${MAX_DEVICES}`);

  // Only add device if user has fewer than MAX_DEVICES active devices
  if (deviceCount < MAX_DEVICES) {
    console.log(`Adding new device. Current count: ${deviceCount}, limit: ${MAX_DEVICES}`);
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
    console.log(`Device added successfully. deviceId: ${newDeviceId}`);
  } else {
    // User has reached the device limit - redirect to manage-devices page
    // User can choose which device to logout from the list
    console.log(`Device limit reached (${deviceCount} >= ${MAX_DEVICES}). Redirecting to device management.`);
    session.needsDeviceManagement = true;
    session.newDeviceToAdd = newDevice;
    // IMPORTANT: Do NOT add deviceId to session - user must manage devices first
  }

  return session; // <-- We correctly return the modified session
};

// Create an Auth0 client instance. We map env vars used in this project
// to the options expected by the SDK.
const domain =
  process.env.AUTH0_DOMAIN ||
  (process.env.AUTH0_ISSUER_BASE_URL || "").replace(/^https?:\/\//, "").replace(/\/$/, "") ||
  undefined;

const auth0 = new Auth0Client({
  domain,
  clientId: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  appBaseUrl: process.env.AUTH0_BASE_URL,
  secret: process.env.AUTH0_SECRET,
  routes: {
    login: "/api/auth/login",
    logout: "/api/auth/logout",
    callback: "/api/auth/callback",
    accessToken: "/api/auth/access-token",
  } as any,
  onCallback: undefined,
});

async function handleAuthRoute(req: NextRequest) {
  // Let the SDK process the request (login/logout/callback/profile/...)
  const res = await auth0.middleware(req as any);

  // If this was the callback route, run our afterCallback hook and persist any changes
  try {
    const pathname = req.nextUrl.pathname;
    if (pathname.endsWith("/api/auth/callback") || pathname.endsWith("/auth/callback")) {
      // Read the session - use getSession() without parameters to read from request cookies
      const session = await auth0.getSession();
      if (session) {
        const updated = await afterCallback(req, session as any, {});
        // Always update the session if afterCallback returned something
        // This ensures flags like needsDeviceManagement are persisted
        if (updated) {
          // Persist updated session back to cookies on the response from middleware
          // The response from middleware already has the session cookies, we just need to update them
          await auth0.updateSession(req as any, res as any, updated as any);
        }
      }
    }
  } catch (err) {
    console.error("afterCallback error:", err);
  }

  return res;
}

export const GET = handleAuthRoute;
export const POST = handleAuthRoute;
