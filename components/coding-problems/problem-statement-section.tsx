"use client"

import ReactMarkdown from "react-markdown"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import remarkGfm from "remark-gfm"
import { Card } from "@/components/ui/card"
import { CodingProblem, CodingProblemExample } from "./types"

interface ProblemStatementSectionProps {
  problem: CodingProblem
  examples: CodingProblemExample[]
}

export function ProblemStatementSection({
  problem,
  examples,
}: ProblemStatementSectionProps) {
  return (
    <div className="space-y-8">
      <h1 className="font-vt323 text-3xl sm:text-4xl font-semibold leading-tight text-white flex flex-wrap items-baseline gap-3">
        {typeof problem.numeric_id === "number" && (
          <span className="font-mono text-base uppercase tracking-[0.4em] text-white/50">
            #{problem.numeric_id}
          </span>
        )}
        <span>{problem.title}</span>
      </h1>

      {/* Cerința */}
      {problem.requirement_markdown && (
        <section className="space-y-2">
          <h2 className="font-vt323 text-lg font-semibold uppercase tracking-[0.2em] text-white">Cerință</h2>
          <div className="rounded-md border border-white/12 bg-[#161616] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
            <ReactMarkdown
              className="font-vt323 text-base leading-relaxed text-white/80"
              remarkPlugins={[remarkMath, remarkGfm]}
              rehypePlugins={[rehypeKatex]}
            >
              {problem.requirement_markdown}
            </ReactMarkdown>
          </div>
        </section>
      )}

      {/* Date de intrare */}
      {problem.input_format && (
        <section className="space-y-2">
          <h2 className="font-vt323 text-lg font-semibold uppercase tracking-[0.2em] text-white">Date de intrare</h2>
          <div className="rounded-md border border-white/12 bg-[#161616] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
            <ReactMarkdown
              className="font-vt323 text-base leading-relaxed text-white/80"
              remarkPlugins={[remarkMath, remarkGfm]}
              rehypePlugins={[rehypeKatex]}
            >
              {problem.input_format}
            </ReactMarkdown>
          </div>
        </section>
      )}

      {/* Date de ieșire */}
      {problem.output_format && (
        <section className="space-y-2">
          <h2 className="font-vt323 text-lg font-semibold uppercase tracking-[0.2em] text-white">Date de ieșire</h2>
          <div className="rounded-md border border-white/12 bg-[#161616] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
            <ReactMarkdown
              className="font-vt323 text-base leading-relaxed text-white/80"
              remarkPlugins={[remarkMath, remarkGfm]}
              rehypePlugins={[rehypeKatex]}
            >
              {problem.output_format}
            </ReactMarkdown>
          </div>
        </section>
      )}

      {/* Restricții */}
      {problem.constraints_markdown && (
        <section className="space-y-2">
          <h2 className="font-vt323 text-lg font-semibold uppercase tracking-[0.2em] text-white">Restricții</h2>
          <div className="prose prose-invert max-w-none text-white/85">
            <ReactMarkdown
              className="font-vt323 text-base leading-relaxed text-white/80"
              remarkPlugins={[remarkMath, remarkGfm]}
              rehypePlugins={[rehypeKatex]}
            >
              {problem.constraints_markdown}
            </ReactMarkdown>
          </div>
        </section>
      )}

      {/* Exemple */}
      {examples.length > 0 && (
        <Card className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="font-vt323 mb-4 text-lg font-semibold text-white">Exemple</h2>
          <div className="space-y-6">
            {examples.map((example, idx) => (
              <div key={example.id} className="space-y-3">
                <div className="text-sm font-semibold uppercase tracking-[0.2em] text-white/60">
                  Exemplu {idx + 1}
                </div>
                {example.sample_input && (
                  <div>
                    <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
                      Intrare
                    </div>
                    <pre className="rounded-lg border border-white/10 bg-black/40 p-4 font-mono text-sm text-white/90 whitespace-pre-wrap">
                      {example.sample_input}
                    </pre>
                  </div>
                )}
                {example.sample_output && (
                  <div>
                    <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
                      Ieșire
                    </div>
                    <pre className="rounded-lg border border-white/10 bg-black/40 p-4 font-mono text-sm text-white/90 whitespace-pre-wrap">
                      {example.sample_output}
                    </pre>
                  </div>
                )}
                {example.explanation && (
                  <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-4">
                    <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">
                      Explicație
                    </div>
                    <p className="text-sm text-blue-100/90">{example.explanation}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

