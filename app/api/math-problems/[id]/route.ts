import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { logger } from "@/lib/logger"

import { MATH_PROBLEMS_PUBLIC_COLUMNS } from "@/data/math-problems"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables")
}

const PUBLIC_MATH_SELECT = MATH_PROBLEMS_PUBLIC_COLUMNS

function normalizeTags(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw
      .filter((t): t is string => typeof t === "string")
      .map((t) => t.trim())
      .filter(Boolean)
  }
  return []
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: rawId } = await params
  const id = decodeURIComponent(rawId ?? "").trim()
  if (!id) {
    return NextResponse.json({ error: "ID invalid." }, { status: 400 })
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  const { data, error } = await supabase
    .from("math_problems")
    .select(PUBLIC_MATH_SELECT)
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle()

  if (error) {
    logger.error("[math-problems/id] Query error:", error)
    return NextResponse.json(
      { error: "Nu am putut încărca problema." },
      { status: 500 }
    )
  }

  if (!data) {
    return NextResponse.json({ error: "Problema nu a fost găsită." }, { status: 404 })
  }

  return NextResponse.json({
    problem: {
      ...data,
      tags: normalizeTags(data.tags),
    },
  })
}
