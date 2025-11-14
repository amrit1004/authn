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
  // Try multiple possible user ID claim formats
  const auth0UserId = 
    (session as any).user?.[AUTH0_NAMESPACE + "/user_id"] ||
    (session as any).user?.user_id ||
    (session as any).user?.sub ||
    (session as any).user?.id;

  if (!auth0UserId) {
    // Log available user keys for debugging
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
    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("full_name, phone_number")
      .eq("user_id", auth0UserId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // Profile doesn't exist - return empty profile
        return NextResponse.json({
          full_name: null,
          phone_number: null
        });
      }
      console.error("Failed to fetch profile:", error);
      throw error;
    }

    // Return profile with null handling
    return NextResponse.json({
      full_name: profile?.full_name || null,
      phone_number: profile?.phone_number || null
    });

  } catch (error: any) {
    console.error("Error in user/profile:", error);
    return NextResponse.json(
      { message: "Failed to fetch profile", error: error.message },
      { status: 500 }
    );
  }
});

