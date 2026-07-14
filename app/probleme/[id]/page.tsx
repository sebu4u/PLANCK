import { cache } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { createClient } from "@supabase/supabase-js"
import type { Problem } from "@/data/problems"
import ProblemDetailClient from "./ProblemDetailClient"
import { baseMetadata, pageTitle } from "@/lib/metadata"
import { StructuredData } from "@/components/structured-data"
import {
  buildProblemKeywords,
  buildProblemMetaDescription,
  buildProblemPageTitle,
  buildProblemPlainExcerpt,
  problemEducationalLevel,
  stripMarkupForSeo,
} from "@/lib/physics-problem-seo"

interface ProblemPageProps {
  params: Promise<{
    id: string
  }>
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

const DEFAULT_OG_IMAGE = "https://i.ibb.co/DHgVg7gr/Untitled-design-4.png"

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

const getProblemCached = cache(getProblemFromSupabase)

export async function generateMetadata({ params }: ProblemPageProps): Promise<Metadata> {
  const { id } = await params
  const problem = await getProblemCached(id)
  if (!problem) {
    return { title: pageTitle('Problemă negăsită') }
  }

  const description = buildProblemMetaDescription(problem)
  const pageTitleAbsolute = buildProblemPageTitle(problem)
  const canonicalPath = `/probleme/${id}`
  const canonicalUrl = `https://www.planck.academy${canonicalPath}`
  const keywords = buildProblemKeywords(problem)

  const ogImage =
    typeof problem.image_url === "string" &&
    problem.image_url.trim() !== "" &&
    /^https?:\/\//i.test(problem.image_url.trim().replace(/^@/, ""))
      ? problem.image_url.trim().replace(/^@/, "")
      : DEFAULT_OG_IMAGE

  return {
    ...baseMetadata,
    title: { absolute: pageTitleAbsolute },
    description,
    keywords,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      ...baseMetadata.openGraph,
      title: pageTitleAbsolute,
      description,
      url: canonicalUrl,
      type: "article",
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      ...baseMetadata.twitter,
      title: pageTitleAbsolute,
      description,
      images: [ogImage],
    },
  }
}

function problemLearningResourceJsonLd(problem: Problem, pageUrl: string) {
  const level = problemEducationalLevel(problem)
  return {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: stripMarkupForSeo(problem.title) || `Problemă ${problem.id}`,
    description: buildProblemPlainExcerpt(problem, 500),
    url: pageUrl,
    inLanguage: "ro",
    learningResourceType: "Problemă de fizică",
    ...(level ? { educationalLevel: level } : {}),
    isPartOf: {
      "@type": "WebSite",
      name: "Planck Academy",
      url: "https://www.planck.academy",
    },
  }
}

export default async function ProblemPage({ params }: ProblemPageProps) {
  const { id } = await params
  const problem = await getProblemCached(id)
  if (!problem) {
    notFound()
  }

  const pageUrl = `https://www.planck.academy/probleme/${id}`
  return (
    <div className="bg-[#f6f5f4]">
      <StructuredData data={problemLearningResourceJsonLd(problem, pageUrl)} id={`problem-ld-json-${problem.id}`} />
      <ProblemDetailClient problem={problem} categoryIcons={categoryIcons} difficultyColors={difficultyColors} />
    </div>
  )
}
