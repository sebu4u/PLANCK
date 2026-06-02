import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { logger } from "@/lib/logger"
import { requireDevSession } from "@/lib/dev-api-session"
import { buildInformaticsProblemRow } from "@/lib/dev-informatics-problem"

function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error("Missing Supabase service role configuration.")
  }
  return createClient(url, key)
}

/** GET — problemă completă + teste (dev). PATCH — actualizează toate câmpurile. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const auth = await requireDevSession(req.headers)
    if (auth instanceof NextResponse) return auth

    const { slug: rawSlug } = await params
    const slug = rawSlug?.trim().toLowerCase()
    if (!slug) {
      return NextResponse.json({ error: "Slug lipsă." }, { status: 400 })
    }

    const service = createServiceClient()
    const { data: problem, error } = await service
      .from("coding_problems")
      .select("*")
      .eq("slug", slug)
      .maybeSingle()

    if (error) {
      logger.error("[dev/problems/[slug]] GET problem:", error)
      return NextResponse.json({ error: "Nu am putut încărca problema." }, { status: 500 })
    }
    if (!problem) {
      return NextResponse.json({ error: "Problema nu există." }, { status: 404 })
    }

    const { data: tests, error: testsError } = await service
      .from("coding_problem_tests")
      .select("stdin, expected_stdout, is_sample, weight, order_index")
      .eq("problem_id", problem.id)
      .order("order_index", { ascending: true })

    if (testsError) {
      logger.error("[dev/problems/[slug]] GET tests:", testsError)
      return NextResponse.json({ error: "Nu am putut încărca testele." }, { status: 500 })
    }

    return NextResponse.json({ problem, tests: tests ?? [] })
  } catch (e) {
    logger.error("[dev/problems/[slug]] GET:", e)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const auth = await requireDevSession(req.headers)
    if (auth instanceof NextResponse) return auth

    const { slug: rawSlug } = await params
    const currentSlug = rawSlug?.trim().toLowerCase()
    if (!currentSlug) {
      return NextResponse.json({ error: "Slug lipsă." }, { status: 400 })
    }

    const body = (await req.json()) as Record<string, unknown>
    const parsed = buildInformaticsProblemRow(body)
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.message }, { status: 400 })
    }

    const service = createServiceClient()
    const { data: existing, error: findError } = await service
      .from("coding_problems")
      .select("id, slug")
      .eq("slug", currentSlug)
      .maybeSingle()

    if (findError) {
      logger.error("[dev/problems/[slug]] PATCH find:", findError)
      return NextResponse.json({ error: "Nu am putut găsi problema." }, { status: 500 })
    }
    if (!existing) {
      return NextResponse.json({ error: "Problema nu există." }, { status: 404 })
    }

    const newSlug = parsed.row.slug as string
    if (newSlug !== currentSlug) {
      const { data: slugConflict } = await service
        .from("coding_problems")
        .select("id")
        .eq("slug", newSlug)
        .neq("id", existing.id)
        .maybeSingle()
      if (slugConflict) {
        return NextResponse.json({ error: "Slug-ul este deja folosit de altă problemă." }, { status: 400 })
      }
    }

    const { data: updated, error: updateError } = await service
      .from("coding_problems")
      .update(parsed.row)
      .eq("id", existing.id)
      .select("id, slug, title")
      .single()

    if (updateError) {
      logger.error("[dev/problems/[slug]] PATCH update:", updateError)
      return NextResponse.json(
        { error: updateError.message || "Nu am putut actualiza problema." },
        { status: 500 }
      )
    }

    const { error: deleteTestsError } = await service
      .from("coding_problem_tests")
      .delete()
      .eq("problem_id", existing.id)

    if (deleteTestsError) {
      logger.error("[dev/problems/[slug]] PATCH delete tests:", deleteTestsError)
      return NextResponse.json({ error: "Nu am putut actualiza testele." }, { status: 500 })
    }

    const testRows = parsed.tests.map((t) => ({
      problem_id: existing.id,
      stdin: t.stdin,
      expected_stdout: t.expected_stdout,
      is_sample: t.is_sample,
      weight: t.weight,
      order_index: t.order_index,
    }))

    const { error: insertTestsError } = await service.from("coding_problem_tests").insert(testRows)
    if (insertTestsError) {
      logger.error("[dev/problems/[slug]] PATCH insert tests:", insertTestsError)
      return NextResponse.json(
        { error: insertTestsError.message || "Nu am putut salva testele." },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      problem: updated,
      tests_count: testRows.length,
      slug_changed: newSlug !== currentSlug,
    })
  } catch (e) {
    logger.error("[dev/problems/[slug]] PATCH:", e)
    return NextResponse.json({ error: "Eroare internă." }, { status: 500 })
  }
}
