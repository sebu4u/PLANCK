"use client"

import { BlockMath, InlineMath } from "react-katex"
import "katex/dist/katex.min.css"
import { cn } from "@/lib/utils"

function InlineLatexContent({ content }: { content: string }) {
  const parts = content.split(/(\$[^$]+\$)/g)
  return (
    <>
      {parts.map((part, idx) => {
        if (part.startsWith("$") && part.endsWith("$") && part.length > 1) {
          return <InlineMath key={idx} math={part.slice(1, -1)} />
        }
        return (
          <span key={idx} className="whitespace-pre-wrap">
            {part}
          </span>
        )
      })}
    </>
  )
}

/**
 * Renders text with `$...$` inline and `$$...$$` block LaTeX, consistent with catalog / problem pages.
 */
export function LatexRichText({ content, className }: { content: string; className?: string }) {
  if (!content) return null

  const hasBlockMath = content.includes("$$")
  const hasInlineMath = content.includes("$")

  if (!hasBlockMath && !hasInlineMath) {
    return <span className={cn("whitespace-pre-wrap", className)}>{content}</span>
  }

  if (hasBlockMath) {
    const parts = content.split(/(\$\$[^$]+\$\$)/g)
    return (
      <div className={cn("latex-rich-text [&_.katex-display]:my-3", className)}>
        {parts.map((part, idx) => {
          if (part.startsWith("$$") && part.endsWith("$$") && part.length > 4) {
            return <BlockMath key={idx} math={part.slice(2, -2)} />
          }
          return <InlineLatexContent key={idx} content={part} />
        })}
      </div>
    )
  }

  return (
    <span className={cn("inline-block max-w-full whitespace-pre-wrap", className)}>
      <InlineLatexContent content={content} />
    </span>
  )
}
