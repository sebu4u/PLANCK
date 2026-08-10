import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { logger } from "@/lib/logger"
import { normalizeTestRow, toListItem } from "@/lib/practice-tests"
import { resolveParsedPublicItems } from "@/lib/practice-tests-server"

function createAnonClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    throw new Error("Missing Supabase anon configuration.")
  }
  return createClient(url, anonKey)
}

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * GET /api/teste/[id] — detaliu test publicat + items publice
 */
export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const { id: rawId } = await context.params
    const id = decodeURIComponent(rawId ?? "").trim()
    if (!id) {
      return NextResponse.json({ error: "ID invalid." }, { status: 400 })
    }

    const supabase = createAnonClient()
    const { data, error } = await supabase
      .from("practice_tests")
      .select(
        "id, title, description, subject, class, chapter, difficulty, time_limit_seconds, items, is_published, created_at, updated_at",
      )
      .eq("id", id)
      .eq("is_published", true)
      .maybeSingle()

    if (error) {
      logger.error("[api/teste/id] fetch error:", error)
      return NextResponse.json({ error: "Nu am putut încărca testul." }, { status: 500 })
    }
    if (!data) {
      return NextResponse.json({ error: "Testul nu a fost găsit." }, { status: 404 })
    }

    const row = normalizeTestRow(data as Record<string, unknown>)
    if (!row) {
      return NextResponse.json({ error: "Test invalid." }, { status: 500 })
    }

    const items = await resolveParsedPublicItems(supabase, row.items)

    return NextResponse.json({
      test: {
        ...toListItem(row),
        description: row.description,
      },
      items,
    })
  } catch (err) {
    logger.error("[api/teste/id] GET error:", err)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}
