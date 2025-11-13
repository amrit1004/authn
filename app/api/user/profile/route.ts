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
    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("full_name, phone_number")
      .eq("user_id", auth0UserId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // Profile doesn't exist
        return NextResponse.json(
          { message: "Profile not found" },
          { status: 404 }
        );
      }
      console.error("Failed to fetch profile:", error);
      throw error;
    }

    return NextResponse.json(profile);

  } catch (error: any) {
    console.error("Error in user/profile:", error);
    return NextResponse.json(
      { message: "Failed to fetch profile", error: error.message },
      { status: 500 }
    );
  }
});

