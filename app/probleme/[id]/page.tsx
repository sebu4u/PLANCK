import { notFound } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { supabase } from "@/lib/supabaseClient"
import { Problem } from "@/data/problems"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import ProblemDetailClient from "./ProblemDetailClient"

interface ProblemPageProps {
  params: {
    id: string
  }
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

async function getProblemFromSupabase(id: string): Promise<Problem | null> {
  const { data, error } = await supabase.from("problems").select("*").eq("id", id).single()
  if (error || !data) return null
  return data as Problem
}

export default async function ProblemPage({ params }: ProblemPageProps) {
  const problem = await getProblemFromSupabase(params.id)
  if (!problem) {
    notFound()
  }
  return <ProblemDetailClient problem={problem} categoryIcons={categoryIcons} difficultyColors={difficultyColors} />
}
