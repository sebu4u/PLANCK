"use client"

import Link from "next/link"
import { Loader2 } from "lucide-react"
import type { PlanckResourceReference } from "@/lib/insight/agent/types"
import type { InvataAskMessage } from "@/lib/invata/ask-types"
import { InvataAskResourceCard } from "@/components/invata/invata-ask-resource-card"
import { InvataAskThinkingPanel } from "@/components/invata/invata-ask-thinking"
import { cn } from "@/lib/utils"

function InvataAskStreamingText({ content }: { content: string }) {
  return (
    <p className="text-sm leading-relaxed text-[#111111]">
      {content}
      <span className="invata-ask-stream-cursor ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-[2px] bg-[#111111]" />
    </p>
  )
}

export function InvataAskConversation({
  messages,
  primary,
  secondary,
  topicLabel,
  isThinking,
  thinkingUserMessage,
  streamingMessage,
  isStreaming,
  showRecommendations,
  canGeneratePersonalizedPath = true,
  personalizedPathBlockedReason = null,
  isGeneratingPath,
  generateError,
  onGeneratePath,
  className,
}: {
  messages: InvataAskMessage[]
  primary: PlanckResourceReference | null
  secondary: PlanckResourceReference | null
  topicLabel: string
  isThinking: boolean
  thinkingUserMessage: string | null
  streamingMessage: string | null
  isStreaming: boolean
  showRecommendations: boolean
  canGeneratePersonalizedPath?: boolean
  personalizedPathBlockedReason?: string | null
  isGeneratingPath: boolean
  generateError: string | null
  onGeneratePath: () => void
  className?: string
}) {
  const assistantMessages = messages.filter((entry) => entry.role === "assistant")
  const previousAssistantMessages = isStreaming ? assistantMessages : assistantMessages.slice(0, -1)
  const hasRelevantResources = Boolean(primary || secondary)

  return (
    <div className={cn("space-y-4", className)}>
      {previousAssistantMessages.map((entry, index) => (
        <div key={`assistant-${index}`} className="space-y-4">
          <p className="text-sm leading-relaxed text-[#111111]">{entry.content}</p>
        </div>
      ))}

      {isThinking && !isStreaming && thinkingUserMessage ? (
        <InvataAskThinkingPanel userMessage={thinkingUserMessage} />
      ) : null}

      {isStreaming && streamingMessage !== null ? (
        <InvataAskStreamingText content={streamingMessage} />
      ) : null}

      {!isStreaming && !isThinking
        ? assistantMessages.slice(-1).map((entry, index) => (
            <div key={`assistant-latest-${index}`} className="space-y-4">
              <p className="text-sm leading-relaxed text-[#111111]">{entry.content}</p>
              {showRecommendations ? (
                <>
                  {hasRelevantResources ? (
                    <>
                      {primary ? (
                        <div className="space-y-2">
                          <p className="text-sm font-semibold text-[#111111]">Iată ce recomand:</p>
                          <InvataAskResourceCard resource={primary} />
                        </div>
                      ) : null}
                      {secondary ? (
                        <div className="space-y-2">
                          <p className="text-sm font-semibold text-[#111111]">Poți începe și cu:</p>
                          <InvataAskResourceCard resource={secondary} />
                        </div>
                      ) : null}
                    </>
                  ) : null}
                  <div className="rounded-xl border border-[#bfe6c8] bg-gradient-to-br from-[#e9fbef] via-[#d8f5e2] to-[#c2eecf] p-3">
                    {canGeneratePersonalizedPath ? (
                      <>
                        <p className="text-sm text-[#2f5d3f]">
                          Vrei să-ți creez un traseu personalizat pentru{" "}
                          <span className="font-semibold text-[#143d22]">{topicLabel}</span>?
                        </p>
                        <button
                          type="button"
                          onClick={onGeneratePath}
                          disabled={isGeneratingPath}
                          className="mt-3 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#16a34a] to-[#0f9d6b] px-4 py-2 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(16,163,74,0.3)] transition-all hover:from-[#15803d] hover:to-[#0d8a5e] hover:shadow-[0_6px_18px_rgba(16,163,74,0.4)] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isGeneratingPath ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                              Generez traseul…
                            </>
                          ) : (
                            "Creează traseu personalizat"
                          )}
                        </button>
                      </>
                    ) : (
                      <p className="text-sm text-[#2f5d3f]">
                        {personalizedPathBlockedReason ??
                          "Planul gratuit include un singur traseu personalizat."}{" "}
                        <Link
                          href="/pricing"
                          className="font-semibold text-[#143d22] underline underline-offset-2 hover:text-[#0f5132]"
                        >
                          Vezi planurile Plus
                        </Link>
                        .
                      </p>
                    )}
                    {generateError ? (
                      <p className="mt-2 text-sm font-medium text-[#b42318]">{generateError}</p>
                    ) : null}
                  </div>
                </>
              ) : null}
            </div>
          ))
        : null}
    </div>
  )
}
