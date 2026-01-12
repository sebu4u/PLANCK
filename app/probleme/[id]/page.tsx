import { notFound } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { supabase } from "@/lib/supabaseClient"
import { createClient } from "@supabase/supabase-js"
import { Problem } from "@/data/problems"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import ProblemDetailClient from "./ProblemDetailClient"
import { CatalogThemeProvider } from "@/components/catalog-theme-provider"
import { CatalogThemeBackground } from "@/components/catalog-theme-background"

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

// Enable ISR with revalidation every hour
export const revalidate = 3600
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

export default async function ProblemPage({ params }: ProblemPageProps) {
  const { id } = await params
  const problem = await getProblemFromSupabase(id)
  if (!problem) {
    notFound()
  }
  return (
    <CatalogThemeProvider catalogType="physics" pageType="detail">
      <CatalogThemeBackground defaultBackgroundClass="bg-[#141414]">
        <ProblemDetailClient problem={problem} categoryIcons={categoryIcons} difficultyColors={difficultyColors} />
      </CatalogThemeBackground>
    </CatalogThemeProvider>
  )
}
