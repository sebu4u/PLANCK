"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, CheckCircle2, Loader2, LogIn, Sparkles, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

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
  const [prompt, setPrompt] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "done">("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [createdHref, setCreatedHref] = useState<string | null>(null)
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
      setCreatedHref(null)

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
          href?: string
          course?: { id: string; href: string }
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

        const targetHref = data?.href ?? data?.course?.href ?? null
        // Don't navigate away — stay on /invata and refresh so the in-progress
        // chapter card appears in the list with a real-time progress bar.
        setStatus("done")
        setCreatedHref(targetHref)

        router.refresh()
      } catch (error) {
        if ((error as Error)?.name === "AbortError") return
        setStatus("error")
        setErrorMessage("Conexiunea a eșuat. Verifică internetul și încearcă din nou.")
      }
    },
    [isAuthenticated, prompt, router],
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
              if (status === "error" || status === "done") {
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

      {status === "done" && createdHref ? (
        <div className="relative mt-4 flex items-start gap-3 rounded-xl border border-[#e6e6e6] bg-white px-3.5 py-3 text-sm text-[#1f1f1f]">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#059669]" />
          <div className="min-w-0 flex-1">
            <p className="font-medium">Cursul tău personalizat este gata.</p>
            <Link href={createdHref} className="mt-1 inline-flex items-center gap-1 font-semibold text-[#1f1f1f] hover:underline">
              Deschide cursul <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      ) : null}

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
