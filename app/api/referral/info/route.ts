import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Initialize Supabase client with service role for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")

    if (!code) {
      return NextResponse.json(
        { valid: false, error: "Missing referral code" },
        { status: 400 }
      )
    }

    // Look up the referrer by their referral code
    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("user_id, name, nickname")
      .eq("referral_code", code.toUpperCase())
      .single()

    if (error || !profile) {
      return NextResponse.json(
        { valid: false, error: "Invalid referral code" },
        { status: 404 }
      )
    }

    // Return referrer info (but not sensitive data)
    return NextResponse.json({
      valid: true,
      referrer: {
        name: profile.name || profile.nickname || "Un prieten",
        nickname: profile.nickname,
      },
    })
  } catch (error) {
    console.error("[referral/info] Error:", error)
    return NextResponse.json(
      { valid: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
