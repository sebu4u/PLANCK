import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { logger } from "@/lib/logger"
import { isPracticeSubjectId } from "@/lib/practice-subject"
import {
  isPracticeTestDifficulty,
  normalizeTestRow,
  toListItem,
} from "@/lib/practice-tests"

function createAnonClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    throw new Error("Missing Supabase anon configuration.")
  }
  return createClient(url, anonKey)
}

/**
 * GET /api/teste — listă teste publicate cu filtre
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const subject = searchParams.get("subject")
    const classParam = searchParams.get("class")
    const chapter = searchParams.get("chapter")?.trim()
    const difficulty = searchParams.get("difficulty")

    const supabase = createAnonClient()
    let query = supabase
      .from("practice_tests")
      .select(
        "id, title, description, subject, class, chapter, difficulty, time_limit_seconds, items, is_published, created_at, updated_at",
      )
      .eq("is_published", true)
      .order("created_at", { ascending: false })

    if (subject && isPracticeSubjectId(subject)) {
      query = query.eq("subject", subject)
    }
    if (classParam) {
      const classNum = Number.parseInt(classParam, 10)
      if ([9, 10, 11, 12].includes(classNum)) {
        query = query.eq("class", classNum)
      }
    }
    if (chapter) {
      query = query.eq("chapter", chapter)
    }
    if (difficulty && isPracticeTestDifficulty(difficulty)) {
      query = query.eq("difficulty", difficulty)
    }

    const { data, error } = await query
    if (error) {
      logger.error("[api/teste] list error:", error)
      return NextResponse.json({ error: "Nu am putut încărca testele." }, { status: 500 })
    }

    const tests = (data ?? [])
      .map((row) => normalizeTestRow(row as Record<string, unknown>))
      .filter((row): row is NonNullable<typeof row> => row !== null)
      .map(toListItem)

    return NextResponse.json(
      { tests },
      {
        headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
      },
    )
  } catch (err) {
    logger.error("[api/teste] GET error:", err)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}
