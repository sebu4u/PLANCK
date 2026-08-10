"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Clock3, Loader2, Play } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { supabase } from "@/lib/supabaseClient"
import { PRACTICE_SUBJECTS } from "@/lib/practice-subject"
import {
  formatPracticeTestDuration,
  type PracticeTestListItem,
  type PracticeTestPublicItem,
} from "@/lib/practice-tests"
import { LatexRichText } from "@/components/classrooms/latex-rich-text"
import { cn } from "@/lib/utils"
import { MOBILE_BOTTOM_NAV_PADDING_CLASS } from "@/lib/mobile-app-nav"
import { Button } from "@/components/ui/button"

interface TesteDetailClientProps {
  testId: string
}

export function TesteDetailClient({ testId }: TesteDetailClientProps) {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [test, setTest] = useState<PracticeTestListItem | null>(null)
  const [items, setItems] = useState<PracticeTestPublicItem[]>([])
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/teste/${encodeURIComponent(testId)}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Nu am putut încărca testul.")
        if (!cancelled) {
          setTest(data.test)
          setItems(data.items ?? [])
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Eroare la încărcare.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [testId])

  const startTest = async () => {
    if (!user) {
      router.push(`/login?next=/teste/${encodeURIComponent(testId)}`)
      return
    }
    setStarting(true)
    setError(null)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      if (!token) {
        router.push(`/login?next=/teste/${encodeURIComponent(testId)}`)
        return
      }
      const res = await fetch(`/api/teste/${encodeURIComponent(testId)}/attempts`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Nu am putut începe testul.")
      router.push(`/teste/${encodeURIComponent(testId)}/attempt/${data.attempt.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Eroare la pornirea testului.")
      setStarting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-[#2c2f33]/60">
        <Loader2 className="h-5 w-5 animate-spin" />
        Se încarcă…
      </div>
    )
  }

  if (error && !test) {
    return (
      <div className={cn("mx-auto max-w-3xl px-4 py-10", MOBILE_BOTTOM_NAV_PADDING_CLASS)}>
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-6 text-red-700">{error}</div>
        <Link href="/teste" className="mt-4 inline-flex items-center gap-2 text-sm text-[#2c2f33]/70 hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Înapoi la teste
        </Link>
      </div>
    )
  }

  if (!test) return null

  const subjectLabel = PRACTICE_SUBJECTS.find((s) => s.id === test.subject)?.label ?? test.subject

  return (
    <div className={cn("mx-auto max-w-3xl px-4 py-8 burger:px-6", MOBILE_BOTTOM_NAV_PADDING_CLASS)}>
      <Link href="/teste" className="inline-flex items-center gap-2 text-sm text-[#2c2f33]/65 hover:underline">
        <ArrowLeft className="h-4 w-4" />
        Toate testele
      </Link>

      <div className="mt-6 rounded-2xl border border-black/5 bg-white p-6 shadow-[0_8px_30px_-18px_rgba(11,12,15,0.35)]">
        <h1 className="text-2xl font-bold text-[#0b0c0f] sm:text-3xl">{test.title}</h1>
        {test.description ? <p className="mt-3 text-[#2c2f33]/75">{test.description}</p> : null}

        <div className="mt-5 flex flex-wrap gap-2 text-sm text-[#2c2f33]/70">
          <span className="rounded-lg bg-[#f5f4f2] px-2.5 py-1">{subjectLabel}</span>
          <span className="rounded-lg bg-[#f5f4f2] px-2.5 py-1">Clasa a {test.class}-a</span>
          {test.chapter ? <span className="rounded-lg bg-[#f5f4f2] px-2.5 py-1">{test.chapter}</span> : null}
          <span className="rounded-lg bg-[#f5f4f2] px-2.5 py-1">{test.difficulty}</span>
          <span className="inline-flex items-center gap-1 rounded-lg bg-[#f5f4f2] px-2.5 py-1">
            <Clock3 className="h-3.5 w-3.5" />
            {formatPracticeTestDuration(test.time_limit_seconds)}
          </span>
          <span className="rounded-lg bg-[#f5f4f2] px-2.5 py-1">
            {items.length} {items.length === 1 ? "problemă" : "probleme"}
          </span>
        </div>

        <ul className="mt-6 space-y-2 border-t border-black/5 pt-5">
          {items.map((item, index) => (
            <li key={item.id} className="flex items-start gap-3 text-sm text-[#2c2f33]/80">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#f5f4f2] text-xs font-semibold">
                {index + 1}
              </span>
              <span className="line-clamp-2 min-w-0">
                <LatexRichText
                  content={item.title || item.statement || `Problema ${index + 1}`}
                  className="break-words [&_.katex]:text-inherit"
                />
              </span>
            </li>
          ))}
        </ul>

        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

        <Button
          className="mt-6 w-full sm:w-auto"
          onClick={() => void startTest()}
          disabled={starting || authLoading}
        >
          {starting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Se pornește…
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              {user ? "Începe testul" : "Autentifică-te pentru a începe"}
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
