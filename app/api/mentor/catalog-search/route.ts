import { NextRequest, NextResponse } from "next/server"
import { logger } from "@/lib/logger"
import { requireMentorSession } from "@/lib/mentor/session"
import {
  WORKSHOP_HOMEWORK_ITEM_TYPES,
  workshopHomeworkHref,
  type WorkshopHomeworkItemType,
} from "@/lib/pregatire/types"
import { getServiceRoleSupabase } from "@/lib/supabaseServiceRole"

function isHomeworkKind(value: string): value is WorkshopHomeworkItemType {
  return (WORKSHOP_HOMEWORK_ITEM_TYPES as readonly string[]).includes(value)
}

export async function GET(req: NextRequest) {
  try {
    const session = await requireMentorSession(req.headers)
    if (session instanceof NextResponse) return session

    const { searchParams } = new URL(req.url)
    const kind = (searchParams.get("kind") || "").trim()
    const search = (searchParams.get("search") || "").trim()

    if (!isHomeworkKind(kind)) {
      return NextResponse.json({ error: "Tipul de material este invalid." }, { status: 400 })
    }

    const supabase = getServiceRoleSupabase()

    if (kind === "grila_fizica" || kind === "grila_biologie") {
      let query = supabase
        .from("quiz_questions")
        .select("id, question_id, class, statement, title")
        .order("created_at", { ascending: false })
        .limit(40)

      if (kind === "grila_biologie") {
        query = query.eq("materie", "biologie")
      } else {
        query = query.or("materie.eq.fizica,materie.is.null")
      }

      if (search) {
        const escaped = search.replace(/[%_,]/g, "")
        query = query.or(`statement.ilike.%${escaped}%,question_id.ilike.%${escaped}%,title.ilike.%${escaped}%`)
      }

      const { data, error } = await query
      if (error) {
        logger.error("[mentor/catalog-search] quiz:", error)
        return NextResponse.json({ error: "Nu am putut căuta grilele." }, { status: 500 })
      }

      const hits = (data ?? []).map((row) => ({
        id: row.id,
        title: row.title?.trim() || row.question_id || row.id,
        subtitle: row.statement?.slice(0, 90) || (row.class != null ? `Clasa ${row.class}` : undefined),
        href: workshopHomeworkHref(kind, row.id),
      }))
      return NextResponse.json({ hits })
    }

    if (kind === "math_problem") {
      if (search.length < 2) return NextResponse.json({ hits: [] })
      const { data, error } = await supabase
        .from("math_problems")
        .select("id, title, class")
        .ilike("title", `%${search}%`)
        .order("created_at", { ascending: false })
        .limit(40)
      if (error) {
        logger.error("[mentor/catalog-search] math:", error)
        return NextResponse.json({ error: "Nu am putut căuta problemele." }, { status: 500 })
      }
      return NextResponse.json({
        hits: (data ?? []).map((row) => ({
          id: row.id,
          title: row.title?.trim() || row.id,
          subtitle: row.class != null ? `Clasa ${row.class}` : undefined,
          href: workshopHomeworkHref(kind, row.id),
        })),
      })
    }

    if (kind === "coding_problem") {
      if (search.length < 2) return NextResponse.json({ hits: [] })
      const { data, error } = await supabase
        .from("coding_problems")
        .select("id, slug, display_id, title, class")
        .eq("is_active", true)
        .ilike("title", `%${search}%`)
        .order("created_at", { ascending: false })
        .limit(40)
      if (error) {
        logger.error("[mentor/catalog-search] coding:", error)
        return NextResponse.json({ error: "Nu am putut căuta problemele." }, { status: 500 })
      }
      return NextResponse.json({
        hits: (data ?? [])
          .filter((row) => Boolean(row.slug))
          .map((row) => ({
            id: row.id,
            title: row.title?.trim() || row.display_id || row.id,
            subtitle: row.display_id || row.slug || (row.class != null ? `Clasa ${row.class}` : undefined),
            href: workshopHomeworkHref(kind, row.id, row.slug),
          })),
      })
    }

    if (search.length < 2) return NextResponse.json({ hits: [] })
    const { data, error } = await supabase
      .from("problems")
      .select("id, title, class")
      .ilike("title", `%${search}%`)
      .order("created_at", { ascending: false })
      .limit(40)
    if (error) {
      logger.error("[mentor/catalog-search] physics:", error)
      return NextResponse.json({ error: "Nu am putut căuta problemele." }, { status: 500 })
    }

    return NextResponse.json({
      hits: (data ?? []).map((row) => ({
        id: row.id,
        title: row.title?.trim() || row.id,
        subtitle: row.class != null ? `Clasa ${row.class}` : undefined,
        href: workshopHomeworkHref("physics_problem", row.id),
      })),
    })
  } catch (error) {
    logger.error("[mentor/catalog-search] GET:", error)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}
