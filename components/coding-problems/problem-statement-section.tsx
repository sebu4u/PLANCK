"use client"

import ReactMarkdown from "react-markdown"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import remarkGfm from "remark-gfm"
import { Card } from "@/components/ui/card"
import { CodingProblem, CodingProblemExample } from "./types"
import { cn } from "@/lib/utils"

interface ProblemStatementSectionProps {
  problem: CodingProblem
  examples: CodingProblemExample[]
  theme?: "dark" | "light"
}

export function ProblemStatementSection({
  problem,
  examples,
  theme = "dark",
}: ProblemStatementSectionProps) {
  const isLight = theme === "light"
  const bodyFontClass = ""
  const textClass = isLight ? "text-[#2b2433]" : "text-white/80"
  const headingClass = isLight ? "text-[#111111]" : "text-white"
  const eyebrowClass = isLight ? "text-[#6f657b]" : "text-white/50"
  const sectionLabelClass = isLight
    ? "text-sm font-semibold text-[#111111]"
    : "text-sm font-semibold text-white"
  const sectionCardClass = isLight
    ? "rounded-2xl border border-[#ece7f2] bg-[#ffffff] px-4 py-3"
    : "rounded-md border border-white/12 bg-[#161616] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
  const preClass = isLight
    ? "rounded-xl border border-[#ded6e8] bg-[#171421] p-4 font-mono text-sm text-[#f8f5ff] whitespace-pre-wrap"
    : "rounded-lg border border-white/10 bg-black/40 p-4 font-mono text-sm text-white/90 whitespace-pre-wrap"

  return (
    <div className="space-y-8">
      <h1 className={cn(bodyFontClass, "flex flex-wrap items-baseline gap-3 text-2xl font-bold leading-tight sm:text-3xl", headingClass)}>
        {typeof problem.numeric_id === "number" && (
          <span className={cn("font-mono text-sm uppercase tracking-[0.3em]", isLight ? "text-[#8d7b9f]" : "text-white/50")}>
            #{problem.numeric_id}
          </span>
        )}
        <span>{problem.title}</span>
      </h1>

      {problem.statement_markdown?.trim() && (
        <section className="space-y-2">
          <h2 className={cn(bodyFontClass, sectionLabelClass, headingClass)}>Enunț</h2>
          <div className={sectionCardClass}>
            <ReactMarkdown
              className={cn(bodyFontClass, "text-base leading-relaxed", textClass)}
              remarkPlugins={[remarkMath, remarkGfm]}
              rehypePlugins={[rehypeKatex]}
            >
              {problem.statement_markdown}
            </ReactMarkdown>
          </div>
        </section>
      )}

      {/* Cerința */}
      {problem.requirement_markdown && (
        <section className="space-y-2">
          <h2 className={cn(bodyFontClass, sectionLabelClass, headingClass)}>Cerință</h2>
          <div className={sectionCardClass}>
            <ReactMarkdown
              className={cn(bodyFontClass, "text-base leading-relaxed", textClass)}
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
          <h2 className={cn(bodyFontClass, sectionLabelClass, headingClass)}>Date de intrare</h2>
          <div className={sectionCardClass}>
            <ReactMarkdown
              className={cn(bodyFontClass, "text-base leading-relaxed", textClass)}
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
          <h2 className={cn(bodyFontClass, sectionLabelClass, headingClass)}>Date de ieșire</h2>
          <div className={sectionCardClass}>
            <ReactMarkdown
              className={cn(bodyFontClass, "text-base leading-relaxed", textClass)}
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
          <h2 className={cn(bodyFontClass, sectionLabelClass, headingClass)}>Restricții</h2>
          <div className={sectionCardClass}>
            <ReactMarkdown
              className={cn(bodyFontClass, "text-base leading-relaxed", textClass)}
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
        <Card className={cn("rounded-2xl p-6", isLight ? "border-[#e7dff0] bg-[#ffffff] shadow-[0_16px_40px_rgba(76,44,114,0.08)]" : "border-white/10 bg-white/[0.03]")}>
          <h2 className={cn(bodyFontClass, "mb-4 text-lg font-semibold", headingClass)}>Exemple</h2>
          <div className="space-y-6">
            {examples.map((example, idx) => (
              <div key={example.id} className="space-y-3">
                <div className={cn(bodyFontClass, "text-sm font-semibold", isLight ? "text-[#6f657b]" : "text-white/60")}>
                  Exemplu {idx + 1}
                </div>
                {example.sample_input && (
                  <div>
                    <div className={cn(bodyFontClass, "mb-2 text-xs font-semibold", eyebrowClass)}>
                      Intrare
                    </div>
                    <pre className={preClass}>
                      {example.sample_input}
                    </pre>
                  </div>
                )}
                {example.sample_output && (
                  <div>
                    <div className={cn(bodyFontClass, "mb-2 text-xs font-semibold", eyebrowClass)}>
                      Ieșire
                    </div>
                    <pre className={preClass}>
                      {example.sample_output}
                    </pre>
                  </div>
                )}
                {example.explanation && (
                  <div className={cn("rounded-lg border p-4", isLight ? "border-[#cbd5ff] bg-[#eef2ff]" : "border-blue-500/20 bg-blue-500/10")}>
                    <div className={cn(bodyFontClass, "mb-2 text-xs font-semibold", isLight ? "text-[#4251b5]" : "text-blue-200")}>
                      Explicație
                    </div>
                    <p className={cn(bodyFontClass, "text-sm", isLight ? "text-[#293178]" : "text-blue-100/90")}>{example.explanation}</p>
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

