"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import ReactMarkdown, { type Components as ReactMarkdownComponents } from "react-markdown"
import remarkGfm from "remark-gfm"
import { useAuth } from "@/components/auth-provider"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Chrome, Github, Loader2, Send, X, Copy, Check, Sparkles, ChevronDown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import { AiAgentLimitBanner } from "@/components/ai-agent-limit-banner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Editor from "@monaco-editor/react"

type ChatRole = "user" | "assistant" | "system"

interface ChatMessage {
  role: ChatRole
  content: string
  model?: string
}

type MessageSegment =
  | { type: "text"; content: string }
  | { type: "code"; content: string; language?: string }

interface CodeEditChange {
  type: "insert" | "delete" | "replace"
  line?: number
  start?: number
  end?: number
  content?: string
}

interface CodeEditResponse {
  type: "code_edit"
  target?: {
    file_name?: string
  }
  explanation?: string
  changes: CodeEditChange[]
  full_content?: string
}

interface InsightIdeChatProps {
  isOpen: boolean
  onClose: () => void
  onInsertCode: (code: string) => void
  onApplyCodeEdit: (edit: CodeEditResponse) => boolean
  onAcceptCodeChanges?: () => void
  onRejectCodeChanges?: () => void
  onMessageSent?: () => void
  activeFileName?: string
  activeFileContent?: string
  activeFileLanguage?: string
}

const INSIGHT_SESSION_TITLE = "PlanckCode IDE"
const MODEL_OPTIONS = [
  { id: "gpt-4o-mini", label: "Raptor1 (fast)", selectable: true },
  { id: "gpt-4o", label: "Raptor1", selectable: true },
  { id: "deep-thinking", label: "Raptor1 heavy", selectable: true },
]

function findJsonCandidate(text: string): string | null {
  const trimmed = text.trim()

  if (!trimmed) return null

  // Try to find JSON in markdown code blocks first (non-greedy, but handle multiline)
  const codeBlockRegex = /```(?:json|JSON)?\s*(\{[\s\S]*?\})\s*```/g
  let match: RegExpExecArray | null
  while ((match = codeBlockRegex.exec(trimmed)) !== null) {
    const candidate = match[1].trim()
    try {
      const parsed = JSON.parse(candidate)
      if (parsed && typeof parsed === "object" && parsed.type === "code_edit") {
        return candidate
      }
    } catch {
      // Continue searching
    }
  }

  // Try to find standalone JSON object (handle multiline)
  if (trimmed.startsWith("{")) {
    // Try to find matching closing brace, handling nested objects
    let braceCount = 0
    let endIndex = -1
    for (let i = 0; i < trimmed.length; i++) {
      if (trimmed[i] === "{") braceCount++
      if (trimmed[i] === "}") {
        braceCount--
        if (braceCount === 0) {
          endIndex = i
          break
        }
      }
    }
    if (endIndex !== -1) {
      const candidate = trimmed.slice(0, endIndex + 1)
      try {
        const parsed = JSON.parse(candidate)
        if (parsed && typeof parsed === "object" && parsed.type === "code_edit") {
          return candidate
        }
      } catch {
        // Continue searching
      }
    }
  }

  // Try to find JSON object embedded in text (find first { and matching })
  const firstBrace = trimmed.indexOf("{")
  if (firstBrace !== -1) {
    let braceCount = 0
    let endIndex = -1
    for (let i = firstBrace; i < trimmed.length; i++) {
      if (trimmed[i] === "{") braceCount++
      if (trimmed[i] === "}") {
        braceCount--
        if (braceCount === 0) {
          endIndex = i
          break
        }
      }
    }
    if (endIndex !== -1 && endIndex > firstBrace) {
      const candidate = trimmed.slice(firstBrace, endIndex + 1)
      try {
        const parsed = JSON.parse(candidate)
        if (parsed && typeof parsed === "object" && parsed.type === "code_edit") {
          return candidate
        }
      } catch {
        // Continue searching
      }
    }
  }

  return null
}

function parseCodeEditResponse(content: string): CodeEditResponse | null {
  const candidate = findJsonCandidate(content)
  if (!candidate) {
    console.log("Insight: No JSON candidate found in content:", content.substring(0, 200))
    return null
  }
  try {
    const parsed = JSON.parse(candidate)
    if (parsed && typeof parsed === "object" && parsed.type === "code_edit") {
      console.log("Insight: Successfully parsed code_edit:", parsed)
      return parsed as CodeEditResponse
    } else {
      console.warn("Insight: Parsed JSON but not code_edit type:", parsed)
    }
  } catch (err) {
    console.warn("Insight: Failed to parse code_edit JSON:", err, "Candidate:", candidate.substring(0, 200))
  }
  return null
}

