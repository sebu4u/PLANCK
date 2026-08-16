import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAccessTokenFromRequest, isAdminFromDB } from "@/lib/admin-check"
import { isJwtExpired } from "@/lib/auth-validate"
import { createServerClientWithToken } from "@/lib/supabaseServer"
import { getServiceRoleSupabase } from "@/lib/supabaseServiceRole"
import { logger } from "@/lib/logger"
import {
  CONTENT_REPORTS_BUCKET,
  CONTENT_REPORT_STATUSES,
  isContentReportSourceType,
  isContentReportStatus,
  type ContentReportRow,
} from "@/lib/content-reports"

async function verifyAdmin(req: NextRequest) {
  const accessToken = getAccessTokenFromRequest(req.headers.get("authorization"))
  if (!accessToken) {
    return { error: NextResponse.json({ error: "Necesită autentificare." }, { status: 401 }) }
  }
  if (isJwtExpired(accessToken)) {
    return { error: NextResponse.json({ error: "Sesiune expirată." }, { status: 401 }) }
  }

  const supabaseUser = createServerClientWithToken(accessToken)
  const {
    data: { user },
    error,
  } = await supabaseUser.auth.getUser()
  if (error || !user) {
    return { error: NextResponse.json({ error: "Sesiune invalidă." }, { status: 401 }) }
  }
  if (!(await isAdminFromDB(supabaseUser, user))) {
    return { error: NextResponse.json({ error: "Acces interzis." }, { status: 403 }) }
  }

  return { userId: user.id }
}

const patchSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(CONTENT_REPORT_STATUSES).optional(),
  admin_notes: z.string().max(4000).nullable().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAdmin(req)
    if ("error" in auth) return auth.error

    const url = new URL(req.url)
    const statusFilter = url.searchParams.get("status")
    const sourceTypeFilter = url.searchParams.get("source_type")
    const idFilter = url.searchParams.get("id")

    const service = getServiceRoleSupabase()
    let query = service
      .from("content_reports")
      .select(
        "id, user_id, created_at, issue_type, description, screenshot_path, source_type, source_id, source_url, source_meta, status, admin_notes, resolved_at, resolved_by",
      )
      .order("created_at", { ascending: false })
      .limit(200)

    if (idFilter) {
      query = query.eq("id", idFilter)
    }
    if (statusFilter && isContentReportStatus(statusFilter)) {
      query = query.eq("status", statusFilter)
    }
    if (sourceTypeFilter && isContentReportSourceType(sourceTypeFilter)) {
      query = query.eq("source_type", sourceTypeFilter)
    }

    const { data, error } = await query
    if (error) {
      logger.error("[admin/content-reports] list:", error)
      return NextResponse.json({ error: "Nu am putut încărca rapoartele." }, { status: 500 })
    }

    const reports = (data ?? []) as ContentReportRow[]
    const userIds = [...new Set(reports.map((row) => row.user_id))]
    const reporterById = new Map<string, { name: string | null; nickname: string | null; email: string | null }>()

    if (userIds.length > 0) {
      const { data: profiles } = await service
        .from("profiles")
        .select("user_id, name, nickname")
        .in("user_id", userIds)

      for (const profile of profiles ?? []) {
        reporterById.set(profile.user_id as string, {
          name: (profile.name as string | null) ?? null,
          nickname: (profile.nickname as string | null) ?? null,
          email: null,
        })
      }

      await Promise.all(
        userIds.map(async (userId) => {
          try {
            const { data: authUser } = await service.auth.admin.getUserById(userId)
            const existing = reporterById.get(userId) ?? { name: null, nickname: null, email: null }
            reporterById.set(userId, {
              ...existing,
              email: authUser.user?.email ?? null,
            })
          } catch {
            // skip
          }
        }),
      )
    }

    const signedByPath = new Map<string, string>()
    await Promise.all(
      reports.map(async (row) => {
        const { data: signed, error: signedError } = await service.storage
          .from(CONTENT_REPORTS_BUCKET)
          .createSignedUrl(row.screenshot_path, 60 * 60)
        if (signedError || !signed?.signedUrl) {
          logger.error("[admin/content-reports] signed url:", signedError)
          return
        }
        signedByPath.set(row.screenshot_path, signed.signedUrl)
      }),
    )

    return NextResponse.json({
      reports: reports.map((row) => ({
        ...row,
        screenshot_url: signedByPath.get(row.screenshot_path) ?? null,
        reporter: reporterById.get(row.user_id) ?? { name: null, nickname: null, email: null },
      })),
    })
  } catch (error) {
    logger.error("[admin/content-reports] GET:", error)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await verifyAdmin(req)
    if ("error" in auth) return auth.error

    const body = patchSchema.safeParse(await req.json())
    if (!body.success) {
      return NextResponse.json({ error: "Datele sunt invalide." }, { status: 400 })
    }

    const updates: Record<string, unknown> = {}
    if (body.data.status) {
      updates.status = body.data.status
      if (body.data.status === "resolved" || body.data.status === "dismissed") {
        updates.resolved_at = new Date().toISOString()
        updates.resolved_by = auth.userId
      } else {
        updates.resolved_at = null
        updates.resolved_by = null
      }
    }
    if (body.data.admin_notes !== undefined) {
      updates.admin_notes = body.data.admin_notes
    }
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Nimic de actualizat." }, { status: 400 })
    }

    const service = getServiceRoleSupabase()
    const { error } = await service.from("content_reports").update(updates).eq("id", body.data.id)
    if (error) {
      logger.error("[admin/content-reports] patch:", error)
      return NextResponse.json({ error: "Nu am putut actualiza raportul." }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error("[admin/content-reports] PATCH:", error)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}
