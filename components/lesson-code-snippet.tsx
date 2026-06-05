"use client"

import dynamic from "next/dynamic"
import { useMemo } from "react"

const Editor = dynamic(() => import("@monaco-editor/react").then((mod) => mod.default), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[80px] items-center justify-center bg-[#1e1e1e]">
      <div className="text-xs text-gray-500">Se încarcă...</div>
    </div>
  ),
})

const LINE_HEIGHT = 19
const VERTICAL_PADDING = 20
const MIN_HEIGHT = 80
const MAX_HEIGHT = 420

interface LessonCodeSnippetProps {
  code: string
}

export function normalizeCodeSnippetContent(value: string): string {
  return value.replace(/^\r?\n/, "").replace(/\r?\n$/, "")
}

export function LessonCodeSnippet({ code }: LessonCodeSnippetProps) {
  const normalizedCode = useMemo(() => normalizeCodeSnippetContent(code), [code])
  const lineCount = Math.max(normalizedCode.split("\n").length, 1)
  const height = Math.min(Math.max(lineCount * LINE_HEIGHT + VERTICAL_PADDING, MIN_HEIGHT), MAX_HEIGHT)

  return (
    <div className="lesson-code-snippet my-4 overflow-hidden rounded-xl border border-[#3b3b3b] bg-[#1e1e1e]">
      <div className="flex items-center border-b border-[#3b3b3b] bg-[#252526] px-3 py-1.5">
        <span className="text-xs font-medium uppercase tracking-wide text-gray-400">Python</span>
      </div>
      <div style={{ height }}>
        <Editor
          height="100%"
          language="python"
          value={normalizedCode}
          theme="vs-dark"
          options={{
            readOnly: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 13,
            lineNumbers: "on",
            folding: false,
            overviewRulerBorder: false,
            overviewRulerLanes: 0,
            hideCursorInOverviewRuler: true,
            renderLineHighlight: "none",
            contextmenu: false,
            fontFamily: "Geist Mono, ui-monospace, monospace",
            padding: { top: 10, bottom: 10 },
            scrollbar: {
              vertical: lineCount * LINE_HEIGHT + VERTICAL_PADDING > MAX_HEIGHT ? "auto" : "hidden",
              horizontal: "auto",
              handleMouseWheel: true,
            },
            automaticLayout: true,
          }}
        />
      </div>
    </div>
  )
}
