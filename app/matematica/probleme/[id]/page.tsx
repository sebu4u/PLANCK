import { createClient } from "@supabase/supabase-js"
import { notFound } from "next/navigation"
import { MathProblemDetail } from "@/components/math-problems/math-problem-detail"
import { CatalogThemeProvider } from "@/components/catalog-theme-provider"
import { CatalogThemeBackground } from "@/components/catalog-theme-background"
import type { MathProblem } from "@/components/math-problems/types"
import { MATH_PROBLEMS_PUBLIC_COLUMNS } from "@/data/math-problems"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables")
}

export const revalidate = 604800

interface MathProblemDetailPageProps {
  params: Promise<{ id: string }>
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
    .select(MATH_PROBLEMS_PUBLIC_COLUMNS)
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle()

  if (error || !data) {
    return null
  }

  return {
    ...data,
    tags: normalizeTags(data.tags),
  } as MathProblem
}

export async function generateMetadata(props: MathProblemDetailPageProps) {
  const { id: rawId } = await props.params
  const id = decodeURIComponent(rawId ?? "").trim()
  const problem = id ? await fetchProblem(id) : null

  if (!problem) {
    return { title: "Problemă negăsită" }
  }

  return {
    title: `${problem.title} – Probleme de Matematică | PLANCK`,
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

  return (
    <CatalogThemeProvider catalogType="info">
      <CatalogThemeBackground defaultBackgroundClass="bg-[#070707]">
        <MathProblemDetail problem={problem} />
      </CatalogThemeBackground>
    </CatalogThemeProvider>
  )
}
