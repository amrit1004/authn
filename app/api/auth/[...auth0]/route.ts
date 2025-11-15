import { Auth0Client } from "@auth0/nextjs-auth0/server";
import { NextRequest, NextResponse } from "next/server";
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
  req: NextRequest,
  session: any,
  state: Record<string, unknown>
) => {
  const { user } = session;
  const auth0UserId =
    user?.[AUTH0_NAMESPACE + "/user_id"] || user?.user_id || user?.sub || user?.id;

  if (!auth0UserId) {
    console.error("afterCallback: session missing expected user id claims:", {
      user:
        typeof user === "object"
          ? {
              keys: Object.keys(user),
            }
          : user,
    });
    throw new Error("Auth0 user ID not found in session. Check Auth0 Action or inspect session keys (see server logs).");
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("full_name, phone_number")
    .eq("user_id", auth0UserId)
    .single();

  if (profileError && profileError.code === "PGRST116") {
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

  const existingDeviceId = (session as any).deviceId;
  
  const { error: deviceError, data: existingDevices } = await supabaseAdmin
    .from("active_devices")
    .select("device_id")
    .eq("user_id", auth0UserId);

  if (deviceError) {
    console.error("Failed to get device count:", deviceError);
    throw deviceError;
  }

  const deviceCount = existingDevices?.length || 0;
  const isExistingDevice = existingDeviceId && existingDevices?.some((d: any) => d.device_id === existingDeviceId);
  
  const newDeviceId = randomUUID();
  const userAgent = req.headers.get("user-agent") || "Unknown";
  const ip = req.headers.get("x-forwarded-for") || "Unknown";

  const newDevice: ActiveDevice = {
    user_id: auth0UserId,
    device_id: newDeviceId,
    user_agent: userAgent,
    ip: ip,
  };

  if (isExistingDevice) {
    const { error: updateError } = await supabaseAdmin
      .from("active_devices")
      .update({
        user_agent: userAgent,
        ip: ip,
        logged_in_at: new Date().toISOString(),
      })
      .eq("device_id", existingDeviceId)
      .eq("user_id", auth0UserId);
      
    if (updateError) {
      console.error("Failed to update existing device:", updateError);
      throw updateError;
    }
    
    session.deviceId = existingDeviceId;
    delete (session as any).needsDeviceManagement;
    delete (session as any).newDeviceToAdd;
  } else if (deviceCount >= MAX_DEVICES) {
    session.needsDeviceManagement = true;
    session.newDeviceToAdd = newDevice;
    delete (session as any).deviceId;
  } else {
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
    
    session.deviceId = newDeviceId;
    delete (session as any).needsDeviceManagement;
    delete (session as any).newDeviceToAdd;
  }

  return session;
};

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
  const res = await auth0.middleware(req as any);

  try {
    const pathname = req.nextUrl.pathname;
    if (pathname.endsWith("/api/auth/callback") || pathname.endsWith("/auth/callback")) {
      const session = await auth0.getSession();
      if (session) {
        const updated = await afterCallback(req, session as any, {});
        if (updated) {
          await auth0.updateSession(req as any, res as any, updated as any);
          
          if ((updated as any).needsDeviceManagement) {
            const baseUrl = process.env.AUTH0_BASE_URL || req.nextUrl.origin;
            return NextResponse.redirect(new URL("/manage-devices", baseUrl));
          }
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
