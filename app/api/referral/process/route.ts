import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

import { createServerClientWithToken } from "@/lib/supabaseServer"
import { parseAccessToken } from "@/lib/subscription-plan-server"

const REFERRAL_WINDOW_MS = 30 * 60 * 1000

export async function POST(request: NextRequest) {
    const accessToken = parseAccessToken(request)
    if (!accessToken) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createServerClientWithToken(accessToken)
    const { data: userData, error: userErr } = await supabase.auth.getUser()
    if (userErr || !userData?.user) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const user = userData.user

    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    try {
        const body = await request.json()
        const { referral_code, referred_user_id } = body

        if (!referral_code || !referred_user_id) {
            return NextResponse.json(
                { success: false, error: "Missing required fields" },
                { status: 400 }
            )
        }

        if (referred_user_id !== user.id) {
            return NextResponse.json(
                { success: false, error: "Forbidden" },
                { status: 403 }
            )
        }

        const accountAgeMs = Date.now() - new Date(user.created_at).getTime()
        if (accountAgeMs > REFERRAL_WINDOW_MS) {
            return NextResponse.json(
                { success: false, error: "Referral window expired" },
                { status: 400 }
            )
        }

        const normalizedCode = referral_code.toUpperCase()

        const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc("process_referral", {
            p_referral_code: normalizedCode,
            p_referred_user_id: referred_user_id,
        })

        if (rpcError) {
            console.error("[referral/process] RPC error:", rpcError.message)
            return NextResponse.json(
                { success: false, error: "Failed to process referral" },
                { status: 500 }
            )
        }

        if (!rpcData?.success) {
            return NextResponse.json(
                { success: false, error: rpcData?.error ?? "Failed to process referral" },
                { status: 400 }
            )
        }

        return NextResponse.json({
            success: true,
            message: "Referral processed successfully",
            referral_id: rpcData.referral_id,
        })
    } catch (error) {
        console.error("[referral/process] Error:", error)
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        )
    }
}
