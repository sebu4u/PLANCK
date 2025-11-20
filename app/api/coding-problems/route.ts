import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getMonthlyFreeProblemSet } from "@/lib/monthly-free-rotation";
import { isPaidPlan } from "@/lib/subscription-plan";
import { parseAccessToken, resolvePlanForRequest } from "@/lib/subscription-plan-server";
import { createServerClientWithToken } from "@/lib/supabaseServer";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

const SUPPORTED_DIFFICULTIES: Record<string, string> = {
  "ușor": "Ușor",
  "usor": "Ușor",
  "mediu": "Mediu",
  "avansat": "Avansat",
  "concurs": "Concurs",
};

const CLASS_VALUES = new Set([9, 10, 11, 12]);
const MAX_PAGE_SIZE = 50;
const DEFAULT_PAGE_SIZE = 12;

export async function GET(request: NextRequest) {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const accessToken = parseAccessToken(request);
  const authedSupabase =
    accessToken !== undefined ? createServerClientWithToken(accessToken) : supabase;
  const { searchParams } = new URL(request.url);

  const pageParam = parseInt(searchParams.get("page") ?? "1", 10);
  const pageSizeParam = parseInt(
    searchParams.get("pageSize") ?? `${DEFAULT_PAGE_SIZE}`,
    10
  );
  const classParam = searchParams.get("class");
  const difficultyParam = searchParams.get("difficulty");
  const chapterParam = searchParams.get("chapter");
  const searchParam = searchParams.get("search");
  const includeFacets = (searchParams.get("facets") ?? "true") !== "false";

  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const pageSize =
    Number.isFinite(pageSizeParam) && pageSizeParam > 0
      ? Math.min(pageSizeParam, MAX_PAGE_SIZE)
      : DEFAULT_PAGE_SIZE;

  const offset = (page - 1) * pageSize;

  const normalizedDifficulty =
    difficultyParam &&
    SUPPORTED_DIFFICULTIES[difficultyParam.trim().toLowerCase()];

  const normalizedClass =
    classParam !== null ? parseInt(classParam, 10) : undefined;
  const validClass =
    normalizedClass !== undefined && CLASS_VALUES.has(normalizedClass)
      ? normalizedClass
      : undefined;

  let query = supabase
    .from("coding_problems")
    .select("*", { count: "exact" })
    .eq("is_active", true);

  if (validClass !== undefined) {
    query = query.eq("class", validClass);
  }

  if (normalizedDifficulty) {
    query = query.eq("difficulty", normalizedDifficulty);
  }

  if (chapterParam) {
    query = query.eq("chapter", chapterParam.trim());
  }

  if (searchParam && searchParam.trim().length > 0) {
    const term = searchParam.trim();
    query = query.or(
      `title.ilike.%${term}%,statement_markdown.ilike.%${term}%`
    );
  }

  query = query
    .order("created_at", { ascending: false })
    .range(offset, offset + pageSize - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error("[coding-problems] Query error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch coding problems",
        details: error.message,
      },
      { status: 500 }
    );
  }

  let facets: {
    classes: Array<{ value: number; count: number }>;
    difficulties: Array<{ value: string; count: number }>;
    chaptersByClass: Record<string, string[]>;
  } | null = null;

  if (includeFacets) {
    const { data: facetRows, error: facetError } = await supabase
      .from("coding_problems")
      .select("class, difficulty, chapter", { count: "exact" })
      .eq("is_active", true);

    if (!facetError && facetRows) {
      const classCounts = new Map<number, number>();
      const difficultyCounts = new Map<string, number>();
      const chaptersByClass = new Map<number, Set<string>>();

      facetRows.forEach((row) => {
        const rowClass =
          typeof row.class === "number" && CLASS_VALUES.has(row.class)
            ? row.class
            : undefined;
        const rowDifficulty =
          typeof row.difficulty === "string"
            ? row.difficulty
            : undefined;
        const rowChapter =
          typeof row.chapter === "string" ? row.chapter : undefined;

        if (rowClass !== undefined) {
          classCounts.set(rowClass, (classCounts.get(rowClass) ?? 0) + 1);
          if (!chaptersByClass.has(rowClass)) {
            chaptersByClass.set(rowClass, new Set());
          }
          if (rowChapter) {
            chaptersByClass.get(rowClass)?.add(rowChapter);
          }
        }

        if (rowDifficulty) {
          const difficultyKey = rowDifficulty.toLowerCase();
          const canonical =
            SUPPORTED_DIFFICULTIES[difficultyKey] ?? rowDifficulty;
          difficultyCounts.set(
            canonical,
            (difficultyCounts.get(canonical) ?? 0) + 1
          );
        }
      });

      facets = {
        classes: Array.from(classCounts.entries())
          .sort(([a], [b]) => a - b)
          .map(([value, count]) => ({ value, count })),
        difficulties: Array.from(difficultyCounts.entries())
          .sort((a, b) => a[0].localeCompare(b[0], "ro"))
          .map(([value, count]) => ({ value, count })),
        chaptersByClass: Array.from(chaptersByClass.entries()).reduce<
          Record<string, string[]>
        >((acc, [cls, chapters]) => {
          acc[String(cls)] = Array.from(chapters).sort((a, b) =>
            a.localeCompare(b, "ro")
          );
          return acc;
        }, {}),
      };
    } else if (facetError) {
      console.error("[coding-problems] Facet error:", facetError);
    }
  }

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const monthlyFreeSet = await getMonthlyFreeProblemSet(supabase)
  const userPlan = await resolvePlanForRequest(authedSupabase, accessToken)
  const enriched = (data ?? []).map((item) => {
    const isFreeMonthly = monthlyFreeSet.has(item.id)
    const canAccess = isPaidPlan(userPlan)
    return {
      ...item,
      isFreeMonthly,
      canAccess,
    }
  })

  return NextResponse.json({
    data: enriched,
    meta: {
      page,
      pageSize,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
    facets,
  });
}

