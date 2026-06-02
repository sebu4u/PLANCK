"use client"

import { useEffect, useMemo, useState } from "react"
import dynamic from "next/dynamic"
import { ProblemStatementSection } from "@/components/coding-problems/problem-statement-section"
import type { CodingProblem, CodingProblemExample } from "@/components/coding-problems/types"
import { PlanckCodeSettingsProvider } from "@/components/planckcode-settings-provider"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"

const EmbeddedIDE = dynamic(() => import("@/components/coding-problems/embedded-ide"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-black text-white">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-white/20 border-t-white" />
        <p className="text-sm text-white/60">Se încarcă IDE-ul...</p>
      </div>
    </div>
  ),
})

export type InformaticsPreviewInput = {
  slug?: string
  title: string
  statement_markdown: string
  requirement_markdown: string
  input_format: string
  output_format: string
  constraints_markdown: string
  difficulty: string
  class: string | number
  chapter: string
  language: "cpp" | "python"
  tags?: string
  sample_input: string
  sample_output: string
  boilerplate_cpp: string
  boilerplate_python: string
  tests?: Array<{ stdin: string; expected_stdout: string; is_sample: boolean }>
  /** Slug salvat — activează butonul „Trimite” în IDE (doar editare). */
  submitSlug?: string | null
}

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebounced(value), delayMs)
    return () => window.clearTimeout(timeoutId)
  }, [value, delayMs])
  return debounced
}

function buildPreviewProblem(input: InformaticsPreviewInput): CodingProblem {
  const classNum =
    typeof input.class === "number"
      ? input.class
      : Number.parseInt(String(input.class), 10) || 10

  const tags = input.tags
    ? input.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
    : []

  return {
    id: "preview",
    slug: input.slug?.trim() || "preview",
    title: input.title.trim() || "Titlu problemă",
    statement_markdown: input.statement_markdown,
    requirement_markdown: input.requirement_markdown.trim() || null,
    input_format: input.input_format.trim() || null,
    output_format: input.output_format.trim() || null,
    constraints_markdown: input.constraints_markdown.trim() || null,
    difficulty: input.difficulty || "Ușor",
    class: classNum,
    chapter: input.chapter.trim() || "Capitol neclasificat",
    points: 100,
    time_limit_ms: 2000,
    memory_limit_kb: 256000,
    tags,
    language: input.language,
    boilerplate_cpp: input.boilerplate_cpp || null,
    boilerplate_python: input.boilerplate_python || null,
    created_at: new Date().toISOString(),
  }
}

function buildPreviewExamples(input: InformaticsPreviewInput): CodingProblemExample[] {
  const examples: CodingProblemExample[] = []
  let orderIndex = 0

  if (input.sample_input.trim() || input.sample_output.trim()) {
    examples.push({
      id: "preview-sample",
      problem_id: "preview",
      sample_input: input.sample_input || null,
      sample_output: input.sample_output || null,
      explanation: null,
      order_index: orderIndex++,
      created_at: new Date().toISOString(),
    })
  }

  for (const [index, test] of (input.tests ?? []).entries()) {
    if (!test.is_sample) continue
    if (!test.stdin.trim() && !test.expected_stdout.trim()) continue
    examples.push({
      id: `preview-test-${index}`,
      problem_id: "preview",
      sample_input: test.stdin || null,
      sample_output: test.expected_stdout || null,
      explanation: null,
      order_index: orderIndex++,
      created_at: new Date().toISOString(),
    })
  }

  return examples
}

export function InformaticsProblemLivePreview({ input }: { input: InformaticsPreviewInput }) {
  const problem = useMemo(() => buildPreviewProblem(input), [input])
  const examples = useMemo(() => buildPreviewExamples(input), [input])

  const boilerplate = input.language === "python" ? input.boilerplate_python : input.boilerplate_cpp
  const debouncedBoilerplate = useDebouncedValue(boilerplate, 500)

  const metaText = useMemo(() => {
    const classLabel = Number.isFinite(problem.class) ? `Clasa a ${problem.class}-a` : undefined
    return [problem.difficulty, classLabel, problem.chapter].filter(Boolean).join(" • ")
  }, [problem.chapter, problem.class, problem.difficulty])

  const ideKey = `${input.language}:${debouncedBoilerplate}`

  return (
    <div className="overflow-hidden rounded-xl border border-gray-300 bg-[#070707] shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-[#0a0a0a] px-4 py-2.5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">Preview live</p>
        {metaText ? (
          <span className="font-vt323 text-[0.65rem] uppercase tracking-[0.16em] text-white/45">{metaText}</span>
        ) : null}
      </div>

      <PlanckCodeSettingsProvider>
        <div className="h-[min(78vh,760px)] min-h-[420px]">
          <ResizablePanelGroup direction="horizontal" className="h-full">
            <ResizablePanel defaultSize={48} minSize={28} maxSize={72}>
              <div className="h-full bg-[#121212]">
                <ScrollArea className="h-full">
                  <div className="px-4 py-5 sm:px-5">
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                      {problem.language === "python" ? (
                        <span className="font-vt323 rounded-full border border-amber-400/35 bg-amber-500/15 px-2 py-0.5 text-[0.65rem] uppercase tracking-[0.2em] text-amber-100">
                          Python
                        </span>
                      ) : (
                        <span className="font-vt323 rounded-full border border-sky-400/30 bg-sky-500/10 px-2 py-0.5 text-[0.65rem] uppercase tracking-[0.2em] text-sky-100/90">
                          C++
                        </span>
                      )}
                      {!input.submitSlug ? (
                        <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.14em] text-white/45">
                          Draft — fără trimitere oficială
                        </span>
                      ) : null}
                    </div>
                    <ProblemStatementSection problem={problem} examples={examples} />
                  </div>
                </ScrollArea>
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle className="bg-white/10 hover:bg-white/20 transition-colors" />

            <ResizablePanel defaultSize={52} minSize={28} maxSize={72}>
              <div className="h-full overflow-hidden bg-black">
                <EmbeddedIDE
                  key={ideKey}
                  defaultLanguage={input.language}
                  initialCode={debouncedBoilerplate || undefined}
                  problemSlug={input.language === "python" ? input.submitSlug ?? undefined : undefined}
                />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </PlanckCodeSettingsProvider>
    </div>
  )
}
