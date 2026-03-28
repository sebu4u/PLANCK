import { notFound } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { createClient } from "@supabase/supabase-js"
import { Problem } from "@/data/problems"
import ProblemDetailClient from "./ProblemDetailClient"
import type { Metadata } from "next"
import { StructuredData } from "@/components/structured-data"

interface ProblemPageProps {
  params: Promise<{
    id: string
  }>
}

type ProblemSeoFields = Problem & {
  slug?: string | null
  topic?: string | null
  grade?: string | number | null
  updated_at?: string | null
  tags?: string | string[] | null
}

const categoryIcons = {
  Mecanică: "🚀",
  Termodinamică: "🔥",
  Electricitate: "⚡",
  Optică: "🌟",
}

const difficultyColors = {
  Ușor: "border-green-500 text-green-600 bg-green-50",
  Mediu: "border-yellow-500 text-yellow-600 bg-yellow-50",
  Avansat: "border-red-500 text-red-600 bg-red-50",
}

// High-cardinality route: keep ISR, but revalidate rarely to reduce Vercel ISR writes.
export const revalidate = 604800 // 7 days
export const dynamicParams = true

// Pre-generate popular problem pages at build time
export async function generateStaticParams() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

  if (!supabaseUrl || !supabaseAnonKey) {
    return []
  }

  const serverSupabase = createClient(supabaseUrl, supabaseAnonKey)

  const { data } = await serverSupabase
    .from("problems")
    .select("id")
    .limit(200) // Pre-generate first 200 problems

  return (data || []).map((p) => ({ id: p.id }))
}

async function getProblemFromSupabase(id: string): Promise<Problem | null> {
  const { data, error } = await supabase.from("problems").select("*").eq("id", id).single()
  if (error || !data) return null
  return data as Problem
}

const canonicalBaseUrl = "https://www.planck.academy"

function normalizeTags(tags: unknown): string[] {
  if (Array.isArray(tags)) {
    return tags
      .map((tag) => (typeof tag === "string" ? tag.trim() : ""))
      .filter(Boolean)
  }

  if (typeof tags === "string") {
    return tags
      .split(/[;,|]/g)
      .map((tag) => tag.trim())
      .filter(Boolean)
  }

  return []
}

function extractStatementSnippet(statement?: string | null, maxLength = 100): string {
  if (!statement) return ""
  const compact = statement.replace(/\s+/g, " ").trim()
  if (compact.length <= maxLength) return compact
  return `${compact.slice(0, maxLength).trim()}...`
}

function resolveTopic(problem: ProblemSeoFields): string {
  if (typeof problem.topic === "string" && problem.topic.trim()) return problem.topic.trim()
  if (typeof problem.category === "string" && problem.category.trim()) return problem.category.trim()
  return "Fizică"
}

function resolveGrade(problem: ProblemSeoFields): string {
  if (typeof problem.grade === "number") return `clasa ${problem.grade}`
  if (typeof problem.grade === "string" && problem.grade.trim()) return problem.grade.trim()
  if (typeof problem.class === "number") return `clasa ${problem.class}`
  if (typeof problem.classString === "string" && problem.classString.trim()) return problem.classString.trim()
  return "liceu"
}

function resolveCanonicalPath(_problem: ProblemSeoFields, fallbackId: string): string {
  // Route is app/probleme/[id], so canonical must always target the ID URL.
  return `/probleme/${encodeURIComponent(fallbackId)}`
}

function resolveEducationalLevel(problem: ProblemSeoFields): string {
  if (typeof problem.class === "number" && problem.class >= 9 && problem.class <= 12) {
    return "HighSchool"
  }

  const gradeText = resolveGrade(problem).toLowerCase()
  if (/\b(9|10|11|12)\b/.test(gradeText)) {
    return "HighSchool"
  }

  return "HighSchool"
}

