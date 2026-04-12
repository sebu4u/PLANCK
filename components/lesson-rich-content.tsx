"use client"

import { BlockMath, InlineMath } from "react-katex"
import "katex/dist/katex.min.css"
import { cn } from "@/lib/utils"

interface LessonRichContentProps {
  content: string
  theme?: "dark" | "light"
  /** Body text slightly heavier (e.g. learning path custom text full-screen slides). */
  emphasizedBody?: boolean
}

const TAG_CLASS_MAP = {
  formula: "formula",
  enunt: "enunt",
  important: "important",
  definitie: "definition",
  exemplu: "example",
  indent: "indent",
} as const

function getThemeClasses(theme: "dark" | "light", emphasizedBody: boolean) {
  if (theme === "light") {
    return {
      strongClass: "font-bold text-[#111111]",
      emClass: "italic text-[#111111]",
      linkClass: "text-[#3550c8] hover:text-[#213899] hover:underline",
      problemLinkClass:
        "inline-block mt-4 rounded-xl bg-[#111111] px-4 py-2 text-center font-bold text-white shadow-md transition-opacity duration-200 hover:opacity-90",
      paragraphClass: cn("mb-4 leading-relaxed text-[#222222]", emphasizedBody && "font-medium"),
      headingClasses: {
        1: "mt-8 mb-6 text-3xl font-bold text-[#111111]",
        2: "mt-6 mb-4 text-2xl font-bold text-[#111111]",
        3: "mt-5 mb-3 text-xl font-semibold text-[#111111]",
        4: "mt-4 mb-2 text-lg font-semibold text-[#111111]",
      },
    }
  }

  return {
    strongClass: "font-bold text-white",
    emClass: "italic text-white",
    linkClass: "text-blue-400 hover:text-blue-300 hover:underline",
    problemLinkClass:
      "inline-block mt-4 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 text-center font-bold text-white shadow-md transition-all duration-200 hover:scale-105 hover:from-purple-700 hover:to-pink-700",
    paragraphClass: cn("mb-4 leading-relaxed text-white", emphasizedBody && "font-medium"),
    headingClasses: {
      1: "mt-8 mb-6 text-3xl font-bold text-white",
      2: "mt-6 mb-4 text-2xl font-bold text-white",
      3: "mt-5 mb-3 text-xl font-semibold text-white",
      4: "mt-4 mb-2 text-lg font-semibold text-white",
    },
  }
}

