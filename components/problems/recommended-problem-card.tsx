"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import type { Problem } from "@/data/problems"
import { supabase } from "@/lib/supabaseClient"
import { useAuth } from "@/components/auth-provider"

type ProblemLite = {
  id: string
  title: string
  tags: unknown
  difficulty?: string | null
  category?: string | null
}

function normalizeTags(tags: unknown): string[] {
  if (Array.isArray(tags)) {
    return tags
      .map((tag) => String(tag).trim())
      .filter(Boolean)
  }

  if (typeof tags === "string" && tags.trim()) {
    return tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)
  }

  return []
}

function hasSharedTag(currentTags: string[], candidateTags: string[]) {
  if (currentTags.length === 0 || candidateTags.length === 0) return false
  const currentSet = new Set(currentTags)
  return candidateTags.some((tag) => currentSet.has(tag))
}

export function RecommendedProblemCard({ currentProblem }: { currentProblem: Problem }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [recommended, setRecommended] = useState<ProblemLite | null>(null)

  const currentTags = useMemo(() => normalizeTags((currentProblem as unknown as { tags?: unknown }).tags), [currentProblem])

  useEffect(() => {
    let isCancelled = false

    const fetchRecommendation = async () => {
      if (currentTags.length === 0) {
        setRecommended(null)
        setLoading(false)
        return
      }

      setLoading(true)

      let solvedIds = new Set<string>()
      if (user?.id) {
        const { data: solvedData } = await supabase
          .from("solved_problems")
          .select("problem_id")
          .eq("user_id", user.id)

        solvedIds = new Set((solvedData || []).map((item) => item.problem_id))
      }

      const { data: problemsData, error } = await supabase
        .from("problems")
        .select("id, title, tags, difficulty, category")
        .order("created_at", { ascending: false })
        .limit(100)

      if (error || !problemsData) {
        if (!isCancelled) {
          setRecommended(null)
          setLoading(false)
        }
        return
      }

      const candidates = (problemsData as ProblemLite[]).filter((problem) => {
        if (problem.id === currentProblem.id) return false
        if (solvedIds.has(problem.id)) return false
        return hasSharedTag(currentTags, normalizeTags(problem.tags))
      })

      if (!isCancelled) {
        setRecommended(candidates.length > 0 ? candidates[Math.floor(Math.random() * candidates.length)] : null)
        setLoading(false)
      }
    }

    fetchRecommendation()

    return () => {
      isCancelled = true
    }
  }, [currentProblem.id, currentTags, user?.id])

  return (
    <div className="rounded-3xl border border-[#0b0d10]/10 bg-white/90 p-5 shadow-[0px_20px_50px_-40px_rgba(11,13,16,0.6)]">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#2C2F33]/60">Recomandare</p>
      <h2 className="mt-2 text-lg font-semibold text-[#0b0d10]">Ce să rezolvi mai departe</h2>

      {loading ? (
        <p className="mt-3 text-sm text-[#2C2F33]/70">Căutăm o problemă potrivită pentru tine...</p>
      ) : recommended ? (
        <div className="mt-4 rounded-2xl border border-[#0b0d10]/10 bg-white p-4">
          <p className="text-sm font-semibold text-[#0b0d10]">{recommended.title}</p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-[#2C2F33]/70">
            {recommended.difficulty && (
              <span className="rounded-full border border-[#0b0d10]/10 bg-[#f6f5f4] px-2 py-0.5">
                {recommended.difficulty}
              </span>
            )}
            {recommended.category && (
              <span className="rounded-full border border-[#0b0d10]/10 bg-[#f6f5f4] px-2 py-0.5">
                {recommended.category}
              </span>
            )}
          </div>
          <Link
            href={`/probleme/${recommended.id}`}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#2a2a2a] px-4 py-2 text-sm font-semibold text-[#f5f4f2] shadow-[0_4px_0_#050505] transition-[transform,box-shadow] hover:translate-y-1 hover:shadow-[0_1px_0_#050505] hover:bg-[#2a2a2a]"
          >
            Încearcă problema
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <p className="mt-3 text-sm text-[#2C2F33]/70">
          Nu am găsit momentan o problemă nerezolvată cu tag comun.
        </p>
      )}
    </div>
  )
}
