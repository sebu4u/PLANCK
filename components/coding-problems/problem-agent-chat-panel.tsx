"use client"

import { useMemo } from "react"
import dynamic from "next/dynamic"
import { CodingProblem, CodingProblemExample } from "./types"
import { buildCodingProblemContextMessage } from "@/lib/coding-problem-agent-context"
import type { EmbeddedIdeAgentBridge } from "@/lib/planckcode/embedded-ide-agent-bridge"

const InsightIdeChat = dynamic(
  () => import("@/components/insight-ide-chat").then((mod) => mod.InsightIdeChat),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-[#141414] text-sm text-white/50">
        Se încarcă Planck Agent...
      </div>
    ),
  },
)

export interface ProblemAgentChatPanelProps {
  isOpen: boolean
  onClose: () => void
  problem: CodingProblem
  examples: CodingProblemExample[]
  agentBridge: EmbeddedIdeAgentBridge | null
}

export function ProblemAgentChatPanel({
  isOpen,
  onClose,
  problem,
  examples,
  agentBridge,
}: ProblemAgentChatPanelProps) {
  const additionalContextMessages = useMemo(
    () => [buildCodingProblemContextMessage(problem, examples)],
    [problem, examples],
  )

  if (!isOpen) return null

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden border-t border-white/10 bg-[#141414]">
      <InsightIdeChat
        isOpen={isOpen}
        onClose={onClose}
        layout="embedded-panel"
        sessionTitle={`Problema: ${problem.title}`}
        emptyStateTitle="Salut, sunt Planck Agent!"
        emptyStateDescription={`Te ajut cu „${problem.title}” — explicații, indicii sau cod direct în editor.`}
        additionalContextMessages={additionalContextMessages}
        onInsertCode={(code) => agentBridge?.insertCode(code)}
        onApplyCodeEdit={(edit) => agentBridge?.applyCodeEdit(edit) ?? false}
        onAcceptCodeChanges={() => agentBridge?.acceptCodeChanges()}
        onRejectCodeChanges={() => agentBridge?.rejectCodeChanges()}
        activeFileName={agentBridge?.activeFileName}
        activeFileContent={agentBridge?.activeFileContent}
        activeFileLanguage={agentBridge?.activeFileLanguage}
      />
    </div>
  )
}
