import type { JSONContent } from "@tiptap/core"

const BLOCK_MATH_REGEX = /^\$\$([\s\S]+)\$\$$/

function migrateNode(node: JSONContent): JSONContent | JSONContent[] {
  if (node.type === "paragraph" && node.content?.length) {
    const onlyText = node.content.every((child) => child.type === "text")
    const text = node.content.map((child) => child.text ?? "").join("").trim()

    if (onlyText && text) {
      const match = text.match(BLOCK_MATH_REGEX)
      if (match) {
        return { type: "blockMath", attrs: { latex: match[1].trim() } }
      }
    }
  }

  if (!node.content?.length) return node

  return {
    ...node,
    content: node.content.flatMap((child) => {
      const migrated = migrateNode(child)
      return Array.isArray(migrated) ? migrated : [migrated]
    }),
  }
}

/** Converts paragraph nodes that contain only `$$...$$` into TipTap block math nodes. */
export function migrateBlockMathInContent(content: JSONContent): JSONContent {
  const migrated = migrateNode(content)
  return (Array.isArray(migrated) ? { type: "doc", content: migrated } : migrated) as JSONContent
}
