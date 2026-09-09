import { NextRequest, NextResponse } from "next/server"
import { logger } from "@/lib/logger"
import { verifyEnrollToken } from "@/lib/pregatire/confirm-token"
import { getServiceRoleSupabase } from "@/lib/supabaseServiceRole"

/**
 * GET /api/pregatire/[id]/enroll?token=...
 * One-click workshop enrollment via signed token from marketing emails.
 * 
 * Token = HMAC-SHA256(userId:workshopId) using WORKSHOP_CONFIRM_SECRET or CRON_SECRET.
 * 
 * This route:
 * - Verifies the signed token
 * - Inserts workshop_unlocks for the user (idempotent)
 * - Does NOT charge energy (free Planck Week invite path)
 * - Auto-bumps max_seats by +10 if workshop is at capacity
 * - Redirects to success page with workshop details
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params
    const { searchParams } = new URL(req.url)
    const token = searchParams.get("token")

    if (!token) {
      const redirectUrl = new URL(`/pregatire/${id}/inscris`, req.url)
      redirectUrl.searchParams.set("error", "invalid_token")
      return NextResponse.redirect(redirectUrl, { status: 302 })
    }

    const verification = verifyEnrollToken(token, id)
    if (!verification.valid) {
      const errorType = verification.error === "secret_not_configured" ? "server_error" : "invalid_token"
      if (verification.error === "secret_not_configured") {
        logger.error("[pregatire/enroll] GET: WORKSHOP_CONFIRM_SECRET not configured")
      }
      const redirectUrl = new URL(`/pregatire/${id}/inscris`, req.url)
      redirectUrl.searchParams.set("error", errorType)
      return NextResponse.redirect(redirectUrl, { status: 302 })
    }

    const { userId, workshopId } = verification
    const supabase = getServiceRoleSupabase()

    // Verify user exists
    const { data: user, error: userError } = await supabase.auth.admin.getUserById(userId)
    if (userError || !user) {
      logger.error("[pregatire/enroll] user not found:", { userId, error: userError?.message })
      const redirectUrl = new URL(`/pregatire/${id}/inscris`, req.url)
      redirectUrl.searchParams.set("error", "user_not_found")
      return NextResponse.redirect(redirectUrl, { status: 302 })
    }

    // Check if unlock already exists (idempotent)
    const { data: existingUnlock } = await supabase
      .from("workshop_unlocks")
      .select("confirmed_at")
      .eq("user_id", userId)
      .eq("workshop_id", workshopId)
      .maybeSingle()

    if (existingUnlock) {
      // Already enrolled - set confirmed_at if not already set
      if (!existingUnlock.confirmed_at) {
        await supabase
          .from("workshop_unlocks")
          .update({ confirmed_at: new Date().toISOString() })
          .eq("user_id", userId)
          .eq("workshop_id", workshopId)
      }
      
      const redirectUrl = new URL(`/pregatire/${id}/inscris`, req.url)
      redirectUrl.searchParams.set("ok", "1")
      return NextResponse.redirect(redirectUrl, { status: 302 })
    }

    // Get workshop details
    const { data: workshop, error: workshopError } = await supabase
      .from("workshops")
      .select("id, title, max_seats, is_published")
      .eq("id", workshopId)
      .maybeSingle()

    if (workshopError || !workshop) {
      logger.error("[pregatire/enroll] workshop not found:", { workshopId, error: workshopError?.message })
      const redirectUrl = new URL(`/pregatire/${id}/inscris`, req.url)
      redirectUrl.searchParams.set("error", "workshop_not_found")
      return NextResponse.redirect(redirectUrl, { status: 302 })
    }

    if (!workshop.is_published) {
      const redirectUrl = new URL(`/pregatire/${id}/inscris`, req.url)
      redirectUrl.searchParams.set("error", "workshop_not_published")
      return NextResponse.redirect(redirectUrl, { status: 302 })
    }

    // Check capacity and bump if needed
    if (workshop.max_seats != null) {
      const { count } = await supabase
        .from("workshop_unlocks")
        .select("user_id", { count: "exact", head: true })
        .eq("workshop_id", workshopId)

      const currentUnlocks = count ?? 0

      if (currentUnlocks >= workshop.max_seats) {
        // Workshop is full - bump max_seats by +10
        const newMaxSeats = workshop.max_seats + 10
        const { error: updateError } = await supabase
          .from("workshops")
          .update({ max_seats: newMaxSeats })
          .eq("id", workshopId)

        if (updateError) {
          logger.error("[pregatire/enroll] failed to bump max_seats:", { 
            workshopId, 
            oldMax: workshop.max_seats,
            newMax: newMaxSeats,
            error: updateError.message 
          })
          const redirectUrl = new URL(`/pregatire/${id}/inscris`, req.url)
          redirectUrl.searchParams.set("error", "capacity_bump_failed")
          return NextResponse.redirect(redirectUrl, { status: 302 })
        }

        logger.info("[pregatire/enroll] bumped max_seats:", { 
          workshopId, 
          workshop: workshop.title,
          oldMax: workshop.max_seats,
          newMax: newMaxSeats,
          currentUnlocks 
        })
      }
    }

    // Insert workshop unlock with confirmed_at set
    const { error: insertError } = await supabase
      .from("workshop_unlocks")
      .insert({
        user_id: userId,
        workshop_id: workshopId,
        unlocked_at: new Date().toISOString(),
        confirmed_at: new Date().toISOString(),
      })

    if (insertError) {
      // Handle race condition (unique constraint violation)
      if (insertError.code === "23505") {
        logger.info("[pregatire/enroll] unlock race condition (duplicate):", { userId, workshopId })
        const redirectUrl = new URL(`/pregatire/${id}/inscris`, req.url)
        redirectUrl.searchParams.set("ok", "1")
        return NextResponse.redirect(redirectUrl, { status: 302 })
      }

      logger.error("[pregatire/enroll] unlock insert failed:", { 
        userId, 
        workshopId, 
        error: insertError.message 
      })
      const redirectUrl = new URL(`/pregatire/${id}/inscris`, req.url)
      redirectUrl.searchParams.set("error", "insert_failed")
      return NextResponse.redirect(redirectUrl, { status: 302 })
    }

    logger.info("[pregatire/enroll] enrolled successfully:", { 
      userId, 
      workshopId, 
      workshop: workshop.title 
    })

    const redirectUrl = new URL(`/pregatire/${id}/inscris`, req.url)
    redirectUrl.searchParams.set("ok", "1")
    return NextResponse.redirect(redirectUrl, { status: 302 })

  } catch (err) {
    logger.error("[pregatire/enroll] GET error:", err)
    const { id } = await context.params
    const redirectUrl = new URL(`/pregatire/${id}/inscris`, req.url)
    redirectUrl.searchParams.set("error", "server_error")
    return NextResponse.redirect(redirectUrl, { status: 302 })
  }
}
