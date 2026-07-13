"use client"

import { useMemo } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import type { JSONContent } from "@tiptap/core"
import { migrateMathStrings } from "@tiptap/extension-mathematics"
import "katex/dist/katex.min.css"
import { createBlogEditorExtensions } from "@/components/blog/tiptap/blog-editor-extensions"
import { migrateBlockMathInContent } from "@/lib/blog-math-content"

type RichTextContentProps = {
  content: Record<string, unknown>
}

const EDITOR_CLASS =
  "prose prose-lg max-w-none prose-headings:scroll-mt-24 prose-headings:text-slate-900 prose-p:text-slate-700 prose-a:text-cyan-700 prose-a:underline prose-a:decoration-cyan-300 prose-img:rounded-xl [&_.tiptap-mathematics-render[data-type=block-math]]:my-6 [&_.tiptap-mathematics-render[data-type=block-math]]:flex [&_.tiptap-mathematics-render[data-type=block-math]]:justify-center [&_.katex-display]:my-0"

export function RichTextContent({ content }: RichTextContentProps) {
  const normalizedContent = useMemo(
    () => migrateBlockMathInContent(content as JSONContent),
    [content],
  )

  const editor = useEditor({
    editable: false,
    immediatelyRender: false,
    extensions: createBlogEditorExtensions({
      imageClass: "my-6 h-auto max-w-full rounded-xl",
      linkOpenOnClick: true,
    }),
    content: normalizedContent,
    onCreate: ({ editor: createdEditor }) => {
      migrateMathStrings(createdEditor)
    },
    editorProps: {
      attributes: {
        class: EDITOR_CLASS,
      },
    },
  })

  return <EditorContent editor={editor} />
}