export function LessonRichContent({ content, theme = "dark", emphasizedBody = false }: LessonRichContentProps) {
  const themeClasses = getThemeClasses(theme, emphasizedBody)

  const renderInlineMarkdownContent = (value: string) => {
    let processedContent = value
    processedContent = processedContent.replace(
      /\*\*(.*?)\*\*/g,
      `<strong class="${themeClasses.strongClass}">$1</strong>`
    )
    processedContent = processedContent.replace(/\*(.*?)\*/g, `<em class="${themeClasses.emClass}">$1</em>`)
    processedContent = processedContent.replace(/(?:\r?\n)+$/g, "")
    processedContent = processedContent.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
      if (url.startsWith("/probleme/") || url.includes("/probleme/")) {
        return `<a href="${url}" class="${themeClasses.problemLinkClass}">${text}</a>`
      }

      return `<a href="${url}" class="${themeClasses.linkClass}">${text}</a>`
    })
    processedContent = processedContent.replace(/\r?\n/g, "<br />")
    return processedContent
  }

  const renderInlineWithImages = (value: string, keyPrefix: string) => {
    if (!value) return null

    // Single capture group: split() would splice each group into the array, so alt+url
    // would render as duplicate text under the image. Only capture the full ![](...) token.
    const imageParts = value.split(/(!\[[^\]]*\]\([^)]+\))/g)

    return imageParts.map((part, idx) => {
      if (!part) return null

      const imageMatch = part.match(/!\[([^\]]*)\]\(([^)]+)\)/)
      if (imageMatch) {
        const altText = imageMatch[1]
        const imageUrl = imageMatch[2]

        return (
          <img
            key={`img-${keyPrefix}-${idx}`}
            src={imageUrl}
            alt={altText}
            className="mx-auto my-4 block h-auto max-w-full rounded-lg shadow-md"
            onError={(event) => {
              console.error("Image failed to load:", imageUrl, event)
              event.currentTarget.style.display = "none"
            }}
          />
        )
      }

      const mathParts = part.split(/(\$\$[^$]+\$\$|\$[^$]+\$)/g)
      return mathParts.map((mathPart, mathIdx) => {
        if (!mathPart) return null

        if (mathPart.startsWith("$$") && mathPart.endsWith("$$")) {
          return (
            <BlockMath
              key={`display-${keyPrefix}-${idx}-${mathIdx}`}
              math={mathPart.slice(2, -2)}
              className="my-4 block text-center"
            />
          )
        }

        if (mathPart.startsWith("$") && mathPart.endsWith("$")) {
          return <InlineMath key={`inline-${keyPrefix}-${idx}-${mathIdx}`} math={mathPart.slice(1, -1)} />
        }

        const inlineHtml = renderInlineMarkdownContent(mathPart)
        return inlineHtml ? (
          <span key={`text-${keyPrefix}-${idx}-${mathIdx}`} dangerouslySetInnerHTML={{ __html: inlineHtml }} />
        ) : null
      })
    })
  }

  const renderParagraphs = (value: string, keyPrefix: string) => {
    if (!value) return null

    const lines = value.split(/\r?\n/)
    const blocks: React.ReactNode[] = []
    let currentParagraph: string[] = []

    const flushParagraph = (key: number) => {
      if (currentParagraph.length === 0) return

      const paragraphText = currentParagraph.join("\n").trim()
      if (!paragraphText) {
        currentParagraph = []
        return
      }

      if (/^\$\$[\s\S]*\$\$$/m.test(paragraphText)) {
        blocks.push(
          <BlockMath
            key={`paragraph-display-${keyPrefix}-${key}`}
            math={paragraphText.replace(/^\$\$/, "").replace(/\$\$$/, "")}
            className="my-4 block text-center"
          />
        )
      } else {
        blocks.push(
          <div key={`paragraph-${keyPrefix}-${key}`} className={themeClasses.paragraphClass}>
            {renderInlineWithImages(paragraphText, `${keyPrefix}-paragraph-${key}`)}
          </div>
        )
      }

      currentParagraph = []
    }

    lines.forEach((line, idx) => {
      const trimmed = line.trim()
      const headingMatch = line.match(/^\s*(#{1,4})\s+(.*)$/)

      if (headingMatch) {
        flushParagraph(idx)
        const level = headingMatch[1].length as 1 | 2 | 3 | 4
        const headingContent = headingMatch[2].trim()
        const HeadingTag = ({ 1: "h1", 2: "h2", 3: "h3", 4: "h4" }[level] ?? "h4") as
          | "h1"
          | "h2"
          | "h3"
          | "h4"

        blocks.push(
          <HeadingTag key={`heading-${keyPrefix}-${idx}`} className={themeClasses.headingClasses[level]}>
            {renderInlineWithImages(headingContent, `${keyPrefix}-heading-${idx}`)}
          </HeadingTag>
        )
        return
      }

      if (trimmed.startsWith("[FORMULA]")) {
        flushParagraph(idx)
        const inner = trimmed.replace(/\[FORMULA\]|\[\/FORMULA\]/g, "")
        blocks.push(
          <div key={`formula-${keyPrefix}-${idx}`} className="formula-highlight">
            <div className="formula-content">{renderInlineWithImages(inner, `${keyPrefix}-formula-${idx}`)}</div>
          </div>
        )
        return
      }

      if (
        trimmed.startsWith("[ENUNT]") ||
        trimmed.startsWith("[IMPORTANT]") ||
        trimmed.startsWith("[DEFINITIE]") ||
        trimmed.startsWith("[EXEMPLU]") ||
        trimmed.startsWith("[INDENT]")
      ) {
        flushParagraph(idx)
        const tagMatch = trimmed.match(/^\[(FORMULA|ENUNT|IMPORTANT|DEFINITIE|EXEMPLU|INDENT)\]([\s\S]*?)\[\/\1\]$/)

        if (tagMatch) {
          const tagType = tagMatch[1].toLowerCase() as keyof typeof TAG_CLASS_MAP
          const inner = tagMatch[2].trim()
          const classPrefix = TAG_CLASS_MAP[tagType]

          blocks.push(
            <div key={`tag-${keyPrefix}-${idx}`} className={`${classPrefix}-highlight`}>
              <div className={`${classPrefix}-content`}>
                {renderInlineWithImages(inner, `${keyPrefix}-${classPrefix}-${idx}`)}
              </div>
            </div>
          )
        }
        return
      }

      if (trimmed === "") {
        flushParagraph(idx)
        return
      }

      if (/^\$\$[\s\S]*\$\$$/.test(trimmed)) {
        flushParagraph(idx)
        blocks.push(
          <BlockMath
            key={`inline-display-${keyPrefix}-${idx}`}
            math={trimmed.replace(/^\$\$|\$\$$/g, "")}
            className="my-4 block text-center"
          />
        )
        return
      }

      currentParagraph.push(line)
    })

    flushParagraph(lines.length)
    return blocks
  }

  const renderHighlightWithMath = (value: string, type: keyof typeof TAG_CLASS_MAP, keyPrefix: string) => {
    const classPrefix = TAG_CLASS_MAP[type]

    return (
      <div className={`${classPrefix}-highlight`}>
        <div className={`${classPrefix}-content`}>{renderParagraphs(value, `${keyPrefix}-${classPrefix}`)}</div>
      </div>
    )
  }

  const renderContentWithMath = (value: string) => {
    const tagPattern =
      /(\[FORMULA\][\s\S]*?\[\/FORMULA\]|\[ENUNT\][\s\S]*?\[\/ENUNT\]|\[IMPORTANT\][\s\S]*?\[\/IMPORTANT\]|\[DEFINITIE\][\s\S]*?\[\/DEFINITIE\]|\[EXEMPLU\][\s\S]*?\[\/EXEMPLU\]|\[INDENT\][\s\S]*?\[\/INDENT\])/g
    const segments = value.split(tagPattern)

    return (
      <div>
        {segments.map((segment, idx) => {
          if (!segment) return null

          const tagMatch = segment.match(/^\[(FORMULA|ENUNT|IMPORTANT|DEFINITIE|EXEMPLU|INDENT)\]([\s\S]*?)\[\/\1\]$/)
          if (tagMatch) {
            const type = tagMatch[1].toLowerCase() as keyof typeof TAG_CLASS_MAP
            const innerContent = tagMatch[2]

            return <div key={`highlight-${idx}`}>{renderHighlightWithMath(innerContent, type, `highlight-${idx}`)}</div>
          }

          const parts = segment.split(/(\$\$[^$]+\$\$)/g)
          return (
            <div key={`segment-${idx}`}>
              {parts.map((part, partIdx) => {
                if (!part) return null

                if (part.startsWith("$$") && part.endsWith("$$")) {
                  return (
                    <BlockMath
                      key={`display-${idx}-${partIdx}`}
                      math={part.slice(2, -2)}
                      className="my-4 block text-center"
                    />
                  )
                }

                return <div key={`paragraphs-${idx}-${partIdx}`}>{renderParagraphs(part, `segment-${idx}-part-${partIdx}`)}</div>
              })}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className={cn(theme === "light" && "lesson-rich-content--light")}>{renderContentWithMath(content)}</div>
  )
}
