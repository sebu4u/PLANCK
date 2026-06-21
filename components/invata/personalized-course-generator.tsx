"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, Loader2, LogIn, Sparkles, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePersonalizedCourseGeneration, type OptimisticInProgressChapter } from "@/components/invata/personalized-course-generation-context"

interface PersonalizedCourseGeneratorProps {
  isAuthenticated: boolean
  loginHref?: string
}

const MIN_PROMPT_LENGTH = 3
const MAX_PROMPT_LENGTH = 500

export function PersonalizedCourseGenerator({
  isAuthenticated,
  loginHref = "/login?next=/invata",
}: PersonalizedCourseGeneratorProps) {
  const router = useRouter()
  const generation = usePersonalizedCourseGeneration()
  const [prompt, setPrompt] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  const handleSubmit = useCallback(
    async (event?: React.FormEvent) => {
      event?.preventDefault()
      const trimmed = prompt.trim()

      if (!isAuthenticated) {
        setStatus("error")
        setErrorMessage("Trebuie să fii autentificat pentru a genera un curs personalizat.")
        return
      }

      if (trimmed.length < MIN_PROMPT_LENGTH) {
        setStatus("error")
        setErrorMessage("Scrie ce vrei să înveți în cel puțin câteva cuvinte.")
        return
      }

      if (trimmed.length > MAX_PROMPT_LENGTH) {
        setStatus("error")
        setErrorMessage(`Promptul poate avea maximum ${MAX_PROMPT_LENGTH} de caractere.`)
        return
      }

      setStatus("loading")
      setErrorMessage(null)

      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      try {
        const response = await fetch("/api/personalized-courses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: trimmed }),
          credentials: "same-origin",
          signal: controller.signal,
        })

        const data = (await response.json().catch(() => ({}))) as {
          error?: string
          chapterId?: string
          chapterSlug?: string
          title?: string
          description?: string | null
        }

        if (!response.ok) {
          if (response.status === 401) {
            setStatus("error")
            setErrorMessage("Trebuie să fii autentificat pentru a genera un curs personalizat.")
            return
          }
          setStatus("error")
          setErrorMessage(
            data?.error?.trim() || "Nu am putut genera cursul personalizat acum. Încearcă din nou.",
          )
          return
        }

        // On 202: push an optimistic in-progress chapter into the shared context so the
        // progress card appears INSTANTLY at the top of the list (no server refresh
        // needed). The card polls for readiness and refreshes when done. Never navigate.
        if (data.chapterId && generation) {
          const optimistic: OptimisticInProgressChapter = {
            id: data.chapterId,
            slug: data.chapterSlug ?? "",
            title: data.title ?? (prompt.slice(0, 60) || "Curs personalizat"),
            description: data.description ?? null,
            is_personalized: true,
            is_active: false,
            generation_status: "creating",
            generation_metadata: null,
            __optimistic: true,
          }
          generation.addOptimisticChapter(optimistic)
        }
        setPrompt("")
        setStatus("idle")
        // Also refresh so any server-rendered in-progress chapters sync up, but the
        // optimistic card is already visible — this is just for consistency.
        router.refresh()
      } catch (error) {
        if ((error as Error)?.name === "AbortError") return
        setStatus("error")
        setErrorMessage("Conexiunea a eșuat. Verifică internetul și încearcă din nou.")
      }
    },
    [isAuthenticated, prompt, router, generation],
  )

  const isDisabled = status === "loading"
  const remainingChars = MAX_PROMPT_LENGTH - prompt.length

  return (
    <section
      aria-label="Generează curs personalizat"
      className="relative rounded-2xl border border-[#e6e6e6] bg-[#f7f7f7] p-5 sm:p-6"
    >
      <div className="relative flex items-start gap-3">
        <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white border border-[#e6e6e6] text-[#5f5f5f] sm:flex">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-bold tracking-tight text-[#111111] sm:text-2xl">
            Ce dorești să înveți azi?
          </h2>
          <p className="mt-1 text-sm text-[#707070] sm:text-base">
            Scrie un obiectiv liber (ex. „să înțeleg derivata și să rezolv probleme de BAC") și
            Planck îți compune un curs personalizat din conținutul existent.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="relative mt-5">
        <div className="rounded-xl border border-[#e6e6e6] bg-white p-2.5 transition-colors focus-within:border-[#cfcfcf] sm:p-3">
          <textarea
            value={prompt}
            onChange={(event) => {
              setPrompt(event.target.value)
              if (status === "error") {
                setStatus("idle")
                setErrorMessage(null)
              }
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                void handleSubmit()
              }
            }}
            placeholder="ex. Vreau să recapitulez optică pentru BAC, cu probleme și explicații video…"
            rows={3}
            maxLength={MAX_PROMPT_LENGTH}
            disabled={isDisabled}
            aria-label="Obiectiv de învățare"
            className="block w-full resize-none rounded-lg bg-transparent px-3 py-2.5 text-base leading-relaxed text-[#111111] placeholder:text-[#9a9a9a] focus:outline-none disabled:opacity-60 sm:text-[15px]"
          />
          <div className="mt-1.5 flex flex-col gap-2 px-1 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs text-[#9a9a9a]">
              {remainingChars < 80 ? `${remainingChars} caractere rămase` : "Enter + Ctrl/⌘ pentru a trimite"}
            </span>
            <button
              type="submit"
              disabled={isDisabled}
              className={cn(
                "inline-flex items-center justify-center gap-2 rounded-xl bg-[#1f1f1f] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:ml-auto",
              )}
            >
              {status === "loading" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generez cursul…
                </>
              ) : (
                <>
                  Generează curs
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {status === "error" && errorMessage ? (
        <div className="relative mt-4 flex items-start gap-3 rounded-xl border border-[#e6e6e6] bg-white px-3.5 py-3 text-sm text-[#1f1f1f]">
          {isAuthenticated ? (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#9a9a9a]" />
          ) : (
            <LogIn className="mt-0.5 h-4 w-4 shrink-0 text-[#9a9a9a]" />
          )}
          <div className="min-w-0 flex-1">
            <p className="font-medium">{errorMessage}</p>
            {!isAuthenticated ? (
              <p className="mt-1 text-[#707070]">
                <Link href={loginHref} className="font-semibold underline underline-offset-2 hover:text-[#1f1f1f]">
                  Autentifică-te
                </Link>{" "}
                sau{" "}
                <Link href="/register?next=/invata" className="font-semibold underline underline-offset-2 hover:text-[#1f1f1f]">
                  creează un cont
                </Link>{" "}
                ca să-ți salvez cursurile personalizate.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  )
}
