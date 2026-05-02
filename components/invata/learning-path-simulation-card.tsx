"use client"

import { useCallback, useEffect, useRef, useState } from "react"

const DEFAULT_LABEL = {
  name: "Dreaptă",
  text: "corpul merge pe aceeași direcție.",
}

type SimulationMessage =
  | {
      type: "learning-path-simulation-state" | "trajectory-simulation-state"
      name?: unknown
      text?: unknown
      paused?: unknown
    }

interface LearningPathSimulationCardProps {
  embedUrl: string
  title: string
}

function isSimulationMessage(value: unknown): value is SimulationMessage {
  if (!value || typeof value !== "object") return false
  const type = (value as { type?: unknown }).type
  return type === "learning-path-simulation-state" || type === "trajectory-simulation-state"
}

export function LearningPathSimulationCard({ embedUrl, title }: LearningPathSimulationCardProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [label, setLabel] = useState(DEFAULT_LABEL)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow || !isSimulationMessage(event.data)) return

      const { name, text, paused: nextPaused } = event.data
      if (typeof name === "string" && typeof text === "string") {
        setLabel({ name, text })
      }
      if (typeof nextPaused === "boolean") {
        setPaused(nextPaused)
      }
    }

    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [])

  const togglePaused = useCallback(() => {
    const nextPaused = !paused
    setPaused(nextPaused)
    iframeRef.current?.contentWindow?.postMessage(
      { type: "learning-path-simulation-set-paused", paused: nextPaused },
      "*"
    )
    iframeRef.current?.contentWindow?.postMessage(
      { type: "trajectory-simulation-set-paused", paused: nextPaused },
      "*"
    )
  }, [paused])

  return (
    <div className="mx-auto w-full max-w-[360px] sm:max-w-[440px]">
      <div className="rounded-2xl border border-[#e1e1e5] bg-white p-3.5 shadow-[0_18px_40px_-30px_rgba(41,41,41,0.35)] sm:rounded-3xl sm:p-6">
        <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#292929] sm:text-[10px] sm:tracking-[0.2em]">
          {title}
        </p>
        <div className="mt-2.5 overflow-hidden rounded-xl bg-white sm:mt-4 sm:rounded-2xl">
          <div className="aspect-[5/4] w-full">
            <iframe
              ref={iframeRef}
              src={embedUrl}
              title={title}
              className="h-full w-full"
              referrerPolicy="strict-origin-when-cross-origin"
              sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-presentation allow-popups"
              allowFullScreen
            />
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 px-1 sm:mt-4 sm:px-2">
        <p className="min-w-0 text-[11px] font-semibold leading-snug text-[#777777] sm:text-xs">
          <strong className="font-extrabold text-[#292929]">{label.name}:</strong> {label.text}
        </p>
        <button
          type="button"
          onClick={togglePaused}
          className="shrink-0 rounded-full border border-[#e0dce8] bg-white px-3 py-2 text-[11px] font-bold text-[#292929] transition-colors hover:bg-[#f7f7f7] sm:px-4"
        >
          {paused ? "Redă" : "Pauză"}
        </button>
      </div>
    </div>
  )
}