function parseSegments(content: string): MessageSegment[] {
  if (!content) return []

  const regex = /```([\s\S]*?)```/g
  const segments: MessageSegment[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(content)) !== null) {
    const [fullMatch, inner] = match
    const startIndex = match.index ?? 0
    if (startIndex > lastIndex) {
      segments.push({
        type: "text",
        content: content.slice(lastIndex, startIndex),
      })
    }

    let language: string | undefined
    let code = inner ?? ""

    const newlineIdx = code.indexOf("\n")
    if (newlineIdx !== -1) {
      const potentialLang = code.slice(0, newlineIdx).trim()
      const body = code.slice(newlineIdx + 1)
      if (potentialLang.length <= 15 && /^[a-zA-Z0-9+#.-]*$/.test(potentialLang)) {
        language = potentialLang || undefined
        code = body
      }
    }

    segments.push({
      type: "code",
      content: code.replace(/\s+$/, ""),
      language,
    })

    lastIndex = startIndex + fullMatch.length
  }

  if (lastIndex < content.length) {
    segments.push({
      type: "text",
      content: content.slice(lastIndex),
    })
  }

  return segments
}

function unescapePartialJsonString(str: string): string {
  // Simple unescape for partial JSON strings
  return str
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\\r/g, "\r")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\")
}

function extractDisplayContentFromPartialJson(partialJson: string, activeFileLanguage?: string): string {
  // 1. Extract explanation
  let explanation = ""
  const explanationMatch = partialJson.match(/"explanation":\s*"((?:[^"\\]|\\.)*)/)
  if (explanationMatch) {
    explanation = unescapePartialJsonString(explanationMatch[1])
  } else {
    // If no explanation field yet, but we have text before the first brace, maybe use that?
    // Or if the JSON hasn't started yet (unlikely if we are here)
    // For now, assume explanation comes early or we fallback to emptiness
    const jsonStart = partialJson.indexOf("{")
    if (jsonStart > 0) {
      explanation = partialJson.slice(0, jsonStart).trim()
    }
  }

  // 2. Extract code
  // Try to find "content" or "replacement" fields
  let code = ""

  // Strategy: Find all "content": "..." or "replacement": "..." and concatenate them
  // This handles multiple changes or full_content
  const contentRegex = /"(?:full_content|content|replacement)":\s*"((?:[^"\\]|\\.)*)/g
  let match
  while ((match = contentRegex.exec(partialJson)) !== null) {
    const rawCode = match[1]
    code += unescapePartialJsonString(rawCode) + "\n"
  }

  // If we found code, wrap it
  if (code.trim()) {
    const lang = activeFileLanguage || "cpp" // Default to cpp or active
    return [
      explanation,
      "",
      "```" + lang,
      code.trimEnd(), // Don't trim start to preserve indentation
      "```",
      "",
      ":::status:generating:::" // Marker to show it's active
    ].join("\n")
  }

  return explanation || (partialJson.includes("{") ? "Se generează..." : partialJson)
}

