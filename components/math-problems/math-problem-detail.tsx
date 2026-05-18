"use client"

import { lazy, Suspense, useMemo } from "react"
import Link from "next/link"
import ReactMarkdown from "react-markdown"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import remarkGfm from "remark-gfm"
import "katex/dist/katex.min.css"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import type { MathProblem } from "./types"

const VideoPlayer = lazy(() =>
  import("@/components/video-player").then((module) => ({ default: module.VideoPlayer }))
)

const CLASS_LABELS: Record<number, string> = {
  9: "Clasa a 9-a",
  10: "Clasa a 10-a",
  11: "Clasa a 11-a",
  12: "Clasa a 12-a",
}

const DIFFICULTY_STYLES: Record<string, string> = {
  Ușor: "border-emerald-500/40 bg-emerald-500/15 text-emerald-200",
  Mediu: "border-amber-500/40 bg-amber-500/15 text-amber-200",
  Avansat: "border-rose-500/40 bg-rose-500/15 text-rose-200",
}

function stripAtPrefix(url: string) {
  return url.startsWith("@") ? url.slice(1) : url
}

export function MathProblemDetail({ problem }: { problem: MathProblem }) {
  const imageSrc = useMemo(() => {
    if (typeof problem.image_url !== "string" || !problem.image_url.trim()) return null
    const s = stripAtPrefix(problem.image_url.trim())
    if (!s.startsWith("http://") && !s.startsWith("https://")) return null
    return s
  }, [problem.image_url])

  const hasVideo =
    typeof problem.youtube_url === "string" && problem.youtube_url.trim().length > 0

  const classLabel = CLASS_LABELS[problem.class] ?? `Clasa a ${problem.class}-a`
  const difficultyStyle =
    DIFFICULTY_STYLES[problem.difficulty] ?? "border-white/15 bg-white/10 text-white/70"

  const tags =
    Array.isArray(problem.tags) && problem.tags.length > 0
      ? problem.tags
          .map((t) => (typeof t === "string" ? t.trim() : ""))
          .filter(Boolean)
      : []

  return (
    <div className="min-h-screen text-white">
      <Navigation />
      <main className="mx-auto max-w-4xl px-4 pb-16 pt-24">
        <Button variant="ghost" asChild className="mb-6 text-white/70 hover:bg-white/10 hover:text-white">
          <Link href="/matematica/probleme" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Înapoi la catalog
          </Link>
        </Button>

        <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/50">
          <span className="rounded-full border border-white/15 bg-white/[0.08] px-3 py-1 font-semibold text-white/80">
            {classLabel}
          </span>
          <span className="font-mono text-[0.65rem] text-white/45">{problem.id}</span>
        </div>

        <h1 className="mt-4 font-vt323 text-3xl font-semibold leading-tight text-white sm:text-4xl">
          {problem.title}
        </h1>

        {problem.description ? (
          <p className="mt-3 text-base leading-relaxed text-white/65">{problem.description}</p>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge className={`rounded-full border px-4 py-1 text-xs font-semibold ${difficultyStyle}`}>
            {problem.difficulty}
          </Badge>
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-0.5 text-[0.65rem] font-medium text-white/60"
            >
              #{tag}
            </span>
          ))}
        </div>

        {imageSrc ? (
          <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageSrc} alt="" className="max-h-[480px] w-full object-contain" />
          </div>
        ) : null}

        <section className="mt-10 space-y-2">
          <h2 className="font-vt323 text-lg font-semibold uppercase tracking-[0.2em] text-white">Enunț</h2>
          <div className="rounded-md border border-white/12 bg-[#161616] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
            <ReactMarkdown
              className="font-vt323 text-base leading-relaxed text-white/85 [&_.katex-display]:overflow-x-auto"
              remarkPlugins={[remarkMath, remarkGfm]}
              rehypePlugins={[rehypeKatex]}
            >
              {problem.statement}
            </ReactMarkdown>
          </div>
        </section>

        {hasVideo ? (
          <section className="mt-10 space-y-3">
            <h2 className="font-vt323 text-lg font-semibold uppercase tracking-[0.2em] text-white">Video</h2>
            <Suspense
              fallback={<div className="aspect-video w-full animate-pulse rounded-xl bg-white/10" />}
            >
              <VideoPlayer videoUrl={problem.youtube_url!.trim()} title={problem.title} />
            </Suspense>
          </section>
        ) : null}
      </main>
      <Footer />
    </div>
  )
}
