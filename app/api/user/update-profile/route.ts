import { getSession, withApiAuthRequired } from "@/app/lib/auth0Client";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";
import { NextResponse } from "next/server";

export const POST = withApiAuthRequired(async (req: Request) => {
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
    return NextResponse.json(
      { message: "User ID not found" },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();
    const { fullName, phoneNumber } = body;

    if (!fullName || !phoneNumber) {
      return NextResponse.json(
        { message: "fullName and phoneNumber are required" },
        { status: 400 }
      );
    }

    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("user_id")
      .eq("user_id", auth0UserId)
      .single();

    if (existingProfile) {
      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({
          full_name: fullName,
          phone_number: phoneNumber,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", auth0UserId);

      if (updateError) {
        console.error("Failed to update profile:", updateError);
        throw updateError;
      }
    } else {
      const { error: insertError } = await supabaseAdmin
        .from("profiles")
        .insert({
          user_id: auth0UserId,
          full_name: fullName,
          phone_number: phoneNumber,
        });

      if (insertError) {
        console.error("Failed to create profile:", insertError);
        throw insertError;
      }
    }

    (session as any).needsProfileCompletion = false;
    try {
      const res = new NextResponse();
      await (await import("@/app/lib/auth0Client")).updateSession(req as any, res as any, session as any);
    } catch (err) {
      console.error("Failed to persist updated session:", err);
    }

    return NextResponse.json({ 
      success: true,
      message: "Profile updated successfully" 
    });

  } catch (error: any) {
    console.error("Error in user/update-profile:", error);
    return NextResponse.json(
      { message: "Failed to update profile", error: error.message },
      { status: 500 }
    );
  }
});

