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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const accessToken = parseAccessToken(request);
  const authedSupabase = accessToken ? createServerClientWithToken(accessToken) : supabase;

  const { data: problem, error: problemError } = await supabase
    .from("coding_problems")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (problemError || !problem) {
    return NextResponse.json(
      { error: "Problem not found" },
      { status: 404 }
    );
  }

  const [monthlyFreeSet, userPlan] = await Promise.all([
    getMonthlyFreeProblemSet(supabase),
    resolvePlanForRequest(authedSupabase, accessToken),
  ]);

  const isFreeMonthly = monthlyFreeSet.has(problem.id);
  if (!isPaidPlan(userPlan)) {
    return NextResponse.json(
      { error: "Problem locked", code: "PROBLEM_LOCKED" },
      { status: 403 }
    );
  }

  const { data: examples, error: examplesError } = await supabase
    .from("coding_problem_examples")
    .select("*")
    .eq("problem_id", problem.id)
    .order("order_index", { ascending: true });

  if (examplesError) {
    console.error("[coding-problems/[slug]] Failed to load examples:", examplesError);
  }

  return NextResponse.json({
    problem: {
      ...problem,
      tags: Array.isArray(problem.tags) ? problem.tags : [],
      isFreeMonthly,
    },
    examples: examples ?? [],
  });
}

