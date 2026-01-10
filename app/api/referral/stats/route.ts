import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Initialize Supabase client with service role for admin operations
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Generate a unique 8-character referral code
function generateReferralCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let result = ''
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
}

export async function GET(request: NextRequest) {
    try {
        // Get the authorization header
        const authHeader = request.headers.get("authorization")
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            )
        }

        const token = authHeader.split(" ")[1]

        // Verify the user
        const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(token)
        if (authError || !userData.user) {
            return NextResponse.json(
                { error: "Invalid token" },
                { status: 401 }
            )
        }

        const userId = userData.user.id

        // Get user's referral info
        let { data: profile, error: profileError } = await supabaseAdmin
            .from("profiles")
            .select("referral_code, plus_months_remaining")
            .eq("user_id", userId)
            .single()

        if (profileError || !profile) {
            return NextResponse.json(
                { error: "Profile not found" },
                { status: 404 }
            )
        }

        // If user doesn't have a referral code, generate one
        if (!profile.referral_code) {
            let newCode = generateReferralCode()
            let attempts = 0
            const maxAttempts = 10

            // Ensure uniqueness
            while (attempts < maxAttempts) {
                const { data: existing } = await supabaseAdmin
                    .from("profiles")
                    .select("user_id")
                    .eq("referral_code", newCode)
                    .single()

                if (!existing) break
                newCode = generateReferralCode()
                attempts++
            }

            // Update the profile with the new code
            const { error: updateError } = await supabaseAdmin
                .from("profiles")
                .update({ referral_code: newCode })
                .eq("user_id", userId)

            if (!updateError) {
                profile.referral_code = newCode
            }
        }

        // Count successful referrals
        const { count: referralCount, error: countError } = await supabaseAdmin
            .from("referrals")
            .select("*", { count: "exact", head: true })
            .eq("referrer_id", userId)
            .eq("credited", true)

        return NextResponse.json({
            referral_code: profile.referral_code,
            plus_months_remaining: profile.plus_months_remaining || 0,
            total_referrals: referralCount || 0,
        })
    } catch (error) {
        console.error("[referral/stats] Error:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