export async function generateMetadata({ params }: ProblemPageProps): Promise<Metadata> {
  const { id } = await params
  const problem = (await getProblemFromSupabase(id)) as ProblemSeoFields | null

  if (!problem) {
    return {
      title: "Problema nu a fost găsită | Planck",
      description: "Problema de fizică cerută nu a fost găsită pe Planck.",
      alternates: {
        canonical: `/probleme/${encodeURIComponent(id)}`,
      },
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  const topic = resolveTopic(problem)
  const grade = resolveGrade(problem)
  const tags = normalizeTags(problem.tags)
  const statementSnippet = extractStatementSnippet(problem.statement, 100)
  const canonicalPath = resolveCanonicalPath(problem, id)
  const canonicalUrl = `${canonicalBaseUrl}${canonicalPath}`
  const keywordGrade = /\b(9|10|11|12)\b/.exec(grade)?.[0] ?? "liceu"

  const descriptionParts = [
    `Problema ${problem.id} de fizică - ${topic}, ${grade}.`,
    statementSnippet,
    tags.length ? `Taguri: ${tags.join(", ")}.` : "",
    "Rezolvare pas cu pas pe Planck.",
  ].filter(Boolean)

  const keywords = [
    problem.id,
    `${problem.id} fizica`,
    `${problem.id} planck`,
    topic,
    ...tags,
    "probleme fizica bac",
    "probleme admitere fizica",
    "bac fizica",
    "admitere fizica",
    `probleme fizica clasa ${keywordGrade}`,
    `probleme ${topic.toLowerCase()}`,
  ]

  return {
    title: `${problem.title} | Planck - Probleme Fizică ${topic} ${grade}`,
    description: descriptionParts.join(" "),
    keywords,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      type: "article",
      locale: "ro_RO",
      url: canonicalUrl,
      siteName: "Planck Academy",
      title: `${problem.title} | Planck - Probleme Fizică ${topic} ${grade}`,
      description: descriptionParts.join(" "),
    },
    twitter: {
      card: "summary_large_image",
      title: `${problem.title} | Planck - Probleme Fizică ${topic} ${grade}`,
      description: descriptionParts.join(" "),
    },
  }
}

export default async function ProblemPage({ params }: ProblemPageProps) {
  const { id } = await params
  const problem = (await getProblemFromSupabase(id)) as ProblemSeoFields | null
  if (!problem) {
    notFound()
  }

  const topic = resolveTopic(problem)
  const grade = resolveGrade(problem)
  const tags = normalizeTags(problem.tags)
  const statementSnippet = extractStatementSnippet(problem.statement, 180)
  const breadcrumbText = `Acasă > Probleme > ${topic} > ${problem.id}`
  const canonicalPath = resolveCanonicalPath(problem, id)

  const learningResourceStructuredData = {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: problem.title,
    description: problem.statement || problem.description || "",
    educationalLevel: resolveEducationalLevel(problem),
    about: topic,
    inLanguage: "ro",
    provider: {
      "@type": "EducationalOrganization",
      name: "Planck",
      url: canonicalBaseUrl,
    },
    identifier: problem.id,
    keywords: tags,
    url: `${canonicalBaseUrl}${canonicalPath}`,
    learningResourceType: "PracticeProblem",
  }

  return (
    <div className="bg-[#f6f5f4]">
      <StructuredData
        id={`structured-data-problem-${problem.id}`}
        data={learningResourceStructuredData}
      />

      <section className="sr-only" aria-label="Metadate SEO problemă">
        <h1>{`${problem.title} (${problem.id})`}</h1>
        <p>{`Problemă de fizică pentru BAC și admitere - ${topic}, ${grade}.`}</p>
        <p>{`Breadcrumb: ${breadcrumbText}`}</p>
        <p>{`Nivel: ${grade}. Dificultate: ${problem.difficulty}.`}</p>
        <p>{`Taguri: ${tags.length ? tags.join(", ") : "fără taguri"}`}</p>
        {statementSnippet && <p>{`Enunț scurt: ${statementSnippet}`}</p>}
      </section>

      <ProblemDetailClient problem={problem} categoryIcons={categoryIcons} difficultyColors={difficultyColors} />
    </div>
  )
}