function ChatCodeBlock({
  code,
  language = "cpp",
  onCopy,
  onInsert,
  mode,
  copiedSnippet,
  isPending,
  onAccept,
  onReject,
}: {
  code: string
  language?: string
  onCopy: () => void
  onInsert: () => void
  mode: "agent" | "ask"
  copiedSnippet: string | null
  isPending?: boolean
  onAccept?: () => void
  onReject?: () => void
}) {
  // Fixed height for consistent card sizes - code will be clipped if larger
  const FIXED_HEIGHT = 200

  // Show Accept/Reject if pending, otherwise show Copy
  const showPendingControls = isPending

  return (
    <div className="relative overflow-hidden rounded-lg border border-[#3b3b3b] bg-[#1e1e1e]">
      <div className="flex items-center justify-between border-b border-[#3b3b3b] bg-[#252526] px-3 py-1.5">
        <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
          {language || "plaintext"}
        </span>
        <div className="flex items-center gap-2">
          {showPendingControls ? (
            <>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-[10px] text-red-400 hover:text-red-300 hover:bg-red-500/10"
                onClick={onReject}
              >
                <X className="mr-1 w-3 h-3" />
                Reject
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-[10px] text-green-400 hover:text-green-300 hover:bg-green-500/10"
                onClick={onAccept}
              >
                <Check className="mr-1 w-3 h-3" />
                Accept
              </Button>
            </>
          ) : (
            <>
              {mode === "ask" && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-[10px] text-gray-400 hover:text-white hover:bg-white/10"
                  onClick={onInsert}
                >
                  <Sparkles className="mr-1 w-3 h-3" />
                  Insert
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-[10px] text-gray-400 hover:text-white hover:bg-white/10"
                onClick={onCopy}
              >
                {copiedSnippet === code ? (
                  <>
                    <Check className="mr-1 w-3 h-3 text-green-400" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="mr-1 w-3 h-3" />
                    Copy
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>
      <div style={{ height: FIXED_HEIGHT, overflow: "hidden" }}>
        <Editor
          height="100%"
          language={language === "cpp" || language === "c++" ? "cpp" : "plaintext"}
          value={code}
          theme="vs-dark"
          options={{
            readOnly: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 13,
            lineNumbers: "off",
            folding: false,
            overviewRulerBorder: false,
            overviewRulerLanes: 0,
            hideCursorInOverviewRuler: true,
            renderLineHighlight: "none",
            contextmenu: false,
            fontFamily: "Geist Mono, monospace",
            padding: { top: 10, bottom: 10 },
            scrollbar: {
              vertical: "hidden",
              horizontal: "hidden",
              handleMouseWheel: false,
            }
          }}
          loading={<div className="p-4 text-xs text-gray-500">Loading editor...</div>}
        />
      </div>
    </div>
  )
}

export function InsightIdeChat({
  isOpen,
  onClose,
  onInsertCode,
  onApplyCodeEdit,
  onAcceptCodeChanges,
  onRejectCodeChanges,
  onMessageSent,
  activeFileName,
  activeFileContent,
  activeFileLanguage,
}: InsightIdeChatProps) {
  const { user, loginWithGoogle, loginWithGitHub, subscriptionPlan } = useAuth()
  const { toast } = useToast()
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "system",
      content:
        "Ești Insight, un asistent inteligent pentru PlanckCode IDE. Ajută utilizatorii cu sfaturi C++, generare de cod și depanare. Respectă politicile și limitează-te la subiecte de programare.",
    },
  ])
  const [input, setInput] = useState("")
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [limitReached, setLimitReached] = useState(false)
  const [loginLoading, setLoginLoading] = useState<"google" | "github" | null>(null)
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const [shouldSendContext, setShouldSendContext] = useState(false)
  const [mode, setMode] = useState<"agent" | "ask">("agent")
  const [selectedModel, setSelectedModel] = useState("gpt-4o-mini")
  const [isGenerating, setIsGenerating] = useState(false)
  const [hasPendingCodeChange, setHasPendingCodeChange] = useState(false)
  const codeGeneratedRef = useRef(false)

  const handleAcceptChanges = useCallback(() => {
    setHasPendingCodeChange(false)
    onAcceptCodeChanges?.()
  }, [onAcceptCodeChanges])

  const handleRejectChanges = useCallback(() => {
    setHasPendingCodeChange(false)
    onRejectCodeChanges?.()
  }, [onRejectCodeChanges])

  const visibleMessages = useMemo(
    () => messages.filter((message) => message.role !== "system"),
    [messages],
  )

  const markdownComponents = useMemo<ReactMarkdownComponents>(
    () => ({
      p: ({ node, ...props }: any) => (
        <p
          className="whitespace-pre-wrap break-words leading-relaxed text-gray-200"
          {...props}
        />
      ),
      strong: ({ node, ...props }: any) => (
        <strong className="font-semibold text-white" {...props} />
      ),
      em: ({ node, ...props }: any) => <em className="text-gray-300" {...props} />,
      a: ({ node, ...props }: any) => (
        <a
          className="text-green-400 underline decoration-dotted underline-offset-4 hover:text-green-300"
          target="_blank"
          rel="noopener noreferrer"
          {...props}
        />
      ),
      ul: ({ node, ordered, ...props }: any) => (
        <ul className="list-disc pl-5 space-y-1 text-gray-200" {...props} />
      ),
      ol: ({ node, ordered, ...props }: any) => (
        <ol className="list-decimal pl-5 space-y-1 text-gray-200" {...props} />
      ),
      li: ({ node, ...props }: any) => <li className="leading-relaxed" {...props} />,
      h1: ({ node, ...props }: any) => (
        <h1 className="text-xl font-semibold text-white" {...props} />
      ),
      h2: ({ node, ...props }: any) => (
        <h2 className="text-lg font-semibold text-white" {...props} />
      ),
      h3: ({ node, ...props }: any) => (
        <h3 className="text-base font-semibold text-white" {...props} />
      ),
      blockquote: ({ node, ...props }: any) => (
        <blockquote
          className="border-l-2 border-white/20 pl-4 italic text-gray-300"
          {...props}
        />
      ),
      code: ({ node, inline, className, children, ...props }: any) => (
        <code
          className={`rounded bg-white/5 px-1.5 py-0.5 font-mono text-[13px] text-gray-100 ${className ?? ""}`}
          {...props}
        >
          {children}
        </code>
      ),
    }),
    [],
  )

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [visibleMessages.length, isStreaming, busy, scrollToBottom])

  useEffect(() => {
    if (isOpen) {
      setShouldSendContext(true)
    } else {
      setShouldSendContext(false)
    }
  }, [isOpen, activeFileContent, activeFileName, activeFileLanguage])

  const stopStreaming = useCallback(() => {
    if (!isStreaming) return
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    setIsStreaming(false)
    setBusy(false)
  }, [isStreaming])

  const sendMessage = useCallback(async () => {
    if (!user || !input.trim() || busy) return

    setBusy(true)
    setIsStreaming(true)
    setIsGenerating(false)
    setError(null)
    setLimitReached(false)

    try {
      abortControllerRef.current?.abort()
      const controller = new AbortController()
      abortControllerRef.current = controller

      const { data } = await supabase.auth.getSession()
      const accessToken = data.session?.access_token
      if (!accessToken) {
        setError("Necesită autentificare.")
        toast({
          title: "Eroare",
          description: "Necesită autentificare.",
          variant: "destructive",
        })
        return
      }

      const newUserMessage: ChatMessage = {
        role: "user",
        content: input.trim(),
      }

      setMessages((prev) => [...prev, newUserMessage])
      setInput("")
      onMessageSent?.()

      let currentSessionId = sessionId

      if (!currentSessionId) {
        const createRes = await fetch("/api/insight/sessions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ title: INSIGHT_SESSION_TITLE }),
        })

        if (!createRes.ok) {
          throw new Error("Nu am putut crea sesiunea Insight.")
        }

        const createData = await createRes.json()
        currentSessionId = createData.sessionId
        setSessionId(currentSessionId)
      }

      const activeModelId = mode === "ask" ? "gpt-4o-mini" : selectedModel
      setMessages((prev) => [...prev, { role: "assistant", content: "", model: activeModelId }])

      const contextMessages =
        shouldSendContext && activeFileContent
          ? [
            {
              role: "user",
              content: [
                "Context: codul curent din fișierul activ din IDE.",
                activeFileName ? `Fișier: ${activeFileName}` : null,
                "",
                "```" +
                (activeFileLanguage || "plaintext") +
                "\n" +
                activeFileContent +
                "\n```",
              ]
                .filter(Boolean)
                .join("\n"),
            } as ChatMessage,
          ]
          : undefined

      const response = await fetch("/api/insight/chat", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: currentSessionId,
          input: newUserMessage.content,
          persona: "ide",
          mode, // hint server to avoid JSON in Ask mode
          model: mode === "ask" ? "gpt-4o-mini" : selectedModel,
          contextMessages,
        }),
        signal: controller.signal,
      })

      if (response.status === 429) {
        const data = await response.json()
        const limitMessage = data.error || "Limită zilnică atinsă pentru Insight."
        const isDailyLimit = Boolean(data.resetTime) || /zilnic/i.test(limitMessage)

        if (isDailyLimit) {
          setLimitReached(true)
          setMessages((prev) => prev.slice(0, -1))
        } else {
          setMessages((prev) => {
            const updated = [...prev]
            const lastIdx = updated.length - 1
            if (lastIdx >= 0 && updated[lastIdx].role === "assistant") {
              updated[lastIdx] = {
                role: "assistant",
                content: limitMessage,
              }
            }
            return updated
          })

          setError(limitMessage)
          toast({
            title: "Limită atinsă",
            description: limitMessage,
            variant: "destructive",
          })
        }

        abortControllerRef.current = null
        setBusy(false)
        setIsStreaming(false)
        setShouldSendContext(false)
        return
      }

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Eroare la Insight.")
      }

      const contentType = response.headers.get("content-type")

      if (!contentType?.includes("text/event-stream")) {
        const data = await response.json()
        setMessages((prev) => {
          const updated = [...prev]
          const lastIdx = updated.length - 1
          if (lastIdx >= 0 && updated[lastIdx].role === "assistant") {
            updated[lastIdx] = {
              role: "assistant",
              content: data.output || "Nu am primit răspuns.",
            }
          }
          return updated
        })
        return
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error("Nu s-a putut citi răspunsul Insight.")
      }

      const decoder = new TextDecoder()
      let sseBuffer = ""
      let assistantBuffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        sseBuffer += decoder.decode(value, { stream: true })
        const parts = sseBuffer.split("\n\n")
        sseBuffer = parts.pop() ?? ""

        for (const part of parts) {
          if (!part.startsWith("data: ")) continue
          const payload = part.slice(6)
          if (!payload.trim() || payload === "[DONE]") continue
          try {
            const data = JSON.parse(payload)
            if (data.type === "text" && data.content) {
              assistantBuffer += data.content

              // Detect if content looks like JSON (code_edit type) - check early
              // Check for JSON patterns: opening brace, "type" field, or "code_edit"
              const hasOpeningBrace = assistantBuffer.includes('{')
              const hasTypeField = assistantBuffer.includes('"type"') || assistantBuffer.includes("'type'")
              const hasCodeEdit = assistantBuffer.includes('code_edit') || assistantBuffer.includes('codeEdit')

              // Early detection: if we see opening brace and type field, likely JSON
              // Or if we see code_edit pattern
              // Also check the new content chunk itself for JSON patterns
              const newContentHasJson = data.content.includes('{') ||
                data.content.includes('"type"') ||
                data.content.includes('code_edit')

              const looksLikeJson = (hasOpeningBrace && hasTypeField) ||
                (hasOpeningBrace && hasCodeEdit) ||
                (hasTypeField && hasCodeEdit) ||
                (hasOpeningBrace && newContentHasJson)

              if (looksLikeJson && mode === "agent") {
                // JSON detected - set generating flag
                if (!isGenerating) {
                  console.log("Insight: JSON detected, setting isGenerating to true")
                  setIsGenerating(true)
                }

                // Extract and show partial content
                const displayContent = extractDisplayContentFromPartialJson(assistantBuffer, activeFileLanguage)

                setMessages((prev) => {
                  const updated = [...prev]
                  for (let i = updated.length - 1; i >= 0; i--) {
                    if (updated[i].role === "assistant") {
                      updated[i] = {
                        ...updated[i],
                        content: displayContent,
                      }
                      break
                    }
                  }
                  return updated
                })

                // Don't update message content with raw JSON
              } else if (!isGenerating) {
                // Normal text - show as it streams (only if not generating)
                setMessages((prev) => {
                  const updated = [...prev]
                  for (let i = updated.length - 1; i >= 0; i--) {
                    if (updated[i].role === "assistant") {
                      updated[i] = {
                        ...updated[i],
                        content: (updated[i].content || "") + data.content,
                      }
                      break
                    }
                  }
                  return updated
                })
              }
              // If isGenerating is true, don't update message content at all
            } else if (data.type === "session" && data.sessionId) {
              setSessionId(data.sessionId)
            } else if (data.type === "error") {
              throw new Error(data.error || "Eroare la Insight.")
            }
          } catch (error) {
            console.error("Failed to parse Insight stream chunk:", error)
          }
        }
      }

      if (assistantBuffer.trim().length > 0) {
        // Try to extract and parse JSON from the buffer
        const structured = parseCodeEditResponse(assistantBuffer)

        if (structured?.type === "code_edit") {
          console.log("Insight: Found code_edit JSON:", structured)
          // Reset generating flag
          setIsGenerating(false)

          if (mode === "agent") {
            // Apply the code changes
            const applied = onApplyCodeEdit(structured)
            console.log("Insight: Code edit applied:", applied)

            // Remove JSON from the displayed message, keep only explanatory text
            let displayText = assistantBuffer
            const jsonCandidate = findJsonCandidate(assistantBuffer)
            if (jsonCandidate) {
              // Try multiple strategies to remove JSON
              // Strategy 1: Remove markdown code block containing JSON
              const codeBlockPattern = /```(?:json|JSON)?\s*\{[\s\S]*?\}\s*```/g
              displayText = displayText.replace(codeBlockPattern, "").trim()

              // Strategy 2: Remove standalone JSON object
              if (displayText.includes(jsonCandidate)) {
                displayText = displayText.replace(jsonCandidate, "").trim()
              }

              // Strategy 3: Remove lines that look like JSON (containing "type": "code_edit")
              const lines = displayText.split("\n")
              displayText = lines
                .filter((line) => {
                  const trimmed = line.trim()
                  // Skip lines that are mostly JSON structure
                  if (
                    trimmed.startsWith("{") ||
                    trimmed.startsWith("}") ||
                    trimmed.match(/^\s*"[^"]+":\s*["{[]/) ||
                    trimmed.match(/^\s*"type":\s*"code_edit"/)
                  ) {
                    return false
                  }
                  return true
                })
                .join("\n")
                .trim()

              // Remove common JSON markers and cleanup
              displayText = displayText
                .replace(
                  /(?:Iată|Here is|Modificările sub formă de JSON|Changes in JSON format|JSON format|sub formă de JSON)[:：]?\s*/gi,
                  ""
                )
                .replace(/\n{3,}/g, "\n\n")
                .trim()
            }

            // Construct final message: Explanation + Code + Status Marker
            let finalMessage = displayText || structured.explanation || "Am actualizat codul și am evidențiat modificările propuse."

            // Re-attach the code block if we have content
            // We use the full content if available, or reconstruct from changes
            const codeContent = structured.full_content ||
              (structured.changes && structured.changes.map(c => c.content || "").join("\n")) ||
              ""

            if (codeContent.trim()) {
              const lang = activeFileLanguage || "cpp"
              finalMessage += `\n\n\`\`\`${lang}\n${codeContent.trim()}\n\`\`\``
            }

            const confirmationMessage = applied
              ? finalMessage + "\n\n:::status:code_inserted:::"
              : "Nu am putut aplica modificările în editor. Verifică manual rezultatul."

            setMessages((prev) => {
              const updated = [...prev]
              for (let i = updated.length - 1; i >= 0; i--) {
                if (updated[i].role === "assistant") {
                  updated[i] = {
                    ...updated[i],
                    content: confirmationMessage,
                  }
                  break
                }
              }
              return updated
            })

            // Mark as pending for Accept/Reject
            if (applied) {
              setHasPendingCodeChange(true)
            }
          } else {
            // In Ask mode, do not apply edits to IDE; remove JSON and show plain code if available
            let displayText = assistantBuffer
            const jsonCandidate = findJsonCandidate(assistantBuffer)
            if (jsonCandidate) {
              // Remove JSON content from chat
              const codeBlockPattern = /```(?:json|JSON)?\s*\{[\s\S]*?\}\s*```/g
              displayText = displayText.replace(codeBlockPattern, "").trim()
              if (displayText.includes(jsonCandidate)) {
                displayText = displayText.replace(jsonCandidate, "").trim()
              }
              const lines = displayText.split("\n")
              displayText = lines
                .filter((line) => {
                  const trimmed = line.trim()
                  if (
                    trimmed.startsWith("{") ||
                    trimmed.startsWith("}") ||
                    trimmed.match(/^\s*"[^"]+":\s*["{[]/) ||
                    trimmed.match(/^\s*"type":\s*"code_edit"/)
                  ) {
                    return false
                  }
                  return true
                })
                .join("\n")
                .trim()
              displayText = displayText
                .replace(
                  /(?:Iată|Here is|Modificările sub formă de JSON|Changes in JSON format|JSON format|sub formă de JSON)[:：]?\s*/gi,
                  ""
                )
                .replace(/\n{3,}/g, "\n\n")
                .trim()
            }

            // If JSON provided full_content, render that as a code block in chat
            const codeFromJson =
              structured.full_content && structured.full_content.trim().length > 0
                ? "```" +
                (activeFileLanguage || "plaintext") +
                "\n" +
                structured.full_content +
                "\n```"
                : ""

            const finalAssistantMessage =
              (structured.explanation?.trim() || displayText) +
              (codeFromJson ? "\n\n" + codeFromJson : "")

            setMessages((prev) => {
              const updated = [...prev]
              for (let i = updated.length - 1; i >= 0; i--) {
                if (updated[i].role === "assistant") {
                  updated[i] = {
                    ...updated[i],
                    content:
                      finalAssistantMessage ||
                      "În modul Ask am evitat generarea JSON. Am afișat codul ca fragment în chat.",
                  }
                  break
                }
              }
              return updated
            })
          }
        } else if (mode === "agent") {
          // No structured edit; auto-insert any code snippets into IDE and avoid leaving full code in chat
          setIsGenerating(false)
          const segments = parseSegments(assistantBuffer)
          const codeSegments = segments.filter((s) => s.type === "code") as Array<{ type: "code"; content: string }>
          if (codeSegments.length > 0) {
            // Insert the last code segment (or all sequentially)
            codeSegments.forEach((seg) => {
              if (seg.content && seg.content.trim().length > 0) {
                onInsertCode(seg.content)
              }
            })
            // Preserve existing message content and append the success marker
            setMessages((prev) => {
              const updated = [...prev]
              for (let i = updated.length - 1; i >= 0; i--) {
                if (updated[i].role === "assistant") {
                  // Remove generating marker and add inserted marker
                  let newContent = updated[i].content || assistantBuffer
                  newContent = newContent.replace(":::status:generating:::", "")
                  updated[i] = {
                    ...updated[i],
                    content: newContent + "\n\n:::status:code_inserted:::",
                  }
                  break
                }
              }
              return updated
            })

            // Mark as pending for Accept/Reject
            setHasPendingCodeChange(true)
          }
        } else {
          // Ask mode without code_edit - reset generating flag
          setIsGenerating(false)
        }
        // Otherwise (Ask mode without code_edit), keep the original message as-is
      } else {
        // No JSON detected - reset generating flag
        setIsGenerating(false)
      }
    } catch (err) {
      if ((err as any)?.name === "AbortError") {
        return
      }
      console.error("Insight IDE chat error:", err)
      setIsGenerating(false)
      const message =
        err instanceof Error ? err.message : "Eroare la comunicarea cu Insight."
      setError(message)
      toast({
        title: "Eroare",
        description: message,
        variant: "destructive",
      })
    } finally {
      abortControllerRef.current = null
      setBusy(false)
      setIsStreaming(false)
      setIsGenerating(false)
      setShouldSendContext(false)
    }
  }, [
    user,
    input,
    busy,
    sessionId,
    toast,
    shouldSendContext,
    activeFileContent,
    activeFileLanguage,
    activeFileName,
    onApplyCodeEdit,
    onInsertCode,
    mode,
    isGenerating,
  ])

  const handleGoogleLogin = useCallback(async () => {
    setLoginLoading("google")
    const { error } = await loginWithGoogle()
    if (error) {
      toast({
        title: "Eroare la autentificare cu Google",
        description: error.message,
        variant: "destructive",
      })
    }
    setLoginLoading(null)
  }, [loginWithGoogle, toast])

  const handleGitHubLogin = useCallback(async () => {
    setLoginLoading("github")
    const { error } = await loginWithGitHub()
    if (error) {
      toast({
        title: "Eroare la autentificare cu GitHub",
        description: error.message,
        variant: "destructive",
      })
    }
    setLoginLoading(null)
  }, [loginWithGitHub, toast])

  const handleCopySnippet = useCallback((code: string) => {
    navigator.clipboard
      .writeText(code)
      .then(() => {
        setCopiedSnippet(code)
        setTimeout(() => {
          setCopiedSnippet((prev) => (prev === code ? null : prev))
        }, 2000)
      })
      .catch(() => {
        toast({
          title: "Nu am putut copia codul",
          description: "Încearcă din nou.",
          variant: "destructive",
        })
      })
  }, [toast])

  const handleInsertSnippet = useCallback(
    (code: string) => {
      if (!code.trim()) return
      // Block direct IDE insertions in Ask mode
      if (mode === "ask") {
        toast({
          title: "Mod Ask activ",
          description: "În modul Ask nu poți insera direct în IDE.",
          variant: "destructive",
        })
        return
      }
      onInsertCode(code)
      toast({
        title: "Cod inserat în editor",
        description: "Ai introdus fragmentul direct în fișierul curent.",
      })
    },
    [onInsertCode, toast, mode, user],
  )

  const renderAssistantMessage = useCallback(
    (content: string, index: number, isLastMessage: boolean = false) => {
      // Check for markers
      const isGeneratingMarker = content.includes(":::status:generating:::")
      const parts = content.split(":::status:code_inserted:::")

      let mainContent = parts[0]
      if (isGeneratingMarker) {
        mainContent = mainContent.replace(":::status:generating:::", "")
      }

      const hasInsertedMarker = parts.length > 1

      // Common renderer for a block of text
      const renderBlock = (text: string, keyPrefix: string) => {
        if (!text.trim()) return null
        const segments = parseSegments(text)
        if (segments.length === 0) return null

        return (
          <div key={keyPrefix} className="space-y-4">
            {segments.map((segment, segmentIndex) => {
              if (segment.type === "text") {
                if (!segment.content.trim()) return null
                return (
                  <ReactMarkdown
                    key={`${keyPrefix}-text-${segmentIndex}`}
                    remarkPlugins={[remarkGfm]}
                    components={markdownComponents}
                    className="space-y-3"
                  >
                    {segment.content}
                  </ReactMarkdown>
                )
              }

              return (
                <ChatCodeBlock
                  key={`${keyPrefix}-code-${segmentIndex}`}
                  code={segment.content}
                  language={segment.language}
                  mode={mode}
                  onCopy={() => handleCopySnippet(segment.content)}
                  onInsert={() => handleInsertSnippet(segment.content)}
                  copiedSnippet={copiedSnippet}
                  isPending={hasInsertedMarker && hasPendingCodeChange}
                  onAccept={handleAcceptChanges}
                  onReject={handleRejectChanges}
                />
              )
            })}
          </div>
        )
      }

      return (
        <div key={index} className="space-y-3">
          {/* Main content (explanation + streamed code) */}
          {renderBlock(mainContent, `msg-${index}-main`)}

          {/* Generating Indicator - Show if marker exists OR (last message + isGenerating state) */}
          {(isGeneratingMarker || (isLastMessage && isGenerating)) && (
            <div className="flex items-center gap-3 p-4 bg-[#202020] border border-[#3b3b3b] rounded-lg animate-pulse">
              <div className="w-5 h-5 border-2 border-t-transparent border-green-500 rounded-full animate-spin" />
              <span className="text-gray-300 font-medium">Writing code...</span>
            </div>
          )}

          {/* Code Inserted Card */}
          {hasInsertedMarker && (
            <div className="mt-3">
              <div className="flex items-center gap-3 p-3 bg-[#1e2e25] border border-green-800/50 rounded-lg text-green-100">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-900/50 text-green-400">
                  <Check className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-100">Cod inserat în IDE</p>
                  <p className="text-xs text-green-300/70">Modificările au fost aplicate cu succes.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )
    },
    [copiedSnippet, handleCopySnippet, handleInsertSnippet, markdownComponents, mode, isGenerating, hasPendingCodeChange, handleAcceptChanges, handleRejectChanges],
  )

  return (
    <div
      className={`h-full flex flex-col bg-[#181818] transition-opacity duration-200 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      aria-hidden={!isOpen}
    >
      <header className="flex items-center justify-between px-4 py-3 border-b border-[#3b3b3b]">
        <div className="flex items-center gap-3">
          <Image
            src="/insight-logo.png"
            alt="Insight Logo"
            width={32}
            height={32}
            className="rounded-full"
          />
          <div>
            <h2 className="text-white font-semibold text-base">Insight</h2>
            <p className="text-xs text-gray-400">
              Generează cod, debugging și explicații contextualizate.
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            stopStreaming()
            onClose()
          }}
          className="text-gray-400 hover:text-white hover:bg-white/10"
        >
          <X className="w-4 h-4" />
        </Button>
      </header>

      {!user ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-4">
          <p className="text-gray-300 text-sm">
            Autentifică-te pentru a folosi Insight în PlanckCode IDE.
          </p>
          <div className="flex flex-col gap-3 w-full">
            <Button
              onClick={handleGoogleLogin}
              disabled={loginLoading !== null}
              className="h-10 bg-transparent border border-white/20 text-white hover:bg-white/10 transition-all duration-200"
            >
              {loginLoading === "google" ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Chrome className="w-4 h-4 mr-2" />
              )}
              Continuă cu Google
            </Button>
            <Button
              onClick={handleGitHubLogin}
              disabled={loginLoading !== null}
              className="h-10 bg-transparent border border-white/20 text-white hover:bg-white/10 transition-all duration-200"
            >
              {loginLoading === "github" ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Github className="w-4 h-4 mr-2" />
              )}
              Continuă cu GitHub
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
            {visibleMessages.length === 0 ? (
              <div className="mt-20 text-center text-gray-400 text-sm space-y-2">
                <p className="text-lg text-white">Salut, sunt Insight!</p>
                <p>Pune o întrebare despre cod, algoritmi sau lasă-mă să scriu cod pentru tine.</p>
              </div>
            ) : (
              visibleMessages.map((message, index) => {
                const isAssistant = message.role === "assistant"
                const isLastMessage = index === visibleMessages.length - 1
                return (
                  <div
                    key={`${message.role}-${index}`}
                    className={`flex ${isAssistant ? "justify-start" : "justify-end"}`}
                  >
                    {isAssistant ? (
                      <div className="w-full lg:max-w-none space-y-3">
                        <div className="text-xs uppercase tracking-wide text-gray-500">
                          {MODEL_OPTIONS.find((m) => m.id === message.model)?.label || "Insight"}
                        </div>
                        {renderAssistantMessage(message.content, index, isLastMessage)}
                      </div>
                    ) : (
                      <div className="max-w-[75%] rounded-2xl bg-[#262626] text-white px-4 py-3 shadow-sm">
                        <div className="text-xs uppercase tracking-wide text-gray-400 mb-1 opacity-80">
                          Tu
                        </div>
                        <p className="whitespace-pre-wrap break-words leading-relaxed text-gray-100">
                          {message.content}
                        </p>
                      </div>
                    )}
                  </div>
                )
              })
            )}

            {busy && !isGenerating && (
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Loader2 className="w-3 h-3 animate-spin" />
                Insight scrie...
              </div>
            )}

            {error && !limitReached && (
              <div className="bg-red-900/20 border border-red-800 text-red-300 rounded p-2 text-xs">
                {error}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 space-y-3">
            {limitReached && <AiAgentLimitBanner />}
            <div className="rounded-2xl border border-[#3b3b3b] bg-[#242424] px-3 py-1.5 space-y-1">
              <Input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="How can I help you?"
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault()
                    sendMessage()
                  }
                }}
                className="h-8 bg-transparent border-0 text-[13px] text-gray-100 placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 px-0 rounded-xl"
                disabled={busy}
              />
              <div className="flex items-center justify-between gap-2 pt-0.5">
                <div className="relative flex items-center h-6 w-[114px] text-[10px] font-medium rounded-xl border border-[#3b3b3b] bg-[#1c1c1c] overflow-hidden">
                  <span
                    className="absolute top-0 left-0 h-full w-1/2 transition-all duration-200 ease-out"
                    style={{
                      transform: mode === "agent" ? "translateX(0%)" : "translateX(100%)",
                      backgroundColor: mode === "agent" ? "#3d3d3d" : "#14532d",
                      pointerEvents: "none",
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setMode("agent")}
                    className={`relative z-10 flex-1 h-full px-0 rounded-none border border-transparent transition-colors focus-visible:ring-0 ${mode === "agent"
                      ? "text-white text-[10px] hover:text-white hover:bg-transparent"
                      : "text-gray-400 text-[10px] hover:text-gray-400 hover:bg-transparent"
                      }`}
                  >
                    Agent
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setMode("ask")}
                    className={`relative z-10 flex-1 h-full px-0 rounded-none border border-transparent transition-colors focus-visible:ring-0 ${mode === "ask"
                      ? "text-white text-[10px] hover:text-white hover:bg-transparent"
                      : "text-gray-400 text-[10px] hover:text-gray-400 hover:bg-transparent"
                      }`}
                  >
                    Ask
                  </Button>
                </div>
                <div className="flex items-center gap-1.5">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-7 px-3 text-[11px] font-medium text-gray-300 hover:text-white bg-transparent hover:bg-transparent flex items-center gap-1"
                      >
                        {MODEL_OPTIONS.find((m) => m.id === selectedModel)?.label || selectedModel}
                        <ChevronDown className="w-3 h-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-[#202020] border border-[#3b3b3b] text-gray-200">
                      {MODEL_OPTIONS.map((model) => {
                        const isLocked = model.id === "deep-thinking" && subscriptionPlan === "free"
                        const isSelectable = model.selectable && !isLocked

                        return (
                          <DropdownMenuItem
                            key={model.id}
                            disabled={!isSelectable}
                            className={`text-sm ${isSelectable ? "cursor-pointer" : "cursor-not-allowed opacity-50"
                              }`}
                            onSelect={() => {
                              if (isSelectable) {
                                setSelectedModel(model.id)
                              }
                            }}
                          >
                            {model.label}
                            {!model.selectable ? " (în curând)" : (isLocked ? " (Plus)" : "")}
                          </DropdownMenuItem>
                        )
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    type="button"
                    onClick={isStreaming ? stopStreaming : sendMessage}
                    disabled={!input.trim() && !isStreaming}
                    className={`h-7 w-7 p-0 bg-transparent ${input.trim() || isStreaming ? "text-white hover:text-gray-200" : "text-gray-500"
                      }`}
                  >
                    {isStreaming ? <X className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

