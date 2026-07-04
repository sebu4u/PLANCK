"use client"

import { motion } from "framer-motion"
import { Code } from "lucide-react"
import { usePlanckIdeFloating } from "@/components/planckcode-floating-provider"
import { getFloatingEntryAnimationRects } from "@/lib/planckcode-floating-animation"

function sessionTitle(source: "standalone" | "problem") {
  return source === "problem" ? "Problemă informatică" : "PlanckCode IDE"
}

export function PlanckIdeFloatingEntryAnimation() {
  const { session, entryAnimationActive, completeEntryAnimation } = usePlanckIdeFloating()

  if (!entryAnimationActive || !session) {
    return null
  }

  const { from, to } = getFloatingEntryAnimationRects(session.source)
  const activeFile =
    session.files.find((file) => file.id === session.activeFileId) ?? session.files[0]
  const previewLines = activeFile.content.split("\n").slice(0, 8)

  return (
    <motion.div
      className="fixed z-[281] flex flex-col overflow-hidden border border-[#3b3b3b] bg-[#181818] shadow-[0_20px_60px_rgba(0,0,0,0.55)] pointer-events-none"
      initial={{
        top: from.top,
        left: from.left,
        width: from.width,
        height: from.height,
        borderRadius: from.borderRadius,
      }}
      animate={{
        top: to.top,
        left: to.left,
        width: to.width,
        height: to.height,
        borderRadius: to.borderRadius,
      }}
      transition={{ duration: 0.48, ease: [0.32, 0.72, 0, 1] }}
      onAnimationComplete={completeEntryAnimation}
    >
      <div className="flex shrink-0 items-center gap-2 border-b border-[#3b3b3b] bg-[#1e1e1e] px-3 py-2">
        <Code className="h-4 w-4 shrink-0 text-white/80" />
        <div className="min-w-0 flex-1 truncate text-sm font-semibold text-white">
          {sessionTitle(session.source)}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#060b10]">
        <div className="flex shrink-0 items-center gap-2 border-b border-[#3b3b3b] bg-[#1e1e1e] px-3 py-1.5">
          <span className="truncate text-xs text-white/80">{activeFile.name}</span>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden p-3 font-mono text-[11px] leading-relaxed text-white/70">
          {previewLines.map((line, index) => (
            <div key={`${index}-${line}`} className="truncate whitespace-pre">
              {line || " "}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
