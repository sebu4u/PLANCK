import { createClient } from "@supabase/supabase-js"
import { notFound } from "next/navigation"
import ProblemDetailClient from "@/app/probleme/[id]/ProblemDetailClient"
import { dynamicTitleSegment, pageTitle } from "@/lib/metadata"
import { MATH_PROBLEMS_SOLVE_COLUMNS } from "@/data/math-problems"
import { mathProblemRowToProblem } from "@/lib/math-problem-to-learning-path-problem"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables")
}

export const revalidate = 604800

interface MathProblemDetailPageProps {
  params: Promise<{ id: string }>
}

const mathCategoryIcons: Record<string, string> = {
  Matematică: "🧮",
}

const difficultyColors = {
  Ușor: "border-green-500 text-green-600 bg-green-50",
  Mediu: "border-yellow-500 text-yellow-600 bg-yellow-50",
  Avansat: "border-red-500 text-red-600 bg-red-50",
}

function normalizeTags(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw
      .filter((t): t is string => typeof t === "string")
      .map((t) => t.trim())
      .filter(Boolean)
  }
  return []
}

async function fetchProblem(id: string) {
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  const { data, error } = await supabase
    .from("math_problems")
    .select(MATH_PROBLEMS_SOLVE_COLUMNS)
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle()

  if (error || !data) {
    return null
  }

  return {
    ...data,
    tags: normalizeTags(data.tags),
  }
}

export async function generateMetadata(props: MathProblemDetailPageProps) {
  const { id: rawId } = await props.params
  const id = decodeURIComponent(rawId ?? "").trim()
  const problem = id ? await fetchProblem(id) : null

  if (!problem) {
    return { title: pageTitle('Problemă negăsită') }
  }

  return {
    title: dynamicTitleSegment(problem.title),
    description: problem.description || problem.statement.slice(0, 160),
  }
}

export default async function MathProblemDetailPage(props: MathProblemDetailPageProps) {
  const { id: rawId } = await props.params
  const id = decodeURIComponent(rawId ?? "").trim()
  if (!id) {
    notFound()
  }

  const problem = await fetchProblem(id)
  if (!problem) {
    notFound()
  }

  const detailProblem = mathProblemRowToProblem(problem)
  const categoryIcons = {
    ...mathCategoryIcons,
    ...(problem.chapter?.trim() ? { [problem.chapter.trim()]: "🧮" } : {}),
  }

  return (
    <div className="bg-[#f6f5f4]">
      <ProblemDetailClient
        problem={detailProblem}
        categoryIcons={categoryIcons}
        difficultyColors={difficultyColors}
        subject="math"
      />
    </div>
  )
}
