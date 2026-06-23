import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { logger } from "@/lib/logger"
import type { MathProblemFacets } from "@/components/math-problems/types"

import { MATH_PROBLEMS_PUBLIC_COLUMNS } from "@/data/math-problems"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables")
}

const PUBLIC_MATH_SELECT = MATH_PROBLEMS_PUBLIC_COLUMNS

const SUPPORTED_DIFFICULTIES: Record<string, string> = {
  "ușor": "Ușor",
  usor: "Ușor",
  mediu: "Mediu",
  avansat: "Avansat",
}

const CLASS_VALUES = new Set([9, 10, 11, 12])
const MAX_PAGE_SIZE = 50
const DEFAULT_PAGE_SIZE = 12

function normalizeTags(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw
      .filter((t): t is string => typeof t === "string")
      .map((t) => t.trim())
      .filter(Boolean)
  }
  return []
}

export async function GET(request: NextRequest) {
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  const { searchParams } = new URL(request.url)

  const pageParam = parseInt(searchParams.get("page") ?? "1", 10)
  const pageSizeParam = parseInt(
    searchParams.get("pageSize") ?? `${DEFAULT_PAGE_SIZE}`,
    10
  )
  const classParam = searchParams.get("class")
  const difficultyParam = searchParams.get("difficulty")
  const searchParam = searchParams.get("search")
  const includeFacets = (searchParams.get("facets") ?? "true") !== "false"

  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1
  const pageSize =
    Number.isFinite(pageSizeParam) && pageSizeParam > 0
      ? Math.min(pageSizeParam, MAX_PAGE_SIZE)
      : DEFAULT_PAGE_SIZE

  const offset = (page - 1) * pageSize

  const normalizedDifficulty =
    difficultyParam &&
    SUPPORTED_DIFFICULTIES[difficultyParam.trim().toLowerCase()]

  const normalizedClass =
    classParam !== null ? parseInt(classParam, 10) : undefined
  const validClass =
    normalizedClass !== undefined && CLASS_VALUES.has(normalizedClass)
      ? normalizedClass
      : undefined

  let query = supabase
    .from("math_problems")
    .select(PUBLIC_MATH_SELECT, { count: "exact" })
    .eq("is_active", true)

  if (validClass !== undefined) {
    query = query.eq("class", validClass)
  }

  if (normalizedDifficulty) {
    query = query.eq("difficulty", normalizedDifficulty)
  }

  if (searchParam && searchParam.trim().length > 0) {
    const term = searchParam.trim()
    query = query.or(`title.ilike.%${term}%,statement.ilike.%${term}%`)
  }

  query = query
    .order("created_at", { ascending: false })
    .range(offset, offset + pageSize - 1)

  const { data, error, count } = await query

  if (error) {
    logger.error("[math-problems] Query error:", error)
    return NextResponse.json(
      {
        error: "Nu am putut încărca problemele de matematică.",
        details: error.message,
      },
      { status: 500 }
    )
  }

  let facets: MathProblemFacets | null = null

  if (includeFacets) {
    const { data: facetRows, error: facetError } = await supabase
      .from("math_problems")
      .select("class, difficulty", { count: "exact" })
      .eq("is_active", true)

    if (!facetError && facetRows) {
      const classCounts = new Map<number, number>()
      const difficultyCounts = new Map<string, number>()

      facetRows.forEach((row) => {
        const rowClass =
          typeof row.class === "number" && CLASS_VALUES.has(row.class)
            ? row.class
            : undefined
        const rowDifficulty =
          typeof row.difficulty === "string" ? row.difficulty : undefined

        if (rowClass !== undefined) {
          classCounts.set(rowClass, (classCounts.get(rowClass) ?? 0) + 1)
        }
        if (rowDifficulty) {
          const key = rowDifficulty.toLowerCase()
          const canonical = SUPPORTED_DIFFICULTIES[key] ?? rowDifficulty
          difficultyCounts.set(
            canonical,
            (difficultyCounts.get(canonical) ?? 0) + 1
          )
        }
      })

      facets = {
        classes: Array.from(classCounts.entries())
          .sort(([a], [b]) => a - b)
          .map(([value, c]) => ({ value, count: c })),
        difficulties: Array.from(difficultyCounts.entries())
          .sort((a, b) => a[0].localeCompare(b[0], "ro"))
          .map(([value, c]) => ({ value, count: c })),
      }
    } else if (facetError) {
      logger.error("[math-problems] Facet error:", facetError)
    }
  }

  const total = count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const normalized = (data ?? []).map((item) => ({
    ...item,
    tags: normalizeTags(item.tags),
  }))

  return NextResponse.json({
    data: normalized,
    meta: {
      page,
      pageSize,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
    facets,
  }, {
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
  })
}
