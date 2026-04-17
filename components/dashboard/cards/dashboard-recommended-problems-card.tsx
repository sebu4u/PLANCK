"use client"

import { type CSSProperties, useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import AutoHeight from "embla-carousel-auto-height"
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel"
import type { Problem } from "@/data/problems"
import { LatexRichText } from "@/components/classrooms/latex-rich-text"
import { cn } from "@/lib/utils"

interface DashboardRecommendedProblemsCardProps {
  problems: Problem[]
  userGrade?: string | number | null
}

function toClassLabel(problem: Problem): string | null {
  const rawClass = (problem as { class?: unknown }).class

  if (typeof rawClass === "number") return `Clasa a ${rawClass}-a`
  if (typeof rawClass === "string" && rawClass.trim()) return rawClass
  if (problem.classString?.trim()) return problem.classString
  return null
}

/** Word-based preview that keeps `$...$` segments intact (same idea as catalog cards). */
function createStatementPreview(statement: string | undefined | null, wordLimit = 22): string {
  if (!statement) return ""
  const normalized = statement.replace(/\s+/g, " ").trim()
  if (!normalized) return ""

  const parts = normalized.split(/(\$[^$]+\$)/g).filter(Boolean)
  const collected: string[] = []
  let wordCount = 0

  for (const part of parts) {
    const isMath = part.startsWith("$") && part.endsWith("$")
    if (isMath) {
      if (wordCount >= wordLimit) break
      collected.push(part)
      wordCount += 1
      continue
    }

    const words = part.trim().split(/\s+/)
    for (const word of words) {
      if (!word) continue
      collected.push(word)
      wordCount += 1
      if (wordCount >= wordLimit) break
    }
    if (wordCount >= wordLimit) break
  }

  const preview = collected.join(" ")
  const totalWords = normalized.split(/\s+/).filter(Boolean).length
  return wordCount < totalWords ? `${preview}...` : preview
}

function toSnippet(problem: Problem): string {
  const text = (problem.statement || problem.description || problem.title || "").trim()
  if (!text) return "Alege aceasta problema pentru urmatorul pas."
  const preview = createStatementPreview(text, 22)
  return preview || text
}

export function DashboardRecommendedProblemsCard({
  problems,
  userGrade,
}: DashboardRecommendedProblemsCardProps) {
  const [api, setApi] = useState<CarouselApi>()
  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => {
    if (!api) return

    const onSelect = () => setSelectedIndex(api.selectedScrollSnap())
    onSelect()
    api.on("select", onSelect)
    api.on("reInit", onSelect)

    return () => {
      api.off("select", onSelect)
    }
  }, [api])

  useEffect(() => {
    if (!api || problems.length <= 1) return

    const id = window.setInterval(() => {
      api.scrollNext()
    }, 10_000)

    return () => window.clearInterval(id)
  }, [api, problems.length])

  if (!problems.length) {
    return (
      <section className="rounded-3xl border border-[#e5e5e5] bg-white p-5 shadow-[0_12px_30px_rgba(0,0,0,0.03)]">
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#7f7f7f]">Problema recomandata</p>
        <p className="mt-3 text-sm text-[#5f5f5f]">
          {userGrade
            ? "Momentan nu avem recomandari pentru clasa selectata."
            : "Selecteaza clasa in profil pentru recomandari personalizate."}
        </p>
      </section>
    )
  }

  return (
    <section>
      <Carousel
        setApi={setApi}
        opts={{ align: "start", loop: problems.length > 1 }}
        plugins={[AutoHeight()]}
        className="w-full [&>*]:px-1 [&>*]:pb-4"
      >
        <CarouselContent className="items-start">
          {problems.map((problem) => {
            const classLabel = toClassLabel(problem)
            return (
              <CarouselItem key={problem.id} className="self-start">
                <div className="rounded-3xl border border-[#e5e5e5] bg-white p-5 shadow-[0_12px_30px_rgba(0,0,0,0.03)]">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-full bg-[#f0ebff] px-2.5 py-1 font-semibold text-[#6f43db]">
                      {problem.difficulty || "Nivel mixt"}
                    </span>
                    {classLabel ? (
                      <span className="rounded-full bg-[#f1f1f1] px-2.5 py-1 font-medium text-[#636363]">
                        {classLabel}
                      </span>
                    ) : null}
                  </div>

                  <LatexRichText
                    content={problem.title}
                    className="mt-3 text-lg font-semibold leading-snug text-[#191919] [&_.katex]:text-[#191919]"
                  />
                  <LatexRichText
                    content={toSnippet(problem)}
                    className="mt-2 text-sm text-[#666666] [&_.katex]:text-[#666666]"
                  />

                  <Link
                    href={`/probleme/${problem.id}`}
                    className="dashboard-start-glow mt-4 inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-[#efe0f5] via-[#f8dce4] to-[#fce8d4] px-4 py-3 text-sm font-semibold text-[#2f2a3c] shadow-[0_4px_0_#c4b5d4] transition-[transform,box-shadow] hover:translate-y-1 hover:shadow-[0_1px_0_#c4b5d4] active:translate-y-1 active:shadow-[0_1px_0_#c4b5d4]"
                    style={{ "--start-glow-tint": "rgba(250, 238, 245, 0.88)" } as CSSProperties}
                  >
                    <span className="relative z-[1] inline-flex items-center justify-center gap-2">
                      Rezolva problema
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </Link>
                </div>
              </CarouselItem>
            )
          })}
        </CarouselContent>
      </Carousel>

      {problems.length > 1 ? (
        <div className="mt-2 flex items-center justify-center gap-2">
          {problems.map((problem, index) => (
            <button
              key={problem.id}
              type="button"
              aria-label={`Mergi la problema ${index + 1}`}
              onClick={() => api?.scrollTo(index)}
              className={cn(
                "h-2.5 w-2.5 rounded-full transition-all",
                selectedIndex === index ? "bg-[#7c3aed] w-5" : "bg-[#d8d8d8]"
              )}
            />
          ))}
        </div>
      ) : null}
    </section>
  )
}
