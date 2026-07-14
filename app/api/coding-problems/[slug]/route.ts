import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { CodingProblem } from "@/components/coding-problems/types";
import { parseAccessToken } from "@/lib/subscription-plan-server";
import { createServerClientWithToken } from "@/lib/supabaseServer";
import { logger } from "@/lib/logger";
import {
  applyCodingProblemPremiumGating,
  getActiveCodingProblemBySlug,
  isCodingProblemUnlocked,
  resolveCanAccessPremiumHints,
} from "@/lib/coding-problems-access";

// Server-side: access environment variables directly
// These are validated at build time in next.config.mjs
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const accessToken = parseAccessToken(request);
  const authedSupabase = accessToken ? createServerClientWithToken(accessToken) : supabase;

  const { data: problem, error: problemError } = await getActiveCodingProblemBySlug(supabase, slug);

  if (problemError || !problem) {
    return NextResponse.json(
      { error: "Problem not found" },
      { status: 404 }
    );
  }

  const { ok: unlocked, isFreeMonthly } = await isCodingProblemUnlocked(
    supabase,
    authedSupabase,
    accessToken,
    problem.id
  );
  if (!unlocked) {
    return NextResponse.json(
      { error: "Problem locked", code: "PROBLEM_LOCKED" },
      { status: 403 }
    );
  }

  const userPlan = await resolveCanAccessPremiumHints(authedSupabase, accessToken);
  const canAccessPremiumHints = userPlan;

  const { data: examples, error: examplesError } = await supabase
    .from("coding_problem_examples")
    .select("*")
    .eq("problem_id", problem.id)
    .order("order_index", { ascending: true });

  if (examplesError) {
    logger.error("[coding-problems/[slug]] Failed to load examples:", examplesError);
  }

  return NextResponse.json({
    problem: applyCodingProblemPremiumGating(
      {
        ...(problem as CodingProblem),
        tags: Array.isArray(problem.tags) ? problem.tags : [],
        isFreeMonthly,
      },
      canAccessPremiumHints
    ),
    examples: examples ?? [],
  });
}

