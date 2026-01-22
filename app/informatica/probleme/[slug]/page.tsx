import { CodingProblemDetailClient } from "@/components/coding-problems/problem-detail-client"
import { CodingProblem, CodingProblemExample } from "@/components/coding-problems/types"
import { createClient } from "@supabase/supabase-js"
import { notFound } from "next/navigation"


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables")
}

export const revalidate = 21600

interface CodingProblemDetailPageProps {
  params: Promise<{ slug: string }>
}

async function fetchProblemData(slug: string) {
  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  const { data: problem, error: problemError } = await supabase
    .from("coding_problems")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single()

  if (problemError || !problem) {
    return null
  }

  const { data: examples, error: examplesError } = await supabase
    .from("coding_problem_examples")
    .select("*")
    .eq("problem_id", problem.id)
    .order("order_index", { ascending: true })

  if (examplesError) {
    console.error("[coding-problems/[slug]] Failed to load examples:", examplesError)
  }

  return {
    problem: {
      ...problem,
      tags: Array.isArray(problem.tags) ? problem.tags : [],
    } as CodingProblem,
    examples: (examples ?? []) as CodingProblemExample[],
  }
}

async function doesProblemExist(slug: string) {
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  const { data } = await supabase
    .from("coding_problems")
    .select("id")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle()
  return Boolean(data)
}

export async function generateMetadata(props: CodingProblemDetailPageProps) {
  const params = await props.params
  const { slug } = params
  const data = await fetchProblemData(slug)

  if (!data) {
    return {
      title: "Problemă negăsită",
    }
  }

  return {
    title: `${data.problem.title} - Probleme de Informatică | PLANCK`,
    description: data.problem.requirement_markdown || data.problem.statement_markdown,
  }
}

export default async function CodingProblemDetailPage(props: CodingProblemDetailPageProps) {
  const params = await props.params
  const { slug } = params
  const exists = await doesProblemExist(slug)
  if (!exists) {
    notFound()
  }

  return <CodingProblemDetailClient slug={slug} />
}

