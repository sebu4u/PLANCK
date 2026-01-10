import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Initialize Supabase client with service role for admin operations
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { referral_code, referred_user_id } = body

        console.log("[referral/process] Processing referral:", { referral_code, referred_user_id })

        if (!referral_code || !referred_user_id) {
            return NextResponse.json(
                { success: false, error: "Missing required fields" },
                { status: 400 }
            )
        }

        const normalizedCode = referral_code.toUpperCase()

        // First, try using the RPC function
        try {
            const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc("process_referral", {
                p_referral_code: normalizedCode,
                p_referred_user_id: referred_user_id,
            })

            if (!rpcError && rpcData?.success) {
                console.log("[referral/process] RPC success:", rpcData)
                return NextResponse.json({
                    success: true,
                    message: "Referral processed successfully",
                    referral_id: rpcData.referral_id,
                })
            }

            if (rpcError) {
                console.log("[referral/process] RPC error, falling back to direct SQL:", rpcError.message)
            } else if (rpcData && !rpcData.success) {
                console.log("[referral/process] RPC returned error:", rpcData.error)
                return NextResponse.json(
                    { success: false, error: rpcData.error },
                    { status: 400 }
                )
            }
        } catch (rpcErr) {
            console.log("[referral/process] RPC exception, falling back to direct SQL:", rpcErr)
        }

        // Fallback: Direct SQL approach
        console.log("[referral/process] Using direct SQL approach")

        // 1. Find the referrer by their referral code
        const { data: referrerProfile, error: referrerError } = await supabaseAdmin
            .from("profiles")
            .select("user_id")
            .eq("referral_code", normalizedCode)
            .single()

        if (referrerError || !referrerProfile) {
            console.error("[referral/process] Referrer not found:", referrerError)
            return NextResponse.json(
                { success: false, error: "Invalid referral code" },
                { status: 404 }
            )
        }

        const referrerId = referrerProfile.user_id

        // 2. Check for self-referral
        if (referrerId === referred_user_id) {
            return NextResponse.json(
                { success: false, error: "Cannot refer yourself" },
                { status: 400 }
            )
        }

        // 3. Check if the referred user already has a referral record
        const { data: existingReferral } = await supabaseAdmin
            .from("referrals")
            .select("id")
            .eq("referred_id", referred_user_id)
            .single()

        if (existingReferral) {
            return NextResponse.json(
                { success: false, error: "User already referred" },
                { status: 400 }
            )
        }

        // 4. Create the referral record
        const { data: newReferral, error: insertError } = await supabaseAdmin
            .from("referrals")
            .insert({
                referrer_id: referrerId,
                referred_id: referred_user_id,
                credited: true,
                credited_at: new Date().toISOString(),
            })
            .select("id")
            .single()

        if (insertError) {
            console.error("[referral/process] Insert error:", insertError)
            return NextResponse.json(
                { success: false, error: "Failed to create referral record" },
                { status: 500 }
            )
        }

        // 5. Update the referred user's profile with referrer info
        await supabaseAdmin
            .from("profiles")
            .update({ referred_by: referrerId })
            .eq("user_id", referred_user_id)

        // 6. Credit the referrer with 1 month of Plus+
        // First get current value
        const { data: referrerStats } = await supabaseAdmin
            .from("profiles")
            .select("plus_months_remaining")
            .eq("user_id", referrerId)
            .single()

        const currentMonths = referrerStats?.plus_months_remaining || 0

        const { error: updateError } = await supabaseAdmin
            .from("profiles")
            .update({ plus_months_remaining: currentMonths + 1 })
            .eq("user_id", referrerId)

        if (updateError) {
            console.error("[referral/process] Update error:", updateError)
            // Don't fail the whole operation, the referral was created
        }

        console.log("[referral/process] Success! Referrer credited with +1 month")

        return NextResponse.json({
            success: true,
            message: "Referral processed successfully",
            referral_id: newReferral?.id,
        })
    } catch (error) {
        console.error("[referral/process] Error:", error)
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        )
    }
}
