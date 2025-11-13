import { getSession, withApiAuthRequired } from "@/app/lib/auth0Client";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";
import { NextResponse } from "next/server";

export const POST = withApiAuthRequired(async (req: Request) => {
  const session = await getSession(req as any, new NextResponse());
  
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
    const { fullName, phoneNumber } = body;

    if (!fullName || !phoneNumber) {
      return NextResponse.json(
        { message: "fullName and phoneNumber are required" },
        { status: 400 }
      );
    }

    // Check if profile exists
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("user_id")
      .eq("user_id", auth0UserId)
      .single();

    if (existingProfile) {
      // Update existing profile
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
      // Create new profile
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

    // Update session to remove needsProfileCompletion flag and persist it
    (session as any).needsProfileCompletion = false;
    try {
      // Persist the updated session back to cookies
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

