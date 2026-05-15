import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { email, password, full_name, role } = body;

    if (!email || !password || !full_name) {
      return NextResponse.json(
        { error: "Email, password and full name are required." },
        { status: 400 }
      );
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const userId = data.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: "User created but no user ID returned." },
        { status: 400 }
      );
    }

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: userId,
        full_name,
        role: role || "staff",
        trade: "Joinery",
      });

    if (profileError) {
      return NextResponse.json(
        { error: profileError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Staff login created successfully.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Unknown server error." },
      { status: 500 }
    );
  }
}