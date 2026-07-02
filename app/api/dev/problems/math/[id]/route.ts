import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { logger } from "@/lib/logger"
import { requireDevSession } from "@/lib/dev-api-session"

function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error("Missing Supabase service role configuration.")
  }
  return createClient(url, key)
}

/**
 * PATCH — editare rapidă (doar admin) a unei probleme de matematică.
 * Permite actualizarea câmpurilor `title` (enunț scurt) și `statement` (enunț complet).
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireDevSession(req.headers)
    if (auth instanceof NextResponse) return auth
    if (!auth.permissions.isAdmin) {
      return NextResponse.json({ error: "Editarea este permisă doar adminilor." }, { status: 403 })
    }

    const { id: rawId } = await params
    const id = rawId?.trim()
    if (!id) {
      return NextResponse.json({ error: "ID lipsă." }, { status: 400 })
    }

    const body = (await req.json()) as Record<string, unknown>

    const update: Record<string, unknown> = {}

    if (body.title !== undefined) {
      const title = typeof body.title === "string" ? body.title.trim() : ""
      if (!title) {
        return NextResponse.json({ error: "Titlul nu poate fi gol." }, { status: 400 })
      }
      update.title = title
    }

    if (body.statement !== undefined) {
      const statement = typeof body.statement === "string" ? body.statement.trim() : ""
      if (!statement) {
        return NextResponse.json({ error: "Enunțul nu poate fi gol." }, { status: 400 })
      }
      update.statement = statement
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "Nimic de actualizat." }, { status: 400 })
    }

    const service = createServiceClient()
    const { data, error } = await service
      .from("math_problems")
      .update(update)
      .eq("id", id)
      .select("id, title, statement")
      .maybeSingle()

    if (error) {
      logger.error("[dev/problems/math/[id]] PATCH update:", error)
      return NextResponse.json(
        { error: error.message || "Nu am putut actualiza problema." },
        { status: 500 }
      )
    }
    if (!data) {
      return NextResponse.json({ error: "Problema nu există." }, { status: 404 })
    }

    return NextResponse.json({ success: true, problem: data })
  } catch (e) {
    logger.error("[dev/problems/math/[id]] PATCH:", e)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}
