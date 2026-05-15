"use client"

import { BlockMath, InlineMath } from "react-katex"
import "katex/dist/katex.min.css"
import { cn } from "@/lib/utils"
import { hasMixedLatexDelimiters, splitMixedLatex } from "@/lib/parse-mixed-latex"

/**
 * Renders text with `$...$` / `\(...\)` inline and `$$...$$` / `\[...\]` block LaTeX.
 */
export function LatexRichText({ content, className }: { content: string; className?: string }) {
  if (!content) return null

  if (!hasMixedLatexDelimiters(content)) {
    return <span className={cn("whitespace-pre-wrap", className)}>{content}</span>
  }

  const pieces = splitMixedLatex(content)
  const hasBlock = pieces.some((p) => p.type === "block")

  const inner = (
    <>
      {pieces.map((part, idx) => {
        if (part.type === "text") {
          return (
            <span key={idx} className="whitespace-pre-wrap">
              {part.value}
            </span>
          )
        }
        if (part.type === "inline") {
          return <InlineMath key={idx} math={part.value} />
        }
        return <BlockMath key={idx} math={part.value} />
      })}
    </>
  )

  if (hasBlock) {
    return (
      <div className={cn("latex-rich-text [&_.katex-display]:my-3", className)}>
        {inner}
      </div>
    )
  }

  return (
    <span className={cn("inline-block max-w-full whitespace-pre-wrap", className)}>
      {inner}
    </span>
  )
}
